"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  Cpu, User, Calendar, Play, Pause, Square, ExternalLink, Activity, Zap,
  RotateCcw, XCircle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { listMessagesByMission } from '@/lib/anima';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  status: 'pending' | 'running' | 'completed' | 'error' | 'blocked' | 'waiting';
  requires_approval?: boolean;
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
          
          // Paperclip Style: Notifica e Beep se richiesto intervento umano
          if (payload.new.metadata?.type === 'approval_required') {
            playPaperclipBeep();
            showNotification("Intervento Richiesto", `L'agente ${payload.new.agent_id} attende approvazione per: ${payload.new.metadata.tool}`);
          }
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

  const runTask = useCallback(async (taskId: string, bypassSafety: boolean = false) => {
    setExecutingTaskId(taskId);
    try {
      const res = await fetch('/api/tasks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, bypassSafety })
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

  // --- PAPERCLIP NOTIFICATION SYSTEM ---
  const playPaperclipBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 (Alto)
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // Slide down
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context failed", e);
    }
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    toast.info(title, { description: body });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- AUTO-PILOT IGNITION SYSTEM ---
  // In v2, il loop è gestito dal backend (executor.ts).
  // Questo effect serve solo come "Innesco Iniziale" se la missione è attiva ma nessun task è partito.
  useEffect(() => {
    if (!mission || mission.status !== 'active' || mission.execution_mode !== 'autonomous' || tasks.length === 0 || loading || executingTaskId) return;

    const isAnyStarted = tasks.some(t => t.status === 'running' || t.status === 'completed');
    if (isAnyStarted) return;

    const firstTask = [...tasks]
      .sort((a, b) => a.order_index - b.order_index)
      .find(t => t.status === 'pending');

    if (firstTask && !firstTask.requires_approval) {
      console.log("[Auto-Pilot] Initial Ignition: Starting first task", firstTask.id);
      runTask(firstTask.id);
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
      
      {/* --- TOP BAR / MISSION COMMAND --- */}
      <header className="px-6 py-4 border-b border-white/[0.03] flex items-center justify-between bg-black/60 backdrop-blur-3xl sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-5">
          <Link href="/missions" className="p-2.5 hover:bg-white/[0.02] rounded-xl transition-all border border-transparent hover:border-white/5 group interactive">
            <ChevronLeft size={18} className="text-zinc-600 group-hover:text-cyan-400 transition-colors" />
          </Link>
          <div className="h-6 w-px bg-white/5" />
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black tracking-tight text-white italic uppercase leading-none">{mission.title}</h1>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.2em] border shadow-lg",
                mission.status === 'active' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              )}>
                  {mission.status}
              </span>
            </div>
            <p className="text-[8px] text-zinc-700 font-mono font-black italic uppercase tracking-[0.3em] mt-1.5 opacity-60">
              UPLINK_STABLE_ID://<span className="text-zinc-400">{id?.slice(0, 15)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleExecutionMode}
            disabled={isUpdating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-wider interactive",
              mission.execution_mode === 'autonomous' 
                ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.1)]" 
                : "bg-white/[0.01] border-white/5 text-zinc-600 hover:border-white/10"
            )}
          >
            {mission.execution_mode === 'autonomous' ? (
              <Zap size={11} className="fill-current animate-neural-pulse" />
            ) : (
              <User size={11} />
            )}
            {mission.execution_mode === 'autonomous' ? 'AUTO_PILOT_ON' : 'MANUAL_MODE'}
          </button>

          <div className="h-4 w-px bg-white/5 mx-1" />

          <div className="flex items-center gap-1.5 bg-white/[0.01] px-2.5 py-1.5 rounded-lg border border-white/5 text-[9px] font-black text-zinc-700 italic">
            <CheckCircle2 size={11} className="text-emerald-500" />
            <span className="text-zinc-300">{tasks.filter(t => t.status === 'completed').length}</span>
            <span className="text-zinc-800">/</span>
            <span>{tasks.length}</span>
          </div>
          
          <button 
            onClick={() => setIsStreamOpen(!isStreamOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-black uppercase tracking-wider interactive",
              isStreamOpen ? "bg-cyan-500/5 border-cyan-500/10 text-cyan-600" : "bg-white/[0.01] border-white/5 text-zinc-700"
            )}
          >
            <Activity size={11} className={isStreamOpen ? 'animate-neural-pulse' : ''} />
            LIVE_FEED
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={restartMission}
              disabled={isUpdating}
              className="p-1.5 hover:text-emerald-400 transition-all interactive"
              title="Restart Mission"
            >
              <RotateCcw size={14} className="opacity-40 hover:opacity-100" />
            </button>
            <button
              onClick={cancelMission}
              disabled={isUpdating}
              className="p-1.5 hover:text-rose-500 transition-all interactive"
              title="Cancel Mission"
            >
              <XCircle size={14} className="opacity-40 hover:opacity-100" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* --- MAIN WORKSPACE --- */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Objective Summary */}
            <section className="control-card rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-3xl shadow-2xl group interactive">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles size={60} />
                </div>
                <h3 className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-5 flex items-center gap-2 italic">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 animate-neural-pulse" /> TARGET_MISSION_PROFILE
                </h3>
                <p className="text-lg text-zinc-300 leading-relaxed italic font-black uppercase tracking-tight">
                  "{mission.objective}"
                </p>
            </section>

            {/* Task Timeline */}
            <section className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                    <LayoutDashboard size={10} className="text-cyan-600" /> STRATEGIC_EXECUTION_SEQUENCE
                    <div className="flex-1 h-px bg-white/[0.03] ml-2" />
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
                              "group border rounded-[2rem] transition-all duration-300 overflow-hidden shadow-lg interactive",
                              task.status === 'running' ? "bg-cyan-500/[0.02] border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)]" : 
                              task.status === 'waiting' ? "bg-amber-500/[0.01] border-amber-500/10 border-dashed" :
                              task.requires_approval && task.status === 'pending' ? "bg-amber-500/[0.02] border-amber-500/20" :
                              "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] hover:border-white/10"
                            )}
                        >
                            <div className="p-5 flex items-center gap-5">
                                {/* Compact Status Node */}
                                <div className={cn(
                                  "shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300",
                                  task.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
                                  task.status === 'running' ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse" : 
                                  task.status === 'waiting' ? "bg-amber-500/5 border-amber-500/10 text-amber-500/50" :
                                  task.requires_approval && task.status === 'pending' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                  "bg-white/[0.02] border-white/5 text-zinc-800"
                                )}>
                                    {task.status === 'completed' ? (
                                        <CheckCircle2 size={14} strokeWidth={3} />
                                    ) : task.status === 'running' ? (
                                        <Activity size={14} strokeWidth={3} />
                                    ) : task.status === 'waiting' ? (
                                        <Clock size={14} className="animate-neural-pulse" />
                                    ) : task.requires_approval ? (
                                        <ShieldCheck size={14} strokeWidth={3} />
                                    ) : (
                                        <span className="text-[10px] font-black text-zinc-900 italic font-mono">0{idx + 1}</span>
                                    )}
                                </div>

                                {/* Task Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className={cn(
                                      "text-[12px] font-black italic tracking-wide uppercase",
                                      task.status === 'completed' ? "text-zinc-800" : "text-zinc-100 group-hover:text-cyan-500 transition-colors"
                                    )}>
                                      {task.title}
                                    </h4>
                                    <div className={cn(
                                      "px-1.5 py-0.5 rounded text-[6px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                      task.status === 'completed' ? "bg-zinc-900 border-zinc-800 text-zinc-800" :
                                      task.status === 'running' ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500 animate-pulse" :
                                      task.status === 'waiting' ? "bg-amber-500/5 border-amber-500/10 text-amber-500/60" :
                                      task.requires_approval && task.status === 'pending' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                      "bg-zinc-950 border-white/5 text-zinc-800"
                                    )}>
                                      {task.status === 'waiting' ? 'BUSY_NODE' : 
                                       (task.requires_approval && task.status === 'pending' ? 'SAFETY_WAIT' : task.status)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[7px] font-mono font-black text-cyan-700 uppercase tracking-tighter flex items-center gap-1 italic opacity-60">
                                      <Bot size={8} /> AGENT_UID://{task.agent_id.slice(0,8)}
                                    </span>
                                    <span className="text-zinc-900 text-[9px]">•</span>
                                    <p className="text-[9px] text-zinc-700 font-bold italic truncate max-w-[300px]">{task.description}</p>
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
                                    <>
                                      {task.requires_approval && (
                                        <button
                                          onClick={() => runTask(task.id, true)}
                                          className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 hover:bg-amber-500/20 text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                        >
                                          <ShieldCheck size={12} strokeWidth={3} /> Approve & Run
                                        </button>
                                      )}
                                      {!task.requires_approval && task.status === 'pending' && (
                                        <button 
                                          onClick={() => runTask(task.id)}
                                          className="p-2 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg text-zinc-600 transition-all border border-transparent hover:border-cyan-500/20"
                                          title="Execute Task"
                                        >
                                          <Play size={14} fill="currentColor" className="opacity-40" />
                                        </button>
                                      )}
                                    </>
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
              <div className="p-5 border-b border-white/[0.03] flex items-center justify-between bg-white/[0.01]">
                <h3 className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.3em] flex items-center gap-2 italic">
                  <Activity size={10} className="animate-neural-pulse" /> NEURAL_TRAFFIC_LIVE
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7px] font-black text-zinc-700 uppercase italic">UPLINK_STABLE</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-[9px] scrollbar-hide">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-900 italic opacity-30 px-8 text-center uppercase tracking-widest">
                    <Cpu size={24} className="mb-3 opacity-5" />
                    <p className="text-[8px] font-black">Syncing_Neural_Cortex...</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={msg.id} 
                    className={cn(
                      "p-3 rounded-lg border relative overflow-hidden transition-all group",
                      msg.role === 'system' ? 'bg-cyan-500/[0.02] border-cyan-500/10 text-cyan-600/60' : 'bg-white/[0.01] border-white/5 text-zinc-500 hover:border-white/10'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2 opacity-50">
                      <span className="font-black uppercase tracking-tighter text-[7px] italic flex items-center gap-1">
                         <div className="w-1 h-1 rounded-full bg-zinc-800" /> {msg.agent_id.slice(0,10)}
                      </span>
                      <span className="text-[6px] font-black text-zinc-800">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="prose prose-invert prose-xs max-w-none opacity-80 leading-relaxed text-[10px] font-sans italic font-bold">
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
