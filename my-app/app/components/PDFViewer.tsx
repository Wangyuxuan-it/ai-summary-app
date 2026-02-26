'use client';

interface PDFViewerProps {
  fileUrl: string;
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  return (
    <iframe
      src={fileUrl}
      width="100%"
      height="600px"
      style={{ border: 'none' }}
      title="PDF Viewer"
    />
  );
}