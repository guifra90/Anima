import React from 'react';
import { Shield, Zap, Database, Globe } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function IntroPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
          Getting Started
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Introduction</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold italic">
          Benvenuto in ANIMA OS. Questa documentazione ti guiderà nella comprensione dell'unico sistema operativo al mondo progettato per gestire agenzie decentralizzate governate da AI.
        </p>
      </div>

      <section className="mb-16">
        <h2 className="text-2xl font-black text-white mb-6">I Tre Pilastri</h2>
        
        <Mermaid chart={`graph TD
    P1[Human Sovereignty] --- P2[Mirror Data]
    P2 --- P3[Portable DNA]
    style P1 fill:#06b6d4,stroke:#06b6d4,color:#fff
    style P2 fill:#2563eb,stroke:#2563eb,color:#fff
    style P3 fill:#4f46e5,stroke:#4f46e5,color:#fff`} />

        <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <Shield className="text-cyan-500 shrink-0" />
                <div>
                    <h4 className="text-white font-bold mb-1">Human Sovereignty</h4>
                    <p className="text-sm text-zinc-500">Gli agenti non "scappano". Ogni missione risponde a un obiettivo <strong>board-approved</strong> e a limiti di budget insuperabili.</p>
                </div>
            </div>
            <div className="flex gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <Database className="text-blue-500 shrink-0" />
                <div>
                    <h4 className="text-white font-bold mb-1">Mirror Data Integration</h4>
                    <p className="text-sm text-zinc-500">ANIMA non lavora nel vuoto. È integrata nativamente con <strong>Scoro</strong>, <strong>Google</strong> e <strong>Slack</strong> per operare nel mondo reale.</p>
                </div>
            </div>
            <div className="flex gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <Globe className="text-indigo-500 shrink-0" />
                <div>
                    <h4 className="text-white font-bold mb-1">Portable Agency DNA</h4>
                    <p className="text-sm text-zinc-500">Il layout dei tuoi team e la logica degli agenti sono memorizzati in file <strong>Markdown standard</strong>, rendendo la tua azienda trasferibile e autonoma.</p>
                </div>
            </div>
        </div>
      </section>

      <section className="bg-cyan-500/5 border border-cyan-500/10 rounded-3xl p-8 mb-16">
        <h3 className="text-cyan-400 font-black text-sm mb-4 uppercase tracking-widest">Quick Start</h3>
        <p className="text-zinc-400 leading-relaxed mb-6">Sei pronto a lanciare la tua prima missione? Ecco come iniziare:</p>
        <ul className="list-decimal list-inside space-y-4 text-zinc-300 font-medium">
            <li>Vai alla <a href="/" className="text-cyan-400 underline underline-offset-4 decoration-cyan-500/30">Missions Control</a>.</li>
            <li>Seleziona un <strong>Planner Agent</strong> (solitamente <code>strategic-planner</code>).</li>
            <li>Inserisci l'obiettivo strategico per la missione.</li>
            <li>Monitora l'attività della "Neural Net" degli agenti in tempo reale.</li>
        </ul>
      </section>

      <div className="p-8 rounded-3xl border border-white/5 bg-zinc-900/50 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
            <p className="text-lg font-bold text-white mb-1 tracking-tight">Need help development-side?</p>
            <p className="text-sm text-zinc-500">Learn how ANIMA handles agent definitions and sync engine.</p>
        </div>
        <a href="/docs/developer-guide/dna" className="px-6 py-3 rounded-xl bg-white text-black font-black text-xs uppercase hover:bg-cyan-400 transition-colors">
            Developer Docs
        </a>
      </div>
    </article>
  );
}
