import React from 'react';
import { Volume2, ShieldCheck, BookOpen } from 'lucide-react';
import type { BackendHealth } from '../types';

interface HeaderProps {
  health: BackendHealth | null;
  onOpenContributorGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, onOpenContributorGuide }) => {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(8, 12, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '16px 24px'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <Volume2 size={24} color="#FFFFFF" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #FFFFFF, #94A3B8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                VoiceClean
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                v1.0 Local
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Open-Source Video Speech Isolation & Background Noise Removal
            </p>
          </div>
        </div>

        {/* Status badges & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Privacy indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '5px 12px',
            borderRadius: 999,
            fontSize: '0.78rem',
            color: 'var(--accent-emerald)',
            fontWeight: 500
          }}>
            <ShieldCheck size={14} />
            <span>100% Local • Zero Cloud APIs</span>
          </div>

          {/* Backend Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            padding: '5px 12px',
            borderRadius: 999,
            fontSize: '0.78rem',
            color: health?.status === 'healthy' ? 'var(--text-primary)' : 'var(--accent-amber)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: health?.status === 'healthy' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              boxShadow: health?.status === 'healthy' ? '0 0 8px var(--accent-emerald)' : 'none'
            }} />
            <span className="font-mono" style={{ fontSize: '0.75rem' }}>
              FFmpeg & DSP Ready
            </span>
          </div>

          {/* Contributor Guide button */}
          <button
            onClick={onOpenContributorGuide}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            <BookOpen size={15} color="var(--accent-cyan)" />
            <span>Architecture & Extensibility</span>
          </button>
        </div>
      </div>
    </header>
  );
};
