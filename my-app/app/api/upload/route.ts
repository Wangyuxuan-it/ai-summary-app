import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// 净化文件名，只保留字母、数字、点、下划线、连字符，防止特殊字符导致上传失败
function sanitizeFileName(fileName: string): string {
  // 提取扩展名
  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  const extension = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex);

  // 将 baseName 中非安全字符替换为下划线
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  // 限制长度（可选），避免过长
  const truncatedBase = safeBase.slice(0, 100);
  return truncatedBase + extension;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 生成安全的文件名：时间戳 + 净化后的原始文件名
    const originalName = file.name;
    const safeOriginal = sanitizeFileName(originalName);
    const fileName = `${Date.now()}_${safeOriginal}`;

    console.log('Uploading with fileName:', fileName); // 调试日志

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    return NextResponse.json({
      id: data.path,
      name: originalName, // 返回原始文件名（显示用）
      size: file.size,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}