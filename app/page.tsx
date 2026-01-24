'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlinkoBoard, { PlinkoBoardRef } from '@/components/PlinkoBoard';
import GameControls from '@/components/GameControls';
import SoundToggle from '@/components/SoundToggle';
import GameResult from '@/components/GameResult';
import { useSound } from '@/hooks/useSound';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface RoundState {
  roundId: string | null;
  commitHex: string | null;
  nonce: string | null;
  serverSeed: string | null;
  clientSeed: string;
  binIndex: number | null;
  payoutMultiplier: number | null;
  path: ('L' | 'R')[];
}

export default function Home() {
  const router = useRouter();
  const boardRef = useRef<PlinkoBoardRef>(null);

  // Game state
  const [dropColumn, setDropColumn] = useState(6);
  const [betAmount, setBetAmount] = useState(100);
  const [clientSeed, setClientSeed] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Round data
  const [round, setRound] = useState<RoundState>({
    roundId: null,
    commitHex: null,
    nonce: null,
    serverSeed: null,
    clientSeed: '',
    binIndex: null,
    payoutMultiplier: null,
    path: [],
  });

  // Hooks
  const reducedMotion = useReducedMotion();
  const { initAudio, playPegHit, playBinLand } = useSound(isMuted);

  // Generate random client seed on mount
  useEffect(() => {
    const randomSeed = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setClientSeed(randomSeed);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !isPlaying && clientSeed.trim()) {
        e.preventDefault();
        handleDrop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, clientSeed]);

  const handleDrop = useCallback(async () => {
    if (isPlaying || !clientSeed.trim()) return;

    initAudio();
    setIsPlaying(true);
    setError(null);

    try {
      // Step 1: Get commitment from server
      const commitResponse = await fetch('/api/rounds/commit', {
        method: 'POST',
      });

      if (!commitResponse.ok) {
        throw new Error('Failed to get commitment');
      }

      const { roundId, commitHex, nonce } = await commitResponse.json();

      setRound(prev => ({
        ...prev,
        roundId,
        commitHex,
        nonce,
        serverSeed: null,
        binIndex: null,
        payoutMultiplier: null,
        path: [],
      }));

      // Step 2: Start the round
      const startResponse = await fetch(`/api/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSeed,
          betCents: betAmount,
          dropColumn,
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start round');
      }

      // Step 3: Get round result (before reveal for animation)
      const roundResponse = await fetch(`/api/rounds/${roundId}`);
      const roundData = await roundResponse.json();

      // Start animation with path
      setRound(prev => ({
        ...prev,
        clientSeed,
        binIndex: roundData.binIndex,
        payoutMultiplier: roundData.payoutMultiplier,
        path: roundData.path || [],
      }));

      // Start ball animation
      boardRef.current?.startAnimation();

    } catch (err) {
      console.error('Game error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsPlaying(false);
    }
  }, [isPlaying, clientSeed, betAmount, dropColumn, initAudio]);

  const handleAnimationComplete = useCallback(async () => {
    // Reveal server seed after animation
    if (round.roundId) {
      try {
        const revealResponse = await fetch(`/api/rounds/${round.roundId}/reveal`, {
          method: 'POST',
        });

        if (revealResponse.ok) {
          const { serverSeed } = await revealResponse.json();
          setRound(prev => ({ ...prev, serverSeed }));
        }
      } catch (err) {
        console.error('Failed to reveal:', err);
      }
    }

    setIsPlaying(false);
  }, [round.roundId]);

  const handleVerify = useCallback(() => {
    if (round.serverSeed && round.nonce) {
      const params = new URLSearchParams({
        serverSeed: round.serverSeed,
        clientSeed: round.clientSeed,
        nonce: round.nonce,
        dropColumn: dropColumn.toString(),
      });
      router.push(`/verify?${params.toString()}`);
    }
  }, [round, dropColumn, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
            🎰 Plinko
          </h1>
          <p className="text-slate-400">Provably Fair Game</p>
        </header>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Main game layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game board */}
          <div className="lg:col-span-2 flex justify-center">
            <PlinkoBoard
              ref={boardRef}
              rows={12}
              selectedColumn={dropColumn}
              onColumnChange={setDropColumn}
              path={round.path}
              isAnimating={isPlaying}
              onAnimationComplete={handleAnimationComplete}
              reducedMotion={reducedMotion}
              onPegHit={playPegHit}
              onBinLand={playBinLand}
            />
          </div>

          {/* Controls and results */}
          <div className="space-y-6">
            {/* Sound toggle */}
            <div className="flex justify-end">
              <SoundToggle isMuted={isMuted} onToggle={() => setIsMuted(!isMuted)} />
            </div>

            {/* Game controls */}
            <GameControls
              dropColumn={dropColumn}
              onDropColumnChange={setDropColumn}
              betAmount={betAmount}
              onBetAmountChange={setBetAmount}
              clientSeed={clientSeed}
              onClientSeedChange={setClientSeed}
              onDrop={handleDrop}
              isPlaying={isPlaying}
            />

            {/* Game result */}
            <GameResult
              binIndex={round.binIndex}
              payoutMultiplier={round.payoutMultiplier}
              betCents={betAmount}
              roundId={round.roundId}
              commitHex={round.commitHex}
              nonce={round.nonce}
              serverSeed={round.serverSeed}
              onVerify={handleVerify}
            />
          </div>
        </div>

        {/* Verify link */}
        <div className="mt-8 text-center">
          <a
            href="/verify"
            className="text-slate-400 hover:text-white transition-colors underline"
          >
            Verify a past round →
          </a>
        </div>
      </div>
    </main>
  );
}
