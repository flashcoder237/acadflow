// ========================================
// FICHIER: src/components/ui/select.tsx
// ========================================

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  onValueChange,
  children,
  defaultValue = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  
  const value = controlledValue ?? internalValue;
  const handleValueChange = onValueChange ?? setInternalValue;

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className }) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectTrigger must be used within a Select component');
  }

  const { open, setOpen } = context;

  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-gray-300',
        'bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => setOpen(!open)}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder = 'Select...', className }) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectValue must be used within a Select component');
  }

  const { value } = context;

  return (
    <span className={cn('block truncate', className)}>
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  const context = useContext(SelectContext);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!context) {
    throw new Error('SelectContent must be used within a Select component');
  }

  const { open, setOpen } = context;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute top-full left-0 z-50 w-full mt-1 rounded-md border border-gray-200',
        'bg-white shadow-lg animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      <div className="max-h-60 overflow-auto p-1">
        {children}
      </div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({ value: itemValue, children, className }) => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('SelectItem must be used within a Select component');
  }

  const { value, onValueChange, setOpen } = context;
  const isSelected = value === itemValue;

  const handleSelect = () => {
    onValueChange(itemValue);
    setOpen(false);
  };

  return (
    <button
      type="button"
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm',
        'outline-none focus:bg-gray-100 focus:text-gray-900',
        'hover:bg-gray-100',
        className
      )}
      onClick={handleSelect}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </button>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };