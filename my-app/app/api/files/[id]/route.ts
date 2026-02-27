import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = id;

    // 查询数据库获取存储路径
    const { data: file, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 删除存储文件
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([file.storage_path]);

    if (storageError) throw storageError;

    // 删除数据库记录
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}