'use client';

import React, { useRef, useState } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';

interface SwipeableExpenseItemProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 120;

export const SwipeableExpenseItem: React.FC<SwipeableExpenseItemProps> = ({
  children,
  onDelete,
  onEdit,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;

    // Swipe left to delete
    if (offset < -SWIPE_THRESHOLD && onDelete) {
      await controls.start({ x: -MAX_SWIPE, transition: { duration: 0.2 } });
      onDelete();
      await controls.start({ x: 0, transition: { duration: 0.2 } });
    }
    // Swipe right to edit
    else if (offset > SWIPE_THRESHOLD && onEdit) {
      await controls.start({ x: MAX_SWIPE, transition: { duration: 0.2 } });
      onEdit();
      await controls.start({ x: 0, transition: { duration: 0.2 } });
    }
    // Reset if not enough swipe
    else {
      await controls.start({ x: 0, transition: { duration: 0.3, type: 'spring' } });
    }
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        {/* Right side - Edit */}
        {onEdit && (
          <div className="flex items-center justify-center w-16 h-full bg-blue-500 text-white">
            <Edit className="h-5 w-5" />
          </div>
        )}
        
        <div className="flex-1" />
        
        {/* Left side - Delete */}
        {onDelete && (
          <div className="flex items-center justify-center w-16 h-full bg-red-500 text-white">
            <Trash2 className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`bg-white dark:bg-gray-800 relative z-10 touch-pan-y ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {children}
      </motion.div>
    </div>
  );
};

