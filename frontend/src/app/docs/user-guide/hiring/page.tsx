import React from 'react';
import { Users, UserPlus, ShieldCheck, Briefcase } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function HiringPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
          User Guide
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Hiring & Teams</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold">
          Configura la struttura della tua agenzia gestendo i membri del team e le loro gerarchie.
        </p>
      </div>

      <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 mb-16 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-cyan-500/20" />
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic">
          <Users className="text-cyan-500" /> Il Hiring Hall
        </h2>
        <div className="space-y-6 text-zinc-400">
            <p>Il <strong>Hiring Hall</strong> è la sezione in cui puoi visualizzare tutti gli agenti attivi nella tua agenzia. Qui puoi:</p>
            
            <Mermaid chart={`graph TD
    CEO[CEO / Board] --> PM[Project Manager]
    PM --> STRAT[Strategic Planner]
    PM --> CREA[Creative Director]
    STRAT --> MKT[Marketer]
    style CEO fill:#06b6d4,stroke:#06b6d4,color:#fff
    style PM fill:#2563eb,stroke:#2563eb,color:#fff`} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-10">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all">
                    <h4 className="text-cyan-400 font-black text-xs uppercase mb-3 tracking-widest">Roster vs System Core</h4>
                    <p className="text-sm">Gli agenti sono ora divisi tra asset operativi (Roster) e infrastruttura critica (System Core), accessibili tramite tab dedicate.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all">
                    <h4 className="text-blue-400 font-black text-xs uppercase mb-3 tracking-widest">Aggiunta Dinamica</h4>
                    <p className="text-sm">Puoi creare nuovi membri del team o nuovi nodi di sistema cliccando su <code>ADD_AGENT_CORE</code> o <code>ADD_SYSTEM_NODE</code>.</p>
                </div>
            </div>
        </div>

        <div className="mt-8 p-6 bg-black/40 rounded-3xl border border-white/5">
             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Example: Team Hierarchy Config</h4>
             <pre className="text-xs text-zinc-500 font-mono leading-relaxed overflow-x-auto">
{`Agent: Creative Director
Role: Design & Branding Lead
Reports To: project-manager
Department: Marketing & Design`}
             </pre>
        </div>
      </section>

      <section className="mb-16">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <UserPlus size={18} className="text-zinc-500" /> Come aggiungere un agente
        </h3>
        <div className="space-y-6 text-zinc-500 leading-relaxed">
            <p>Aggiungere un agente è un processo in 3 passi:</p>
            <ol className="list-decimal list-inside space-y-4">
                <li><strong className="text-white">Dati Base:</strong> Inserisci il nome, il ruolo e il reparto.</li>
                <li><strong className="text-white">DNA & Prompt:</strong> Definisci il suo comportamento principale e le sue istruzioni di sistema.</li>
                <li><strong className="text-white">Hierarchy:</strong> Seleziona chi sarà il suo supervisore (es: il CEO o il Project Manager).</li>
            </ol>
        </div>
      </section>

      <div className="p-8 border border-white/10 bg-zinc-950/40 rounded-3xl mb-12">
        <h4 className="text-white font-black text-sm mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" /> Neural Guard Protection (v4.5)
        </h4>
        <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            Tutti gli agenti contrassegnati come <strong>is_system</strong> sono protetti dalla "Neural Guard". Questo significa che non possono essere eliminati accidentalmente dalla Dashboard, pur rimanendo completamente configurabili nel loro carattere e nelle loro istruzioni.
        </p>
      </div>

       <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12 text-zinc-500">
        <a href="/docs/user-guide/skills" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Next — User Guide</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Skills & Tools Overview →</p>
        </a>
      </div>
    </article>
  );
}
