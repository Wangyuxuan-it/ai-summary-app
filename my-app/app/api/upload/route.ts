import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  const extension = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex);
  const safeBase = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
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

    const originalName = file.name;
    const safeOriginal = sanitizeFileName(originalName);
    const fileName = `${Date.now()}_${safeOriginal}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 上传到 Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) throw storageError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // 插入数据库
    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          file_name: originalName,
          file_size: file.size,
          storage_path: fileName,
          public_url: urlData.publicUrl,
        },
      ])
      .select()
      .single();

    if (dbError) {
      // 插入失败时删除已上传的存储文件
      await supabase.storage.from('documents').remove([fileName]);
      throw dbError;
    }

    return NextResponse.json({
      id: dbData.id,               // 数据库自增ID
      name: dbData.file_name,
      size: dbData.file_size,
      url: dbData.public_url,
      uploadedAt: dbData.uploaded_at,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}