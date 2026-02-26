'use client';
import { useEffect, useState } from 'react';

interface FileItem {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface FileListProps {
  onSelectFile: (file: FileItem) => void;
  onGenerateSummary: (file: FileItem) => void; // 新增属性
}

export default function FileList({ onSelectFile, onGenerateSummary }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    setLoading(true);
    const res = await fetch('/api/files');
    const data = await res.json();
    setFiles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure?')) return;
    const res = await fetch(`/api/files/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchFiles(); // 刷新列表
    } else {
      const err = await res.json();
      alert(`Delete failed: ${err.error}`);
    }
  };

  if (loading) return <p>Loading files...</p>;

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>File Name</th>
            <th>Size</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>
                <button
                  onClick={() => onSelectFile(file)}
                  style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  {file.name}
                </button>
              </td>
              <td>{(file.size / 1024).toFixed(2)} KB</td>
              <td>
                {/* 点击 Generate Summary 调用 onGenerateSummary */}
                <button onClick={() => onGenerateSummary(file)}>Generate Summary</button>
                <button onClick={() => handleDelete(file.name)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={fetchFiles} style={{ marginTop: 10 }}>Refresh</button>
    </div>
  );
}