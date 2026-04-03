"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Box, Loader2, Settings, User } from 'lucide-react';
import { Unit, AgentInfo } from '@/lib/anima';

interface UnitOrgNodeProps {
  unit: Unit & { children?: any[] };
  agents: AgentInfo[];
  onEdit: (unit: Unit) => void;
}

export default function UnitOrgNode({ unit, agents, onEdit }: UnitOrgNodeProps) {
  const leadAgent = agents.find(a => a.id === unit.lead_id);

  return (
    <div className="flex flex-col items-center relative mx-12">
      {/* Unit Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="group relative bg-[#0C0C0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-7 w-72 hover:border-cyan-400/50 transition-all duration-500 z-10 shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
      >
        <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity">
          <Box size={48} />
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-colors shadow-inner">
            <Box size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-black truncate tracking-tighter uppercase italic text-white group-hover:text-cyan-400 transition-colors">
              {unit.name}
            </h4>
            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em] italic">
              CORE_NODE: {unit.id}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Lead Info */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
             <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                <User size={14} />
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Orchestrator_Lead</p>
                <p className="text-[10px] font-bold text-white truncate uppercase italic">
                  {leadAgent ? leadAgent.name : 'DIRECT_BOARD_LINK'}
                </p>
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Neural_Load_Nominal</span>
            </div>
            
            <button 
              onClick={() => onEdit(unit)} 
              className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-zinc-600 hover:text-cyan-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 interactive"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Recursive Children Connections */}
      {unit.children && unit.children.length > 0 && (
        <>
          <div className="w-px h-20 bg-gradient-to-b from-cyan-400 to-white/5 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] z-20" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-white/10 bg-black z-20 flex items-center justify-center">
               <div className="w-1 h-1 rounded-full bg-white/40" />
            </div>
          </div>
          <div className="relative flex justify-center gap-6">
            {/* Horizontal connector line */}
            {unit.children.length > 1 && (
              <div 
                className="absolute top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" 
                style={{ 
                  left: `calc(100% / (${unit.children.length} * 2))`,
                  right: `calc(100% / (${unit.children.length} * 2))`
                }} 
              />
            )}
            {unit.children.map((child) => (
              <UnitOrgNode key={child.id} unit={child} agents={agents} onEdit={onEdit} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
