import React from 'react';
import { X, GitPullRequest, Code2, Layers, Cpu, ArrowRight } from 'lucide-react';

interface ContributorGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContributorGuideModal: React.FC<ContributorGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div className="glass-panel" style={{
        maxWidth: 780,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 30,
        position: 'relative',
        background: '#0B111E',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GitPullRequest size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              VoiceClean Architecture & Contributor Guide
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              How contributors can add new AI/DSP speech denoisers and tackle GitHub issues.
            </p>
          </div>
        </div>

        {/* Pipeline Architecture breakdown */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 20
        }}>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={16} />
            Modular Pipeline Flow
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Every step is isolated so contributors can work on individual modules without breaking others:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            alignItems: 'center',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)'
          }}>
            <span style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: 4 }}>Video Upload</span>
            <ArrowRight size={12} color="var(--text-muted)" />
            <span style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: 4 }}>FFmpeg Extract (48kHz)</span>
            <ArrowRight size={12} color="var(--text-muted)" />
            <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>
              BaseAudioEnhancer (Pluggable)
            </span>
            <ArrowRight size={12} color="var(--text-muted)" />
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', padding: '4px 8px', borderRadius: 4 }}>
              Speech Formant & AGC
            </span>
            <ArrowRight size={12} color="var(--text-muted)" />
            <span style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: 4 }}>FFmpeg Video Remux</span>
          </div>
        </div>

        {/* How to add a new enhancer */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Code2 size={16} color="var(--accent-emerald)" />
            Adding a New Denoising Engine (e.g. DeepFilterNet or Demucs)
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Create a single Python file in <code>backend/app/services/dsp/</code> subclassing <code>BaseAudioEnhancer</code>:
          </p>
          <pre style={{
            background: '#060A12',
            padding: 14,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: '#E2E8F0',
            overflowX: 'auto',
            lineHeight: 1.5
          }}>
{`from app.services.dsp.base import BaseAudioEnhancer, register_enhancer
import numpy as np

@register_enhancer("deepfilternet")
class DeepFilterNetEnhancer(BaseAudioEnhancer):
    def enhance(self, audio: np.ndarray, sr: int, options) -> np.ndarray:
        # 1. Run local inference on 1D audio array
        # 2. Return cleaned 1D audio array (float32)
        return cleaned_audio`}
          </pre>
        </div>

        {/* Contributor Issues Roadmap */}
        <div>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={16} color="var(--accent-violet)" />
            Open Good First Issues for Contributors
          </h4>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { id: 'ISSUE-01', title: 'DeepFilterNet backend module integration', tag: 'ML / PyTorch' },
              { id: 'ISSUE-02', title: 'Adaptive noise profile sampling from initial 500ms of silence', tag: 'DSP / Audio' },
              { id: 'ISSUE-03', title: 'Interactive audio waveform scrubber with Web Audio API', tag: 'Frontend / React' },
              { id: 'ISSUE-04', title: 'Multi-channel stereo voice preservation mode', tag: 'FFmpeg / Audio' },
            ].map(issue => (
              <div key={issue.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.76rem' }}>
                    {issue.id}
                  </span>
                  <span>{issue.title}</span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--accent-violet)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                  {issue.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
