"use client";

import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Cpu, 
  Key, 
  Globe, 
  ShieldCheck, 
  Zap, 
  RefreshCcw,
  Cloud,
  ChevronRight,
  Save,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header */}
      <header className="mb-16 flex justify-between items-end border-b border-white/[0.03] pb-10">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Infrastructure: <span className="text-white">v3.0.0-CORE</span>
          </div>
          <h1 className="text-6xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent uppercase">
            System Core
          </h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-3xl shadow-xl">
           {['system', 'engines', 'security', 'api'].map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        
        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-8">
           <motion.div 
             key={activeTab}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-12 opacity-5">
                 <Settings size={120} />
              </div>

              {activeTab === 'system' && (
                <div className="space-y-10">
                   <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-2xl font-black italic uppercase italic mb-2 tracking-tight">Base Configuration</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Global Environment Variables</p>
                      </div>
                      <button className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-xl">
                        <Save size={16} strokeWidth={3} /> SAVE_CHANGES
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Agency Persistence Mode</label>
                         <div className="flex bg-black/40 border border-white/5 rounded-2xl p-4 items-center justify-between group hover:border-cyan-500/30 transition-all transition-all">
                            <span className="text-xs font-bold text-zinc-300">Infinite Orchestration</span>
                            <div className="w-10 h-5 bg-cyan-500 rounded-full flex items-center justify-end p-1 shadow-[0_0_10px_cyan]">
                               <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Self-Repairing Kernel</label>
                         <div className="flex bg-black/40 border border-white/5 rounded-2xl p-4 items-center justify-between group hover:border-emerald-500/30 transition-all">
                            <span className="text-xs font-bold text-zinc-300">Automatic Heal</span>
                            <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end p-1 shadow-[0_0_10px_emerald]">
                               <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Data Retention (Days)</label>
                         <input type="number" defaultValue={30} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono outline-none focus:border-cyan-500/50 transition-all" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">RAG Context Buffer (tokens)</label>
                         <input type="number" defaultValue={4096} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono outline-none focus:border-cyan-500/50 transition-all" />
                      </div>
                   </div>
                </div>
              )}

              {activeTab !== 'system' && (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                   <div className="w-20 h-20 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mb-6">
                      <RefreshCcw size={40} className="text-zinc-600 animate-spin" strokeWidth={1} />
                   </div>
                   <h3 className="text-xl font-black italic uppercase mb-2">Synchronizing Module</h3>
                   <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Interface connecting via AI Bridge Server v1.0.2</p>
                </div>
              )}
           </motion.div>
        </div>

        {/* Info Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
           <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Database size={80} />
             </div>
             <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
               <div className="w-1 h-3 bg-cyan-500" /> Infrastructure Status
             </h3>
             
             <div className="space-y-8">
               <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <Database size={16} className="text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Supabase DB</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-cyan-400 uppercase italic">STABLE</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                 </div>
               </div>
               <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <Cloud size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Cloud Memory</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase italic">CONNECTED</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                 </div>
               </div>
               <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Kernel Security</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-400 uppercase italic">VERIFIED</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                 </div>
               </div>
             </div>
           </div>

           <div className="p-10 bg-black flex flex-col gap-6 rounded-[3rem] border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              <div className="flex items-center gap-3 mb-2">
                 <Key size={18} className="text-cyan-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Access Credentials</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                 Gestisci le chiavi API per i provider LLM e i servizi di terze parti integrati nel motore Mirror. Tutti i dati sono memorizzati nel Vault protetto da chiave hardware locale.
              </p>
              <button className="flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-cyan-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                 MANAGE_VAULT <ChevronRight size={14} />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
