import React from 'react';
import { Activity, TrendingUp, ShieldCheck, Download, Mic, Volume2 } from 'lucide-react';
import type { AudioMetrics } from '../types';
import { getDownloadUrl } from '../api';

interface AudioMetricsCardProps {
  metrics: AudioMetrics;
  taskId: string;
}

export const AudioMetricsCard: React.FC<AudioMetricsCardProps> = ({ metrics, taskId }) => {
  return (
    <div className="glass-panel" style={{ padding: 22, marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} color="var(--accent-emerald)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Audio Telemetry & Signal Improvements</h3>
        </div>

        {/* Download Clean Audio WAV button */}
        <a
          href={getDownloadUrl(taskId, 'enhanced-audio')}
          download
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '6px 12px', textDecoration: 'none' }}
        >
          <Download size={13} />
          <span>Download Clean WAV Master</span>
        </a>
      </div>

      {/* Grid of technical metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 14
      }}>
        {/* SNR Improvement Card */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>SNR Improvement</span>
            <TrendingUp size={15} color="var(--accent-emerald)" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            +{metrics.snr_improvement_db} dB
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Signal-to-Noise Ratio enhanced from {metrics.original_snr_db} dB to {metrics.enhanced_snr_db} dB
          </div>
        </div>

        {/* Noise Floor Attenuation Card */}
        <div style={{
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Noise Attenuation</span>
            <Volume2 size={15} color="var(--accent-cyan)" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            -{metrics.noise_floor_reduction_db} dB
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Ambient noise floor lowered from {metrics.original_noise_floor_db} dBFS
          </div>
        </div>

        {/* Vocal Headroom & Normalization Card */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Vocal Broadcast Peak</span>
            <Mic size={15} color="var(--accent-violet)" />
          </div>
          <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-violet)' }}>
            {metrics.enhanced_peak_db} dBFS
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Leveled to broadcast standard (was {metrics.original_peak_db} dBFS)
          </div>
        </div>
      </div>

      {/* Visual Spectral Comparison Indicator */}
      <div style={{
        marginTop: 16,
        padding: 14,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={18} color="var(--accent-emerald)" />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Vocal formants intact • Phase-aligned remux • Zero cloud telemetry
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-amber)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-amber)' }} />
            Raw Noise Profile
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-emerald)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-emerald)' }} />
            Clean Isolated Speech
          </span>
        </div>
      </div>
    </div>
  );
};
