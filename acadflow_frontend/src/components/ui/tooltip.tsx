// ========================================
// FICHIER: src/components/ui/tooltip.tsx
// ========================================

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface TooltipContentProps {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

const TooltipProvider: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>;
};

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ children, asChild = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      'data-tooltip-visible': isVisible,
    } as any);
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-tooltip-visible={isVisible}
    >
      {children}
    </div>
  );
};

const TooltipContent: React.FC<TooltipContentProps> = ({ 
  children, 
  className, 
  side = 'top', 
  align = 'center' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const trigger = document.querySelector('[data-tooltip-visible="true"]');
    setIsVisible(!!trigger);
  });

  if (!isVisible) return null;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
    center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
    end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
  };

  return (
    <div
      className={cn(
        'absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        positionClasses[side],
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };