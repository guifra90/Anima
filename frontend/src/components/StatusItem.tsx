import React from 'react';

interface StatusItemProps {
  label: string;
  value?: string | number;
  status?: string;
  color?: 'cyan' | 'emerald' | 'rose' | 'amber' | 'zinc';
}

export default function StatusItem({ label, value, status, color = 'cyan' }: StatusItemProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'emerald': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
      case 'rose': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
      case 'amber': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      case 'zinc': return 'bg-zinc-500';
      default: return 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]';
    }
  };

  const getTextColor = () => {
    switch (color) {
      case 'emerald': return 'text-emerald-500';
      case 'rose': return 'text-rose-500';
      case 'amber': return 'text-amber-500';
      case 'zinc': return 'text-zinc-500';
      default: return 'text-cyan-500';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-1.5 h-1.5 rounded-full ${getColorClasses()} animate-pulse`} />
      <div className="flex flex-col">
        <span className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.2em] leading-none mb-1 italic">
          {label}
        </span>
        <span className={`text-[11px] font-black italic uppercase leading-none ${getTextColor()}`}>
          {value !== undefined ? value : status}
        </span>
      </div>
    </div>
  );
}
