import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number; text?: string; className?: string }> = ({
  size = 20,
  text,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
      <svg
        className="animate-spin text-emerald-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        width={size}
        height={size}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      {text && <span className="text-xs font-medium">{text}</span>}
    </div>
  );
};
