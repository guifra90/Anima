import React from 'react';
import { Terminal, Database, Code, ShieldCheck } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function CustomSkillsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
          Developer Guide
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Custom Skills</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold">
          Estendi le capacità operative dei tuoi agenti creando nuovi moduli di esecuzione.
        </p>
      </div>

      <Mermaid chart={`graph LR
    Dev[Developer] -->|Write| Code[Skill Logic]
    Code -->|Define| Meta[SKILL.md]
    Meta -->|Load| Engine[ANIMA Skill Engine]
    Engine -->|Register| Agent[Agent Portfolio]
    style Dev fill:#06b6d4,stroke:#06b6d4,color:#fff
    style Code fill:#2563eb,stroke:#2563eb,color:#fff`} />

      <section className="bg-zinc-950/40 border border-white/5 rounded-3xl p-8 mb-16 overflow-hidden relative group">
        <p className="text-sm text-zinc-500 leading-relaxed mb-6">In ANIMA, una <strong>Skill</strong> è un'unità atomica di codice che un agente può invocare (es. inviare un'email, interrogare Scoro). Le skill sono agnostiche rispetto all'agente: puoi assegnare la stessa skill a più membri del team.</p>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Code size={18} className="text-cyan-500" /> Sviluppo in 3 Passi
        </h3>
        
        <div className="space-y-12 my-12">
            <div className="flex gap-6 relative">
                 <div className="absolute left-6 top-10 w-px h-full bg-white/5" />
                 <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 z-10 font-black text-cyan-500">1</div>
                 <div>
                    <h4 className="text-white font-bold mb-1">Identificazione Categoria</h4>
                    <p className="text-xs text-zinc-500">Crea la directory in <code>skills/&lt;category&gt;/&lt;slug&gt;/</code>. Le categorie standard sono: <code>operational</code>, <code>ai</code>, <code>custom</code>.</p>
                 </div>
            </div>

            <div className="flex gap-6 relative">
                 <div className="absolute left-6 top-10 w-px h-full bg-white/5" />
                 <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 z-10 font-black text-blue-500">2</div>
                 <div>
                    <h4 className="text-white font-bold mb-1">Definizione Istruzioni</h4>
                    <p className="text-xs text-zinc-500">Scrivi il file <code>SKILL.md</code> con i metadati YAML e le istruzioni per l'LLM su come "capire" e usare il nuovo tool.</p>
                 </div>
            </div>

            <div className="flex gap-6 relative">
                 <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 z-10 font-black text-indigo-500">3</div>
                 <div>
                    <h4 className="text-white font-bold mb-1">Implementazione Esecuzione</h4>
                    <p className="text-xs text-zinc-500">Scrivi il codice logico in <code>execution/&lt;category&gt;/&lt;slug&gt;.js</code>. Qui avviene l'integrazione API reale.</p>
                 </div>
            </div>
        </div>

        <div className="mt-8 p-6 bg-black/40 rounded-3xl border border-white/5">
             <h4 className="text-sm font-black text-zinc-500 underline mb-4">Example: SKILL.md Spec</h4>
             <pre className="text-xs text-indigo-400 font-mono leading-relaxed overflow-x-auto">
{`---
name: "gmail_reply"
description: "Risponde a un thread di email esistente"
params:
  threadId: "id del thread"
  body: "contenuto della risposta"
---
# Instructions
Usa questa skill solo se hai il threadId confermato. 
Il tono deve essere cordiale.`}
             </pre>
        </div>
      </section>

      <div className="p-8 bg-zinc-900 border border-white/10 rounded-3xl mb-16 shadow-2xl overflow-hidden group">
        <h4 className="text-lg font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
             <ShieldCheck className="text-cyan-500" /> Best Practices
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed">
            <div className="text-zinc-500">
                <strong className="text-white">Validation First:</strong> Sanitizza sempre l'input che ricevi dall'LLM prima di inviarlo alle API esterne.
            </div>
            <div className="text-zinc-500">
                <strong className="text-white">Portability:</strong> Non inserire chiavi API hard-coded. Usa sempre <code>process.env</code>.
            </div>
        </div>
      </div>

      <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12">
        <a href="/docs" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Back — Overview</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Return to Documentation Hub →</p>
        </a>
      </div>
    </article>
  );
}
