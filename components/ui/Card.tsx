import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-black/25 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg shadow-black/40 ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-white/20">
          <h3 className="text-lg font-semibold text-fuchsia-300 tracking-wider">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};