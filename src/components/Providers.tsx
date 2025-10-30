'use client';

import { SessionProvider } from 'next-auth/react';
import { VersionNoticeDialog } from './VersionNoticeDialog';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <VersionNoticeDialog />
    </SessionProvider>
  );
}


