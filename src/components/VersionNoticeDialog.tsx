'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const VERSION_NOTICE_KEY = 'version-notice-seen';

export function VersionNoticeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if user has already seen the notice
    const hasSeenNotice = localStorage.getItem(VERSION_NOTICE_KEY);
    
    if (!hasSeenNotice) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    // Mark as seen in localStorage
    localStorage.setItem(VERSION_NOTICE_KEY, 'true');
    setIsOpen(false);
  };

  // Don't render anything until mounted (avoid SSR issues)
  if (!isMounted) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Development Notice</DialogTitle>
          <DialogDescription className="text-base pt-4 space-y-3">
            <p>The Application is still in Development.</p>
            <p>
              This is Version 0.0.6 Beta. There will be some delay in the values
              getting updated. Please be patient.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button onClick={handleClose}>I Understand</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

