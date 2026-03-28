"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  Shield, 
  FileText, 
  MessageSquare, 
  ChevronRight,
  Monitor,
  Database,
  Search,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-400/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <Zap size={24} className="text-black" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tighter italic">ANIMA OS</span>
        </div>
        <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
           <span>Status: ONLINE</span>
           <span>Latency: 14ms</span>
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-6 backdrop-blur-sm">
            <Shield size={12} /> Autonomous Agency Framework
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent italic">
            Zero Human.<br />Full Intelligence.
          </h1>
          <p className="max-w-xl mx-auto text-zinc-500 text-lg leading-relaxed font-medium">
            ANIMA è il sistema operativo di Mirror Agency. Gestione SOP, orchestrazione agenti e memoria semantica in un'unica interfaccia.
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          
          <Link href="/agents" className="group">
            <div className="h-full p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-cyan-400/50 transition-all duration-500 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-cyan-400/10 transition-colors">
                <MessageSquare size={120} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-400/20 group-hover:scale-110 transition-transform duration-500">
                  <Monitor size={28} className="text-black" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold mb-3 italic">Agent Hub</h2>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6 group-hover:text-zinc-400 transition-colors">
                  Interagisci con il Creative Director, il CFO e gli altri agenti. Accesso completo al RAG Engine.
                </p>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                  ACCEDI AL HUB <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>

          <Link href="/sops" className="group">
            <div className="h-full p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all duration-500 relative overflow-hidden backdrop-blur-xl">
               <div className="absolute top-0 right-0 p-8 text-white/5 group-hover:text-emerald-500/10 transition-colors">
                <Database size={120} strokeWidth={1} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all duration-500">
                  <FileText size={28} className="text-white group-hover:text-black transition-colors" strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl font-bold mb-3 italic">Knowledge Base</h2>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6 group-hover:text-zinc-400 transition-colors">
                  Gestisci le SOP aziendali, carica documenti e monitora l'indicizzazione vettoriale della memoria semantica.
                </p>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                  GESTISCI SOP <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* System Stats Footer */}
        <div className="mt-20 w-full max-w-4xl grid grid-cols-3 gap-8">
           {[
             { label: 'Active Agents', value: '7', icon: Monitor },
             { label: 'SOP Total', value: '24', icon: FileText },
             { label: 'Semantic Chunks', value: '1.2k', icon: Activity }
           ].map((stat, i) => (
             <div key={i} className="flex items-center gap-4 text-zinc-600">
                <stat.icon size={20} strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                  <p className="text-lg font-bold text-zinc-400">{stat.value}</p>
                </div>
             </div>
           ))}
        </div>

      </main>

      <footer className="p-8 border-t border-white/5 text-[10px] text-center font-bold uppercase tracking-[0.3em] text-zinc-700">
        Mirror Agency Intellectual Property © 2026  ·  Autonomous Network for Intelligent Agency
      </footer>

    </div>
  );
}
