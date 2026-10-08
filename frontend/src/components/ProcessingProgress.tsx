import React from 'react';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import type { TaskStatusResponse } from '../types';

interface ProcessingProgressProps {
  taskStatus: TaskStatusResponse;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({ taskStatus }) => {
  const steps = [
    { id: 1, label: 'Probe Container', desc: 'Inspect media & audio channels', thresh: 10 },
    { id: 2, label: 'Extract Audio', desc: 'Demux 48kHz 16-bit PCM WAV', thresh: 25 },
    { id: 3, label: 'Voice Isolation', desc: 'Spectral gating noise suppression', thresh: 55 },
    { id: 4, label: 'Speech Clarity', desc: 'Formant EQ & low-cut rumble filter', thresh: 75 },
    { id: 5, label: 'Audio Mastering', desc: 'Compute SNR & level loudness', thresh: 88 },
    { id: 6, label: 'Merge with Video', desc: 'Remux video stream with AAC master', thresh: 100 },
  ];

  const isFailed = taskStatus.status === 'failed';
  const isDone = taskStatus.status === 'completed';

  return (
    <div className="glass-panel" style={{ padding: 24, marginTop: 20 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isDone ? (
            <CheckCircle2 size={22} color="var(--accent-emerald)" />
          ) : isFailed ? (
            <AlertTriangle size={22} color="var(--accent-rose)" />
          ) : (
            <Loader2 size={22} color="var(--accent-cyan)" style={{ animation: 'spin 1.5s linear infinite' }} />
          )}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              {isDone ? 'Voice Cleaning Complete!' : isFailed ? 'Processing Interrupted' : 'Processing Video Audio...'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {taskStatus.step}
            </p>
          </div>
        </div>

        {/* Percentage badge */}
        <div className="font-mono" style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: isDone ? 'var(--accent-emerald)' : isFailed ? 'var(--accent-rose)' : 'var(--accent-cyan)'
        }}>
          {taskStatus.progress}%
        </div>
      </div>

      {/* Progress track */}
      <div style={{
        width: '100%',
        height: 8,
        background: 'var(--bg-tertiary)',
        borderRadius: 999,
        overflow: 'hidden',
        marginBottom: 20,
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.max(5, taskStatus.progress)}%`,
          background: isDone
            ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
            : isFailed
            ? 'var(--accent-rose)'
            : 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)',
          borderRadius: 999,
          transition: 'width 0.3s ease',
          boxShadow: isDone ? '0 0 12px rgba(16, 185, 129, 0.5)' : '0 0 12px rgba(6, 182, 212, 0.5)'
        }} />
      </div>

      {/* Step nodes pipeline */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10
      }}>
        {steps.map((st) => {
          const stepFinished = taskStatus.progress >= st.thresh;
          const isCurrent = !isDone && !isFailed && taskStatus.progress < st.thresh && (taskStatus.progress >= (st.thresh - 20));

          return (
            <div
              key={st.id}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: stepFinished
                  ? 'rgba(16, 185, 129, 0.08)'
                  : isCurrent
                  ? 'rgba(6, 182, 212, 0.1)'
                  : 'rgba(255, 255, 255, 0.02)',
                border: stepFinished
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : isCurrent
                  ? '1px solid rgba(6, 182, 212, 0.4)'
                  : '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span className="font-mono" style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: stepFinished ? 'var(--accent-emerald)' : isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>
                  0{st.id}
                </span>
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: stepFinished ? 'var(--text-primary)' : isCurrent ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>
                  {st.label}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                {st.desc}
              </div>
            </div>
          );
        })}
      </div>

      {isFailed && taskStatus.error && (
        <div style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          color: 'var(--accent-rose)',
          fontSize: '0.85rem'
        }}>
          <strong>Failure Reason:</strong> {taskStatus.error}
        </div>
      )}
    </div>
  );
};
