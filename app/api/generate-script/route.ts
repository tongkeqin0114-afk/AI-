import { NextResponse } from "next/server";

const instructions = "你是一名中文短视频脚本作者。严格使用五段结构：1.开场核心金句 2.反常识钩子 3.大多数人的认知+举例说明 4.正确理解和说明 5.结尾。要求口语化、自然、有传播力。只学习参考视频的高层结构、节奏、表达气质，不复制具体文案、独特表达或素材。不要生成分镜、镜头说明或拍摄建议。直接输出完整原创脚本。";

export async function POST(req: Request) {
 try {
  const b = await req.json();
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"未配置 OPENAI_API_KEY"},{status:503});
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
  const input = "内容方向："+(b.template||"人生感悟")+"\n目标时长："+(b.length||"45 秒")+"\n表达气质："+(b.tone||"沉稳、有力量")+"\n用户灵感：\n"+b.idea+"\n参考视频链接：\n"+(b.reference||"无");
  const r = await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({model,instructions,input})});
  const d = await r.json();
  if(!r.ok) return NextResponse.json({error:d?.error?.message||"OpenAI 请求失败"},{status:r.status});
  return NextResponse.json({script:d.output_text||""});
 } catch { return NextResponse.json({error:"服务器处理失败"},{status:500}); }
}