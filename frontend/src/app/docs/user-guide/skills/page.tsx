import { Zap, Globe, Cpu, ShieldCheck } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function SkillsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-6">
          User Guide
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Skills & Tools</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold">
          Potenzia i tuoi agenti fornendo loro nuovi strumenti operativi per agire nel mondo reale.
        </p>
      </div>

      <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 mb-16 relative group overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-cyan-500/20" />
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 italic">
          <Zap className="text-cyan-500" /> Capabilities Overview
        </h2>
        <div className="space-y-6 text-zinc-400">
            <p>In ANIMA, una <strong>Skill</strong> è una capacità specifica che può essere assegnata a uno o più agenti. Senza skill, gli agenti possono solo "pensare" e "parlare". Con le skill, possono <strong>fare</strong>.</p>
            
            <Mermaid chart={`graph LR
    Agent[Agent DNA] -->|Request| Tool{Skill Engine}
    Tool -->|Call| API[External API]
    API -->|Data| Tool
    Tool -->|Result| Agent
    style Tool fill:#06b6d4,stroke:#06b6d4,color:#fff
    style API fill:#1e1b4b,stroke:#06b6d4,color:#fff`} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-10">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 transition-all">
                    <h4 className="text-cyan-400 font-black text-xs uppercase mb-3 tracking-widest flex items-center gap-2">
                        <Globe size={14} /> External Tools
                    </h4>
                    <p className="text-sm">Integrazioni con software terzi come Scoro, Google Calendar, Slack e Gmail.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-all">
                    <h4 className="text-blue-400 font-black text-xs uppercase mb-3 tracking-widest flex items-center gap-2">
                        <Cpu size={14} /> Data Tools
                    </h4>
                    <p className="text-sm">Capacità di analisi dati, accesso a database vettoriali e ricerca web in tempo reale.</p>
                </div>
            </div>
        </div>

        <div className="mt-8 p-6 bg-black/40 rounded-3xl border border-white/5">
             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Example: Skill Definition (JSON)</h4>
             <pre className="text-xs text-blue-400/80 font-mono leading-relaxed overflow-x-auto">
{`{
  "name": "send_slack_message",
  "description": "Invia un messaggio a un canale Slack specifico",
  "parameters": {
    "channel": "string",
    "text": "string"
  }
}`}
             </pre>
        </div>
      </section>

      <section className="mb-16">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <ShieldCheck size={18} className="text-zinc-500" /> Assegnazione Skill
        </h3>
        <div className="space-y-6 text-zinc-500 leading-relaxed font-medium">
            <p>Per assegnare una nuova skill a un membro del team:</p>
            <ol className="list-decimal list-inside space-y-4">
                <li>Naviga al <strong>Agent Hub</strong> o al <strong>Hiring Hall</strong>.</li>
                <li>Seleziona l'agente desiderato.</li>
                <li>Nel pannello di configurazione, seleziona le skill attive dall'elenco.</li>
                <li>Salva le modifiche.</li>
            </ol>
            <p className="mt-4 italic">Se sei uno sviluppatore e vuoi creare una nuova skill personalizzata, consulta la <a href="/docs/developer-guide/custom-skills" className="text-cyan-500">Developer Guide</a>.</p>
        </div>
      </section>

       <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12 text-zinc-500">
        <a href="/docs/developer-guide/dna" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Coming Next — Developer Guide</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Agent DNA & Systems →</p>
        </a>
      </div>
    </article>
  );
}
