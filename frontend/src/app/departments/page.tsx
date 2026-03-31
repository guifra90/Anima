"use client";

import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  ChevronRight, 
  Users, 
  Target, 
  Layers, 
  Zap,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

const DEPARTMENTS = [
  { id: 'creative', name: 'Creative', roles: 4, status: 'Active', active_missions: 3, head: 'Creative Director' },
  { id: 'strategy', name: 'Strategy', roles: 2, status: 'Active', active_missions: 5, head: 'Strategy Lead' },
  { id: 'finance', name: 'Finance', roles: 1, status: 'Active', active_missions: 1, head: 'CFO' },
  { id: 'ops', name: 'Operations', roles: 6, status: 'Active', active_missions: 8, head: 'COO' },
];

export default function DepartmentsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header */}
      <header className="mb-16 flex justify-between items-end border-b border-white/[0.03] pb-10">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Agency Structure: <span className="text-white">Hierarchical</span>
          </div>
          <h1 className="text-6xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent uppercase">
            Departments
          </h1>
        </div>
        
        <button className="px-8 py-4 bg-white text-black text-[12px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-cyan-500 hover:text-white transition-all shadow-[0_10px_40px_rgba(255,255,255,0.1)]">
          <Plus size={20} className="inline-block mr-2" strokeWidth={3} /> NEW_UNIT
        </button>
      </header>

      <div className="grid grid-cols-12 gap-10">
        
        {/* Main Grid */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {DEPARTMENTS.map(dept => (
              <motion.div 
                key={dept.id}
                whileHover={{ y: -5 }}
                className="p-10 bg-white/[0.02] border border-white/5 rounded-[3.5rem] relative overflow-hidden group hover:bg-white/[0.04] transition-all"
              >
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Layers size={100} />
                </div>
                
                <div className="flex justify-between items-start mb-10">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 group-hover:border-cyan-500/50 transition-colors shadow-inner">
                    <Briefcase size={28} className="text-zinc-600 group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <span className="px-4 py-1.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest leading-none">
                    {dept.status}
                  </span>
                </div>

                <h3 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">{dept.name}</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1 italic">Authorized Roles</p>
                    <p className="text-2xl font-black italic text-zinc-100 uppercase">{dept.roles}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1 italic">Active Missions</p>
                    <p className="text-2xl font-black italic text-cyan-500 uppercase">{dept.active_missions}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                        <Users size={12} className="text-zinc-500" />
                     </div>
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{dept.head}</span>
                   </div>
                   <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all">
                     <ChevronRight size={18} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Target size={80} />
             </div>
             <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
               <div className="w-1 h-3 bg-cyan-500" /> Organizational Insights
             </h3>
             
             <div className="space-y-10">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                    <TrendingUp size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black italic uppercase italic">Efficiency Peak</h4>
                    <p className="text-xs text-zinc-500 font-bold italic leading-relaxed">Operations è l'unità più produttiva nelle ultime 48h.</p>
                 </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                    <Cpu size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black italic uppercase italic">Neural Load</h4>
                    <p className="text-xs text-zinc-500 font-bold italic leading-relaxed">Strategy sta saturando il 82% della capacità LLM assegnata.</p>
                 </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <Target size={24} />
                 </div>
                 <div>
                    <h4 className="text-sm font-black italic uppercase italic">Agency Alignment</h4>
                    <p className="text-xs text-zinc-500 font-bold italic leading-relaxed">Tutte le unità sono allineate agli obiettivi trimestrali (V3.0).</p>
                 </div>
               </div>
             </div>
          </div>

          <div className="p-10 bg-black flex flex-col gap-6 rounded-[3rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic">Structural Alerts</h4>
             <div className="space-y-4">
                <div className="flex items-start gap-4">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1 shadow-[0_0_8px_cyan]" />
                   <p className="text-[10px] text-zinc-500 italic font-bold">New unit: Creative is scaling up.</p>
                </div>
                <div className="flex items-start gap-4">
                   <div className="w-2 h-2 rounded-full bg-zinc-800 mt-1" />
                   <p className="text-[10px] text-zinc-500 italic font-bold leading-relaxed">Finance audit completed. No anomalies detected.</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
