import React from "react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color = "currentColor",
  className,
  label = "Chargement en cours"
}) => {
  return (
    <div
      role="status"
      className={cn("inline-flex items-center", className)}
      aria-label={label}
    >
      <svg
        className="animate-spin"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill={color}
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Export a compound component for different sizes
export const Spinner = {
  Small: (props: Omit<LoadingSpinnerProps, "size">) => (
    <LoadingSpinner size={16} {...props} />
  ),
  Medium: (props: Omit<LoadingSpinnerProps, "size">) => (
    <LoadingSpinner size={24} {...props} />
  ),
  Large: (props: Omit<LoadingSpinnerProps, "size">) => (
    <LoadingSpinner size={32} {...props} />
  ),
};
