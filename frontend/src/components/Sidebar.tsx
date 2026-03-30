"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  LayoutDashboard,
  Database,
  PlusCircle,
  Activity
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setSystemHealth(await res.json());
      } catch (err) {}
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = systemHealth?.services?.supabase?.status === 'connected';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'missions', label: 'Mission Board', icon: TrendingUp, path: '/missions' },
    { id: 'team', label: 'Agency Team', icon: Users, path: '/team' },
    { id: 'memory', label: 'Memory (KB)', icon: Database, path: '/memory' },
    { id: 'sops', label: 'Procedure (SOPs)', icon: FileText, path: '/sops' },
  ];

  return (
    <aside 
      className={cn(
        "h-screen bg-[#0A0A0A] border-r border-white/10 transition-all duration-300 flex flex-col relative z-50 shadow-[4px_0_24px_rgba(0,0,0,0.5)]",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <span className="text-black font-bold text-xs">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold tracking-tighter text-xl leading-none">ANIMA v2</span>
              <span className="text-[10px] text-cyan-400/50 font-medium tracking-widest uppercase">Agency OS</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div 
            className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center mx-auto cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            onClick={() => router.push('/')}
          >
            <span className="text-black font-bold text-xs">M</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className={cn("text-xs font-semibold text-zinc-500 mb-4 px-3 uppercase tracking-widest", isCollapsed && "text-center")}>
          {isCollapsed ? "Nav" : "Menu Principale"}
        </div>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/' 
            ? pathname === '/' 
            : pathname.startsWith(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full" />
              )}
              <Icon className={cn("w-5 h-5 min-w-[20px]", isActive ? "text-cyan-400" : "group-hover:text-white")} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="mt-8 px-3">
             <div className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-widest">
              Azioni Rapide
            </div>
            <button 
              onClick={() => router.push('/missions/new')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-black rounded-lg text-sm font-bold hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all"
            >
              <PlusCircle size={16} />
              Nuova Missione
            </button>
          </div>
        )}
      </nav>

      {/* Heartbeat Status Indicator */}
      {!isCollapsed && (
        <div className="px-6 py-4 mx-3 mb-4 bg-white/[0.02] rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Heartbeat</span>
            <div className="flex items-center gap-1.5">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]")} />
              <span className={cn("text-[10px] font-bold uppercase", isOnline ? "text-emerald-500" : "text-rose-500")}>
                {isOnline ? "OPERATIONAL" : "DISRUPTED"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className={isOnline ? "text-cyan-400" : "text-rose-400"} />
            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-tighter">
              {isOnline ? "Neural Core Synchronized" : "Connection Error"}
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center shadow-lg shadow-cyan-400/20 hover:scale-110 transition-transform z-[60]"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Footer Settings */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white transition-all overflow-hidden text-left">
          <Settings className="w-5 h-5 min-w-[20px]" />
          {!isCollapsed && <span className="text-sm font-medium">Impostazioni OS</span>}
        </button>
      </div>
    </aside>
  );
}
