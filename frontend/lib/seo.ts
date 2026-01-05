import { Metadata } from 'next';
import { APP_NAME, APP_DESCRIPTION } from './constants';

export const defaultMetadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'decentralized',
    'discourse',
    'debate',
    'blockchain',
    'Base',
    'web3',
    'onchain reputation',
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://veridium.app'),
  openGraph: {
    type: 'website',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function generatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description: description || APP_DESCRIPTION,
  };
}
