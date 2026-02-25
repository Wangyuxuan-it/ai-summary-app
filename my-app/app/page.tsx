'use client'

import { useState } from "react";
import { supabase } from '@/app/lib/supabase';

export default function Home() {
  const [status, setStatus] = useState("Frontend is running");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

  // Check backend health status
  async function checkBackend() {
    setStatus("Checking backend...");
    const res = await fetch('/api/health');
    const data = await res.json();
    setStatus(`Backend response: ${data.message}`);
  }

  // Handle file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("Uploading file...");
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Call upload API
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadStatus(`Upload successful! Filename: ${data.fileName}`);
        // Get list of uploaded files
        await fetchFileList();
      } else {
        setUploadStatus(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      setUploadStatus("Upload error, please try again");
    }
  }

  // Get list of files from Supabase
  async function fetchFileList() {
    const { data, error } = await supabase.storage
      .from('documents')
      .list();

    if (!error && data) {
      // Get public URL for each file
      const filesWithUrl = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from('documents')
            .getPublicUrl(file.name);
          return { name: file.name, url: urlData.publicUrl };
        })
      );
      setUploadedFiles(filesWithUrl);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1d324b' }}>AI Summary App</h1>
      
      {/* Check backend button */}
      <button 
        onClick={checkBackend}
        style={{ marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Check Backend Status
      </button>
      <p style={{ marginBottom: '1.5rem' }}>{status}</p>

      {/* File upload section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Upload Document</h3>
        <input
          type="file"
          onChange={handleFileUpload}
          style={{ marginBottom: '0.5rem' }}
        />
        <p style={{ color: '#059669' }}>{uploadStatus}</p>
      </div>

      {/* Uploaded files list */}
      <div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Uploaded Files</h3>
        {uploadedFiles.length === 0 ? (
          <p>No files uploaded yet</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {uploadedFiles.map((file, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}