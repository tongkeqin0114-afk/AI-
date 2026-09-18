"use client";

import { ChangeEvent, useMemo, useState } from "react";

const VIDEO_API = process.env.NEXT_PUBLIC_VIDEO_API_URL || "http://localhost:8000";
const templates = ["禅意思考","王阳明心学","人生感悟","传统文化"];
const tones = ["沉稳、有力量","温和、克制","犀利、有冲击","口语、接地气"];
const lengths = [{label:"30 秒",seconds:30},{label:"45 秒",seconds:45},{label:"60 秒",seconds:60},{label:"90 秒",seconds:90}];
const structure = [["01","开场核心金句"],["02","反常识钩子"],["03","大多数人的认知 + 举例说明"],["04","正确理解和说明"],["05","结尾"]];

const demo = "开场核心金句：\n真正让一个人变强的，从来不是控制情绪，而是看见情绪之后，依然知道自己该做什么。\n\n反常识钩子：\n很多人以为，修养好的人应该没有情绪。其实恰恰相反，一个真正稳定的人，不是没有情绪，而是不把情绪当成命令。\n\n大多数人的认知 + 举例说明：\n我们遇到一句不好听的话，第一反应往往是反击；工作里被否定了，就开始证明自己；关系里受了委屈，就急着让对方知道自己有多难受。我们以为这是在维护自己，其实很多时候，只是在跟着情绪走。\n\n正确理解和说明：\n真正的自我掌控，不是把情绪压下去，而是在情绪出现的时候，多留一秒钟。看见它，再决定要不要回应。真正的知行合一，是在事情发生的那一刻，仍然能够按照自己认可的原则行动。\n\n结尾：\n人真正的自由，不是从此没有情绪，而是情绪来了，它可以被你看见，却不能替你做决定。";

type FileInfo = { id:string; name:string; url:string };

export default function Home(){
 const [idea,setIdea]=useState("");
 const [reference,setReference]=useState("");
 const [referenceFile,setReferenceFile]=useState<FileInfo|null>(null);
 const [referenceStyle,setReferenceStyle]=useState<any>(null);
 const [template,setTemplate]=useState("王阳明心学");
 const [tone,setTone]=useState("沉稳、有力量");
 const [length,setLength]=useState("45 秒");
 const [step,setStep]=useState("create");
 const [script,setScript]=useState("");
 const [loading,setLoading]=useState(false);
 const [uploading,setUploading]=useState(false);
 const [video,setVideo]=useState<FileInfo|null>(null);
 const [finalVideo,setFinalVideo]=useState<string|null>(null);
 const [status,setStatus]=useState("");
 const count=useMemo(()=>script.replace(/\s/g,"").length,[script]);

 async function uploadToWorker(file:File, kind:"reference"|"material"){
  setUploading(true); setStatus(kind==="reference"?"正在分析参考视频节奏…":"正在上传原始素材…");
  try{
   const fd=new FormData(); fd.append("file",file);
   const endpoint=kind==="reference"?"/analyze-reference":"/upload";
   const r=await fetch(VIDEO_API+endpoint,{method:"POST",body:fd});
   const d=await r.json();
   if(!r.ok) throw new Error(d.detail||"上传失败");
   return d;
  }catch(e:any){setStatus(e?.message||"视频服务连接失败");return null}
  finally{setUploading(false)}
 }

 async function handleReference(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0]; if(!f)return;
  const d=await uploadToWorker(f,"reference");
  if(d){setReferenceFile({id:d.id,name:f.name,url:VIDEO_API+d.url});setReferenceStyle(d);setStatus("参考视频节奏已提取，生成脚本时只使用高层风格信息。")}
 }

 async function generate(){
  if(!idea.trim())return;
  setLoading(true); setStatus("正在生成原创脚本…");
  try{
   const r=await fetch("/api/generate-script",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idea,reference,referenceStyle,template,tone,length})});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"AI 请求失败");
   setScript(d.script);setStep("script");setStatus("");
  }catch(e:any){
   setScript(demo);setStep("script");setStatus(e?.message||"AI 服务暂不可用，已载入示例脚本。");
  }finally{setLoading(false)}
 }

 async function uploadMaterial(e:ChangeEvent<HTMLInputElement>){
  const f=e.target.files?.[0];if(!f)return;
  const d=await uploadToWorker(f,"material");
  if(d){setVideo({id:d.id,name:f.name,url:VIDEO_API+d.url});setStep("material");setStatus("")}
 }

 async function autoEdit(){
  if(!video)return;
  setLoading(true);setStatus("正在自动剪辑：去除开头/结尾空白、裁切 9:16、生成字幕并导出 MP4…");
  try{
   const chosen=lengths.find(x=>x.label===length)?.seconds||45;
   const r=await fetch(VIDEO_API+"/edit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source_id:video.id,script,target_seconds:chosen,subtitle:true})});
   const d=await r.json();
   if(!r.ok)throw new Error(d.detail||"剪辑失败");
   setFinalVideo(VIDEO_API+d.url);setStep("edit");setStatus("成片已生成。");
  }catch(e:any){setStatus(e?.message||"自动剪辑失败，请检查视频服务")}
  finally{setLoading(false)}
 }

 const nav=(s:string)=>setStep(s);

 return <main className="min-h-screen bg-[#f6f6f3] text-[#171717]">
  <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
   <button onClick={()=>nav("create")} className="text-lg font-semibold">AI 视频创作</button>
   <div className="hidden text-sm text-neutral-400 sm:block">灵感 → 脚本 → 素材 → 成片</div>
  </header>

  {step==="create" && <section className="mx-auto max-w-3xl px-5 pb-20 pt-16 sm:pt-24">
   <div className="mb-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">AI 短视频工作台</div>
   <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">把一个想法，变成一条视频。</h1>
   <p className="mt-5 text-base leading-7 text-neutral-500">输入灵感和参考视频，AI 提炼高层表达风格，生成原创脚本，再用你的原始素材自动剪辑。</p>
   <div className="mt-10 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
    <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="写下你的灵感……" className="min-h-44 w-full resize-none p-6 text-lg leading-8 outline-none placeholder:text-neutral-300"/>
    <div className="border-t border-neutral-100 p-4 space-y-3">
     <input value={reference} onChange={e=>setReference(e.target.value)} placeholder="参考视频链接（可选）" className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm outline-none"/>
     <div className="flex items-center gap-3">
      <label className="cursor-pointer rounded-xl border border-neutral-200 px-4 py-3 text-sm hover:bg-neutral-50"><input type="file" accept="video/*" className="hidden" onChange={handleReference}/>上传参考视频</label>
      {referenceFile&&<span className="truncate text-xs text-neutral-500">已分析：{referenceFile.name}</span>}
     </div>
     <p className="text-[11px] leading-5 text-neutral-400">如果链接不是可直接下载的视频文件，请上传参考视频文件；系统只提取时长、画幅和切镜节奏等高层信息。</p>
    </div>
    <div className="grid gap-3 border-t border-neutral-100 p-4 sm:grid-cols-3">
     <select value={template} onChange={e=>setTemplate(e.target.value)} className="rounded-xl bg-neutral-50 px-4 py-3 text-sm">{templates.map(x=><option key={x}>{x}</option>)}</select>
     <select value={length} onChange={e=>setLength(e.target.value)} className="rounded-xl bg-neutral-50 px-4 py-3 text-sm">{lengths.map(x=><option key={x}>{x.label}</option>)}</select>
     <select value={tone} onChange={e=>setTone(e.target.value)} className="rounded-xl bg-neutral-50 px-4 py-3 text-sm">{tones.map(x=><option key={x}>{x}</option>)}</select>
    </div>
    <div className="p-4 pt-0"><button onClick={generate} disabled={!idea.trim()||loading||uploading} className="w-full rounded-xl bg-neutral-900 px-5 py-3.5 text-sm font-medium text-white disabled:bg-neutral-200">{loading?"AI 正在创作…":"开始创作 →"}</button></div>
   </div>
   {status&&<p className="mt-4 text-center text-xs text-neutral-400">{status}</p>}
   <div className="mt-8 flex justify-center gap-3 text-xs text-neutral-400"><span>① 灵感</span><span>→</span><span>② 原创脚本</span><span>→</span><span>③ 原始素材</span><span>→</span><span>④ 自动剪辑</span></div>
  </section>}

  {step!=="create" && <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
   <div className="mb-7 flex items-end justify-between">
    <div><button onClick={()=>nav("create")} className="text-sm text-neutral-500">← 重新开始</button><h1 className="mt-3 text-3xl font-semibold">创作工作台</h1></div>
    <div className="flex gap-2 text-xs">{[["script","脚本"],["material","素材"],["edit","成片"]].map((x,i)=><button key={x[0]} onClick={()=>nav(x[0])} className={"rounded-full px-3 py-2 "+(step===x[0]?"bg-neutral-900 text-white":"border border-neutral-200 bg-white text-neutral-400")}>{i+1} {x[1]}</button>)}</div>
   </div>

   {step==="script" && <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7">
     <div className="flex items-center justify-between border-b border-neutral-100 pb-5"><div><h2 className="font-medium">原创脚本</h2><p className="mt-1 text-xs text-neutral-400">只写内容，不生成分镜。</p></div><span className="text-xs text-neutral-400">{count} 字</span></div>
     <div className="mt-5 grid grid-cols-5 gap-2">{structure.map(x=><div key={x[0]} className="rounded-xl bg-neutral-50 p-3"><div className="text-[10px] text-neutral-400">{x[0]}</div><div className="mt-2 text-xs font-medium leading-5">{x[1]}</div></div>)}</div>
     <textarea value={script} onChange={e=>setScript(e.target.value)} className="mt-5 min-h-[520px] w-full rounded-2xl border border-neutral-200 p-5 text-sm leading-8 outline-none"/>
     {status&&<p className="mt-3 text-xs text-neutral-400">{status}</p>}
     <div className="mt-5 flex justify-end"><button onClick={()=>nav("material")} className="rounded-xl bg-neutral-900 px-5 py-3 text-sm text-white">确认脚本 → 上传素材</button></div>
    </div>
    <aside className="h-fit rounded-3xl border border-neutral-200 bg-white p-6"><h3 className="font-medium">创作设置</h3><div className="mt-5 space-y-4 text-sm"><div><div className="text-xs text-neutral-400">内容方向</div><div className="mt-2 rounded-xl bg-neutral-50 px-4 py-3">{template}</div></div><div><div className="text-xs text-neutral-400">目标时长</div><div className="mt-2 rounded-xl bg-neutral-50 px-4 py-3">{length}</div></div><div><div className="text-xs text-neutral-400">表达气质</div><div className="mt-2 rounded-xl bg-neutral-50 px-4 py-3">{tone}</div></div><div><div className="text-xs text-neutral-400">参考节奏</div><div className="mt-2 rounded-xl bg-neutral-50 px-4 py-3">{referenceStyle?("已提取 "+referenceStyle.shot_count+" 个切镜点"):"未分析"}</div></div></div></aside>
   </div>}

   {step==="material" && <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
    <div className="rounded-3xl border border-neutral-200 bg-white p-7"><h2 className="text-xl font-semibold">上传你的原始素材</h2><p className="mt-2 text-sm text-neutral-500">上传口播、生活片段或一条长视频，系统会去掉明显开头/结尾空白、裁成 9:16，并生成字幕。</p>
     <label className="mt-8 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50"><input type="file" accept="video/*" className="hidden" onChange={uploadMaterial}/><div className="text-3xl">＋</div><div className="mt-3 text-sm font-medium">{uploading?"正在上传…":"点击上传视频"}</div><div className="mt-1 text-xs text-neutral-400">MP4 / MOV / WebM，最大 1GB</div></label>
     {video&&<div className="mt-5 overflow-hidden rounded-2xl bg-black"><video src={video.url} controls className="max-h-[480px] w-full"/></div>}
     {video&&<div className="mt-3 text-xs text-neutral-500">{video.name}</div>}
     {status&&<p className="mt-3 text-xs text-neutral-400">{status}</p>}
     <div className="mt-6 flex justify-end"><button disabled={!video||loading} onClick={autoEdit} className="rounded-xl bg-neutral-900 px-5 py-3 text-sm text-white disabled:bg-neutral-200">{loading?"正在剪辑…":"开始自动剪辑 →"}</button></div>
    </div>
    <aside className="h-fit rounded-3xl border border-neutral-200 bg-white p-6"><h3 className="font-medium">本次剪辑</h3><div className="mt-5 space-y-3 text-sm text-neutral-500"><div className="rounded-xl bg-neutral-50 p-4">脚本：{script?"已确认":"未生成"}</div><div className="rounded-xl bg-neutral-50 p-4">参考节奏：{referenceStyle?"已分析":"未提供"}</div><div className="rounded-xl bg-neutral-50 p-4">目标比例：9:16</div><div className="rounded-xl bg-neutral-50 p-4">字幕：自动生成</div></div></aside>
   </div>}

   {step==="edit" && <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
    <div className="rounded-3xl border border-neutral-200 bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">成片预览</h2><p className="mt-1 text-sm text-neutral-500">已完成基础自动剪辑。</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">9:16</span></div>
     <div className="mx-auto mt-6 flex aspect-[9/16] max-h-[620px] max-w-[350px] items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">{finalVideo?<video src={finalVideo} controls className="h-full w-full object-contain"/>:<div className="text-sm text-neutral-500">等待素材</div>}</div>
     <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm leading-7 text-neutral-600 whitespace-pre-wrap">{script}</div>
     <div className="mt-5 flex gap-3"><button onClick={()=>nav("script")} className="flex-1 rounded-xl border border-neutral-200 px-5 py-3 text-sm">修改脚本</button>{finalVideo&&<a href={finalVideo} download className="flex-1 rounded-xl bg-neutral-900 px-5 py-3 text-center text-sm text-white">导出成片 ↓</a>}</div>
     {status&&<p className="mt-3 text-center text-xs text-neutral-400">{status}</p>}
    </div>
    <aside className="h-fit rounded-3xl border border-neutral-200 bg-white p-6"><h3 className="font-medium">自动处理</h3><ul className="mt-5 space-y-3 text-sm leading-6 text-neutral-500"><li>• 检测并裁掉明显开头/结尾静音</li><li>• 居中裁切为 1080 × 1920</li><li>• 根据脚本自动生成字幕时间轴</li><li>• H.264 + AAC MP4</li><li>• 参考视频只影响节奏分析，不复制原素材</li></ul></aside>
   </div>}
  </section>}
 </main>
}
