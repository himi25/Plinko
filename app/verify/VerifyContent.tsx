'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import PlinkoBoard, { PlinkoBoardRef } from '@/components/PlinkoBoard';

interface VerificationResult {
    serverSeed: string;
    clientSeed: string;
    nonce: string;
    dropColumn: number;
    commitHex: string;
    combinedSeed: string;
    pegMapHash: string;
    binIndex: number;
    payoutMultiplier: number;
    path: ('L' | 'R')[];
}

export default function VerifyContent() {
    const searchParams = useSearchParams();
    const boardRef = useRef<PlinkoBoardRef>(null);

    // Form inputs
    const [serverSeed, setServerSeed] = useState('');
    const [clientSeed, setClientSeed] = useState('');
    const [nonce, setNonce] = useState('');
    const [dropColumn, setDropColumn] = useState(6);

    // Verification state
    const [result, setResult] = useState<VerificationResult | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReplaying, setIsReplaying] = useState(false);

    // Load from URL params on mount
    useEffect(() => {
        const server = searchParams.get('serverSeed');
        const client = searchParams.get('clientSeed');
        const n = searchParams.get('nonce');
        const col = searchParams.get('dropColumn');

        if (server) setServerSeed(server);
        if (client) setClientSeed(client);
        if (n) setNonce(n);
        if (col) setDropColumn(parseInt(col, 10) || 6);

        // Auto-verify if all params present
        if (server && client && n && col) {
            handleVerify(server, client, n, parseInt(col, 10));
        }
    }, [searchParams]);

    const handleVerify = useCallback(async (
        serverSeedValue?: string,
        clientSeedValue?: string,
        nonceValue?: string,
        dropColumnValue?: number
    ) => {
        const ss = serverSeedValue ?? serverSeed;
        const cs = clientSeedValue ?? clientSeed;
        const nn = nonceValue ?? nonce;
        const dc = dropColumnValue ?? dropColumn;

        if (!ss || !cs || !nn) {
            setError('Please fill in all fields');
            return;
        }

        setIsVerifying(true);
        setError(null);
        setResult(null);

        try {
            const params = new URLSearchParams({
                serverSeed: ss,
                clientSeed: cs,
                nonce: nn,
                dropColumn: dc.toString(),
            });

            const response = await fetch(`/api/verify?${params.toString()}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Verification failed');
            }

            const data = await response.json();
            setResult(data);

        } catch (err) {
            console.error('Verification error:', err);
            setError(err instanceof Error ? err.message : 'Verification failed');
        } finally {
            setIsVerifying(false);
        }
    }, [serverSeed, clientSeed, nonce, dropColumn]);

    const handleReplay = useCallback(() => {
        if (!result) return;
        setIsReplaying(true);
        boardRef.current?.resetBall();
        setTimeout(() => {
            boardRef.current?.startAnimation();
        }, 100);
    }, [result]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🔍 Verify Round
                    </h1>
                    <p className="text-slate-400">Prove the fairness of any game round</p>
                    <a
                        href="/"
                        className="inline-block mt-4 text-amber-400 hover:text-amber-300 transition-colors"
                    >
                        ← Back to Game
                    </a>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6">Verification Inputs</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="serverSeed" className="block text-sm font-medium text-slate-300 mb-2">
                                    Server Seed
                                </label>
                                <input
                                    type="text"
                                    id="serverSeed"
                                    value={serverSeed}
                                    onChange={(e) => setServerSeed(e.target.value)}
                                    placeholder="Enter server seed (revealed after round)"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientSeed" className="block text-sm font-medium text-slate-300 mb-2">
                                    Client Seed
                                </label>
                                <input
                                    type="text"
                                    id="clientSeed"
                                    value={clientSeed}
                                    onChange={(e) => setClientSeed(e.target.value)}
                                    placeholder="Enter your client seed"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="nonce" className="block text-sm font-medium text-slate-300 mb-2">
                                    Nonce
                                </label>
                                <input
                                    type="text"
                                    id="nonce"
                                    value={nonce}
                                    onChange={(e) => setNonce(e.target.value)}
                                    placeholder="Enter nonce"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="dropColumn" className="block text-sm font-medium text-slate-300 mb-2">
                                    Drop Column
                                </label>
                                <input
                                    type="number"
                                    id="dropColumn"
                                    value={dropColumn}
                                    onChange={(e) => setDropColumn(parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={12}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                                />
                            </div>

                            <button
                                onClick={() => handleVerify()}
                                disabled={isVerifying}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg shadow-lg transition-all"
                            >
                                {isVerifying ? 'Verifying...' : '✓ Verify Round'}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-6">
                        {result ? (
                            <>
                                {/* Verification Status */}
                                <div className="bg-green-900/30 border border-green-600 rounded-xl p-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">✅</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-400">Verification Successful</h3>
                                            <p className="text-green-300/80">The game result is provably fair</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Computed Values */}
                                <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                                    <h3 className="text-lg font-bold text-white mb-4">Computed Values</h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400">Bin Index:</span>
                                            <span className="text-2xl font-bold text-amber-400">{result.binIndex}</span>
                                        </div>

                                        <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400">Payout:</span>
                                            <span className="text-xl font-bold text-green-400">{result.payoutMultiplier}x</span>
                                        </div>

                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400 block mb-1">Commit Hash:</span>
                                            <span className="text-slate-300 font-mono text-xs break-all">{result.commitHex}</span>
                                        </div>

                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400 block mb-1">Combined Seed:</span>
                                            <span className="text-slate-300 font-mono text-xs break-all">{result.combinedSeed}</span>
                                        </div>

                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400 block mb-1">Peg Map Hash:</span>
                                            <span className="text-slate-300 font-mono text-xs break-all">{result.pegMapHash}</span>
                                        </div>

                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400 block mb-1">Path:</span>
                                            <span className="text-slate-300 font-mono">{result.path.join(' ')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Replay */}
                                <button
                                    onClick={handleReplay}
                                    disabled={isReplaying}
                                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                                >
                                    🔄 Replay Animation
                                </button>

                                {/* Mini board replay */}
                                <div className="flex justify-center transform scale-75 origin-top">
                                    <PlinkoBoard
                                        ref={boardRef}
                                        rows={12}
                                        selectedColumn={result.dropColumn}
                                        path={result.path}
                                        isAnimating={isReplaying}
                                        onAnimationComplete={() => setIsReplaying(false)}
                                        reducedMotion={false}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
                                <div className="text-6xl mb-4">🔐</div>
                                <h3 className="text-xl font-bold text-white mb-2">Enter Round Data</h3>
                                <p className="text-slate-400">
                                    Fill in the server seed, client seed, nonce, and drop column from your game round to verify its fairness.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* How it works */}
                <div className="mt-12 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4">How Provably Fair Works</h2>
                    <div className="grid md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <div className="text-2xl mb-2">1️⃣</div>
                            <h3 className="font-semibold text-white mb-1">Server Commitment</h3>
                            <p className="text-slate-400">
                                Before you play, the server generates a secret seed and sends you a hash (commitment) of it.
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl mb-2">2️⃣</div>
                            <h3 className="font-semibold text-white mb-1">You Provide Your Seed</h3>
                            <p className="text-slate-400">
                                You provide your own client seed, which combines with the server seed to determine the outcome.
                            </p>
                        </div>
                        <div>
                            <div className="text-2xl mb-2">3️⃣</div>
                            <h3 className="font-semibold text-white mb-1">Verify After Game</h3>
                            <p className="text-slate-400">
                                After the game, the server reveals its seed. You can verify the hash matches and replay the exact result.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
