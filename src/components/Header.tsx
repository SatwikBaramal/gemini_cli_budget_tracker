'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ExportDataDialog } from './ExportDataDialog';

const Header: React.FC = () => {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-gray-800 text-white p-3 md:p-4 flex justify-between items-center px-3 md:px-8">
      <h1 className="font-[var(--font-crimson-text)] text-xs sm:text-sm hidden sm:block">Made by Satwik Baramal</h1>
      <p className="text-lg sm:text-xl md:text-2xl font-bold">Vivaranam</p>
      <div className="flex items-center gap-2 md:gap-4 relative">
        {session?.user ? (
          <>
            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              size="sm"
              className="bg-transparent border-white text-white hover:bg-gray-700 hover:text-white px-2 md:px-3"
            >
              <Download className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Export Data</span>
            </Button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                  {getInitials(session.user.name)}
                </div>
              )}
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-12 md:top-14 w-56 sm:w-64 bg-white rounded-lg shadow-xl z-20 py-2 text-gray-800">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold">{session.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}

            <ExportDataDialog
              open={showExportDialog}
              onOpenChange={setShowExportDialog}
            />
          </>
        ) : (
          <Button onClick={() => window.location.href = '/sign-in'}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;