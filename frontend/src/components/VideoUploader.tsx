import React, { useState, useRef } from 'react';
import { UploadCloud, Sparkles, AlertCircle, FileVideo, Mic } from 'lucide-react';
import { uploadVideoFile, requestDemoClip } from '../api';
import type { UploadResponse } from '../types';

interface VideoUploaderProps {
  onUploadSuccess: (uploadData: UploadResponse) => void;
  isProcessing: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadSuccess,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validExtensions = [
      '.mp4', '.mov', '.mkv', '.webm', '.m4v', '.avi',
      '.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg', '.opus', '.wma'
    ];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      setErrorMessage(`Unsupported format. Supported: MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, FLAC.`);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setErrorMessage(`File exceeds 500MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);
    setUploading(true);

    try {
      const result = await uploadVideoFile(file);
      onUploadSuccess(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTryDemo = async () => {
    setErrorMessage(null);
    setUploading(true);
    try {
      const demoResult = await requestDemoClip();
      onUploadSuccess(demoResult);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate demo clip');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            Upload Video or Voice Audio
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Provide any speech recording or video contaminated with fan noise, air conditioning, hum, or chatter.
          </p>
        </div>

        {/* Instant sample button */}
        <button
          type="button"
          onClick={handleTryDemo}
          disabled={uploading || isProcessing}
          className="btn-secondary"
          style={{
            fontSize: '0.82rem',
            padding: '8px 14px',
            borderColor: 'rgba(6, 182, 212, 0.4)',
            color: 'var(--accent-cyan)'
          }}
        >
          <Sparkles size={15} />
          <span>Try Demo Speech Clip</span>
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && !isProcessing && fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed var(--accent-cyan)' : '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: uploading || isProcessing ? 'not-allowed' : 'pointer',
          background: isDragging ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.01)',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,.mp4,.mov,.webm,.mkv,.avi,.wav,.mp3,.m4a,.aac,.flac,.ogg,.opus,.wma"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          {uploading ? (
            <div style={{
              width: 24,
              height: 24,
              border: '3px solid rgba(6, 182, 212, 0.3)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            <UploadCloud size={28} color="var(--accent-cyan)" />
          )}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 6 }}>
          {uploading ? 'Uploading & inspecting audio track...' : 'Drop video or audio file here, or click to browse'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Supports MP4, MOV, WEBM, MKV, MP3, WAV, M4A, AAC, FLAC • Up to 500MB • Local Fast Processing
        </p>

        {selectedFile && !uploading && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: '0.82rem',
            color: 'var(--text-primary)'
          }}>
            {['.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg'].some(ext => selectedFile.name.toLowerCase().endsWith(ext)) ? (
              <Mic size={16} color="var(--accent-cyan)" />
            ) : (
              <FileVideo size={16} color="var(--accent-cyan)" />
            )}
            <span>{selectedFile.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
            </span>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div style={{
          marginTop: 14,
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
