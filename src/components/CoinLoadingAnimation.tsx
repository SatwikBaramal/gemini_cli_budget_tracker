export function CoinLoadingAnimation() {
  return (
    <div className="flex items-center justify-center gap-1">
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
      
      <style jsx>{`
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6b7280;
          animation: pulse 1.4s ease-in-out infinite;
        }
        
        .dot-1 {
          animation-delay: 0s;
        }
        
        .dot-2 {
          animation-delay: 0.2s;
        }
        
        .dot-3 {
          animation-delay: 0.4s;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

