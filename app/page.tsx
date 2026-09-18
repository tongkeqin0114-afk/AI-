"use client";
import {useState} from "react";

const templates=["禅意思考","王阳明心学","人生感悟","传统文化"];

export default function Home(){
 const [idea,setIdea]=useState("");
 const [url,setUrl]=useState("");
 const [template,setTemplate]=useState("王阳明心学");
 const [started,setStarted]=useState(false);
 return <main className="min-h-screen">
  <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
   <div className="text-lg font-semibold tracking-tight">AI 视频创作</div>
   <div className="text-sm text-neutral-400">从一个想法，到一条成片</div>
  </header>
  <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-16 text-center">
   <div className="mb-5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">AI 短视频工作台</div>
   <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">把你的想法，变成一条视频</h1>
   <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">输入灵感，可选参考视频。AI 会提炼表达结构、生成原创脚本，并为后续自动剪辑做好准备。</p>
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
   {started && <div className="mt-5 w-full rounded-2xl border border-neutral-200 bg-white p-5 text-left">
    <div className="text-sm font-medium">创作任务已建立</div>
    <div className="mt-2 text-sm text-neutral-500">方向：{template} · {url?"已添加参考视频":"暂无参考视频"}</div>
    <div className="mt-4 grid gap-2 sm:grid-cols-4">{["分析风格","生成脚本","上传素材","自动剪辑"].map((x,i)=><div key={x} className="rounded-xl bg-neutral-50 p-3 text-center text-xs text-neutral-500"><span className="mr-1">{i+1}.</span>{x}</div>)}</div>
   </div>}
   <div className="mt-10 flex items-center gap-3 text-xs text-neutral-400"><span>① 灵感</span><span>→</span><span>② AI脚本</span><span>→</span><span>③ 自动剪辑</span></div>
  </section>
 </main>
}