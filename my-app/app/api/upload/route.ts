import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Parse the uploaded form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file selected' }, { status: 400 });
    }

    // Generate a unique file name (to avoid duplicates)
    const fileName = `${Date.now()}-${file.name}`;
    
    // Upload the file to the Supabase storage bucket
    const { data, error } = await supabase.storage
      .from('documents') // corresponds to the bucket name created earlier
      .upload(fileName, file);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL of the uploaded file
    const { data: urlData } = await supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl: urlData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}