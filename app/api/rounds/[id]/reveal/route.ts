/**
 * POST /api/rounds/:id/reveal
 * 
 * Reveals the server seed after the game is complete.
 * Returns: { serverSeed }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get round from database
        const round = await prisma.round.findUnique({
            where: { id },
        });

        if (!round) {
            return NextResponse.json(
                { error: 'Round not found' },
                { status: 404 }
            );
        }

        if (round.status === 'committed') {
            return NextResponse.json(
                { error: 'Round not yet started' },
                { status: 400 }
            );
        }

        // Update status to revealed
        const updatedRound = await prisma.round.update({
            where: { id },
            data: {
                status: 'revealed',
                revealedAt: new Date(),
            },
        });

        return NextResponse.json({
            serverSeed: updatedRound.serverSeed,
        });
    } catch (error) {
        console.error('Error revealing round:', error);
        return NextResponse.json(
            { error: 'Failed to reveal round' },
            { status: 500 }
        );
    }
}
