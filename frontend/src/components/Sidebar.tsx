"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  MessageSquare, 
  BarChart2, 
  Briefcase, 
  TrendingUp, 
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Agent {
  id: string;
  name: string;
  department: string;
  responsibility: string;
}

interface SidebarProps {
  activeAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  'operations-manager': Zap,
  'strategic-planner': TrendingUp,
  'creative-director': Briefcase,
  'cfo': BarChart2,
  'account-manager': MessageSquare,
  'project-manager': Users,
  'hr-manager': HeartHandshake,
};

export default function Sidebar({ activeAgentId, onSelectAgent }: SidebarProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/chat')
      .then(res => res.json())
      .then(data => {
        if (data.agents) setAgents(data.agents);
      })
      .catch(err => console.error("Error loading agents:", err));
  }, []);

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center">
              <span className="text-black font-bold text-xs">M</span>
            </div>
            <span className="text-white font-bold tracking-tighter text-xl">MIRROR ANIMA</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-full bg-cyan-400 flex items-center justify-center mx-auto">
            <span className="text-black font-bold text-xs">M</span>
          </div>
        )}
      </div>

      {/* Agents List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className={cn("text-xs font-semibold text-zinc-500 mb-4 px-3 uppercase tracking-widest", isCollapsed && "text-center")}>
          {isCollapsed ? "Ag" : "Network Agenti"}
        </div>
        
        {agents.map((agent) => {
          const Icon = AGENT_ICONS[agent.id] || Zap;
          const isActive = activeAgentId === agent.id;
          
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
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
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium truncate w-full">{agent.name}</span>
                  <span className="text-[10px] text-zinc-500 truncate uppercase tracking-tighter">
                    {agent.department}
                  </span>
                </div>
              )}
              {isCollapsed && isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-cyan-400 text-black rounded-full flex items-center justify-center shadow-lg shadow-cyan-400/20 hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Settings Footer */}
      <div className="p-3 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white transition-all overflow-hidden">
          <Settings className="w-5 h-5 min-w-[20px]" />
          {!isCollapsed && <span className="text-sm font-medium">Impostazioni</span>}
        </button>
      </div>
    </aside>
  );
}
