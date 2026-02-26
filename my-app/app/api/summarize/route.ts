import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { fileContent, fileName, language = 'en', customPrompt = '' } = body;

    if (!fileContent) {
      return NextResponse.json({ error: 'Missing file content' }, { status: 400 });
    }

    const maxLength = 15000;
    const truncatedContent = fileContent.length > maxLength
      ? fileContent.substring(0, maxLength) + '... [截断]'
      : fileContent;

    const languageName = language === 'zh' ? '中文' : 'English';
    let prompt = `请用 ${languageName} 总结以下文档内容：\n\n${truncatedContent}`;
    if (customPrompt) {
      prompt = `${customPrompt}\n\n文档内容：\n${truncatedContent}`;
    }

    let summary: string;
    try {
      const completion = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });
      summary = completion.choices[0]?.message?.content || '无法生成摘要。';
    } catch (aiError: any) {
      console.error('DeepSeek error:', aiError);
      if (aiError.status === 402 || aiError.message?.includes('Insufficient Balance')) {
        summary = '【API 额度不足】请检查 DeepSeek API 余额。';
      } else {
        summary = `【AI 服务错误】${aiError.message}`;
      }
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}