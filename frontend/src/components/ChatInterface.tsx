"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  Sparkles, 
  User, 
  Cpu, 
  Loader2, 
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  agentId: string;
}

const CD_MODES = [
  { key: 'brief', label: 'Brief Deconstruction' },
  { key: 'concept', label: 'Concept Development' },
  { key: 'brand', label: 'Brand Thinking' },
  { key: 'pitch', label: 'Pitch Preparation' },
  { key: 'review', label: 'Creative Review' },
];

export default function ChatInterface({ agentId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('brief');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messaggi e sessione quando cambiamo agente
    setMessages([{
      role: 'assistant',
      content: `Ciao, sono il tuo ${agentId.replace('-', ' ')}. Come posso aiutarti oggi?`,
      timestamp: new Date()
    }]);
    setCurrentSessionId(null);
  }, [agentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          sessionId: currentSessionId,
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content }))
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Salva l'ID sessione fornito dal server per i messaggi successivi
      if (data.sessionId) setCurrentSessionId(data.sessionId);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `ERRORE: ${err.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#050505] text-zinc-200">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-zinc-950/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Sessione Attiva: <span className="text-white">{agentId.replace('-', ' ')}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {agentId === 'creative-director' && (
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 gap-1">
              {CD_MODES.slice(0, 3).map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setActiveMode(mode.key)}
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase tracking-tighter rounded-md transition-all font-bold",
                    activeMode === mode.key ? "bg-cyan-400 text-black" : "text-zinc-500 hover:text-white"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <Info size={18} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex w-full gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-1",
                msg.role === 'user' 
                  ? "bg-zinc-800 border-zinc-700 text-zinc-400" 
                  : msg.role === 'system'
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-cyan-500/10 border-cyan-400/20 text-cyan-400"
              )}>
                {msg.role === 'user' ? <User size={14} /> : msg.role === 'system' ? <Terminal size={14} /> : <Cpu size={14} />}
              </div>

              <div className={cn(
                "max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed border",
                msg.role === 'user'
                  ? "bg-zinc-900/50 border-white/5 text-zinc-200"
                  : msg.role === 'system'
                  ? "bg-red-500/5 border-red-500/10 text-red-500 font-mono italic"
                  : "bg-white/[0.03] border-white/5 backdrop-blur-3xl text-zinc-100"
              )}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className="mt-2 text-[10px] text-zinc-600 font-mono">
                  {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border bg-cyan-500/10 border-cyan-400/20 text-cyan-400">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-2">
              <span className="text-zinc-600 text-[10px] uppercase font-bold animate-pulse">L'agente sta elaborando...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <footer className="p-8 pt-0">
        <form 
          onSubmit={handleSendMessage}
          className="relative max-w-4xl mx-auto flex items-center bg-zinc-950 border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-cyan-400/30 transition-all duration-500"
        >
          <button type="button" className="p-3 text-zinc-500 hover:text-cyan-400 transition-colors">
            <Sparkles size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Chiedi qualcosa a ${agentId.replace('-', ' ')}...`}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 px-2 placeholder:text-zinc-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isLoading 
                ? "bg-cyan-400 text-black hover:scale-105 active:scale-95 shadow-lg shadow-cyan-400/20" 
                : "bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-[0.2em]">
          Powered by ANIMA Orchestrator v1.4 • Mirror Autonomous Network
        </p>
      </footer>
    </div>
  );
}
