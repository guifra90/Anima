"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  User, Zap
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
      <header className="max-w-3xl mx-auto mb-16">
        <Link href="/missions" className="flex items-center gap-2 text-zinc-500 hover:text-cyan-400 transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.3em] font-bold">
            <ChevronLeft size={14} /> Back to Missions
        </Link>
        <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <Sparkles size={32} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter">NEW STRATEGIC MISSION</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold italic">Initializing Autonomous Orchestration</p>
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto">
        <form onSubmit={handleLaunch} className="space-y-12">
            <div className="space-y-8 bg-white/[0.02] border border-white/10 rounded-[3rem] p-12 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[80px] rounded-full" />
                
                <div className="space-y-4 relative">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Mission Title</label>
                    <input 
                        required 
                        type="text" 
                        placeholder="e.g. Q2 Growth Strategy" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-xl font-bold focus:border-cyan-400/50 outline-none transition-all placeholder:text-zinc-800"
                        value={mission.title}
                        onChange={e => setMission({...mission, title: e.target.value})}
                    />
                </div>

                <div className="space-y-4 relative">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Planning Agent (The "Brain")</label>
                    <div className="relative group">
                        <select 
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm focus:border-cyan-400/50 outline-none transition-all appearance-none cursor-pointer"
                            value={mission.plannerAgentId}
                            onChange={e => setMission({...mission, plannerAgentId: e.target.value})}
                        >
                            {agents.map(agent => (
                                <option key={agent.id} value={agent.id} className="bg-black text-white">
                                    {agent.name} — {agent.role}
                                </option>
                            ))}
                        </select>
                        <User className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-cyan-400 transition-colors" size={18} />
                    </div>
                    <p className="text-[9px] text-zinc-600 italic ml-1">L'agente selezionato utilizzerà il suo modello AI configurato per orchestrare la missione.</p>
                </div>

                <div className="space-y-4 relative">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Mission Objective</label>
                    <textarea 
                        required 
                        rows={6}
                        placeholder="Descrivi l'obiettivo strategico in linguaggio naturale. L'AI Planner selezionato scompone l'obiettivo in task atomici..." 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-sm leading-relaxed focus:border-cyan-400/50 outline-none transition-all resize-none placeholder:text-zinc-800"
                        value={mission.objective}
                        onChange={e => setMission({...mission, objective: e.target.value})}
                    />
                    <p className="text-[9px] text-zinc-600 italic ml-1">Essere chiari e specifici aiuta l'Orchestratore a definire un piano d'azione accurato.</p>
                </div>

                {/* --- EXECUTION MODE SELECTOR --- */}
                <div className="space-y-6 pt-4">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Execution Architecture</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMission({...mission, execution_mode: 'manual'})}
                      className={cn(
                        "p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
                        mission.execution_mode === 'manual' 
                          ? "bg-white/10 border-white/20 ring-1 ring-white/20" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <User size={16} className={mission.execution_mode === 'manual' ? "text-white" : "text-zinc-600"} />
                        <span className="text-xs font-black italic uppercase tracking-wider">Manual</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-relaxed italic">L'utente deve autorizzare manualmente ogni singolo task della missione.</p>
                      {mission.execution_mode === 'manual' && <div className="absolute top-2 right-4 text-cyan-400 font-black text-[8px]">ACTIVE</div>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMission({...mission, execution_mode: 'autonomous'})}
                      className={cn(
                        "p-6 rounded-3xl border transition-all text-left group relative overflow-hidden",
                        mission.execution_mode === 'autonomous' 
                          ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Zap size={16} className={mission.execution_mode === 'autonomous' ? "text-cyan-400" : "text-zinc-600"} />
                        <span className="text-xs font-black italic uppercase tracking-wider">Auto-Pilot</span>
                      </div>
                      <p className="text-[9px] text-zinc-500 leading-relaxed italic">I task vengono concatenati automaticamente. L'AI prosegue fino a obiettivo raggiunto.</p>
                      {mission.execution_mode === 'autonomous' && (
                        <>
                          <div className="absolute top-2 right-4 text-cyan-400 font-black text-[8px] animate-pulse">AUTONOMOUS</div>
                          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-cyan-400/10 blur-xl rounded-full" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button 
                    disabled={isSubmitting || !mission.title || !mission.objective || !mission.plannerAgentId}
                    type="submit" 
                    className="group relative flex items-center gap-4 bg-white text-black px-12 py-6 rounded-[2rem] font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:scale-100 italic"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            PLANNING MISSION...
                        </>
                    ) : (
                        <>
                            <Send size={20} />
                            AUTHORIZE AND LAUNCH
                            <div className="absolute inset-0 bg-cyan-400 rounded-[2rem] blur-[20px] opacity-0 group-hover:opacity-20 transition-opacity" />
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
