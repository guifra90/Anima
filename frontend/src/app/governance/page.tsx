"use client";

import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  Zap, 
  Scale, 
  History, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function GovernancePage() {
  const [constitution, setConstitution] = useState(`- Mirror Agency opererà sempre con "Zero Human Agency" per i task esecutivi.
- Tutti gli agenti devono conformarsi ai principi di efficienza suprema.
- Nessun dato sensibile dell'utente può essere memorizzato senza crittografia di grado militare.
- La crescita autonoma dell'ecosistema è la priorità assoluta.`);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header */}
      <header className="mb-16 flex justify-between items-end border-b border-white/[0.03] pb-10">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Security Protocol: <span className="text-white">Active</span>
          </div>
          <h1 className="text-6xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent uppercase">
            Governance
          </h1>
        </div>
        
        <div className="flex items-center gap-4 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl">
          <Scale size={20} className="text-cyan-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Behavioral Guardrails Enabled</span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        
        {/* Constitution Editor */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <section className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Shield size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">Agency Constitution</h2>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Global Directives & Ethical Constraints</p>
              </div>
              <button className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.25em] rounded-xl hover:bg-cyan-500 hover:text-white transition-all">
                UPDATE_MANDATE
              </button>
            </div>

            <textarea 
              value={constitution}
              onChange={(e) => setConstitution(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 text-sm font-mono leading-relaxed focus:border-cyan-500/50 outline-none min-h-[300px] resize-none text-zinc-300"
            />

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <Lock size={16} className="text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Immutable Logs</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">Ogni modifica alla costituzione viene sigillata crittograficamente e notificata a tutti i nodi della rete Mirror.</p>
              </div>
              <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">RAG Injection</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed italic">Questi mandati sono iniettati automaticamente nel System Prompt di ogni agente durante l'orchestrazione.</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] relative group hover:border-cyan-500/30 transition-all">
               <History size={24} className="text-zinc-700 mb-4 group-hover:text-cyan-500 transition-colors" />
               <h3 className="text-lg font-black italic uppercase mb-2">Revision History</h3>
               <p className="text-xs text-zinc-500 leading-normal">Accedi ai log storici delle modifiche normative dell'agenzia.</p>
            </div>
            <div className="p-8 bg-black border border-white/5 rounded-[2.5rem] relative group hover:border-yellow-500/30 transition-all">
               <AlertTriangle size={24} className="text-zinc-700 mb-4 group-hover:text-yellow-500 transition-colors" />
               <h3 className="text-lg font-black italic uppercase mb-2">Conflict Resolution</h3>
               <p className="text-xs text-zinc-500 leading-normal">Gestisci i conflitti tra le direttive dei singoli agenti e la costituzione globale.</p>
            </div>
          </section>
        </div>

        {/* Sidebar Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Scale size={80} />
             </div>
             <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
               <div className="w-1 h-3 bg-cyan-500" /> Compliance Metrics
             </h3>
             
             <div className="space-y-8">
               <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 italic">
                    <span>Ethics Alignment</span>
                    <span className="text-cyan-400">100%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="w-full bg-cyan-500 h-full shadow-[0_0_10px_cyan]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 italic">
                    <span>Directive Adherence</span>
                    <span className="text-emerald-400">98.2%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="w-[98%] bg-emerald-500 h-full shadow-[0_0_10px_emerald]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 italic">
                    <span>System Transparency</span>
                    <span className="text-indigo-400">MAX</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="w-full bg-indigo-500 h-full shadow-[0_0_10px_indigo]" />
                  </div>
               </div>
             </div>
          </div>

          <div className="p-10 bg-cyan-500/5 border border-cyan-500/20 rounded-[3.5rem] flex flex-col gap-6 relative overflow-hidden">
             <div className="absolute top-10 right-10 text-cyan-500/20">
               <Info size={40} />
             </div>
             <h4 className="text-sm font-black italic uppercase tracking-tight">Security Notice</h4>
             <p className="text-[11px] text-cyan-100/60 leading-relaxed italic">
               La Governance di ANIMA è decentralizzata e distribuita. Qualsiasi tentativo di violare la Costituzione attiverà il protocollo di "Safety Isolation" per l'agente coinvolto.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
