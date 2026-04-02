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
  Plus,
  Users,
  Workflow,
  Database,
  ShieldCheck,
  Trash2,
  Archive,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';

export default function MissionControl() {
  const [missions, setMissions] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [activeAgents, setActiveAgents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    completedTasks: 0,
    activeAgentsCount: 0,
    heartbeatStatus: 'online'
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchiveView, setIsArchiveView] = useState(false);

  useEffect(() => {
    // Fetch Missions
    const fetchMissions = async () => {
      const { data } = await supabase
        .from('anima_missions')
        .select('*, tasks:anima_tasks(status)')
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

    // Fetch Active Agents (Live Labeling)
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('anima_agents')
        .select('*, anima_missions:current_mission_id(title), anima_tasks:current_task_id(title)')
        .order('last_activity_at', { ascending: false });
      if (data) {
        setActiveAgents(data);
        setStats(prev => ({ ...prev, activeAgentsCount: data.filter(a => a.status === 'online').length }));
      }
    };

    // Fetch Recent Activity (Neural Traffic)
    const fetchRecentActivity = async () => {
      const { data } = await supabase
        .from('anima_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) setRecentActivity(data);
    };

    fetchMissions();
    fetchApprovalQueue();
    fetchAgents();
    fetchRecentActivity();

    // Polling per aggiornamenti real-time (visto che siamo una dashboard ОС)
    const interval = setInterval(() => {
      fetchMissions();
      fetchApprovalQueue();
      fetchAgents();
      fetchRecentActivity();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleDeleteMission = async (e: React.MouseEvent, missionId: string, title: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Sei sicuro di voler eliminare la missione "${title}"?`)) return;
    
    try {
      const res = await fetch(`/api/missions?id=${missionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`Missione ${title} eliminata`);
        setMissions(prev => prev.filter(m => m.id !== missionId));
      } else {
        toast.error("Errore durante l'eliminazione");
      }
    } catch (err) {
      console.error("Delete mission error", err);
      toast.error("Errore di rete");
    }
  };

  const filteredMissions = missions.filter(m => {
    const isActuallyArchived = m.status === 'completed' || m.status === 'cancelled';
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return isArchiveView ? (isActuallyArchived && matchesSearch) : (!isActuallyArchived && matchesSearch);
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
           {/* Header Dashboard - Mission Control V2 */}
      <header className="mb-12 flex justify-between items-start border-b border-white/[0.03] pb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 text-cyan-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-neural-pulse" />
            System_Core_Status: <span className="text-white">Live_Operational</span>
          </div>
          <h1 className="text-5xl font-black tracking-[-0.05em] bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent uppercase italic">
            Mission_Control
          </h1>
        </div>
        
        <div className="flex gap-3 items-center">
          <div className="hidden xl:flex items-center gap-6 px-8 py-3 bg-white/[0.01] border border-white/5 rounded-2xl mr-4 backdrop-blur-md">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Active_Nodes</span>
                <span className="text-sm font-black text-white italic">{stats.activeAgentsCount} <span className="text-[10px] text-zinc-500">AGENTS</span></span>
             </div>
             <div className="w-px h-6 bg-white/5" />
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Neural_Load</span>
                <span className="text-sm font-black text-cyan-400 italic">24.5 <span className="text-[10px] text-zinc-600">MTPS</span></span>
             </div>
          </div>

          <Link 
              href="/missions/new" 
              className="group relative flex items-center gap-3 bg-white text-black px-6 py-4 rounded-xl font-black text-[10px] hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] italic mr-2"
          >
              <Plus size={14} strokeWidth={3} />
              NEW_MISSION_CORE
          </Link>

          <div className="px-5 py-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4 hover:bg-white/[0.04] transition-all cursor-crosshair">
            <div className="flex flex-col">
              <p className="text-[7px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-0.5 leading-none">Security_Protocol</p>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] italic">
                <ShieldCheck size={12} />
                <span>ENCRYPTED_LINK</span>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h2 className="text-xl font-black flex items-center gap-3 italic uppercase tracking-tighter transition-all">
                {isArchiveView ? (
                  <>
                    <History size={20} className="text-zinc-600" /> Operational Archives
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} className="text-cyan-500" /> Operational Missions
                  </>
                )}
              </h2>
              
              <div className="flex-1 max-w-md relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder={isArchiveView ? "SEARCH_HISTORICAL_LOGS..." : "FILTER_STRATEGIC_DIRECTIVES..."} 
                  className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest placeholder:text-zinc-800 focus:border-cyan-500/30 outline-none transition-all italic"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <button 
                onClick={() => setIsArchiveView(!isArchiveView)}
                className={`text-[9px] font-black py-2.5 px-4 rounded-xl border transition-all flex items-center gap-2 tracking-[0.2em] group interactive shrink-0 ${isArchiveView ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:text-white'}`}
              >
                {isArchiveView ? 'RETURN_TO_LIVE' : 'ARCHIVE_DATA'} 
                {isArchiveView ? <ChevronRight size={12} className="rotate-180" /> : <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMissions.length > 0 ? filteredMissions.map(mission => {
                const totalTasks = mission.tasks?.length || 0;
                const completedTasks = mission.tasks?.filter((t: any) => t.status === 'completed').length || 0;
                const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                return (
                  <Link key={mission.id} href={`/missions/${mission.id}`} className="block group control-card rounded-[2rem] p-6 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Workflow size={32} />
                      </div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2.5 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest leading-none tabular-nums",
                            mission.status === 'active' ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" : "bg-zinc-900 text-zinc-600 border-white/5"
                          )}>
                            {mission.status}
                          </span>
                          {mission.status === 'active' && <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                          <button 
                            onClick={(e) => handleDeleteMission(e, mission.id, mission.title)}
                            className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 transition-all interactive"
                            title="Elimina Missione"
                          >
                            <Trash2 size={10} />
                          </button>
                          <span className="text-zinc-800 text-[8px] font-mono font-black tracking-tighter leading-none">ID_SYS://{mission.id.slice(0,6)}</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-black mb-2 group-hover:text-cyan-400 transition-colors leading-tight italic uppercase tracking-tight">{mission.title}</h3>
                      <p className="text-zinc-600 text-[11px] font-medium line-clamp-2 mb-6 leading-relaxed italic pr-6 h-8">{mission.objective || 'Null_Context_Detected'}</p>
                      
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-700 mb-1 italic">
                          <span>Sync_Level</span>
                          <span className="text-cyan-600 font-mono">{progress}.0%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="bg-gradient-to-r from-cyan-600/80 to-blue-700/80 h-full rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)]" 
                          />
                        </div>
                      </div>
                  </Link>
                );
              }) : (
                <Link href="/missions/new" className="col-span-2 group">
                  <div className="p-12 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-800 bg-white/[0.005] hover:bg-cyan-500/[0.015] hover:border-cyan-500/20 transition-all">
                    <PlusCircle size={40} strokeWidth={1} className="mb-4 opacity-10 group-hover:opacity-30 group-hover:text-cyan-400 transition-all" />
                    <p className="font-black uppercase tracking-[0.4em] text-[10px] mb-1">Null_Missions_Detected</p>
                    <p className="text-[9px] font-bold text-zinc-700 italic">Initiate Mission Core to begin.</p>
                  </div>
                </Link>
              )}
            </div>
          </section>

          {/* Board Approval Queue */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
                <CheckCircle2 size={20} className="text-emerald-500 shadow-emerald" /> Human_In_Loop
              </h2>
              <span className="px-3 py-1 bg-emerald-500/5 text-emerald-500/60 border border-emerald-500/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] italic tabular-nums">
                {approvalQueue.length} PENDING
              </span>
            </div>
            
            <div className="space-y-3">
              {approvalQueue.length > 0 ? approvalQueue.map(task => (
                <div key={task.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all hover:translate-x-0.5 interactive">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all duration-300">
                      <ShieldCheck size={18} className="text-zinc-700 group-hover:text-current" />
                    </div>
                    <div>
                      <h4 className="font-black text-[15px] italic leading-none mb-1.5 uppercase group-hover:text-emerald-400 transition-colors tracking-tight">{task.title}</h4>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] text-zinc-700 font-black uppercase tracking-widest italic">NODE:</span>
                          <span className="text-[9px] text-cyan-600 font-black uppercase tracking-tight">{task.anima_agents?.name || 'CORE'}</span>
                        </div>
                        <div className="w-1 h-1 bg-zinc-900 rounded-full" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] text-zinc-700 font-black uppercase tracking-widest italic">TASK_STATE:</span>
                          <span className="text-[8px] text-rose-500 font-black uppercase tracking-widest animate-pulse italic">AWAITING_REVIEW</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link href={`/missions/${task.mission_id}`} className="px-5 py-2.5 bg-white text-black rounded-xl font-black text-[9px] italic hover:bg-emerald-400 active:scale-95 transition-all uppercase tracking-widest shadow-lg">
                    EXECUTE_REVIEW
                  </Link>
                </div>
              )) : (
                <div className="py-12 border border-dashed border-white/5 rounded-[2rem] text-center text-zinc-800 italic font-black uppercase tracking-widest text-[9px]">
                  _Approval_Queue_Synchronized_
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar: Live Workforce */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className="control-card rounded-[2rem] p-6 relative overflow-hidden h-fit">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <Users size={40} />
             </div>
             
             <h2 className="text-[10px] font-black italic uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-zinc-500">
                <Users size={14} className="text-cyan-500" /> LIVE_WORKFORCE_MONITOR
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-neural-pulse ml-auto" />
             </h2>

             <div className="space-y-5">
                {(activeAgents || []).map(agent => {
                   const lifecycle = (() => {
                      if (agent.current_task_id) return { label: agent.current_phase || 'PROCESSING', color: 'cyan', pulse: true };
                      if (agent.status === 'offline') return { label: 'OFFLINE', color: 'rose', pulse: false };
                      if (agent.last_activity_at) {
                        const lastActive = new Date(agent.last_activity_at).getTime();
                        const now = new Date().getTime();
                        if (now - lastActive > 60 * 60 * 1000) return { label: 'DORMANT', color: 'zinc', pulse: false };
                      }
                      return { label: 'READY_SYNC', color: 'emerald', pulse: false };
                   })();

                   const colorMap: Record<string, string> = {
                      cyan: 'bg-cyan-500',
                      emerald: 'bg-emerald-500',
                      rose: 'bg-rose-500',
                      zinc: 'bg-zinc-800'
                   };

                   const textMap: Record<string, string> = {
                      cyan: 'text-cyan-500',
                      emerald: 'text-emerald-500',
                      rose: 'text-rose-500',
                      zinc: 'text-zinc-700'
                   };

                   return (
                    <div key={agent.id} className="flex items-center justify-between group interactive">
                       <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${agent.current_task_id ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 'bg-white/[0.02] border-white/5 text-zinc-700'}`}>
                             <Cpu size={14} className={agent.current_task_id ? 'animate-pulse' : ''} />
                          </div>
                          <div className="flex flex-col min-w-0">
                             <p className="text-[10px] font-black italic uppercase text-zinc-200 group-hover:text-cyan-400 transition-colors leading-none mb-1.5">{agent.name}</p>
                             <div className="flex items-center gap-2">
                                <div className={`w-1 h-1 rounded-full ${colorMap[lifecycle.color]} ${lifecycle.pulse ? 'animate-neural-pulse' : ''}`} />
                                <p className={`text-[7px] font-black uppercase tracking-widest ${textMap[lifecycle.color]}`}>
                                   {lifecycle.label}
                                </p>
                                {agent.current_task_id && (
                                   <span className="text-[6px] text-zinc-800 font-black animate-pulse uppercase ml-1">_UPLINK_STABLE_</span>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       {agent.current_task_id && (
                          <div className="flex flex-col items-end">
                             <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[6px] font-black uppercase tracking-widest text-cyan-500 mb-1">
                                ACTIVE
                             </div>
                             <p className="text-[6px] text-zinc-700 font-mono opacity-60 leading-none truncate max-w-[80px]">
                                {agent.anima_tasks?.title}
                             </p>
                          </div>
                       )}
                    </div>
                   );
                })}
                {(!activeAgents || activeAgents.length === 0) && (
                  <div className="p-10 text-center opacity-10 italic font-black text-[9px] uppercase tracking-[0.3em]">
                    _NULL_RESOURCES_
                  </div>
                )}
             </div>

             <div className="mt-8 pt-6 border-t border-white/[0.03]">
                <Link href="/team" className="w-full py-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-center gap-3 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white hover:bg-white/5 transition-all group interactive">
                   ACCESS_ROSTER <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
             </div>
          </section>

          {/* Neural Traffic Log - Live Stream */}
          <section className="bg-[#080808]/80 border border-white/[0.03] rounded-[2rem] p-6 backdrop-blur-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity size={40} className="text-cyan-500" />
             </div>
             
             <h2 className="text-[10px] font-black italic uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-zinc-500">
                <Database size={14} /> LIVE_NEURAL_TRAFFIC
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse ml-auto" />
             </h2>

             <div className="space-y-4 font-mono">
                {recentActivity.length > 0 ? recentActivity.map(msg => (
                  <div key={msg.id} className={`flex gap-3 text-[9px] font-bold border-l-2 pl-3 py-0.5 transition-all hover:bg-white/[0.01] ${msg.role === 'user' ? 'border-zinc-700 text-zinc-500' : 'border-cyan-500/40 text-zinc-400'}`}>
                    <span className="text-zinc-700 tabular-nums">[{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="uppercase tracking-tighter truncate">
                      {msg.role === 'assistant' && <span className="text-cyan-800 mr-2 italic">AGENT_SIGNAL_INCOMING</span>}
                      {msg.content.slice(0, 80)}...
                    </span>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-20 italic font-black text-[10px] uppercase tracking-widest">
                    _NO_TRAFFIC_DETECTED_
                  </div>
                )}
             </div>
          </section>
        </div>

      </div>

    </div>
  );
}
