'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { VersionNoticeDialog } from './VersionNoticeDialog';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <VersionNoticeDialog />
      </ThemeProvider>
    </SessionProvider>
  );
}


