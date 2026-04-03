"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Shield, Search, Filter, ArrowDown, 
  Cpu, Zap, Database, CreditCard, Activity,
  ChevronRight, ExternalLink, RefreshCw, Layers,
  CheckCircle2, AlertCircle, Clock, Info, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface NeuralLog {
  id: string;
  mission_id: string;
  agent_id: string;
  role: string;
  content: string;
  metadata: any;
  created_at: string;
  anima_agents?: {
    name: string;
    role: string;
  };
  anima_missions?: {
    title: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<NeuralLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<NeuralLog | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
    
    // Configura sottoscrizione Real-time per i logs
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'anima_messages' },
        (payload) => {
          if (autoRefresh) {
            handleNewLog(payload.new as NeuralLog);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh]);

  const handleNewLog = async (newLog: NeuralLog) => {
    // Arricchimento dati per il log in tempo reale
    const { data: agent } = await supabase
      .from('anima_agents')
      .select('name, role')
      .eq('id', newLog.agent_id)
      .single();
    
    // Coerce null → undefined per compatibilità con NeuralLog interface
    const enrichedLog: NeuralLog = { ...newLog, anima_agents: agent ?? undefined };
    setLogs(prev => [enrichedLog, ...prev].slice(0, 100)); // Mantieni ultimi 100
  };


  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anima_messages')
        .select(`
          *,
          anima_agents(name, role),
          anima_missions(title)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("Failed to sync audit logs");
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterType === 'tool' && log.metadata?.type !== 'tool_result') return false;
    if (filterType === 'assistant' && log.role !== 'assistant') return false;
    if (filterType === 'system' && log.role !== 'system') return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.content.toLowerCase().includes(term) || 
        log.anima_agents?.name.toLowerCase().includes(term) ||
        log.anima_missions?.title.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getLogStyle = (log: NeuralLog) => {
    if (log.metadata?.type === 'tool_result') return "border-indigo-500/20 bg-indigo-500/5 text-indigo-200";
    if (log.role === 'assistant') return "border-cyan-500/20 bg-cyan-500/5 text-white";
    if (log.role === 'system') return "border-emerald-500/20 bg-emerald-500/5 text-emerald-200";
    return "border-white/5 bg-white/[0.02] text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 font-mono selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden flex flex-col">
      
      {/* --- HEADER --- */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.03] pb-8 shrink-0">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] uppercase tracking-[0.4em] mb-3 font-black">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Neural_Bridge_Audit: <span className="text-white">Live_Stream</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent uppercase">
            Audit_Matrix
          </h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           {/* Filters */}
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-3xl shadow-xl">
             {['all', 'assistant', 'tool', 'system'].map(type => (
               <button 
                 key={type}
                 onClick={() => setFilterType(type)}
                 className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
               >
                 {type}
               </button>
             ))}
           </div>

           <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-xl border border-white/10 group focus-within:border-cyan-500/50 transition-all">
              <Search size={14} className="text-zinc-600" />
              <input 
                type="text" 
                placeholder="SEARCH_NEURAL_FLOW..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-40 md:w-60"
              />
           </div>

           <button 
             onClick={() => setAutoRefresh(!autoRefresh)}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${autoRefresh ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}
           >
             <RefreshCw size={12} className={autoRefresh ? "animate-spin" : ""} />
             {autoRefresh ? "LIVE_STREAM" : "PAUSED"}
           </button>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 min-h-0 flex gap-8">
        
        {/* Log List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2" ref={scrollRef}>
           <AnimatePresence initial={false}>
             {filteredLogs.map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  layout
                  onClick={() => setSelectedLog(log)}
                  className={`group p-6 rounded-3xl border cursor-pointer relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] ${getLogStyle(log)}`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     {log.metadata?.type === 'tool_result' ? <Zap size={80} /> : <Terminal size={80} />}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10`}>
                           {log.role === 'assistant' ? <Cpu size={14} /> : log.metadata?.type === 'tool_result' ? <Zap size={14} /> : <Shield size={14} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-tighter">
                               {log.anima_agents?.name || log.role.toUpperCase()}
                             </span>
                             <span className="text-[8px] text-zinc-600 font-bold uppercase italic tracking-widest">
                               {log.anima_agents?.role || 'SYSTEM_PROC'}
                             </span>
                           </div>
                        </div>
                     </div>
                     <div className="text-[9px] font-bold text-zinc-600 flex items-center gap-2">
                        <Clock size={10} />
                        {new Date(log.created_at).toLocaleTimeString('it-IT', { 
                          hour12: false, 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit',
                          fractionalSecondDigits: 3 
                        })}
                     </div>
                  </div>

                  <div className="text-[11px] leading-relaxed break-words font-medium opacity-90 mb-4 line-clamp-3">
                    {log.content}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
                     <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                           <Layers size={10} /> {log.anima_missions?.title || 'GLOBAL_SCOPE'}
                        </div>
                        {log.metadata?.cost && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400 italic">
                             <CreditCard size={10} /> €{parseFloat(log.metadata.cost).toFixed(6)}
                          </div>
                        )}
                     </div>
                     <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        INSPECT_TRANSACTION <ChevronRight size={10} />
                     </div>
                  </div>
                </motion.div>
             ))}
           </AnimatePresence>

           {filteredLogs.length === 0 && !loading && (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-40">
                <Search size={60} strokeWidth={1} className="mb-6" />
                <h3 className="text-xl font-bold uppercase italic tracking-tighter">No_Event_Matches</h3>
                <p className="text-[9px] font-black uppercase tracking-widest mt-2">Adjust filters or search parameters to view neural history.</p>
             </div>
           )}
        </div>

        {/* --- DETAIL MODAL (SIDEBAR STYLE) --- */}
        <AnimatePresence>
           {selectedLog && (
             <motion.div 
               initial={{ opacity: 0, x: 100 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 100 }}
               className="w-full md:w-[500px] bg-white/[0.02] border-l border-white/5 backdrop-blur-3xl p-10 flex flex-col shrink-0"
             >
                <div className="flex items-center justify-between mb-10 shrink-0">
                   <h2 className="text-xl font-black italic uppercase italic tracking-tight">Inspect_Batch</h2>
                   <button 
                     onClick={() => setSelectedLog(null)}
                     className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                   >
                     <X size={18} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
                   {/* Info Block */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                         <span className="text-[9px] font-black uppercase text-zinc-600">Event_ID</span>
                         <span className="text-[10px] font-mono text-zinc-400">{selectedLog.id.split('-')[0]}...</span>
                      </div>
                      <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                         <span className="text-[9px] font-black uppercase text-zinc-600">Neural_Role</span>
                         <span className="text-[10px] font-black uppercase text-cyan-400 italic">{selectedLog.role}</span>
                      </div>
                      {selectedLog.metadata?.usage && (
                         <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3">
                            <span className="text-[9px] font-black uppercase text-zinc-600 block mb-2">Resource_Consumption</span>
                            <div className="flex justify-between text-[10px] font-mono">
                               <span className="text-zinc-500">Prompt_Tokens</span>
                               <span>{selectedLog.metadata.usage.prompt_tokens}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-mono">
                               <span className="text-zinc-500">Completion_Tokens</span>
                               <span>{selectedLog.metadata.usage.completion_tokens}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between text-[10px] font-black text-cyan-400 italic">
                               <span>Estimated_Cost</span>
                               <span>€{parseFloat(selectedLog.metadata.cost || 0).toFixed(6)}</span>
                            </div>
                         </div>
                      )}
                   </div>

                   {/* Content View */}
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-zinc-700 tracking-widest flex items-center gap-2">
                         <Info size={12} /> Transaction_Payload
                      </h3>
                      <div className="w-full bg-black/60 border border-white/5 rounded-3xl p-6 text-[11px] font-mono leading-relaxed text-zinc-300 break-words whitespace-pre-wrap">
                        {selectedLog.content}
                      </div>
                   </div>

                   {/* Raw Metadata */}
                   <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase text-zinc-700 tracking-widest flex items-center gap-2">
                         <Database size={12} /> Neural_Metadata
                      </h3>
                      <pre className="w-full bg-black/40 border border-white/5 rounded-3xl p-6 text-[10px] font-mono text-cyan-500 overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 shrink-0">
                  <button 
                    onClick={() => toast.info("Deep linking mission context...")}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-xl"
                  >
                    <ExternalLink size={14} strokeWidth={3} /> OPEN_MISSION_CONTEXT
                  </button>
                </div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
