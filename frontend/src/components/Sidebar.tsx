import React, { useState } from 'react';
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
  const pathname = usePathname();
  const router = useRouter();

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
        "h-screen bg-[#0A0A0A] border-r border-white/10 transition-all duration-300 flex flex-col relative",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center">
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
            className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center mx-auto cursor-pointer"
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
          const isActive = pathname === item.path;
          
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
              className="w-full flex items-center gap-2 px-3 py-2 bg-cyan-400 text-black rounded-lg text-sm font-bold hover:bg-cyan-300 transition-colors"
            >
              <PlusCircle size={16} />
              Nuova Missione
            </button>
          </div>
        )}
      </nav>

      {/* Heartbeat Status Indicator */}
      {!isCollapsed && (
        <div className="px-6 py-4 mx-3 mb-4 bg-zinc-900/50 rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Heartbeat</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-500 font-bold">ONLINE</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-cyan-400" />
            <span className="text-xs text-zinc-400">Pronto per task...</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center shadow-lg shadow-cyan-400/20 hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Footer Settings */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white transition-all overflow-hidden">
          <Settings className="w-5 h-5 min-w-[20px]" />
          {!isCollapsed && <span className="text-sm font-medium">Impostazioni OS</span>}
        </button>
      </div>
    </aside>
  );
}
