"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Activity,
  Cpu,
  ChevronRight,
  PlusCircle,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function MissionControl() {
  const [missions, setMissions] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeMissions: 0,
    pendingTasks: 0,
    completedTasks: 0,
    heartbeatStatus: 'online'
  });

  useEffect(() => {
    // Fetch Missions
    const fetchMissions = async () => {
      const { data } = await supabase
        .from('anima_missions')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setMissions(data);
    };

    // Fetch Approval Queue
    const fetchApprovalQueue = async () => {
      const { data } = await supabase
        .from('anima_tasks')
        .select('*, anima_agents(*)')
        .eq('status', 'in_review')
        .order('created_at', { ascending: false });
      if (data) setApprovalQueue(data);
    };

    fetchMissions();
    fetchApprovalQueue();

    // Polling per aggiornamenti real-time (visto che siamo una dashboard ОС)
    const interval = setInterval(() => {
      fetchMissions();
      fetchApprovalQueue();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-cyan-400 selection:text-black">
      
      {/* Header Dashboard */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
            <Activity size={12} /> System Status: Operational
          </div>
          <h1 className="text-5xl font-bold tracking-tighter italic bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Mission Control
          </h1>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Heartbeat</p>
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>ACTIVE</span>
            </div>
          </div>
          <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Local LLM</p>
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
               <Cpu size={14} />
               <span>DEEPSEEK-R1</span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Main Section: Missions & Queue */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Active Missions */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 italic">
                <TrendingUp size={20} className="text-cyan-400" /> Active Missions
              </h2>
              <button className="text-xs font-bold text-cyan-400 hover:text-white transition-colors flex items-center gap-1">
                VIEW ALL <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missions.length > 0 ? missions.map(mission => (
                <div key={mission.id} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:border-white/20 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {mission.status}
                    </span>
                    <span className="text-zinc-600 text-[10px] font-bold">ID: {mission.id.slice(0,8)}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{mission.title}</h3>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-6">{mission.description || 'Nessuna descrizione.'}</p>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[35%]" />
                  </div>
                </div>
              )) : (
                <div className="col-span-2 p-12 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-zinc-600">
                  <PlusCircle size={48} strokeWidth={1} className="mb-4" />
                  <p className="font-bold uppercase tracking-widest text-xs">Nessuna missione attiva</p>
                  <p className="text-[10px] mt-1">Crea una nuova missione per iniziare l'automazione.</p>
                </div>
              )}
            </div>
          </section>

          {/* Board Approval Queue */}
          <section>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6 italic">
              <CheckCircle2 size={20} className="text-emerald-500" /> Board Approval
            </h2>
            
            <div className="space-y-3">
              {approvalQueue.length > 0 ? approvalQueue.map(task => (
                <div key={task.id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-zinc-900 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                      <Clock size={20} className="text-zinc-500 group-hover:text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-none mb-1">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Assegnato a:</span>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">{task.anima_agents?.name || 'Agente Ignoto'}</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-400 transition-all">
                    REVIEW OUTPUT
                  </button>
                </div>
              )) : (
                <div className="p-8 bg-zinc-900/30 border border-white/5 rounded-2xl text-center text-zinc-600 italic text-sm">
                  Coda approvazione vuota. Tutti i task sono sincronizzati.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar: System Info & Quick Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* Quick Stats */}
          <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4">
              Agency Insights
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Missions</p>
                <p className="text-3xl font-bold italic tracking-tighter">{missions.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">In Review</p>
                <p className="text-3xl font-bold italic tracking-tighter text-emerald-500">{approvalQueue.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Agenti Hot</p>
                <div className="flex -space-x-2 mt-2">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0A0A0A] flex items-center justify-center">
                       <Users size={12} className="text-zinc-500" />
                     </div>
                   ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Uptime</p>
                <p className="text-lg font-bold text-white tracking-widest">99.9%</p>
              </div>
            </div>
          </div>

          {/* System Logs / Alerts */}
          <div className="p-8 bg-zinc-900 flex flex-col gap-4 rounded-[2.5rem] border border-white/5">
             <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-yellow-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">System Logs</span>
             </div>
             <div className="text-[10px] font-mono space-y-2 text-zinc-500">
                <p><span className="text-zinc-700">[17:42]</span> Heartbeat loop started...</p>
                <p><span className="text-zinc-700">[17:43]</span> Checking queued tasks...</p>
                <p className="text-cyan-500/50"><span className="text-zinc-700">[17:45]</span> Ollama DeepSeek-R1 responded.</p>
                <p><span className="text-zinc-700">[17:48]</span> Task 829ae shifted to IN_REVIEW.</p>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
