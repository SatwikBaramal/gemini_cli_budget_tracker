'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ExportDataDialog } from './ExportDataDialog';
import { ThemeToggle } from './ThemeToggle';
import { SettingsDialog } from './SettingsDialog';
import { SearchDialog } from './SearchDialog';
import { ChatbotDialog } from './ChatbotDialog';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { toast } from 'sonner';

interface HeaderProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const Header: React.FC<HeaderProps> = ({ selectedYear, onYearChange }) => {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/sign-in' });
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      const data = await response.json();
      
      // Close the dialog and menu
      setShowDeleteDialog(false);
      setShowMenu(false);
      
      // Show success message
      toast.success('Account deleted successfully');
      
      // Sign out and redirect to sign-in page
      await signOut({ callbackUrl: '/sign-in' });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
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
    <header className="bg-gray-800 dark:bg-gray-900 text-white py-2 px-2 md:p-4 md:px-8 flex justify-between items-center">
      <Link href="/" className="text-lg sm:text-2xl md:text-3xl font-bold hover:text-gray-300 transition-colors cursor-pointer">
        Vivaranam
      </Link>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-6 relative">
        {session?.user ? (
          <>
            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              size="sm"
              className="bg-transparent border-white text-white hover:bg-gray-700 hover:text-white px-1.5 py-1.5 md:px-3 md:py-2 h-8 md:h-9"
            >
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
              <span className="hidden md:inline">Export Data</span>
            </Button>

            <SettingsDialog selectedYear={selectedYear} onYearChange={onYearChange} />

            <SearchDialog selectedYear={selectedYear} />

            <ChatbotDialog />

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center focus:outline-none"
            >
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs md:text-base">
                {getInitials(session.user.name)}
              </div>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-12 md:top-14 w-56 sm:w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 py-2 text-gray-800 dark:text-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold">{session.user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user.email}</p>
                  </div>
                  <ThemeToggle />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteDialog(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700"
                  >
                    Delete Account
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
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

            <DeleteAccountDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              onConfirmDelete={handleDeleteAccount}
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