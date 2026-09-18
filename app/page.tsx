"use client";
import {useMemo,useState} from "react";

const templates=["禅意思考","王阳明心学","人生感悟","传统文化"];
const sections=[
 ["开场核心金句","一句话先把观点钉住"],
 ["反常识钩子","打破观众原有认知，制造继续看下去的理由"],
 ["大多数人的认知 + 举例说明","先说大家通常怎么想，再用生活场景让观点落地"],
 ["正确理解和说明","给出真正的理解、逻辑和可执行的启发"],
 ["结尾","用一句有余味的话收束，让观众愿意转发或收藏"]
];

export default function Home(){
 const [idea,setIdea]=useState("");
 const [url,setUrl]=useState("");
 const [template,setTemplate]=useState("王阳明心学");
 const [started,setStarted]=useState(false);
 const [tab,setTab]=useState<"style"|"script">("style");
 const [duration,setDuration]=useState("45");
 const [tone,setTone]=useState("沉稳、有力量");
 const [script,setScript]=useState(sections.map(([title])=>title+"：").join("\n"));
 const summary=useMemo(()=>idea.trim()?idea.trim().slice(0,70)+(idea.trim().length>70?"…":""):"尚未输入灵感", [idea]);

 return <main className="min-h-screen bg-[#f7f7f5]">
  <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
   <div className="text-lg font-semibold tracking-tight">AI 视频创作</div>
   <div className="text-sm text-neutral-400">灵感 → 脚本 → 成片</div>
  </header>

  {!started ? <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-16 text-center">
   <div className="mb-5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">AI 短视频工作台</div>
   <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">把你的想法，变成一条视频</h1>
   <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">输入灵感，可选参考视频。AI 提炼高层表达与剪辑规律，再生成原创脚本。</p>
   <div className="mt-10 w-full rounded-2xl border border-neutral-200 bg-white p-3 text-left shadow-sm">
    <textarea value={idea} onChange={e=>setIdea(e.target.value)} placeholder="写下你的灵感，例如：真正厉害的人，不是没有情绪，而是不会被情绪牵着走。" className="min-h-36 w-full resize-none border-0 p-4 text-base outline-none placeholder:text-neutral-300"/>
    <div className="border-t border-neutral-100 p-3">
     <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="参考视频链接（可选）" className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-sm outline-none placeholder:text-neutral-400"/>
    </div>
    <div className="flex flex-col gap-3 border-t border-neutral-100 p-3 sm:flex-row">
     <select value={template} onChange={e=>setTemplate(e.target.value)} className="rounded-xl bg-neutral-50 px-4 py-3 text-sm outline-none">{templates.map(x=><option key={x}>{x}</option>)}</select>
     <button onClick={()=>setStarted(true)} disabled={!idea.trim()} className="flex-1 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-200">开始创作 →</button>
    </div>
   </div>
   <div className="mt-10 flex items-center gap-3 text-xs text-neutral-400"><span>① 灵感</span><span>→</span><span>② AI脚本</span><span>→</span><span>③ 自动剪辑</span></div>
  </section> :
  <section className="mx-auto max-w-6xl px-6 pb-16 pt-8">
   <div className="mb-6 flex items-center justify-between">
    <div><button onClick={()=>setStarted(false)} className="text-sm text-neutral-500 hover:text-neutral-900">← 返回</button><h1 className="mt-3 text-2xl font-semibold">创作工作台</h1></div>
    <button className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white">下一步：上传素材 →</button>
   </div>
   <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
     <div className="flex gap-2 border-b border-neutral-100 pb-4">
      <button onClick={()=>setTab("style")} className={`rounded-lg px-4 py-2 text-sm ${tab==="style"?"bg-neutral-900 text-white":"text-neutral-500"}`}>① 参考风格</button>
      <button onClick={()=>setTab("script")} className={`rounded-lg px-4 py-2 text-sm ${tab==="script"?"bg-neutral-900 text-white":"text-neutral-500"}`}>② 原创脚本</button>
     </div>
     {tab==="style" ? <div className="pt-6">
      <div className="rounded-xl bg-neutral-50 p-5"><div className="text-xs text-neutral-400">你的灵感</div><div className="mt-2 leading-7">{summary}</div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
       <label className="rounded-xl border border-neutral-200 p-4"><div className="text-xs text-neutral-400">目标时长</div><select value={duration} onChange={e=>setDuration(e.target.value)} className="mt-2 w-full outline-none"><option value="30">30 秒</option><option value="45">45 秒</option><option value="60">60 秒</option><option value="90">90 秒</option></select></label>
       <label className="rounded-xl border border-neutral-200 p-4"><div className="text-xs text-neutral-400">表达气质</div><select value={tone} onChange={e=>setTone(e.target.value)} className="mt-2 w-full outline-none"><option>沉稳、有力量</option><option>温和、克制</option><option>犀利、有冲击</option><option>口语、接地气</option></select></label>
       <div className="rounded-xl border border-neutral-200 p-4"><div className="text-xs text-neutral-400">参考视频</div><div className="mt-2 truncate text-sm">{url||"未提供"}</div></div>
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-8 text-center"><div className="text-sm font-medium">AI 风格分析</div><p className="mt-2 text-sm leading-6 text-neutral-500">接入视频分析后，这里会提取表达节奏、口播密度、字幕节奏、转场规律和整体制作风格。</p><button onClick={()=>setTab("script")} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">生成原创脚本 →</button></div>
     </div> :
     <div className="pt-6">
      <div className="mb-5 grid gap-3 sm:grid-cols-5">{sections.map(([title],i)=><div key={title} className="rounded-xl bg-neutral-50 p-3"><div className="text-xs text-neutral-400">0{i+1}</div><div className="mt-2 text-sm font-medium">{title}</div></div>)}</div>
      <textarea value={script} onChange={e=>setScript(e.target.value)} className="min-h-[420px] w-full rounded-xl border border-neutral-200 p-5 text-sm leading-7 outline-none focus:border-neutral-400"/>
      <div className="mt-4 flex justify-end"><button onClick={()=>alert("下一阶段接入真实 AI 生成")} className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white">确认脚本，准备素材 →</button></div>
     </div>}
    </div>
    <aside className="rounded-2xl border border-neutral-200 bg-white p-5">
     <div className="text-sm font-medium">创作设置</div>
     <div className="mt-5 space-y-4 text-sm"><div><div className="text-xs text-neutral-400">内容方向</div><div className="mt-2 rounded-xl bg-neutral-50 px-4 py-3">{template}</div></div><div><div className="text-xs text-neutral-400">当前步骤</div><div className="mt-2 rounded-xl bg-neutral-50 px-4 py-3">{tab==="style"?"分析参考风格":"编辑原创脚本"}</div></div><div><div className="text-xs text-neutral-400">制作目标</div><div className="mt-2 leading-6 text-neutral-500">保持参考视频的高层节奏与制作逻辑，不复制原视频的具体表达。</div></div></div>
    </aside>
   </div>
  </section>}
 </main>
}