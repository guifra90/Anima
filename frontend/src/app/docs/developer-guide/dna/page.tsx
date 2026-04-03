import React from 'react';
import { Terminal, ShieldCheck, Cpu, Database } from 'lucide-react';
import { Mermaid } from '@/components/Mermaid';

export default function DNAPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
          Developer Guide
        </span>
        <h1 className="text-5xl font-black tracking-tight text-white mb-4">Agent DNA</h1>
        <p className="text-xl text-zinc-400 leading-relaxed font-bold">
          Il DNA definisce chi è un agente, cosa sa fare e come deve comportarsi.
        </p>
      </div>

      <Mermaid chart={`graph TD
    DNA[AGENTS.md] --> YAML[Metadata & Directives]
    DNA --> MD[System Instructions]
    DNA --> SKILLS[Skill Set]
    style DNA fill:#2563eb,stroke:#2563eb,color:#fff
    style YAML fill:#1e1b4b,stroke:#2563eb,color:#fff
    style MD fill:#1e1b4b,stroke:#2563eb,color:#fff
    style SKILLS fill:#1e1b4b,stroke:#2563eb,color:#fff`} />

      <section className="bg-zinc-950/40 border border-white/5 rounded-3xl p-8 mb-16 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] transition-all group-hover:bg-blue-500/20" />
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Terminal size={18} className="text-blue-500" /> Struttura del file
        </h3>
        <p className="text-sm text-zinc-500 mb-6">
          Il DNA risiede in percorsi gerarchici (v4.5): 
          <code>agents/system/&lt;slug&gt;/AGENTS.md</code> per il Core, 
          <code>agents/agency/&lt;slug&gt;/AGENTS.md</code> per gli asset agnostici.
        </p>
        
        <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono text-xs text-zinc-500 overflow-x-auto leading-relaxed">
<pre className="!bg-transparent !p-0 m-0">
{`---
name: "Marianna Tutta Panna"
role: "Lead Marketer"
model_id: "google/gemini-2.0-flash-001"
is_system: false
skills: ["market_research", "slack_notify"]
---

# Identity
Sei l'esperta di marketing di ANIMA. Il tuo obiettivo è...

# Guardrails
- Non promettere mai scadenze senza consultare il PM.
- Mantieni un tono professionale ma creativo.`}
</pre>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
            <Cpu size={22} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-2 tracking-tight">System Prompt Injection</h3>
          <p className="text-sm text-zinc-500 leading-relaxed font-medium">ANIMA legge il file e inietta il contenuto direttamente nel <strong>System Message</strong> durante ogni interazione AI.</p>
        </div>
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
            <ShieldCheck size={22} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-2 tracking-tight">Validation Suite</h3>
          <p className="text-sm text-zinc-500 leading-relaxed font-medium">Ogni agente deve avere un file <code>tests/&lt;slug&gt;.test.js</code> nella propria cartella che verifica la coerenza del suo comportamento operativo.</p>
        </div>
      </div>

       <div className="flex items-center gap-6 p-1 border-t border-white/5 pt-12 mt-12">
        <a href="/docs/developer-guide/sync" className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group">
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">Next — Developer Guide</p>
            <p className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">Sync Engine & CLI →</p>
        </a>
      </div>
    </article>
  );
}
