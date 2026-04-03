import React from 'react';
import { Rocket, Shield, Cpu, Zap } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function DocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
          <Rocket size={10} /> Introduction
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">What is ANIMA?</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-medium">
          <strong>ANIMA</strong> (Autonomous Network for Intelligent Mirror Agency) is an Operating System for Zero-Human Agencies. 
          It turns a collection of AI agents into a coordinated corporate machine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Shield size={20} className="text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Governance First</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Ogni azione è tracciata, ogni budget è blindato. La board umana mantiene il controllo sovrano su ogni decisione critica degli agenti.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-blue-500/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Zap size={20} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Ultra-Portable</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Seguendo lo standard <strong>AgentCompanies v1</strong>, ANIMA è agnostica rispetto alla piattaforma. Il "DNA" dell'agenzia risiede nel tuo filesystem.</p>
        </div>
      </div>

      <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 mb-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-cyan-500/20" />
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <Cpu className="text-cyan-500" /> Architettura Ibrida
        </h2>
        
        <Mermaid chart={`graph LR
    A[Human Board] -->|Strategy| B(ANIMA OS)
    B -->|Sync| C[Filesystem DNA]
    B -->|State| D[Supabase Runtime]
    C -.->|Load| B
    D -.->|History| B`} />

        <div className="space-y-6 text-zinc-400 leading-relaxed relative z-10">
          <p>
            A differenza dei sistemi tradizionali che si appoggiano esclusivamente a un database, ANIMA opera su due livelli:
          </p>
          <ul className="list-none p-0 space-y-4">
            <li className="flex gap-4">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">1</div>
              <div>
                <strong className="text-white">Engineering Layer (Filesystem):</strong> Il "DNA" degli agenti in formato Markdown. Diviso per gerarchie: <code>agents/system/</code> per l'infrastruttura e <code>agents/agency/</code> per gli asset operativi.
              </div>
            </li>
            <li className="flex gap-4">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">2</div>
              <div>
                <strong className="text-white">Runtime Layer (Supabase):</strong> Lo stato operativo in tempo reale. Qui vengono salvate le missioni attive, i log di esecuzione e le configurazioni dinamiche come gli override dei modelli LLM.
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter italic">Platform Core v4.5: What's New</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
            <h4 className="text-cyan-400 font-bold text-sm mb-2 uppercase">Neural Model Switcher</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Possibilità di cambiare il motore di intelligenza (LLM) in tempo reale direttamente dalla chat del Neural Link, bypassando i default degli agenti.</p>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
            <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase">System Segregation</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">Distinzione netta tra <strong>System Core</strong> (nodi infrastrutturali protetti) e <strong>Agency Assets</strong> (team operativo), sia nella UI che nel filesystem.</p>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12">
        <a href="/docs/user-guide/missions" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Next — User Guide</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Mission Control & Operation →</p>
        </a>
      </div>
    </article>
  );
}
