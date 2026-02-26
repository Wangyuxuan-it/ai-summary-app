'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';

// 动态导入 PDFViewer，禁用 SSR
const PDFViewer = dynamic(() => import('../app/components/PDFViewer'), { ssr: false });

interface FileItem {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export default function Home() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeTab, setActiveTab] = useState<'pdf' | 'text' | 'summary'>('pdf');
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [pdfJs, setPdfJs] = useState<any>(null);

  // 动态加载 pdfjs-dist 并设置 worker（仅在客户端执行）
  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        // 使用本地 worker 文件（已复制到 public 目录）
        const workerUrl = window.location.origin + '/pdf.worker.min.js';
        console.log('Setting worker to:', workerUrl);
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        setPdfJs(() => pdfjs);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
      }
    };
    loadPdfJs();
  }, []);

  // 生成摘要函数（前端提取 PDF 文本）
  const generateSummary = async (file: FileItem) => {
    setLoadingSummary(true);
    try {
      let textContent = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      // 如果是 PDF，使用 PDF.js 在前端提取文本
      if (fileExtension === 'pdf') {
        if (!pdfJs) {
          alert('PDF 解析库尚未加载完成，请稍后重试。');
          setLoadingSummary(false);
          return;
        }
        try {
          const loadingTask = pdfJs.getDocument(file.url);
          const pdf = await loadingTask.promise;
          const pageTexts: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map((item: any) => item.str);
            pageTexts.push(strings.join(' '));
          }
          textContent = pageTexts.join('\n');
          console.log('PDF text extracted, length:', textContent.length);
        } catch (pdfError: any) {
          console.error('PDF extraction error:', pdfError);
          alert('PDF 解析失败：' + (pdfError.message || '未知错误'));
          setLoadingSummary(false);
          return;
        }
      } else {
        // 对于文本文件，直接 fetch 内容
        try {
          const response = await fetch(file.url);
          textContent = await response.text();
        } catch (textError) {
          console.error('Text file fetch error:', textError);
          alert('无法读取文本文件内容。');
          setLoadingSummary(false);
          return;
        }
      }

      // 从 localStorage 读取自定义提示词（由设置页面保存）
      const customPrompt = localStorage.getItem('customSummaryPrompt') || '';

      // 调用后端 API 生成摘要
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: textContent,
          fileName: file.name,
          language: 'en', // 如需语言切换，可从状态获取
          customPrompt,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setActiveTab('summary');
      } else {
        alert('生成摘要失败：' + data.error);
      }
    } catch (error) {
      console.error('Error in generateSummary:', error);
      alert('生成摘要时发生错误，请稍后重试。');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSelectFile = (file: FileItem) => {
    setSelectedFile(file);
    setActiveTab('pdf');
    setSummary('');
  };

  return (
    <div style={{ display: 'flex', gap: 20, padding: 20 }}>
      {/* 左侧区域：上传和文件列表 */}
      <div style={{ flex: 1 }}>
        <h1>AI Summary App</h1>
        <FileUploader onUploadSuccess={() => window.location.reload()} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2>Stored Files</h2>
          <button onClick={() => router.push('/settings')} style={{ padding: '5px 10px' }}>
            Settings
          </button>
        </div>
        <FileList onSelectFile={handleSelectFile} onGenerateSummary={generateSummary} />
      </div>

      {/* 右侧区域：文档详情 */}
      <div style={{ flex: 1 }}>
        {selectedFile ? (
          <div>
            <h2>Document: {selectedFile.name}</h2>
            <div style={{ marginBottom: 10 }}>
              <button onClick={() => setActiveTab('pdf')}>PDF Viewer</button>
              <button onClick={() => setActiveTab('text')}>Extracted Text</button>
              <button onClick={() => setActiveTab('summary')}>Summary</button>
            </div>

            <div>
              {activeTab === 'pdf' && <PDFViewer fileUrl={selectedFile.url} />}
              {activeTab === 'text' && (
                <div>
                  <p>Extracted text will appear here. (Implement /api/extract if needed)</p>
                </div>
              )}
              {activeTab === 'summary' && (
                <div>
                  {loadingSummary ? 'Generating summary...' : <p>{summary || 'No summary yet. Click "Generate Summary" in the file list.'}</p>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>Select a document from the left list to view its content and generate summaries</p>
        )}
      </div>
    </div>
  );
}