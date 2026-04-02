import React from 'react';
import { Target, Users, Play, AlertCircle } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function MissionsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
          User Guide
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Mission Control</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold italic">
          Le missioni sono il cuore pulsante di ANIMA. Sono l'unico modo per far "lavorare" la tua agenzia.
        </p>
      </div>

      <section className="space-y-8">
        <p className="text-zinc-500 leading-relaxed">
          In ANIMA, una <strong>Missione</strong> non è solo un task. È un obiettivo di alto livello che richiede il coordinamento di più agenti. 
          Il processo segue una struttura rigorosa in 4 fasi:
        </p>

        <Mermaid chart={`graph TD
    A[Definition] --> B[Planning]
    B --> C[Execution]
    C --> D[Reporting]
    D --> E[Human Review]
    style A fill:#06b6d4,stroke:#06b6d4,color:#fff
    style B fill:#2563eb,stroke:#2563eb,color:#fff
    style C fill:#4f46e5,stroke:#4f46e5,color:#fff
    style D fill:#7c3aed,stroke:#7c3aed,color:#fff`} />

        <div className="space-y-12 my-16">
          <div className="flex gap-8 relative">
            <div className="absolute left-6 top-12 w-px h-full bg-white/5" />
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 z-10">
              <Target size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mt-2">1. Definire l'Obiettivo</h3>
              <p className="text-zinc-500 mt-2 leading-relaxed">Inserisci un obiettivo chiaro. Esempio: <em>"Analizza il mercato dei beni di lusso a Milano e proponi una strategia social per Bulgari Q3"</em>.</p>
            </div>
          </div>

          <div className="flex gap-8 relative">
            <div className="absolute left-6 top-12 w-px h-full bg-white/5" />
             <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 z-10">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mt-2">2. Scegliere il Planner</h3>
              <p className="text-zinc-500 mt-2 leading-relaxed">Seleziona l'agente che "penserà" alla strategia. Questo agente non farà il lavoro sporco, ma creerà la lista di task per gli altri.</p>
            </div>
          </div>

          <div className="flex gap-8 relative">
             <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center shrink-0 z-10">
              <Play size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mt-2">3. Esecuzione</h3>
              <p className="text-zinc-500 mt-2 leading-relaxed">
                Una volta lanciata, la missione compare nel tab <strong>Active Missions</strong>. Potrai vedere i task comparire uno ad uno sotto forma di record <code>anima_tasks</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-black/40 rounded-3xl p-8 border border-white/5">
             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Example: Mission Plan JSON</h4>
             <pre className="text-xs text-cyan-500/80 font-mono leading-relaxed overflow-x-auto">
{`{
  "mission_id": "bulgari-q3-strategy",
  "status": "in_progress",
  "tasks": [
    { "id": "t1", "agent": "marketer", "action": "market_research", "params": { "location": "Milano" } },
    { "id": "t2", "agent": "creative-director", "action": "asset_creation", "depends_on": "t1" }
  ]
}`}
             </pre>
        </div>
      </section>

      <section className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl mb-16">
        <h4 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-cyan-500" /> Modalità Operative
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
                <p className="text-cyan-400 font-black text-xs uppercase mb-2">Manual Mode</p>
                <p className="text-sm text-zinc-500">I task generati dal Planner devono essere approvati dalla Board umana prima di essere eseguiti.</p>
            </div>
            <div>
                <p className="text-blue-400 font-black text-xs uppercase mb-2">Autonomous Mode</p>
                <p className="text-sm text-zinc-500">ANIMA esegue i task non appena sono pronti, scalando verso l'umano solo in caso di errore critico o fine budget.</p>
            </div>
        </div>
      </section>

      <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12">
        <a href="/docs/developer-guide/dna" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Coming Next — Developer Guide</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Agent DNA & Systems →</p>
        </a>
      </div>
    </article>
  );
}
