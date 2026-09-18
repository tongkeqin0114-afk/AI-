import { NextResponse } from "next/server";

const system = `你是专业中文短视频口播脚本作者。严格使用五段结构：
1. 开场核心金句
2. 反常识钩子
3. 大多数人的认知 + 举例说明
4. 正确理解和说明
5. 结尾

要求：自然口语、短句、有观点、有传播力；内容必须原创；参考视频只允许学习高层节奏、结构、表达气质，不复制具体文案、独特措辞、人物表达或素材；不要输出分镜、镜头、拍摄建议、标题解释或创作说明；直接输出可口播成稿。
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: "请配置 OPENAI_API_KEY" }, { status: 503 });

    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";
    const style = body.referenceStyle
      ? JSON.stringify({
          duration: body.referenceStyle.duration,
          width: body.referenceStyle.width,
          height: body.referenceStyle.height,
          shot_count: body.referenceStyle.shot_count,
          average_shot_seconds: body.referenceStyle.average_shot_seconds,
        })
      : "无已分析参考视频";

    const input = `内容方向：${body.template}
目标时长：${body.length}
表达气质：${body.tone}
用户灵感：
${body.idea}

参考视频链接：
${body.reference || "无"}

参考视频高层节奏数据：
${style}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model,
        instructions: system,
        input,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "AI 请求失败" },
        { status: response.status }
      );
    }

    return NextResponse.json({ script: data.output_text || "" });
  } catch {
    return NextResponse.json({ error: "服务器处理失败" }, { status: 500 });
  }
}
