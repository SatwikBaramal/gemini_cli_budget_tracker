"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: 'white',
          color: '#333',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
        },
        className: 'toaster-toast',
      }}
    />
  );
}










