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
  Users,
  Workflow,
  Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Dashboard */}
      <header className="mb-16 flex justify-between items-end border-b border-white/[0.03] pb-10">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            System Status: <span className="text-white">Operational</span>
          </div>
          <h1 className="text-6xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent uppercase">
            Mission Control
          </h1>
        </div>
        
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl flex items-center gap-4 hover:bg-white/[0.04] transition-all">
            <div className="flex flex-col">
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Mirror Heartbeat</p>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-xs">
                <span>ONLINE_STABLE</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-3xl flex items-center gap-4 hover:bg-white/[0.04] transition-all">
            <div className="flex flex-col">
               <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Neural Engine</p>
               <div className="flex items-center gap-2 text-cyan-400 font-black text-xs uppercase">
                  <Cpu size={14} className="text-cyan-500" />
                  <span>DeepSeek_R1_Pro</span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-10">
        
        {/* Main Section: Missions & Queue */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          
          {/* Active Missions */}
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3 italic uppercase tracking-tight">
                <TrendingUp size={24} className="text-cyan-500" /> Active Missions
              </h2>
              <button className="text-[10px] font-black text-zinc-500 hover:text-cyan-400 transition-all flex items-center gap-2 tracking-[0.2em]">
                GLOBAL_ARCHIVE <ChevronRight size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {missions.length > 0 ? missions.map(mission => (
                <Link key={mission.id} href={`/missions/${mission.id}`} className="block group">
                  <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] group-hover:bg-white/[0.04] group-hover:border-cyan-500/30 transition-all group relative overflow-hidden h-full shadow-lg">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Workflow size={40} />
                    </div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="px-3 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
                        {mission.status}
                      </span>
                      <span className="text-zinc-700 text-[9px] font-black tracking-widest italic leading-none">#{mission.id.slice(0,8)}</span>
                    </div>
                    <h3 className="text-2xl font-black mb-3 group-hover:text-cyan-400 transition-colors leading-tight italic uppercase">{mission.title}</h3>
                    <p className="text-zinc-500 text-sm font-bold line-clamp-2 mb-8 leading-relaxed italic pr-6">{mission.description || 'Nessuna specifica di missione rilevata.'}</p>
                    
                    <div className="space-y-3 mt-auto">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 italic">
                        <span>ORCHESTRATION_LEVEL</span>
                        <span className="text-cyan-500">65%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          className="bg-gradient-to-r from-cyan-600 to-indigo-600 h-full rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )) : (
                <div className="col-span-2 p-16 border border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center text-zinc-700 bg-white/[0.01]">
                  <PlusCircle size={56} strokeWidth={1} className="mb-6 opacity-20" />
                  <p className="font-black uppercase tracking-[0.3em] text-[11px] mb-2">Null_Missions_Detected</p>
                  <p className="text-[10px] font-bold text-zinc-600 italic">Initiate new orchestration sequence to begin.</p>
                </div>
              )}
            </div>
          </section>

          {/* Board Approval Queue */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3 italic uppercase tracking-tight">
                <CheckCircle2 size={24} className="text-emerald-500" /> Board Approval
              </h2>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                Priority_Queue
              </span>
            </div>
            
            <div className="space-y-4">
              {approvalQueue.length > 0 ? approvalQueue.map(task => (
                <div key={task.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-white/[0.04] transition-all hover:translate-x-1">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-300">
                      <Clock size={20} className="text-zinc-500 group-hover:text-current" />
                    </div>
                    <div>
                      <h4 className="font-black text-base italic leading-none mb-2">{task.title}</h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">AGENT:</span>
                          <span className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">{task.anima_agents?.name || 'GENERIC_CORE'}</span>
                        </div>
                        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">STATUS:</span>
                          <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest italic">PENDING_REVIEW</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[.2em] rounded-xl hover:bg-cyan-500 hover:text-white transition-all shadow-xl shadow-black/20">
                    REVIEW_CMD
                  </button>
                </div>
              )) : (
                <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center text-zinc-700 italic font-black uppercase tracking-widest text-[10px]">
                  Approval_Queue_Synchronized // No_Actions_Required
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar: System Info & Quick Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          
          {/* Quick Stats */}
          <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Database size={100} />
            </div>
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
              <div className="w-1 h-3 bg-cyan-500" /> Agency Insights
            </h3>
            
            <div className="grid grid-cols-2 gap-10">
              <div>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 italic">Active_Missions</p>
                <p className="text-4xl font-black italic tracking-tighter text-white">{missions.length}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 italic">Review_Buffer</p>
                <p className="text-4xl font-black italic tracking-tighter text-emerald-500">{approvalQueue.length}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-3 italic">Active_Presence</p>
                <div className="flex -space-x-3 mt-1">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="w-10 h-10 rounded-2xl bg-zinc-900 border-2 border-[#050505] flex items-center justify-center shadow-lg group hover:-translate-y-1 transition-transform cursor-pointer overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent" />
                       <Users size={16} className="text-zinc-600 group-hover:text-cyan-400" />
                     </div>
                   ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-2 italic">System_Uptime</p>
                <p className="text-xl font-black text-white tracking-[0.2em]">99.99<span className="text-cyan-500">%</span></p>
              </div>
            </div>
          </div>

          {/* System Logs / Alerts */}
          <div className="p-10 bg-black flex flex-col gap-6 rounded-[3rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
             <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                   <AlertCircle size={18} className="text-cyan-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Telemetry_Stream</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan] animate-pulse" />
             </div>
             <div className="text-[10px] font-mono space-y-3 text-zinc-600 leading-relaxed">
                <p><span className="text-zinc-800 mr-2">17:42:01</span> {'>'} Internal_Bridge_SMR initialized.</p>
                <p><span className="text-zinc-800 mr-2">17:43:15</span> {'>'} Syncing_Local_Registry with Supabase_Cloud...</p>
                <p className="text-cyan-500/70"><span className="text-zinc-800 mr-2">17:45:22</span> {'>'} Neural_Link established via DeepSeek_R1.</p>
                <p><span className="text-zinc-800 mr-2">17:48:09</span> {'>'} Task_Sequence_09X shifted to BOARD_REVIEW.</p>
                <p className="animate-pulse text-zinc-800 uppercase font-black tracking-widest text-[9px] mt-4">_awaiting_next_signal_</p>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
