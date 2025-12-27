import React, { useEffect, useRef } from 'react';
import { TerrainType } from '../types';

interface AmbientSoundProps {
  terrainType: TerrainType;
}

export const AmbientSound: React.FC<AmbientSoundProps> = ({ terrainType }) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const rainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rainDropIntervalRef = useRef<number | null>(null);
  const thunderTimeoutRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  /* =======================
     CONTEXT
  ======================= */

  const ensureContext = () => {
    if (ctxRef.current) return ctxRef.current;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx({ latencyHint: 'interactive' });
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    return ctx;
  };

  const resumeContext = async () => {
    const ctx = ensureContext();
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
  };

  /* =======================
     NOISE HELPERS
  ======================= */

  const createNoiseBuffer = (ctx: AudioContext, seconds: number) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const createStereoNoise = (ctx: AudioContext, seconds: number) => {
    const buffer = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
    }
    return buffer;
  };

  /* =======================
     RAIN DROP
  ======================= */

  const spawnRainDrop = () => {
    if (!isRunningRef.current || !ctxRef.current || !masterRef.current) return;
    const ctx = ctxRef.current;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 0.05);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2500 + Math.random() * 3000;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    src.connect(bp);
    bp.connect(g);
    g.connect(masterRef.current);

    src.start(t);
    src.stop(t + 0.1);
  };

  /* =======================
     THUNDER
  ======================= */

  const spawnThunder = () => {
    if (!isRunningRef.current || !ctxRef.current || !masterRef.current) return;

    const ctx = ctxRef.current;
    const t = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 3);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, t);

    const distortion = ctx.createWaveShaper();
    distortion.curve = new Float32Array(
      Array.from({ length: 44100 }, (_, i) =>
        Math.tanh((i - 22050) / 6000)
      )
    );

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.2, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

    src.connect(lp);
    lp.connect(distortion);
    distortion.connect(g);
    g.connect(masterRef.current);

    src.start(t);
    src.stop(t + 3);
  };

  const scheduleThunder = () => {
    if (!isRunningRef.current) return;

    const delay = 6000 + Math.random() * 14000;
    thunderTimeoutRef.current = window.setTimeout(() => {
      if (Math.random() < 0.45) spawnThunder();
      scheduleThunder();
    }, delay);
  };

  /* =======================
     START / STOP
  ======================= */

  const startRain = () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const ctx = ensureContext();
    const master = masterRef.current!;
    const now = ctx.currentTime;

    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = createStereoNoise(ctx, 3);
    rainSrc.loop = true;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 150;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 6000;

    const rainGain = ctx.createGain();
    rainGain.gain.value = 0;

    rainSrc.connect(hp);
    hp.connect(lp);
    lp.connect(rainGain);
    rainGain.connect(master);

    rainSrc.start();

    master.gain.linearRampToValueAtTime(0.4, now + 1);
    rainGain.gain.linearRampToValueAtTime(0.22, now + 1.5);

    rainSourceRef.current = rainSrc;
    rainGainRef.current = rainGain;

    rainDropIntervalRef.current = window.setInterval(() => {
      if (Math.random() < 0.6) spawnRainDrop();
    }, 120);

    scheduleThunder();
  };

  const stopRain = () => {
    if (!isRunningRef.current) return;
    isRunningRef.current = false;

    if (rainDropIntervalRef.current) {
      clearInterval(rainDropIntervalRef.current);
      rainDropIntervalRef.current = null;
    }

    if (thunderTimeoutRef.current) {
      clearTimeout(thunderTimeoutRef.current);
      thunderTimeoutRef.current = null;
    }

    const ctx = ctxRef.current;
    const master = masterRef.current;

    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.linearRampToValueAtTime(0, now + 0.4);

      setTimeout(() => {
        try { rainSourceRef.current?.stop(); } catch {}
        try { ctx.close(); } catch {}
        ctxRef.current = null;
        masterRef.current = null;
      }, 700);
    }
  };

  /* =======================
     LIFECYCLE
  ======================= */

  useEffect(() => {
    const unlock = () => {
      resumeContext();
      if (terrainType === 'rain') startRain();
    };

    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      stopRain();
    };
  }, []);

  useEffect(() => {
    if (terrainType === 'rain') {
      resumeContext();
      startRain();
    } else {
      stopRain();
    }
  }, [terrainType]);

  return null;
};
