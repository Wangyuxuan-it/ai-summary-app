import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    const files = data.map((item) => ({
      id: item.id,
      name: item.file_name,
      size: item.file_size,
      url: item.public_url,
      uploadedAt: item.uploaded_at,
    }));

    return NextResponse.json(files);
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}