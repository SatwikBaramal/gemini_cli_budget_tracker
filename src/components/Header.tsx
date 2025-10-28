'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

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
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center px-8">
      <h1 className="font-[var(--font-crimson-text)] text-sm">Made by Satwik Baramal</h1>
      <p className="text-2xl font-bold">Vivaranam</p>
      <div className="flex items-center relative">
        {session?.user ? (
          <>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
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
                <div className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-xl z-20 py-2 text-gray-800">
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