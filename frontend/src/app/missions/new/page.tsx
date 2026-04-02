"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  User, Zap, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  role: string;
}

export default function NewMissionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mission, setMission] = useState({
    title: '',
    objective: '',
    plannerAgentId: '',
    execution_mode: 'manual' as 'manual' | 'autonomous'
  });

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
        const data = await res.json();
        if (data.agents) {
          setAgents(data.agents);
          // Auto-select CEO or first agent
          const ceo = data.agents.find((a: Agent) => a.role.toLowerCase().includes('ceo') || a.role.toLowerCase().includes('manager'));
          setMission(prev => ({ ...prev, plannerAgentId: ceo?.id || data.agents[0]?.id || '' }));
        }
      } catch (err) {
        console.error("Error fetching agents", err);
      }
    };
    fetchAgents();
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mission)
      });
      
      const data = await res.json();
      if (res.ok) {
        router.push(`/missions/${data.mission.id}`);
      } else {
        alert(`Errore: ${data.error}`);
      }
    } catch (err) {
      console.error("Error launching mission", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      <header className="max-w-3xl mx-auto mb-10 border-b border-white/[0.03] pb-10">
        <Link href="/missions" className="flex items-center gap-2 text-zinc-600 hover:text-cyan-500 transition-colors mb-8 text-[9px] font-black uppercase tracking-[0.3em] italic interactive">
            <ChevronLeft size={14} strokeWidth={3} /> BACK_TO_FLEET_CONTROL
        </Link>
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl">
              <Sparkles size={24} strokeWidth={3} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-cyan-500 font-mono text-[9px] font-black uppercase tracking-[0.4em]">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-neural-pulse" />
                INIT_ORCHESTRATION_LINK
              </div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Initialize_Sequence</h1>
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <form onSubmit={handleLaunch} className="space-y-8">
            <div className="space-y-6 control-card rounded-[2.5rem] p-10 relative overflow-hidden backdrop-blur-3xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.02] blur-[50px]" />
                
                <div className="space-y-3 relative">
                    <label className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-1 flex items-center gap-2 italic">
                      <Target size={10} className="text-cyan-600" /> MISSION_TITLE_PARAM
                    </label>
                    <input 
                        required 
                        type="text" 
                        placeholder="e.g. Q2_GROWTH_STRATEGY" 
                        className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-6 py-4 text-lg font-black italic uppercase tracking-tight focus:border-cyan-500/30 outline-none transition-all placeholder:text-zinc-900"
                        value={mission.title}
                        onChange={e => setMission({...mission, title: e.target.value})}
                    />
                </div>

                <div className="space-y-3 relative">
                    <label className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-1 flex items-center gap-2 italic">
                      <Bot size={10} className="text-cyan-600" /> PLANNER_CORTEX_SELECT
                    </label>
                    <div className="relative group">
                        <select 
                            required
                            className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-6 py-4 text-[10px] font-black uppercase tracking-widest italic leading-none focus:border-cyan-500/30 outline-none transition-all appearance-none cursor-pointer interactive"
                            value={mission.plannerAgentId}
                            onChange={e => setMission({...mission, plannerAgentId: e.target.value})}
                        >
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id} className="bg-black text-white font-mono uppercase tracking-widest">
                                    {agent.name} // {agent.role}
                                </option>
                            ))}
                        </select>
                        <User className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800 group-hover:text-cyan-500 transition-colors" size={14} />
                    </div>
                    <p className="text-[8px] text-zinc-800 italic ml-1 font-bold uppercase tracking-tight opacity-50">L'unità selezionata fungerà da orchestratore principale per la sequence.</p>
                </div>

                <div className="space-y-3 relative">
                    <label className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-1 flex items-center gap-2 italic">
                      <Search size={10} className="text-cyan-600" /> OBJECTIVE_DIRECTIVE_STREAM
                    </label>
                    <textarea 
                        required 
                        rows={4}
                        placeholder="Define strategic objectives in natural language... The AI Planner will deconstruct this into atomic tasks..." 
                        className="w-full bg-white/[0.01] border border-white/5 rounded-2xl px-6 py-5 text-[11px] font-bold leading-relaxed italic placeholder:text-zinc-900 focus:border-cyan-500/30 outline-none transition-all resize-none"
                        value={mission.objective}
                        onChange={e => setMission({...mission, objective: e.target.value})}
                    />
                    <p className="text-[8px] text-zinc-800 italic ml-1 font-bold uppercase tracking-tight opacity-50">Precisione nell'obiettivo aumenta l'accuratezza del piano d'azione neurale.</p>
                </div>

                {/* --- EXECUTION MODE SELECTOR --- */}
                <div className="space-y-5 pt-2">
                  <label className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-1 flex items-center gap-2 italic">
                    <Cpu size={10} className="text-cyan-600" /> EXECUTION_ARCHITECTURE_CORE
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMission({...mission, execution_mode: 'manual'})}
                      className={cn(
                        "p-5 rounded-2xl border transition-all text-left group relative overflow-hidden interactive",
                        mission.execution_mode === 'manual' 
                          ? "bg-white/[0.05] border-white/10" 
                          : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <User size={14} className={mission.execution_mode === 'manual' ? "text-white" : "text-zinc-800"} />
                        <span className="text-[10px] font-black italic uppercase tracking-wider">Manual_Auth</span>
                      </div>
                      <p className="text-[8px] text-zinc-700 leading-tight italic font-bold">Autorizzazione manuale richiesta per ogni singolo task della sequence.</p>
                      {mission.execution_mode === 'manual' && <div className="absolute top-2 right-4 text-cyan-700 font-black text-[6px] uppercase tracking-widest font-mono">SELECTED</div>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMission({...mission, execution_mode: 'autonomous'})}
                      className={cn(
                        "p-5 rounded-2xl border transition-all text-left group relative overflow-hidden interactive",
                        mission.execution_mode === 'autonomous' 
                          ? "bg-cyan-500/[0.03] border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.02)]" 
                          : "bg-white/[0.01] border-white/5 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <Zap size={14} className={mission.execution_mode === 'autonomous' ? "text-cyan-500" : "text-zinc-800"} />
                        <span className="text-[10px] font-black italic uppercase tracking-wider">Auto_Pilot</span>
                      </div>
                      <p className="text-[8px] text-zinc-700 leading-tight italic font-bold">Concatenamento automatico dei task fino al raggiungimento del target.</p>
                      {mission.execution_mode === 'autonomous' && (
                        <>
                          <div className="absolute top-2 right-4 text-cyan-600 font-black text-[6px] uppercase tracking-widest font-mono animate-neural-pulse">LIVE_SYNC</div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
            </div>

            <div className="flex justify-center pt-4">
                <button 
                    disabled={isSubmitting || !mission.title || !mission.objective || !mission.plannerAgentId}
                    type="submit" 
                    className="group relative flex items-center gap-4 bg-white text-black px-10 py-5 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-30 italic interactive"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                            SYNTHESIZING_ORCHESTRATION...
                        </>
                    ) : (
                        <>
                            <Send size={16} strokeWidth={3} />
                            AUTHORIZE_AND_IGNITE_SEQUENCE
                            <div className="absolute inset-0 bg-cyan-400 rounded-2xl blur-[20px] opacity-0 group-hover:opacity-30 transition-opacity" />
                        </>
                    )}
                </button>
            </div>
        </form>

        <div className="mt-20 flex flex-col items-center gap-3 text-center opacity-50">
            <Bot size={24} className="text-zinc-800" />
            <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em] max-w-sm">
                ANIMA OS — Autonomous Orchestration Layer v2
            </p>
        </div>
      </main>
    </div>
  );
}
