'use client';

import { useCallback, useRef, useEffect } from 'react';

export function useSound(isMuted: boolean) {
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize audio context on first interaction
    const initAudio = useCallback(() => {
        if (!audioContextRef.current && typeof window !== 'undefined') {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
    }, []);

    // Play a beep/click sound for peg hits
    const playPegHit = useCallback(() => {
        if (isMuted || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }, [isMuted]);

    // Play a landing sound for bin
    const playBinLand = useCallback((binIndex: number) => {
        if (isMuted || !audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Higher pitch for edge bins (bigger wins)
        const isEdge = binIndex <= 2 || binIndex >= 10;
        oscillator.type = isEdge ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(isEdge ? 1200 : 400, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }, [isMuted]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return { initAudio, playPegHit, playBinLand };
}
