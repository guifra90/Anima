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
  Info,
  Sparkles,
  Search,
  MessageSquare,
  RefreshCcw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { AgentInfo, listAllAgents } from '@/lib/anima';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * ANIMA Agents Hub
 * Visualizza e gestisce la flotta di agenti, filtrandoli per 'units' (reparti).
 */

export default function AgentsHub() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carica la lista degli agenti all'avvio
  useEffect(() => {
    fetchAgents();
  }, []);

  // Scroll automatico alla fine dei messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.agents && Array.isArray(data.agents)) {
        setAgents(data.agents);
        if (data.agents.length > 0) setSelectedAgent(data.agents[0]);
      }
    } catch (err) {
      console.error("[AGENTS_HUB] Error fetching agents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !selectedAgent || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      
      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ ERRORE: ${data.error}`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Si è verificato un errore di connessione con ANIMA.",
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.units && a.units.some(u => u.toLowerCase().includes(searchQuery.toLowerCase()))) ||
    a.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Sidebar: Agent Selection */}
      <aside className="w-80 border-r border-white/[0.03] bg-zinc-950/40 backdrop-blur-3xl flex flex-col shadow-[20px_0_50px_-20px_rgba(0,0,0,0.5)]">
        <div className="p-8 border-b border-white/[0.03]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20">
              <Zap size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-black tracking-tight text-xl italic uppercase leading-none">ANIMA HUB</h2>
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.3em] font-black mt-1">Neural Network</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Cerca agente..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-cyan-400/50 outline-none transition-all placeholder:text-zinc-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgent(agent);
                setMessages([]);
              }}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group ${
                selectedAgent?.id === agent.id 
                ? 'bg-cyan-400/10 border border-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.05)]' 
                : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1 overflow-hidden">
                <div className="flex flex-wrap gap-1 max-w-[80%]">
                  {agent.units && agent.units.length > 0 ? (
                    agent.units.map(unit => (
                      <span key={unit} className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${
                        selectedAgent?.id === agent.id 
                        ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5' 
                        : 'text-zinc-600 border-white/10 bg-white/5'
                      }`}>
                        {unit}
                      </span>
                    ))
                  ) : (
                    <span className="text-[8px] font-bold uppercase text-zinc-700 tracking-widest">UNASSIGNED</span>
                  )}
                </div>
                {selectedAgent?.id === agent.id && (
                  <motion.div layoutId="active-dot" className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_cyan] mt-1 shrink-0" />
                )}
              </div>
              <h3 className={`font-bold transition-colors ${selectedAgent?.id === agent.id ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                {agent.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-1 italic">{agent.role}</p>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 italic text-xs text-zinc-400">
            <Shield size={16} className="text-cyan-400" />
            <span>Sistema Criptografato v1.0</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.05),transparent_40%)]">
        
        {/* Chat Header */}
        <header className="px-10 py-6 border-b border-white/[0.03] flex items-center justify-between backdrop-blur-3xl sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
              <Bot size={32} className="text-cyan-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-black text-2xl italic tracking-tight uppercase leading-none">{selectedAgent?.name || 'Seleziona Agente'}</h1>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1.5 italic">
                Neural Optimization Core  ·  {selectedAgent?.units?.join(' / ') || 'UNASSIGNED'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={() => setMessages([])}
                className="p-3 text-zinc-500 hover:text-white transition-all bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 group"
                title="Svuota chat"
             >
                <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
             </button>
             <div className="px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 tracking-widest uppercase italic">
                INTELLIGENCE_STREAM_ENCRYPTED
             </div>
          </div>
        </header>

        {/* Messages Window */}
        <section className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 bg-cyan-400/5 rounded-[2.5rem] flex items-center justify-center border border-cyan-400/10 animate-pulse">
                <Brain size={48} className="text-cyan-400/30" />
              </div>
              <div>
                <h2 className="text-2xl font-bold italic tracking-tight">Cosa creiamo insieme oggi?</h2>
                <p className="text-zinc-500 mt-3 text-sm leading-relaxed">
                  Stai parlando con il **{selectedAgent?.name}**. Ho accesso completo alle SOP aziendali e alle linee guida di Mirror. Chiedimi qualunque cosa riguardante il mio reparto.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {['Analizza questo brief', 'Nuovo concept', 'Strategia brand', 'Review lavoro'].map((hint) => (
                  <button 
                    key={hint} 
                    onClick={() => setInput(hint)}
                    className="p-3 text-[10px] font-bold uppercase tracking-widest border border-white/5 bg-white/5 rounded-xl hover:bg-white/10 hover:border-cyan-400/30 transition-all text-zinc-400 hover:text-cyan-400"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex gap-6 ${m.role === 'assistant' ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    m.role === 'assistant' 
                    ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                    : 'bg-zinc-800 text-white border-white/10'
                  }`}>
                    {m.role === 'assistant' ? <Bot size={20} strokeWidth={2.5} /> : <User size={20} />}
                  </div>
                  <div className={`flex flex-col gap-2 max-w-[80%] ${m.role === 'assistant' ? '' : 'items-end'}`}>
                    <div className={`p-5 rounded-3xl text-[15px] leading-relaxed relative ${
                      m.role === 'assistant' 
                      ? 'bg-white/5 border border-white/10 text-zinc-200' 
                      : 'bg-cyan-400 text-black font-medium shadow-[0_10px_30px_rgba(34,211,238,0.1)]'
                    }`}>
                      {m.content.split('\n').map((line, idx) => (
                        <p key={idx} className={line.trim() === '' ? 'h-4' : 'mb-2'}>{line}</p>
                      ))}
                      
                      {/* RAG Snippet Badge (Solo per risposte AI che l'hanno usato) */}
                      {m.role === 'assistant' && i > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 overflow-hidden">
                           <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-400/5 rounded-md border border-cyan-400/10 text-[9px] font-bold uppercase tracking-widest text-cyan-400">
                             <Sparkles size={10} /> SOP-Aligned
                           </div>
                           <div className="text-[9px] text-zinc-600 truncate italic">Informazioni recuperate dalla Knowledge Base aziendale.</div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest px-2">{m.timestamp}</span>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-400 text-black flex items-center justify-center animate-pulse">
                    <Bot size={20} strokeWidth={2.5} />
                  </div>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center gap-3">
                    <Loader2 size={20} className="animate-spin text-cyan-400" />
                    <span className="text-zinc-500 italic text-sm">ANIMA sta elaborando con RAG...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        {/* Input Bar */}
        <section className="p-8 backdrop-blur-xl bg-black/40">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100"></div>
            <div className="relative flex items-center bg-[#0C0C0C] border border-white/10 rounded-[2rem] overflow-hidden focus-within:border-cyan-400/50 transition-all p-2 pr-4 shadow-2xl">
              <input 
                type="text" 
                placeholder={`Messaggio per ${selectedAgent?.name}...`}
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent px-6 py-4 outline-none text-white placeholder:text-zinc-700 font-medium"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 bg-cyan-400 text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                <Send size={20} strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mt-4 text-center">
              ANIMA Hub  ·  Mirror Agency Intellectual Property  ·  Powered by Gemini 1.5 Flash
            </p>
          </form>
        </section>

      </main>
    </div>
  );
}
