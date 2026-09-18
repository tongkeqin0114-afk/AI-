from __future__ import annotations
import json
import os
import re
import subprocess
import uuid
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

DATA = Path(os.getenv("DATA_DIR", "/data"))
UPLOADS = DATA / "uploads"
OUTPUTS = DATA / "outputs"
UPLOADS.mkdir(parents=True, exist_ok=True)
OUTPUTS.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Video Creator Worker", version="1.0.0")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "*").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v", ".mkv", ".avi"}

def run(cmd: list[str], timeout: int = 900) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(500, f"FFmpeg 处理失败：{e.stderr[-1200:]}") from e
    except subprocess.TimeoutExpired as e:
        raise HTTPException(504, "视频处理超时，请缩短素材或稍后重试") from e

def probe(path: Path) -> dict[str, Any]:
    p = run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=index,codec_type,width,height,r_frame_rate", "-of", "json", str(path)], 60)
    return json.loads(p.stdout)

def duration(path: Path) -> float:
    return float(probe(path).get("format", {}).get("duration") or 0)

def safe_name(name: str) -> str:
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", Path(name).stem)[:80] or "video"
    ext = Path(name).suffix.lower()
    if ext not in VIDEO_EXTS:
        ext = ".mp4"
    return f"{uuid.uuid4().hex}_{stem}{ext}"

def detect_edges(path: Path) -> tuple[float, float]:
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-45dB:d=0.35", "-f", "null", "-"],
        text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300,
    )
    text = p.stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", text)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", text)]
    total = duration(path)
    start = starts[0] if starts and starts[0] < 1.5 else 0.0
    end = ends[-1] if ends and total - ends[-1] < 1.5 else total
    return max(0.0, start), max(start + 0.2, end)

def make_srt(script: str, seconds: float, out: Path) -> None:
    chunks = [x.strip() for x in re.split(r"\n+|(?<=[。！？!?])", script) if x.strip()]
    chunks = chunks[:18]
    if not chunks:
        return
    weights = [max(1, len(re.sub(r"\s", "", x))) for x in chunks]
    total = sum(weights)
    t = 0.0
    lines: list[str] = []
    for i, chunk in enumerate(chunks, 1):
        span = seconds * weights[i-1] / total
        a, b = t, min(seconds, t + span)
        def ts(v: float) -> str:
            ms = int(round(v * 1000))
            h, ms = divmod(ms, 3600000)
            m, ms = divmod(ms, 60000)
            s, ms = divmod(ms, 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
        lines += [str(i), f"{ts(a)} --> {ts(b)}", chunk, ""]
        t = b
    out.write_text("\n".join(lines), encoding="utf-8")

class EditRequest(BaseModel):
    source_id: str
    script: str = ""
    target_seconds: int = 45
    subtitle: bool = True

@app.get("/health")
def health():
    return {"ok": True, "service": "ai-video-worker"}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in VIDEO_EXTS:
        raise HTTPException(400, "只支持 MP4、MOV、WebM、M4V、MKV、AVI")
    name = safe_name(file.filename or "video.mp4")
    path = UPLOADS / name
    size = 0
    with path.open("wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > 1024 * 1024 * 1024:
                path.unlink(missing_ok=True)
                raise HTTPException(413, "单个视频不能超过 1GB")
            f.write(chunk)
    meta = probe(path)
    return {"id": name, "name": file.filename, "url": f"/files/{name}", "meta": meta}

@app.post("/analyze-reference")
async def analyze_reference(file: UploadFile = File(...)):
    uploaded = await upload(file)
    path = UPLOADS / uploaded["id"]
    meta = uploaded["meta"]
    shots = []
    p = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-filter:v", "select='gt(scene,0.35)',showinfo", "-f", "null", "-"],
        text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300,
    )
    for x in re.findall(r"pts_time:([0-9.]+)", p.stderr):
        shots.append(float(x))
    d = float(meta.get("format", {}).get("duration") or 0)
    return {
        "id": uploaded["id"],
        "duration": round(d, 2),
        "width": next((s.get("width") for s in meta.get("streams", []) if s.get("codec_type") == "video"), None),
        "height": next((s.get("height") for s in meta.get("streams", []) if s.get("codec_type") == "video"), None),
        "shot_changes": shots[:120],
        "shot_count": len(shots),
        "average_shot_seconds": round(d / (len(shots) + 1), 2) if d else 0,
        "style_note": "已提取时长、画幅和镜头切换节奏；不会复制参考视频文案或素材。",
    }

@app.post("/edit")
def edit(req: EditRequest):
    source = UPLOADS / Path(req.source_id).name
    if not source.exists():
        raise HTTPException(404, "原始视频不存在，请重新上传")
    total = duration(source)
    start, end = detect_edges(source)
    usable = max(0.5, end - start)
    target = min(float(req.target_seconds), usable)
    out_name = f"{uuid.uuid4().hex}.mp4"
    out = OUTPUTS / out_name
    srt = OUTPUTS / f"{out_name}.srt"
    make_srt(req.script, target, srt)
    vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    if req.subtitle and srt.exists() and req.script.strip():
        vf += f",subtitles={str(srt).replace(':','\\:').replace('\\','/')}:force_style='FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=3,MarginV=120,Alignment=2'"
    cmd = [
        "ffmpeg","-y","-ss",f"{start:.3f}","-i",str(source),"-t",f"{target:.3f}",
        "-vf",vf,"-c:v","libx264","-preset","veryfast","-crf","20",
        "-c:a","aac","-b:a","192k","-movflags","+faststart",str(out)
    ]
    run(cmd, 1200)
    srt.unlink(missing_ok=True)
    return {"id": out_name, "url": f"/files/{out_name}", "duration": round(target, 2), "trimmed_silence": round(start + max(0, total-end), 2)}

@app.get("/files/{name}")
def files(name: str):
    safe = Path(name).name
    path = UPLOADS / safe
    if not path.exists():
        path = OUTPUTS / safe
    if not path.exists():
        raise HTTPException(404, "文件不存在")
    return FileResponse(path)

@app.delete("/files/{name}")
def delete_file(name: str):
    safe = Path(name).name
    removed = False
    for root in (UPLOADS, OUTPUTS):
        p = root / safe
        if p.exists():
            p.unlink()
            removed = True
    return {"ok": removed}
