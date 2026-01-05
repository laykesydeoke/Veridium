'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary-600">Veridium</div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/sessions"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
          >
            Sessions
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
          >
            Leaderboard
          </Link>
          <Link
            href="/achievements"
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-primary-600"
          >
            Achievements
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}
