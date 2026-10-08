import React, { useState } from 'react';
import { Sliders, Sparkles, Volume2, Mic, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProcessingOptions, ProcessingPreset } from '../types';

interface ParameterControlsProps {
  options: ProcessingOptions;
  onChange: (options: ProcessingOptions) => void;
  disabled?: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  options,
  onChange,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const applyPreset = (preset: ProcessingPreset) => {
    switch (preset) {
      case 'balanced':
        onChange({
          ...options,
          preset: 'balanced',
          noise_reduction_strength: 0.75,
          speech_clarity_boost: 0.6,
          low_cut_hz: 85.0,
          high_cut_hz: 10500.0,
          voice_presence_boost_db: 3.5,
          normalize_loudness: true,
        });
        break;
      case 'aggressive':
        onChange({
          ...options,
          preset: 'aggressive',
          noise_reduction_strength: 0.92,
          speech_clarity_boost: 0.8,
          low_cut_hz: 110.0,
          high_cut_hz: 9500.0,
          voice_presence_boost_db: 4.5,
          normalize_loudness: true,
        });
        break;
      case 'gentle':
        onChange({
          ...options,
          preset: 'gentle',
          noise_reduction_strength: 0.50,
          speech_clarity_boost: 0.4,
          low_cut_hz: 65.0,
          high_cut_hz: 12000.0,
          voice_presence_boost_db: 2.0,
          normalize_loudness: true,
        });
        break;
      case 'podcast':
        onChange({
          ...options,
          preset: 'podcast',
          noise_reduction_strength: 0.80,
          speech_clarity_boost: 0.75,
          low_cut_hz: 90.0,
          high_cut_hz: 11000.0,
          voice_presence_boost_db: 5.0,
          normalize_loudness: true,
        });
        break;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: 22, marginTop: 20 }}>
      {/* Preset selector header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sliders size={18} color="var(--accent-cyan)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tuning Presets & DSP Parameters</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.82rem',
          }}
        >
          <span>{showAdvanced ? 'Hide Advanced' : 'Custom Tuning'}</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Preset Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
        marginBottom: 16
      }}>
        {[
          { id: 'balanced', label: 'Balanced (Standard)', desc: 'Natural voice & steady reduction' },
          { id: 'aggressive', label: 'Aggressive Noise', desc: 'Heavy traffic, loud AC, noisy cafes' },
          { id: 'podcast', label: 'Podcast & Studio', desc: 'Punchy vocal presence & warm tone' },
          { id: 'gentle', label: 'Gentle Cleanup', desc: 'Subtle hiss & light background hum' },
        ].map(item => {
          const isSelected = options.preset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => applyPreset(item.id as ProcessingPreset)}
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {item.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Primary sliders: Always visible for quick tweak */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18,
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)'
      }}>
        {/* Noise reduction strength slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Volume2 size={14} color="var(--accent-cyan)" />
              Noise Reduction Strength
            </label>
            <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {Math.round(options.noise_reduction_strength * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            disabled={disabled}
            value={options.noise_reduction_strength}
            onChange={(e) => onChange({ ...options, noise_reduction_strength: parseFloat(e.target.value) })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>Subtle</span>
            <span>Balanced</span>
            <span>Maximum</span>
          </div>
        </div>

        {/* Speech Clarity & Presence Boost */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mic size={14} color="var(--accent-emerald)" />
              Speech Clarity & Vocal Formants
            </label>
            <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
              {Math.round(options.speech_clarity_boost * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            disabled={disabled}
            value={options.speech_clarity_boost}
            onChange={(e) => onChange({ ...options, speech_clarity_boost: parseFloat(e.target.value) })}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>Flat</span>
            <span>Intelligible</span>
            <span>Ultra Crisp</span>
          </div>
        </div>
      </div>

      {/* Advanced Drawer: Low Cut, High Cut, Presence Gain, Engine */}
      {showAdvanced && (
        <div style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px dashed var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}>
          {/* Low-cut Rumble */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter size={13} color="var(--accent-amber)" />
                Low-Cut Rumble Filter
              </label>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                {options.low_cut_hz} Hz
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              disabled={disabled}
              value={options.low_cut_hz}
              onChange={(e) => onChange({ ...options, low_cut_hz: parseFloat(e.target.value) })}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Cuts AC hum, desk bumps & wind under 85Hz
            </p>
          </div>

          {/* Formant Presence Gain in dB */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} color="var(--accent-violet)" />
                Formant Peak Boost
              </label>
              <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-violet)' }}>
                +{options.voice_presence_boost_db} dB
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              disabled={disabled}
              value={options.voice_presence_boost_db}
              onChange={(e) => onChange({ ...options, voice_presence_boost_db: parseFloat(e.target.value) })}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Parametric boost focused on 2.8kHz vocal presence
            </p>
          </div>

          {/* Broadcast Normalization Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <input
              type="checkbox"
              id="norm-check"
              disabled={disabled}
              checked={options.normalize_loudness}
              onChange={(e) => onChange({ ...options, normalize_loudness: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
            />
            <label htmlFor="norm-check" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Broadcast Loudness Normalization (-1.0 dBFS Peak)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
