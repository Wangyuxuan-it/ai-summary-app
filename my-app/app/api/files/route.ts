import { NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function GET() {
  try {
    // 列出storage中所有文件
    const { data, error } = await supabase.storage
      .from('documents')
      .list()
    
    if (error) {
      throw error
    }

    // 增强文件信息：获取公共URL和文件大小（Supabase list返回的对象包含metadata）
    const files = await Promise.all(
      data.map(async (item) => {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(item.name)
        
        return {
          id: item.id,
          name: item.name,
          size: item.metadata?.size || 0,
          url: urlData.publicUrl,
          uploadedAt: item.created_at
        }
      })
    )
    
    return NextResponse.json(files)
  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}