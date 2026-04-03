import React from 'react';
import { RefreshCcw, Database, FileCode, AlertTriangle } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function SyncPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
          Developer Guide
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Sync Engine</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold">
          Il motore di sincronizzazione garantisce che il "DNA" (Filesystem) e il "Runtime" (Database) siano sempre allineati.
        </p>
      </div>

      <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 mb-16 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-cyan-500/20" />
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic">
          <RefreshCcw className="text-cyan-500 animate-spin-slow" /> Come funziona
        </h2>
        
        <Mermaid chart={`graph LR
    Disk[Local Disk] -->|mtime| Logic{Sync Engine}
    DB[Supabase] -->|updated_at| Logic
    Logic -->|Newer| Disk
    Logic -->|Newer| DB
    style Logic fill:#06b6d4,stroke:#06b6d4,color:#fff`} />

        <div className="space-y-6 text-zinc-400">
            <p>ANIMA utilizza una logica <strong>Bidirezionale basata su Timestamp</strong>. Ogni volta che viene eseguito il comando di sync, il sistema confronta la data di ultima modifica (<code>mtime</code>) del file locale con la data <code>updated_at</code> sul database Supabase.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-10">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all">
                    <h4 className="text-cyan-400 font-black text-xs uppercase mb-3 tracking-widest">📥 PULL (DB → Disk)</h4>
                    <p className="text-sm">Se un agente è creato o modificato dalla Dashboard, il sync lo salva in <code>agents/system/</code> o <code>agents/agency/</code> in base alla sua natura.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all">
                    <h4 className="text-blue-400 font-black text-xs uppercase mb-3 tracking-widest">🆙 PUSH (Disk → DB)</h4>
                    <p className="text-sm">Il Sync Engine scansiona ricorsivamente tutte le sottodirectory degli agenti per aggiornare i prompt su Supabase.</p>
                </div>
            </div>

            <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl">
                <h4 className="text-xs font-black text-cyan-400 uppercase mb-2 tracking-tighter">New Hierarchical Structure (v4.5)</h4>
                <ul className="text-[10px] space-y-1 mb-0">
                    <li><code>agents/system/[slug]</code> — Nodi infrastrutturali (es: system, sentinel)</li>
                    <li><code>agents/agency/[slug]</code> — Asset operativi dell'agenzia</li>
                </ul>
            </div>
        </div>
      </section>

      <section className="mb-16">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <FileCode size={18} className="text-zinc-500" /> CLI Commands
        </h3>
        <div className="space-y-6">
            <div className="bg-black/60 rounded-2xl p-6 border border-white/5 font-mono text-xs">
                <p className="text-zinc-600 mb-2"># Sincronizzazione automatica</p>
                <code className="text-white">npm run sync</code>
                
                <p className="text-zinc-600 mb-2 mt-6"># Verifica simulata (Dry Run)</p>
                <code className="text-white">npm run sync -- --dry-run</code>
            </div>

            <div className="mt-8 p-6 bg-zinc-950/60 rounded-3xl border border-white/5">
                 <h4 className="text-sm font-black text-zinc-500 underline mb-4">Example: npm run sync output</h4>
                 <pre className="text-[10px] text-emerald-500/80 font-mono leading-relaxed overflow-x-auto">
{`> anima@1.0.0 sync
> node orchestration/sync.js

🔄 Avvio sincronizzazione ANIMA Agents...

🆙 [PUSH] Aggiornamento DB per system [system/system]
📥 [PULL] Nuovo agente trovato su DB: strategy-lead [agency/strategy-lead]
✨ Sincronizzazione completata.`}
                 </pre>
            </div>
        </div>
      </section>

      <div className="p-8 border border-amber-500/20 bg-amber-500/5 rounded-3xl mb-12">
        <h4 className="text-amber-400 font-black text-sm mb-2 flex items-center gap-2">
            <AlertTriangle size={16} /> Gestione Conflitti
        </h4>
        <p className="text-xs text-zinc-500 leading-relaxed">
            In caso di modifiche simultanee, l'ultima modifica temporale vince. Ti consigliamo vivamente di effettuare un commit su Git prima di eseguire un <strong>force-pull</strong> per evitare perdite di lavoro accidentali.
        </p>
      </div>

      <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12">
        <a href="/docs/developer-guide/custom-skills" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Next — Developer Guide</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Custom Skills Development →</p>
        </a>
      </div>
    </article>
  );
}
