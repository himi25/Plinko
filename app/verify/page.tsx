'use client';

import React, { Suspense } from 'react';
import VerifyContent from './VerifyContent';

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </main>
        }>
            <VerifyContent />
        </Suspense>
    );
}
