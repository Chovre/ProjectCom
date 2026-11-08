import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'default', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.default} animate-spin text-navy-600`} />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );
}

