"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  Cpu, User, Calendar, Play, Pause, Square, ExternalLink, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { listMessagesByMission } from '@/lib/anima';
import ReactMarkdown from 'react-markdown';

interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
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

  const runTask = async (taskId: string) => {
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
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="text-cyan-400 animate-spin" size={40} />
      </div>
    );
  }

  if (!mission) {
    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-2xl font-black italic">MISSION NOT FOUND</h1>
            <p className="text-zinc-500 max-w-sm mt-2">La missione richiesta non è presente nel database o l'ID non è corretto.</p>
            <Link href="/missions" className="mt-8 text-cyan-400 font-bold uppercase text-[10px] tracking-widest border border-cyan-400/20 px-6 py-3 rounded-xl hover:bg-cyan-400 hover:text-black transition-all">Back to Fleet Control</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      
      {/* --- HEADER --- */}
      <header className="max-w-6xl mx-auto mb-16">
        <Link href="/missions" className="flex items-center gap-2 text-zinc-500 hover:text-cyan-400 transition-colors mb-8 text-[10px] font-black uppercase tracking-[0.3em] font-bold">
            <ChevronLeft size={14} /> Mission Fleet
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-2xl">
              <Target size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black italic tracking-tighter uppercase">{mission.title}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${mission.status === 'active' ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' : 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'}`}>
                    {mission.status}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold italic">Strategic Orchestration in Progress</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 border border-white/10 p-4 rounded-2xl items-center gap-6">
             <div className="text-center">
                <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest mb-1">Tasks</p>
                <p className="text-xs font-bold text-cyan-400">{tasks.filter(t => t.status === 'completed').length} / {tasks.length}</p>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <button 
                onClick={() => setIsStreamOpen(!isStreamOpen)}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-all ${isStreamOpen ? 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}
             >
                <p className="text-[7px] font-black uppercase tracking-[0.2em] mb-1">Neural Link</p>
                <Activity size={16} className={isStreamOpen ? 'animate-pulse' : ''} />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* --- LEFT COLUMN: MISSION DATA --- */}
        <div className={`space-y-6 ${isStreamOpen ? 'xl:col-span-3 lg:col-span-4' : 'lg:col-span-4'}`}>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Sparkles size={12} /> Objective Details
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line italic">"{mission.objective}"</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Operations Board</h3>
                <div className="space-y-4">
                    <button className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-all">Complete Mission</button>
                    <button className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all">Abort Mission</button>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: TASK TIMELINE --- */}
        <div className={`space-y-6 ${isStreamOpen ? 'xl:col-span-6 lg:col-span-8' : 'lg:col-span-8'} min-w-0`}>
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                <LayoutDashboard size={12} /> Actionable Task Plan
            </h3>
            
            <div className="space-y-4 relative">
                {/* Vertical Line — The 'Spine' of the Mission */}
                <div className="absolute left-6 top-8 bottom-8 w-px bg-white/5 z-0" />

                <AnimatePresence mode="popLayout">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 border border-white/5 bg-white/[0.01] rounded-[3rem] text-center">
                            <Loader2 className="animate-spin text-zinc-800 mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700">Awaiting Orchestration Plan...</p>
                        </div>
                    ) : tasks.map((task, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={task.id}
                            className="relative z-10 flex gap-6 group"
                        >
                            {/* Step Indicator Node */}
                            <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#0A0A0A] border border-white/10 flex items-center justify-center group-hover:border-cyan-400/50 transition-all shadow-xl">
                                {task.status === 'completed' ? (
                                    <CheckCircle2 size={20} className="text-emerald-400" />
                                ) : task.status === 'running' ? (
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                ) : (
                                    <span className="text-[10px] font-black italic font-mono text-zinc-700 group-hover:text-cyan-400">0{idx + 1}</span>
                                )}
                            </div>

                            {/* Task Card */}
                            <div className={`flex-1 border rounded-[2rem] p-6 transition-all backdrop-blur-sm ${
                                task.status === 'completed' 
                                ? 'bg-white/[0.01] border-white/5 opacity-60' 
                                : task.status === 'running'
                                ? 'bg-cyan-400/[0.03] border-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.05)]'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                            }`}>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className={`text-lg font-black italic tracking-tight ${task.status === 'completed' ? 'text-zinc-600 line-through' : 'text-white'}`}>
                                                {task.title}
                                            </h4>
                                            <div className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${
                                                task.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                task.status === 'running' ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' :
                                                'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'
                                            }`}>
                                                {task.status}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1.5 p-0.5 px-2 bg-white/5 rounded-full border border-white/10 text-[8px] font-black text-cyan-400 uppercase tracking-widest">
                                                <Bot size={10} /> {task.agent_id}
                                            </div>
                                            {task.order_index > 0 && (
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">SEQ: {task.order_index}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(task.status === 'pending' || task.status === 'error' || task.status === 'running' || task.status === 'completed') && (
                                            <button 
                                                disabled={executingTaskId !== null}
                                                onClick={() => runTask(task.id)} 
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-tighter disabled:opacity-50 ${
                                                    task.status === 'error' ? 'bg-red-500 text-white' : 
                                                    task.status === 'running' ? 'bg-zinc-800 text-cyan-400 border border-cyan-400/20' :
                                                    task.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border border-white/5 hover:border-cyan-400/30 hover:text-cyan-400' :
                                                    'bg-gradient-to-r from-cyan-400 to-cyan-500 text-black'
                                                }`}
                                            >
                                                <Play size={10} fill={task.status === 'error' ? 'white' : task.status === 'completed' ? '#71717a' : task.status === 'running' ? 'cyan' : 'black'} /> 
                                                {executingTaskId === task.id ? 'PROCESSING...' : 
                                                 task.status === 'error' ? 'RETRY TASK' : 
                                                 task.status === 'running' ? 'RE-RUN TASK' : 
                                                 task.status === 'completed' ? 'RE-RUN TASK' : 'START TASK'}
                                            </button>
                                        )}
                                        {task.status === 'running' && (
                                            <button 
                                                onClick={() => updateTaskStatus(task.id, 'completed')} 
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-400 text-black rounded-xl hover:scale-105 active:scale-95 transition-all text-[9px] font-black uppercase tracking-tighter"
                                            >
                                                <CheckCircle2 size={10} /> MARK DONE
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed italic">"{task.description}"</p>
                                
                                {task.result && (
                                    <div className="mt-6 p-5 bg-black/40 border border-white/5 rounded-2xl text-[10px] text-emerald-400/80 font-mono leading-relaxed relative overflow-hidden group/result">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />
                                        <div className="flex items-center gap-2 mb-2 text-[8px] font-black uppercase text-zinc-600">
                                            <ExternalLink size={10} /> Final Execution Log
                                        </div>
                                        <div className="opacity-80 prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-headings:mb-2 prose-headings:mt-4">
                                            <ReactMarkdown>{task.result}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>

        {/* --- EXTREME RIGHT: NEURAL STREAM (ACTIVITY FEED) --- */}
        {isStreamOpen && (
            <div className="xl:col-span-3 lg:col-span-12">
                <div className="bg-[#0D0D0D] border border-white/5 rounded-[2.5rem] h-[calc(100vh-200px)] flex flex-col sticky top-8 shadow-2xl overflow-hidden min-w-[300px] xl:min-w-0">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity size={12} className="animate-pulse" /> Neural Activity Stream
                    </h3>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[10px]">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-800 italic opacity-50">
                            <Cpu size={24} className="mb-2" />
                            Awaiting Neural Link...
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} key={msg.id} className={`p-4 rounded-2xl border ${
                            msg.role === 'system' ? 'bg-cyan-500/5 border-cyan-500/10 text-cyan-200/70' : 
                            'bg-white/[0.02] border-white/5 text-zinc-400'
                        }`}>
                            <div className="flex items-center justify-between mb-2 opacity-60">
                                <span className="font-black uppercase tracking-tighter text-cyan-500/50">{msg.agent_id}</span>
                                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                            <div className="prose prose-invert prose-xs max-w-none opacity-80 leading-relaxed">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </motion.div>
                    ))}
                    <div id="neural-stream-bottom" />
                </div>
                
                </div>
            </div>
        )}
      </main>

    </div>
  );
}
