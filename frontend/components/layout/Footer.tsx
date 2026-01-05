import React from 'react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-neutral-900">Veridium</h3>
            <p className="text-sm text-neutral-600">
              A decentralized discourse platform built on Base.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-neutral-900">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sessions" className="text-neutral-600 hover:text-primary-600">
                  Browse Sessions
                </Link>
              </li>
              <li>
                <Link
                  href="/create-session"
                  className="text-neutral-600 hover:text-primary-600"
                >
                  Create Session
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-neutral-600 hover:text-primary-600"
                >
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-neutral-900">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-neutral-600 hover:text-primary-600">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-neutral-600 hover:text-primary-600">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/veridium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 hover:text-primary-600"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-neutral-900">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-neutral-600 hover:text-primary-600">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-neutral-600 hover:text-primary-600">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <p className="text-center text-sm text-neutral-600">
            © {currentYear} Veridium. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
