'use client';

import React from 'react';

interface GameControlsProps {
    dropColumn: number;
    onDropColumnChange: (column: number) => void;
    betAmount: number;
    onBetAmountChange: (amount: number) => void;
    clientSeed: string;
    onClientSeedChange: (seed: string) => void;
    onDrop: () => void;
    isPlaying: boolean;
    disabled?: boolean;
    bins?: number;
}

export default function GameControls({
    dropColumn,
    onDropColumnChange,
    betAmount,
    onBetAmountChange,
    clientSeed,
    onClientSeedChange,
    onDrop,
    isPlaying,
    disabled = false,
    bins = 13,
}: GameControlsProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!isPlaying && !disabled) {
                onDrop();
            }
        }
    };

    return (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6">Game Controls</h2>

            <div className="space-y-5">
                {/* Drop Column */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Drop Column
                    </label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onDropColumnChange(Math.max(0, dropColumn - 1))}
                            disabled={isPlaying || disabled}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
                        >
                            ←
                        </button>
                        <div className="flex-1 text-center">
                            <span className="text-2xl font-bold text-amber-400">{dropColumn}</span>
                            <span className="text-slate-400 text-sm ml-1">/ {bins - 1}</span>
                        </div>
                        <button
                            onClick={() => onDropColumnChange(Math.min(bins - 1, dropColumn + 1))}
                            disabled={isPlaying || disabled}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-colors"
                        >
                            →
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-center">
                        Use ← → arrow keys
                    </p>
                </div>

                {/* Bet Amount */}
                <div>
                    <label htmlFor="betAmount" className="block text-sm font-medium text-slate-300 mb-2">
                        Bet Amount (cents)
                    </label>
                    <input
                        type="number"
                        id="betAmount"
                        value={betAmount}
                        onChange={(e) => onBetAmountChange(Math.max(1, parseInt(e.target.value) || 1))}
                        disabled={isPlaying || disabled}
                        min={1}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                {/* Client Seed */}
                <div>
                    <label htmlFor="clientSeed" className="block text-sm font-medium text-slate-300 mb-2">
                        Client Seed
                    </label>
                    <input
                        type="text"
                        id="clientSeed"
                        value={clientSeed}
                        onChange={(e) => onClientSeedChange(e.target.value)}
                        disabled={isPlaying || disabled}
                        placeholder="Enter your seed..."
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Your seed for provably fair verification
                    </p>
                </div>

                {/* Drop Button */}
                <button
                    onClick={onDrop}
                    onKeyDown={handleKeyDown}
                    disabled={isPlaying || disabled || !clientSeed.trim()}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg shadow-lg shadow-amber-500/25 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    {isPlaying ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Dropping...
                        </span>
                    ) : (
                        '🎱 Drop Ball'
                    )}
                </button>
                <p className="text-xs text-slate-500 text-center">
                    Press Space or Enter to drop
                </p>
            </div>
        </div>
    );
}
