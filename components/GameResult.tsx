'use client';

import React from 'react';

interface GameResultProps {
    binIndex: number | null;
    payoutMultiplier: number | null;
    betCents: number;
    roundId: string | null;
    commitHex: string | null;
    nonce: string | null;
    serverSeed: string | null;
    onVerify?: () => void;
}

export default function GameResult({
    binIndex,
    payoutMultiplier,
    betCents,
    roundId,
    commitHex,
    nonce,
    serverSeed,
    onVerify,
}: GameResultProps) {
    if (binIndex === null) return null;

    const payout = payoutMultiplier !== null ? Math.floor(betCents * payoutMultiplier) : 0;
    const profit = payout - betCents;
    const isWin = profit > 0;

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Round Result</h2>

            <div className="space-y-4">
                {/* Result Summary */}
                <div className={`p-4 rounded-lg ${isWin ? 'bg-green-900/30 border border-green-700' : 'bg-slate-900/50 border border-slate-700'}`}>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">Bin:</span>
                        <span className="text-2xl font-bold text-white">{binIndex}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-slate-400">Multiplier:</span>
                        <span className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-slate-300'}`}>
                            {payoutMultiplier}x
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-slate-400">Payout:</span>
                        <span className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-slate-300'}`}>
                            {payout}¢
                        </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-slate-400">Profit:</span>
                        <span className={`text-lg font-semibold ${profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                            {profit > 0 ? '+' : ''}{profit}¢
                        </span>
                    </div>
                </div>

                {/* Fairness Info */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-400">Provably Fair Data</h3>

                    <div className="bg-slate-900 rounded-lg p-3 space-y-2 text-xs font-mono">
                        {roundId && (
                            <div>
                                <span className="text-slate-500">Round ID: </span>
                                <span className="text-slate-300 break-all">{roundId}</span>
                            </div>
                        )}
                        {commitHex && (
                            <div>
                                <span className="text-slate-500">Commit: </span>
                                <span className="text-slate-300 break-all">{commitHex.slice(0, 16)}...</span>
                            </div>
                        )}
                        {nonce && (
                            <div>
                                <span className="text-slate-500">Nonce: </span>
                                <span className="text-slate-300 break-all">{nonce}</span>
                            </div>
                        )}
                        {serverSeed && (
                            <div>
                                <span className="text-slate-500">Server Seed: </span>
                                <span className="text-green-400 break-all">{serverSeed.slice(0, 16)}...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verify Button */}
                {serverSeed && onVerify && (
                    <button
                        onClick={onVerify}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verify Result
                    </button>
                )}
            </div>
        </div>
    );
}
