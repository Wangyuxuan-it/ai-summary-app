'use client';

import { useState, useEffect } from 'react';

interface SettingsPanelProps {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [customPrompt, setCustomPrompt] = useState('');

  // 加载保存的设置
  useEffect(() => {
    const saved = localStorage.getItem('customSummaryPrompt');
    if (saved) {
      setCustomPrompt(saved);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('customSummaryPrompt', customPrompt);
    onClose(); // 保存后关闭面板
  };

  const resetToDefault = () => {
    setCustomPrompt('');
    localStorage.removeItem('customSummaryPrompt');
  };

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Settings</h1>
      <h2 style={{ fontSize: '1.2rem', margin: '20px 0 10px' }}>AI Summary Customization</h2>
      <p style={{ color: '#555', marginBottom: '15px' }}>
        Customize the prompt that will be sent to the AI when generating summaries.
        Add your specific requirements or instructions below. Leave empty to use the default prompt.
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="customPrompt" style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
          Custom Requirements
        </label>
        <textarea
          id="customPrompt"
          rows={6}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Example: Focus on technical details and provide actionable insights. Include key metrics and data points. Format the summary with clear sections."
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '30px' }}>
        Tip: The AI will incorporate your requirements into the summary generation process.<br />
        Default prompt focuses on creating a comprehensive summary with key points and main ideas.
      </p>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={resetToDefault}
          style={{ padding: '8px 16px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
        >
          Reset to Default
        </button>
        <button
          onClick={onClose}
          style={{ padding: '8px 16px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={saveSettings}
          style={{ padding: '8px 16px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}