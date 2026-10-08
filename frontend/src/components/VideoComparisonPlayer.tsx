import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Sparkles } from 'lucide-react';
import type { TaskStatusResponse } from '../types';
import { getDownloadUrl } from '../api';

interface VideoComparisonPlayerProps {
  task: TaskStatusResponse;
  onReset: () => void;
}

export const VideoComparisonPlayer: React.FC<VideoComparisonPlayerProps> = ({ task, onReset }) => {
  const origVideoRef = useRef<HTMLVideoElement>(null);
  const enhVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioSource, setActiveAudioSource] = useState<'enhanced' | 'original'>('enhanced');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(task.video_duration_sec || 0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'enhanced-only' | 'original-only'>('side-by-side');
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Sync video audio output based on active audio source selection
  useEffect(() => {
    if (origVideoRef.current && enhVideoRef.current) {
      if (isMuted) {
        origVideoRef.current.muted = true;
        enhVideoRef.current.muted = true;
      } else {
        if (activeAudioSource === 'enhanced') {
          origVideoRef.current.muted = true;
          enhVideoRef.current.muted = false;
          enhVideoRef.current.volume = volume;
        } else {
          origVideoRef.current.muted = false;
          origVideoRef.current.volume = volume;
          enhVideoRef.current.muted = true;
        }
      }
    }
  }, [activeAudioSource, isMuted, volume]);

  const togglePlay = () => {
    const orig = origVideoRef.current;
    const enh = enhVideoRef.current;
    if (!orig || !enh) return;

    if (isPlaying) {
      orig.pause();
      enh.pause();
      setIsPlaying(false);
    } else {
      // Synchronize playheads
      enh.currentTime = orig.currentTime;
      orig.play().catch(() => {});
      enh.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (origVideoRef.current) origVideoRef.current.currentTime = time;
    if (enhVideoRef.current) enhVideoRef.current.currentTime = time;
  };

  const handleTimeUpdate = () => {
    const ref = enhVideoRef.current || origVideoRef.current;
    if (ref) {
      setCurrentTime(ref.currentTime);
      if (ref.duration && !isNaN(ref.duration) && duration === 0) {
        setDuration(ref.duration);
      }
    }
  };

  const handleRestart = () => {
    if (origVideoRef.current) origVideoRef.current.currentTime = 0;
    if (enhVideoRef.current) enhVideoRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) togglePlay();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const originalVideoSrc = task.original_video_url || '';
  const enhancedVideoSrc = task.enhanced_video_url || '';

  return (
    <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 999,
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              textTransform: 'uppercase'
            }}>
              Ready
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Video Audio Comparison
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Synchronized playback: switch between Original and VoiceCleaned audio in real-time.
          </p>
        </div>

        {/* View Mode Switcher and Downloads */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: 3,
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setViewMode('side-by-side')}
              style={{
                background: viewMode === 'side-by-side' ? 'rgba(6, 182, 212, 0.2)' : 'none',
                border: viewMode === 'side-by-side' ? '1px solid var(--accent-cyan)' : 'none',
                color: viewMode === 'side-by-side' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('enhanced-only')}
              style={{
                background: viewMode === 'enhanced-only' ? 'rgba(16, 185, 129, 0.2)' : 'none',
                border: viewMode === 'enhanced-only' ? '1px solid var(--accent-emerald)' : 'none',
                color: viewMode === 'enhanced-only' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Clean Only
            </button>
            <button
              onClick={() => setViewMode('original-only')}
              style={{
                background: viewMode === 'original-only' ? 'rgba(245, 158, 11, 0.2)' : 'none',
                border: viewMode === 'original-only' ? '1px solid var(--accent-amber)' : 'none',
                color: viewMode === 'original-only' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Raw Only
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href={getDownloadUrl(task.task_id, 'enhanced-audio')}
              download
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.82rem', borderColor: 'rgba(6, 182, 212, 0.4)' }}
            >
              <Download size={15} />
              <span>Clean Audio (WAV)</span>
            </a>

            <a
              href={getDownloadUrl(task.task_id, 'enhanced-video')}
              download
              className="btn-success"
              style={{ textDecoration: 'none', padding: '8px 14px', fontSize: '0.84rem' }}
            >
              <Download size={15} />
              <span>Clean Video (MP4)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Videos Display Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: viewMode === 'side-by-side' ? '1fr 1fr' : '1fr',
        gap: 16,
        marginBottom: 16
      }}>
        {/* ORIGINAL VIDEO BOX */}
        {(viewMode === 'side-by-side' || viewMode === 'original-only') && (
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#000000',
            border: activeAudioSource === 'original' ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
            aspectRatio: '16/9'
          }}>
            <video
              ref={origVideoRef}
              src={originalVideoSrc}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {/* Overlay badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-amber)'
            }}>
              <span>Original (Noisy Audio)</span>
            </div>

            {/* Listening indicator */}
            {activeAudioSource === 'original' && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(245, 158, 11, 0.9)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Volume2 size={13} />
                <span>Currently Listening</span>
              </div>
            )}
          </div>
        )}

        {/* ENHANCED VIDEO BOX */}
        {(viewMode === 'side-by-side' || viewMode === 'enhanced-only') && (
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#000000',
            border: activeAudioSource === 'enhanced' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
            aspectRatio: '16/9'
          }}>
            <video
              ref={enhVideoRef}
              src={enhancedVideoSrc}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            {/* Overlay badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-emerald)'
            }}>
              <Sparkles size={12} />
              <span>VoiceClean Enhanced</span>
            </div>

            {/* Listening indicator */}
            {activeAudioSource === 'enhanced' && (
              <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                background: 'rgba(16, 185, 129, 0.95)',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Volume2 size={13} />
                <span>Currently Listening</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Synchronized Player Controls Bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Seek timeline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: 40 }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            style={{ flex: 1 }}
          />
          <span className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minWidth: 40 }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Controls & Instant A/B Audio Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Play/Pause & Restart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={togglePlay}
              className="btn-primary"
              style={{ padding: '8px 16px' }}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
              <span>{isPlaying ? 'Pause' : 'Play Both'}</span>
            </button>

            <button
              onClick={handleRestart}
              className="btn-secondary"
              title="Restart from beginning"
              style={{ padding: '8px 12px' }}
            >
              <RotateCcw size={15} />
            </button>

            {/* Volume slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                style={{ width: 70 }}
              />
            </div>
          </div>

          {/* Instant A/B Audio Comparison Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            padding: 4,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: 4
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0 8px' }}>
              LISTEN TO:
            </span>
            <button
              onClick={() => setActiveAudioSource('original')}
              style={{
                background: activeAudioSource === 'original' ? 'var(--accent-amber)' : 'transparent',
                color: activeAudioSource === 'original' ? '#000000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s ease'
              }}
            >
              <span>Raw Noisy</span>
            </button>
            <button
              onClick={() => setActiveAudioSource('enhanced')}
              style={{
                background: activeAudioSource === 'enhanced' ? 'var(--accent-emerald)' : 'transparent',
                color: activeAudioSource === 'enhanced' ? '#000000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                boxShadow: activeAudioSource === 'enhanced' ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} />
              <span>VoiceCleaned</span>
            </button>
          </div>

          {/* Process another file button */}
          <button
            onClick={onReset}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            Process Another File
          </button>
        </div>
      </div>
    </div>
  );
};
