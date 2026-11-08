import React from 'react';

export default function StatCard({ title, value, icon: Icon, change, changeType, subtitle, color = 'navy' }) {
  const colorMap = {
    navy: 'text-navy-600 bg-navy-50',
    teal: 'text-teal-600 bg-teal-50',
    green: 'text-emerald-600 bg-emerald-50',
    red: 'text-rose-600 bg-rose-50',
    purple: 'text-purple-600 bg-purple-50',
    amber: 'text-amber-600 bg-amber-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.navy}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              changeType === 'positive'
                ? 'bg-emerald-50 text-emerald-700'
                : changeType === 'negative'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
    </div>
  );
}

