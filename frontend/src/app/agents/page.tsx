"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Shield, 
  Zap, 
  Brain, 
  ChevronRight, 
  Sparkles,
  MessageSquare,
  Plus,
  History,
  Clock,
  Loader2,
  Cpu,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';
import { getGroupedActiveModels } from '@/lib/anima';

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AgentInfo {
  id: string;
  is_system?: boolean;
  name: string;
  role: string;
  status: string;
  units?: string[];
  current_phase?: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export default function NeuralLinkChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [groupedModels, setGroupedModels] = useState<Record<string, AIModel[]>>({});
  const [selectedModelId, setSelectedModelId] = useState<string>('google/gemini-2.0-flash-001');

  // 1. Inizializzazione: Carica Sessioni, Agenti e Modelli
  useEffect(() => {
    fetchSessions();
    fetchAgents();
    fetchModels();
  }, []);

  // 2. Caricamento Messaggi al cambio sessione
  useEffect(() => {
    if (currentSessionId) {
      loadHistory(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  // 3. Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        if (data.sessions.length > 0 && !currentSessionId) {
          setCurrentSessionId(data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.agents) setAgents(data.agents);
    } catch (e) {
      console.error("Error fetching agents:", e);
    }
  };

  const fetchModels = async () => {
    try {
      const grouped = await getGroupedActiveModels();
      setGroupedModels(grouped);
      
      // Se il modello selezionato non è tra quelli disponibili, resettiamo al primo disponibile
      const allActive = Object.values(grouped).flat();
      if (allActive.length > 0 && !allActive.find(m => m.id === selectedModelId)) {
        setSelectedModelId(allActive[0].id);
      }
    } catch (e) {
      console.error("Error fetching models:", e);
    }
  };

  const createNewChat = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'system' })
      });
      const data = await res.json();
      if (data.success) {
        setSessions(prev => [data.session, ...prev]);
        setCurrentSessionId(data.session.id);
        setMessages([]);
      }
    } catch (e) {
      console.error("Error creating session:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/history?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error("Error loading history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    
    if (!sessionId) {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: 'system' })
      });
      const data = await res.json();
      if (data.success) {
        sessionId = data.session.id;
        setSessions(prev => [data.session, ...prev]);
        setCurrentSessionId(sessionId);
      } else return;
    }

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    const initialAssistantMsg: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      metadata: { toolCalls: [] }
    };

    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'system',
          sessionId: sessionId,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          modelId: selectedModelId // Passiamo il modello selezionato come override
        })
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const textDecoder = new TextDecoder();
      
      let accumulatedContent = "";
      let accumulatedToolCalls: any[] = [];
      let buffer = ""; // Buffer per i chunk parziali

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += textDecoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Teniamo l'ultima riga nel buffer per la prossima iterazione (nel caso sia incompleta)
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.chunk) {
              if (data.chunk.type === 'text') {
                accumulatedContent += data.chunk.content;
              } else if (data.chunk.type === 'status' && data.chunk.content === 'executing_tool') {
                console.log(`[Neural Link] Executing tool: ${data.chunk.metadata?.toolName}`);
              }
            } else if (data.done) {
               if (data.response?.toolExecutions) {
                  accumulatedToolCalls = data.response.toolExecutions;
               }
            }

            // Aggiorniamo l'ultimo messaggio (assistente) in tempo reale
            setMessages(prev => {
              const newMsgs = [...prev];
              const lastIdx = newMsgs.length - 1;
              if (newMsgs[lastIdx].role === 'assistant') {
                newMsgs[lastIdx] = {
                  ...newMsgs[lastIdx],
                  content: accumulatedContent,
                  metadata: { 
                    ...newMsgs[lastIdx].metadata,
                    toolCalls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : newMsgs[lastIdx].metadata.toolCalls 
                  }
                };
              }
              return newMsgs;
            });
          } catch (e) {
            console.warn("Error parsing stream chunk:", e);
          }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'system' as any,
        content: "FALLIMENTO NEURAL LINK: Impossibile comunicare con ANIMA.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
      fetchSessions(); // Refresh list to move current session to top
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* 1. SIDEBAR SINISTRA: CHRONO HISTORY */}
      <aside className="w-72 border-r border-white/[0.03] bg-zinc-950/40 backdrop-blur-3xl flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/[0.03]">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.01] hover:bg-white/[0.05] border border-white/10 rounded-2xl transition-all group"
          >
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Plus size={18} className="text-black" strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic group-hover:text-cyan-400 transition-colors">Start New Link</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] italic px-2">
              <History size={10} /> Active Sessions
            </h4>
            <div className="space-y-1">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden ${
                    currentSessionId === s.id 
                    ? 'bg-cyan-500/10 border border-cyan-500/30' 
                    : 'hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  {currentSessionId === s.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500" />
                  )}
                  <div className="flex flex-col gap-1">
                    <p className={`text-[11px] font-bold truncate tracking-tight ${
                      currentSessionId === s.id ? 'text-white' : 'text-zinc-500'
                    }`}>
                      {s.title || `Session_${s.id.substring(0, 5).toUpperCase()}`}
                    </p>
                    <div className="flex items-center gap-2">
                       <Clock size={8} className="text-zinc-700" />
                       <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">
                         {new Date(s.updated_at).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/[0.03] space-y-4">
           <div className="flex items-center gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl italic text-[8px] font-black text-cyan-700 uppercase tracking-widest">
             <Brain size={14} className="text-cyan-500" />
             <span>Neural Memory Persistent</span>
           </div>
        </div>
      </aside>

      {/* 2. AREA CENTRALE: NEURAL LINK */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_40%)] border-r border-white/[0.03]">
        
        {/* Header */}
        <header className="px-10 py-6 border-b border-white/[0.03] flex items-center justify-between backdrop-blur-3xl sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative group">
              <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-all rounded-full" />
              <Bot size={32} className="text-cyan-500 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-black text-3xl italic tracking-tighter uppercase leading-none text-white overflow-hidden">
                   ANIMA_NEURAL_LINK
                </h1>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-500 animate-neural-pulse'}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <p className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  Neural Link <span className="text-cyan-500">Established</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <select 
                    className="bg-transparent text-[9px] font-black text-cyan-600/80 italic border-none outline-none appearance-none cursor-pointer hover:text-cyan-400 transition-all uppercase tracking-widest"
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                  >
                    {Object.entries(groupedModels).map(([category, models]) => (
                      <optgroup key={category} label={category} className="bg-[#0E0E0E] text-zinc-500 text-[8px] font-black italic">
                        {models.map(m => (
                          <option key={m.id} value={m.id} className="bg-[#0E0E0E] text-white py-2">
                            {m.name.toUpperCase()}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-[9px] font-black text-zinc-600 tracking-widest uppercase italic flex items-center gap-3">
             <Shield size={14} className="text-emerald-500" />
             Quantum Secure Tunnel
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <section className="flex-1 overflow-y-auto px-8 py-12 space-y-12">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-10">
              <div className="w-24 h-24 bg-cyan-400/5 rounded-3xl flex items-center justify-center border border-cyan-400/10 animate-neural-pulse relative">
                <Brain size={48} className="text-cyan-400/30" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-tight text-white/90">Synchronizing...</h2>
                <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                  Stabilisci un link neurale con l'intelligenza centrale. 
                  ANIMA ha accesso istantaneo a SOP, memorie storiche e flotta operativa.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {['Analizza briefings', 'Strategia Agency V2', 'Stato Gmail', 'Linee guida colori'].map(hint => (
                  <button 
                    key={hint}
                    onClick={() => setInput(hint)}
                    className="p-4 text-[8px] font-black uppercase tracking-[0.2em] border border-white/5 bg-white/[0.01] rounded-2xl hover:bg-cyan-400/5 hover:border-cyan-400/30 transition-all text-zinc-600 hover:text-cyan-400 text-left"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-12">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex gap-8 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 shadow-xl ${
                    m.role === 'assistant' 
                    ? 'bg-cyan-500 text-black border-cyan-400/50' 
                    : 'bg-zinc-900 text-white border-white/10'
                  }`}>
                    {m.role === 'assistant' ? <Cpu size={24} strokeWidth={2.5} /> : <User size={24} />}
                  </div>
                  <div className={`flex flex-col gap-3 min-w-0 max-w-[85%] ${m.role === 'user' ? 'items-end' : ''}`}>
                    <div className={`p-6 rounded-[2rem] text-[16px] leading-relaxed shadow-lg ${
                      m.role === 'assistant' 
                      ? 'bg-white/[0.03] border border-white/[0.05] text-zinc-200' 
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-black font-semibold'
                    }`}>
                      <div className="markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-black uppercase tracking-tighter mb-4" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 ml-4 space-y-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-black italic text-cyan-400" {...props} />,
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto my-6 border border-white/10 rounded-2xl">
                                <table className="w-full text-left border-collapse" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-white/[0.05] border-b border-white/10" {...props} />,
                            th: ({node, ...props}) => <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-400" {...props} />,
                            td: ({node, ...props}) => <td className="p-4 text-[13px] border-b border-white/[0.03] text-zinc-300 font-medium" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-white/[0.02] transition-colors" {...props} />,
                          }}
                        >
                          {m.content || (isLoading && i === messages.length - 1 ? "..." : "")}
                        </ReactMarkdown>
                      </div>

                      {/* Tool Execution Log integration */}
                      {m.metadata?.toolCalls && m.metadata.toolCalls.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                           <div className="flex items-center gap-2 text-[8px] font-black text-cyan-500/50 uppercase tracking-widest">
                             <Sparkles size={10} /> Neural Activity Log
                           </div>
                           {m.metadata.toolCalls.map((tc: any, tci: number) => (
                             <div key={tci} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-start gap-3">
                                <Zap size={12} className="text-cyan-500 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tight italic">
                                    {tc.name}
                                  </p>
                                  <p className="text-[8px] text-zinc-600 truncate opacity-60 font-mono">
                                    {typeof tc.content === 'string' ? tc.content.substring(0, 80) : JSON.stringify(tc.args).substring(0, 80)}...
                                  </p>
                                </div>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-700 font-black uppercase tracking-[0.3em] px-2">{m.timestamp}</span>
                  </div>
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1].content === "" && (
                <div className="flex gap-8 animate-pulse">
                   <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
                     <Loader2 size={24} className="text-cyan-400 animate-spin" />
                   </div>
                   <div className="space-y-3 flex-1 max-w-xs">
                     <div className="h-4 bg-white/5 rounded-full w-3/4" />
                     <div className="h-4 bg-white/5 rounded-full w-1/2" />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* Input Bar */}
        <section className="p-10 backdrop-blur-xl bg-black/60 border-t border-white/[0.03]">
          <form 
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-[2.5rem] blur-xl opacity-30 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center bg-[#080808] border border-white/10 rounded-[2.5rem] p-3 pl-8 shadow-2xl focus-within:border-cyan-400/50 transition-all">
              <input 
                type="text" 
                placeholder="Talk to ANIMA Central Core..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent py-4 outline-none text-zinc-200 placeholder:text-zinc-700 text-[17px] font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-14 h-14 bg-cyan-500 text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-cyan-500/20 disabled:grayscale disabled:opacity-30"
              >
                <Send size={24} strokeWidth={3} />
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* 3. SIDEBAR DESTRA: FLEET STATUS (Read Only Monitoring) */}
      <aside className="w-72 bg-[#080808] flex flex-col">
        <div className="p-8 border-b border-white/[0.03]">
           <h2 className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.4em] italic mb-6">Fleet Status</h2>
           <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">Operational Status</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase italic">Nominal</span>
              </div>
              <div className="flex gap-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[85%] bg-emerald-500 h-full" />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
           <div className="space-y-6">
              {/* SECTION: SYSTEM NODES */}
              <div className="mb-8">
                <h4 className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.3em] italic border-b border-cyan-900/30 pb-2 mb-4 flex items-center gap-2">
                  <Shield size={10} /> System Core
                </h4>
                <div className="space-y-4">
                  {agents.filter(a => a.is_system).map(agent => (
                    <div key={agent.id} className="flex items-start gap-3 p-2 bg-cyan-500/[0.03] border border-cyan-500/10 rounded-xl">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${agent.status === 'online' ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-800'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-zinc-100 truncate">{agent.name}</p>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-tighter truncate">{agent.role}</p>
                        {agent.current_phase && (
                          <p className="mt-1 text-[6px] font-mono text-cyan-500 uppercase animate-pulse">{agent.current_phase}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: AGENCY ASSETS */}
              <div>
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] italic border-b border-white/5 pb-2 mb-4 flex items-center gap-2">
                  <Cpu size={10} /> Agency Assets
                </h4>
                <div className="space-y-4">
                  {agents.filter(a => !a.is_system).slice(0, 10).map(agent => (
                    <div key={agent.id} className="flex items-start gap-3 p-2 hover:bg-white/[0.02] transition-colors rounded-xl">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${agent.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-800'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-zinc-300 truncate">{agent.name}</p>
                        <p className="text-[8px] text-zinc-500 uppercase tracking-tighter truncate">{agent.role}</p>
                        {agent.current_phase && (
                          <p className="mt-1 text-[6px] font-mono text-emerald-500/60 uppercase animate-pulse">{agent.current_phase}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>

        <div className="p-8 border-t border-white/[0.03]">
           <button className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-600 transition-all">
             Global Registry Access
           </button>
        </div>
      </aside>

    </div>
  );
}
