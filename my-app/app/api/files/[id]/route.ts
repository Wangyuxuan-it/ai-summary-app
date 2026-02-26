import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 注意类型改为 Promise
) {
  try {
    // 使用 await 获取 params
    const { id } = await params;
    const fileName = id; // 现在 fileName 有正确的值了

    console.log('Attempting to delete file from storage:', fileName);

    // 执行删除操作
    const { data, error } = await supabase.storage
      .from('documents')
      .remove([fileName]);

    console.log('Supabase remove result:', { data, error });

    if (error) {
      console.error('Supabase storage error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 检查是否真的有文件被删除
    if (!data || data.length === 0) {
      console.warn('No files were deleted. The file may not exist in storage.');
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    // 如果后续有数据库记录，也在这里删除（暂时注释掉）
    // await supabase.from('documents').delete().eq('storage_path', fileName)

    return NextResponse.json({ success: true, deleted: data });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}