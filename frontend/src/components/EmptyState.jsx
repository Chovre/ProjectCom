import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionText,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn-primary text-sm inline-flex items-center gap-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

