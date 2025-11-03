'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';
import { Summary } from './Summary';

export function ChatbotDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent border-white text-white hover:bg-gray-700 hover:text-white px-1.5 py-1.5 md:px-3 md:py-2 h-8 md:h-9"
        >
          <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-2" />
          <span className="hidden md:inline">FinBot</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            FinBot Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me anything about your expenses and financial data
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Summary />
        </div>
      </DialogContent>
    </Dialog>
  );
}

