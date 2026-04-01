"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  Cpu, User, Calendar, Play, Pause, Square, ExternalLink, Activity, Zap,
  RotateCcw, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { listMessagesByMission } from '@/lib/anima';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  execution_mode?: 'manual' | 'autonomous';
  created_at: string;
}

interface Task {
  id: string;
  mission_id: string;
  agent_id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'blocked';
  result?: string;
  order_index: number;
}

interface Message {
  id: string;
  agent_id: string;
  role: string;
  content: string;
  created_at: string;
  metadata?: any;
}

export default function MissionDetailPage() {
  const { id } = useParams();
  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);
  const [isStreamOpen, setIsStreamOpen] = useState(true);

  const fetchMissionData = useCallback(async () => {
    try {
      const resp = await fetch(`/api/missions/${id}`); 
      const data = await resp.json();
      if (data.mission) {
        setMission(data.mission);
      } else {
        console.error("Mission not found", data.error);
        setMission(null);
      }

      const tResp = await fetch(`/api/tasks?mission_id=${id}`);
      const tData = await tResp.json();
      if (tData.tasks) {
        setTasks(tData.tasks);
      }

      // Fetch initial messages
      const msgs = await listMessagesByMission(id as string);
      setMessages(msgs);
    } catch (err) {
      console.error("Error fetching mission details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchMissionData();

    // --- REALTIME SUBSCRIPTIONS ---
    
    // 1. Listen for new messages (Neural Stream)
    const messageChannel = supabase
      .channel(`mission-messages-${id}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'anima_messages',
          filter: `mission_id=eq.${id}` 
      }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    // 2. Listen for task updates (Status, Results)
    const taskChannel = supabase
      .channel(`mission-tasks-${id}`)
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'anima_tasks',
          filter: `mission_id=eq.${id}` 
      }, (payload) => {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(taskChannel);
    };
  }, [id, fetchMissionData]);

  // Auto-scroll Neural Stream
  useEffect(() => {
    const stream = document.getElementById('neural-stream-bottom');
    if (stream) {
      stream.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const runTask = useCallback(async (taskId: string) => {
    setExecutingTaskId(taskId);
    try {
      const res = await fetch('/api/tasks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      
      const data = await res.json();
      if (!res.ok) {
        alert(`Errore esecuzione: ${data.error}`);
      }
    } catch (err) {
      console.error("Error running task", err);
    } finally {
      setExecutingTaskId(null);
    }
  }, []);

  // --- AUTO-PILOT IGNITION SYSTEM ---
  // If autonomous and no task is running, start the first pending task
  useEffect(() => {
    if (!mission || mission.execution_mode !== 'autonomous' || tasks.length === 0 || loading || executingTaskId) return;

    const isAnyRunning = tasks.some(t => t.status === 'running');
    if (isAnyRunning) return;

    // Find the first task that is pending (sequential order)
    const nextTask = [...tasks]
      .sort((a, b) => a.order_index - b.order_index)
      .find(t => t.status === 'pending');

    if (nextTask) {
      console.log("[Auto-Pilot] Autonomous Ignition: Starting task", nextTask.id);
      runTask(nextTask.id);
    }
  }, [mission, tasks, loading, executingTaskId, runTask]);

  const updateTaskStatus = async (taskId: string, status: string) => {
    setIsUpdating(true);
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status })
      });
      // Realtime will update the list
    } catch (err) {
      console.error("Error updating task status", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleExecutionMode = async () => {
    if (!mission) return;
    const newMode = mission.execution_mode === 'autonomous' ? 'manual' : 'autonomous';
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('anima_missions')
        .update({ execution_mode: newMode })
        .eq('id', id);
      
      if (error) throw error;
      setMission({ ...mission, execution_mode: newMode });
    } catch (err) {
      console.error("Error toggling execution mode", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelMission = async () => {
    if (!confirm("Sei sicuro di voler cancellare questa missione?")) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('anima_missions')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      setMission(prev => prev ? ({ ...prev, status: 'cancelled' }) : null);
    } catch (err) {
      console.error("Error cancelling mission", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const restartMission = async () => {
    if (!confirm("Questo resetterà tutti i task e riavvierà l'Auto-Pilot. Continuare?")) return;
    setIsUpdating(true);
    try {
      // 1. Reset mission status
      const { error: mError } = await supabase
        .from('anima_missions')
        .update({ status: 'active' })
        .eq('id', id);
      
      if (mError) throw mError;

      // 2. Clear task progress and reset to pending
      const { error: tError } = await supabase
        .from('anima_tasks')
        .update({ 
          status: 'pending', 
          result: null 
        })
        .eq('mission_id', id);
      
      if (tError) throw tError;

      // Refresh local state will be handled by Realtime for tasks, 
      // but we update mission immediately
      setMission(prev => prev ? ({ ...prev, status: 'active' }) : null);
    } catch (err) {
      console.error("Error restarting mission", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-cyan-400 animate-spin" size={40} />
      </div>
    );
  }

  if (!mission) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-2xl font-black italic">MISSION NOT FOUND</h1>
            <p className="text-zinc-500 max-w-sm mt-2">La missione richiesta non è presente nel database o l'ID non è corretto.</p>
            <Link href="/missions" className="mt-8 text-cyan-400 font-bold uppercase text-[10px] tracking-widest border border-cyan-400/20 px-6 py-3 rounded-xl hover:bg-cyan-400 hover:text-black transition-all">Back to Fleet Control</Link>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-sans">
      
      {/* --- TOP BAR / BREADCRUMBS --- */}
      <header className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-3xl sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group">
            <ChevronLeft size={20} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
          </Link>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white italic uppercase">{mission.title}</h1>
              <span className={cn(
                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg",
                mission.status === 'active' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              )}>
                  {mission.status}
              </span>
            </div>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] mt-1">
              ORCHESTRATION_ID: <span className="text-zinc-400 italic">#{id?.slice(0, 12)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleExecutionMode}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-wider",
              mission.execution_mode === 'autonomous' 
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]" 
                : "bg-white/5 border-white/10 text-zinc-500 hover:border-white/20"
            )}
          >
            {mission.execution_mode === 'autonomous' ? (
              <Zap size={12} className="fill-current animate-pulse" />
            ) : (
              <User size={12} />
            )}
            {mission.execution_mode === 'autonomous' ? 'Auto-Pilot On' : 'Manual Mode'}
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-bold text-zinc-400">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span className="text-zinc-200">{tasks.filter(t => t.status === 'completed').length}</span>
            <span className="text-zinc-600">/</span>
            <span>{tasks.length}</span>
          </div>
          <button 
            onClick={() => setIsStreamOpen(!isStreamOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-wider",
              isStreamOpen ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-white/5 border-white/10 text-zinc-500"
            )}
          >
            <Activity size={12} className={isStreamOpen ? 'animate-pulse' : ''} />
            Stream
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={restartMission}
              disabled={isUpdating}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
              title="Restart Mission"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={cancelMission}
              disabled={isUpdating}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Cancel Mission"
            >
              <XCircle size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* --- MAIN WORKSPACE --- */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Objective Summary */}
            <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles size={80} />
                </div>
                <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_cyan]" /> Mission Objective
                </h3>
                <p className="text-xl text-zinc-400 leading-relaxed italic font-black uppercase tracking-tight">
                  "{mission.objective}"
                </p>
            </section>

            {/* Task Timeline */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <LayoutDashboard size={10} /> Task Execution Plan
                </h3>
              </div>

              <div className="space-y-2 relative">
                <AnimatePresence mode="popLayout">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border border-white/5 bg-white/[0.01] rounded-xl text-center">
                            <Loader2 className="animate-spin text-zinc-800 mb-2" size={24} />
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">Synthesizing Orchestration...</p>
                        </div>
                    ) : tasks.map((task, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            key={task.id}
                            className={cn(
                              "group border rounded-[2rem] transition-all duration-300 overflow-hidden shadow-lg",
                              task.status === 'running' ? "bg-cyan-500/[0.04] border-cyan-500/30 ring-1 ring-cyan-500/20" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                            )}
                        >
                            <div className="p-6 flex items-center gap-6">
                                {/* Compact Status Node */}
                                <div className={cn(
                                  "shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300",
                                  task.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20" : 
                                  task.status === 'running' ? "bg-cyan-500/20 border-cyan-500/40 animate-pulse" : 
                                  "bg-white/5 border-white/10"
                                )}>
                                    {task.status === 'completed' ? (
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    ) : task.status === 'running' ? (
                                        <Activity size={18} className="text-cyan-400" />
                                    ) : (
                                        <span className="text-xs font-black text-zinc-500 italic">0{idx + 1}</span>
                                    )}
                                </div>

                                {/* Task Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className={cn(
                                      "text-sm font-bold tracking-tight italic",
                                      task.status === 'completed' ? "text-zinc-500 line-through" : "text-white"
                                    )}>
                                      {task.title}
                                    </h4>
                                    <div className={cn(
                                      "px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border",
                                      task.status === 'completed' ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/60" :
                                      task.status === 'running' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" :
                                      "bg-zinc-800 border-white/5 text-zinc-500"
                                    )}>
                                      {task.status}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-cyan-500/50 uppercase tracking-tighter flex items-center gap-1">
                                      <Bot size={10} /> {task.agent_id}
                                    </span>
                                    <span className="text-zinc-700 text-[9px]">•</span>
                                    <p className="text-[10px] text-zinc-500 truncate">{task.description}</p>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  {executingTaskId === task.id ? (
                                    <div className="px-3 py-1.5 bg-zinc-800 rounded-lg flex items-center gap-2 border border-white/5">
                                      <Loader2 size={10} className="animate-spin text-cyan-400" />
                                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Running</span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => runTask(task.id)}
                                      className="p-2 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg text-zinc-600 transition-all border border-transparent hover:border-cyan-500/20"
                                      title="Execute Task"
                                    >
                                      <Play size={14} fill="currentColor" className="opacity-40" />
                                    </button>
                                  )}
                                  {task.status === 'running' && (
                                    <button 
                                      onClick={() => updateTaskStatus(task.id, 'completed')}
                                      className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg text-zinc-600 transition-all border border-transparent hover:border-emerald-500/20"
                                      title="Mark as Done"
                                    >
                                      <CheckCircle2 size={14} />
                                    </button>
                                  )}
                                </div>
                            </div>

                            {/* Integrated Result Area */}
                            {task.result && (
                              <div className="border-t border-white/5 bg-black/40 p-6">
                                <div className="flex items-center gap-2 mb-4 text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                                  <Activity size={10} className="text-cyan-500" /> Intelligence Report
                                </div>
                                <div className="prose prose-invert prose-sm max-w-none 
                                  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight 
                                  prose-p:text-zinc-400 prose-p:leading-relaxed
                                  prose-li:text-zinc-300
                                  prose-strong:text-cyan-400/80
                                  selection:bg-cyan-500/20">
                                  <ReactMarkdown>{task.result}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </main>

        {/* --- RETRACTABLE NEURAL STREAM --- */}
        <AnimatePresence>
          {isStreamOpen && (
            <motion.aside 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 border-l border-white/5 bg-[#0D0D0D] flex flex-col shadow-2xl relative z-20"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" /> Activity Feed
                </h3>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[8px] font-bold text-zinc-500 uppercase">Live</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[9px] scrollbar-hide">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-800 italic opacity-50 px-8 text-center">
                    <Cpu size={24} className="mb-2 opacity-10" />
                    <p className="tracking-tight leading-relaxed">Synchronizing Neural Link...</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={msg.id} 
                    className={cn(
                      "p-3 rounded-lg border",
                      msg.role === 'system' ? 'bg-cyan-500/5 border-cyan-500/10 text-cyan-200/50' : 'bg-white/[0.01] border-white/5 text-zinc-400'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5 opacity-40">
                      <span className="font-bold uppercase tracking-tighter text-[8px]">{msg.agent_id}</span>
                      <span className="text-[7px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="prose prose-invert prose-xs max-w-none opacity-80 leading-relaxed text-[10px] font-sans">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
                <div id="neural-stream-bottom" />
              </div>

              <div className="p-3 border-t border-white/5 bg-black/40">
                <div className="flex items-center gap-2 text-zinc-700 px-2 py-1">
                  <Loader2 size={10} className="animate-spin" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Listening...</span>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
