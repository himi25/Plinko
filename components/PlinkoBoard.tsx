'use client';

import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';

interface PlinkoBoardProps {
    rows?: number;
    selectedColumn: number;
    onColumnChange?: (column: number) => void;
    path?: ('L' | 'R')[];
    isAnimating?: boolean;
    onAnimationComplete?: () => void;
    reducedMotion?: boolean;
    onPegHit?: () => void;
    onBinLand?: (binIndex: number) => void;
}

export interface PlinkoBoardRef {
    startAnimation: () => void;
    resetBall: () => void;
}

const PlinkoBoard = forwardRef<PlinkoBoardRef, PlinkoBoardProps>(({
    rows = 12,
    selectedColumn,
    onColumnChange,
    path = [],
    isAnimating = false,
    onAnimationComplete,
    reducedMotion = false,
    onPegHit,
    onBinLand,
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
    const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
    const [animationStep, setAnimationStep] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    const bins = rows + 1;

    // Canvas dimensions
    const padding = 40;
    const pegRadius = 6;
    const ballRadius = 10;
    const rowSpacing = 45;
    const pegSpacing = 50;

    const canvasWidth = (bins + 1) * pegSpacing + padding * 2;
    const canvasHeight = rows * rowSpacing + padding * 2 + 60;

    // Calculate peg position
    const getPegPosition = useCallback((row: number, index: number) => {
        const rowPegCount = row + 1;
        const rowWidth = rowPegCount * pegSpacing;
        const startX = (canvasWidth - rowWidth) / 2 + pegSpacing / 2;
        const x = startX + index * pegSpacing;
        const y = padding + row * rowSpacing + rowSpacing;
        return { x, y };
    }, [canvasWidth, pegSpacing, rowSpacing, padding]);

    // Calculate bin position
    const getBinPosition = useCallback((binIndex: number) => {
        const binWidth = pegSpacing;
        const totalWidth = bins * binWidth;
        const startX = (canvasWidth - totalWidth) / 2;
        const x = startX + binIndex * binWidth + binWidth / 2;
        const y = canvasHeight - 30;
        return { x, y };
    }, [canvasWidth, canvasHeight, bins, pegSpacing]);

    // Calculate ball path positions
    const getBallPathPositions = useCallback(() => {
        if (path.length === 0) return [];

        const positions: { x: number; y: number }[] = [];

        // Starting position above the board
        const startBin = getBinPosition(selectedColumn);
        positions.push({ x: startBin.x, y: padding - 10 });

        let pos = 0;
        for (let row = 0; row < path.length; row++) {
            const pegIndex = Math.min(pos, row);
            const pegPos = getPegPosition(row, pegIndex);

            // Position slightly offset from peg
            const direction = path[row];
            const offsetX = direction === 'L' ? -pegRadius - ballRadius : pegRadius + ballRadius;
            positions.push({ x: pegPos.x + offsetX, y: pegPos.y + pegRadius + 5 });

            if (direction === 'R') {
                pos += 1;
            }
        }

        // Final bin position
        const finalBin = getBinPosition(pos);
        positions.push({ x: finalBin.x, y: finalBin.y - 15 });

        return positions;
    }, [path, selectedColumn, getPegPosition, getBinPosition, padding]);

    // Draw the board
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw pegs
        for (let row = 0; row < rows; row++) {
            const pegCount = row + 1;
            for (let index = 0; index < pegCount; index++) {
                const { x, y } = getPegPosition(row, index);

                ctx.beginPath();
                ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
                ctx.fillStyle = '#94a3b8';
                ctx.fill();

                // Add glow effect
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Draw bins
        const payouts = [110, 40, 20, 10, 4, 2, 1, 2, 4, 10, 20, 40, 110];
        const colors = [
            '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
            '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'
        ];

        for (let i = 0; i < bins; i++) {
            const { x, y } = getBinPosition(i);
            const binWidth = pegSpacing - 4;
            const binHeight = 40;

            // Bin background
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x - binWidth / 2, y - binHeight / 2, binWidth, binHeight);
            ctx.globalAlpha = 1;

            // Bin border
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 2;
            ctx.strokeRect(x - binWidth / 2, y - binHeight / 2, binWidth, binHeight);

            // Payout text
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${payouts[i]}x`, x, y);
        }

        // Draw drop column indicator
        const indicatorPos = getBinPosition(selectedColumn);
        ctx.beginPath();
        ctx.moveTo(indicatorPos.x, padding - 25);
        ctx.lineTo(indicatorPos.x - 10, padding - 35);
        ctx.lineTo(indicatorPos.x + 10, padding - 35);
        ctx.closePath();
        ctx.fillStyle = '#60a5fa';
        ctx.fill();

        // Draw ball if animating
        if (ballPosition) {
            ctx.beginPath();
            ctx.arc(ballPosition.x, ballPosition.y, ballRadius, 0, Math.PI * 2);

            // Gradient fill
            const gradient = ctx.createRadialGradient(
                ballPosition.x - 3, ballPosition.y - 3, 0,
                ballPosition.x, ballPosition.y, ballRadius
            );
            gradient.addColorStop(0, '#fbbf24');
            gradient.addColorStop(1, '#f59e0b');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Glow
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 15;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }, [canvasWidth, canvasHeight, rows, bins, getPegPosition, getBinPosition, selectedColumn, ballPosition, pegSpacing]);

    // Animation loop
    useEffect(() => {
        if (!isRunning || path.length === 0) return;

        const positions = getBallPathPositions();
        if (positions.length === 0) return;

        if (reducedMotion) {
            // Instant animation for reduced motion
            const finalPos = positions[positions.length - 1];
            setBallPosition(finalPos);
            setIsRunning(false);
            const finalBinIndex = path.filter(d => d === 'R').length;
            onBinLand?.(finalBinIndex);
            onAnimationComplete?.();
            return;
        }

        let currentStep = 0;
        let progress = 0;
        const speed = 0.05;

        const animate = () => {
            if (currentStep >= positions.length - 1) {
                setIsRunning(false);
                const finalBinIndex = path.filter(d => d === 'R').length;
                onBinLand?.(finalBinIndex);
                onAnimationComplete?.();
                return;
            }

            progress += speed;

            if (progress >= 1) {
                progress = 0;
                currentStep++;
                setAnimationStep(currentStep);

                // Trigger peg hit sound (except for first and last position)
                if (currentStep > 0 && currentStep < positions.length - 1) {
                    onPegHit?.();
                }
            }

            if (currentStep < positions.length - 1) {
                const from = positions[currentStep];
                const to = positions[currentStep + 1];

                // Eased interpolation
                const eased = 1 - Math.pow(1 - progress, 3);
                const x = from.x + (to.x - from.x) * eased;
                const y = from.y + (to.y - from.y) * eased;

                setBallPosition({ x, y });
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        setBallPosition(positions[0]);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isRunning, path, getBallPathPositions, reducedMotion, onPegHit, onBinLand, onAnimationComplete]);

    // Draw when state changes
    useEffect(() => {
        draw();
    }, [draw]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        startAnimation: () => {
            setAnimationStep(0);
            setIsRunning(true);
        },
        resetBall: () => {
            setBallPosition(null);
            setAnimationStep(0);
            setIsRunning(false);
        },
    }));

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isRunning) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const newColumn = Math.max(0, selectedColumn - 1);
                onColumnChange?.(newColumn);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const newColumn = Math.min(bins - 1, selectedColumn + 1);
                onColumnChange?.(newColumn);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedColumn, bins, isRunning, onColumnChange]);

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="rounded-xl border border-slate-700 shadow-2xl"
                style={{ maxWidth: '100%', height: 'auto' }}
            />
        </div>
    );
});

PlinkoBoard.displayName = 'PlinkoBoard';

export default PlinkoBoard;
