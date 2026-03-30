"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  TrendingUp, Zap, Shield, BarChart3, ArrowUpRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await fetch('/api/missions');
        const data = await res.json();
        if (data.missions) {
          setMissions(data.missions);
        }
      } catch (err) {
        console.error("Error fetching missions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  const stats = {
    total: missions.length,
    active: missions.filter(m => m.status === 'active').length,
    completed: missions.filter(m => m.status === 'completed').length,
    successRate: missions.length > 0 ? Math.round((missions.filter(m => m.status === 'completed').length / missions.length) * 100) : 0
  };

  const filteredMissions = missions.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.objective.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-cyan-500/30">
      
      {/* --- HEADER & STATS --- */}
      <header className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-cyan-400">
                        <Target size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter">MISSION CONTROL</h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold italic">Strategic Fleet Intelligence Dashboard</p>
                    </div>
                </div>
            </div>
            
            <Link 
                href="/missions/new" 
                className="group relative flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] italic"
            >
                <Plus size={16} strokeWidth={3} />
                INITIALIZE NEW MISSION
                <div className="absolute inset-0 bg-cyan-400 rounded-2xl blur-[15px] opacity-0 group-hover:opacity-20 transition-opacity" />
            </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { label: 'Total Missions', value: stats.total, icon: <LayoutDashboard size={14}/>, color: 'text-zinc-400' },
                { label: 'Active Stratagem', value: stats.active, icon: <Zap size={14}/>, color: 'text-cyan-400' },
                { label: 'Successful Exec', value: stats.completed, icon: <CheckCircle2 size={14}/>, color: 'text-emerald-400' },
                { label: 'Efficiency Rate', value: `${stats.successRate}%`, icon: <TrendingUp size={14}/>, color: 'text-purple-400' },
            ].map((stat, i) => (
                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
                    <div className={`flex items-center gap-2 ${stat.color} mb-3 font-black text-[9px] uppercase tracking-widest`}>
                        {stat.icon} {stat.label}
                    </div>
                    <div className="text-3xl font-black italic tracking-tighter">{stat.value}</div>
                </div>
            ))}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <div className="relative w-full max-w-md">
                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                    type="text" 
                    placeholder="Search strategic objectives..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-16 pr-8 text-sm outline-none focus:border-cyan-400/30 transition-all placeholder:text-zinc-800"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-4">
                <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-colors">
                    <Filter size={18} />
                </button>
                <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-colors">
                    <BarChart3 size={18} />
                </button>
            </div>
        </div>

        {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 className="animate-spin text-cyan-400" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Accessing Fleet Data...</p>
            </div>
        ) : filteredMissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredMissions.map((m, i) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={m.id}
                        >
                            <Link href={`/missions/${m.id}`} className="group block h-full">
                                <div className="h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 hover:border-cyan-400/30 hover:bg-white/[0.04] transition-all relative overflow-hidden flex flex-col">
                                    {/* Glass gradient highlight */}
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-400/5 blur-[60px] rounded-full group-hover:bg-cyan-400/10 transition-all" />
                                    
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            m.status === 'active' ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' : 
                                            m.status === 'completed' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
                                            'bg-white/5 border-white/10 text-zinc-500'
                                        }`}>
                                            {m.status}
                                        </div>
                                        <ArrowUpRight size={16} className="text-zinc-700 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                    </div>

                                    <h3 className="text-xl font-black italic tracking-tight mb-3 uppercase group-hover:text-cyan-400 transition-colors">{m.title}</h3>
                                    <p className="text-zinc-500 text-xs leading-relaxed italic line-clamp-3 mb-8 flex-1">"{m.objective}"</p>

                                    <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                <Calendar size={10} className="text-zinc-600" />
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-600 tracking-tight">
                                                {new Date(m.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map((_, idx) => (
                                                <div key={idx} className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-zinc-800 flex items-center justify-center text-[8px] font-black">
                                                    A
                                                </div>
                                            ))}
                                            <div className="w-6 h-6 rounded-full border-2 border-[#0A0A0A] bg-cyan-400 flex items-center justify-center text-[8px] font-black text-black">
                                                +
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-800 mb-6">
                    <Shield size={32} />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter mb-2 uppercase">No missions detected</h3>
                <p className="text-zinc-600 text-sm max-w-xs mb-10">La flotta è attualmente silente. Inizia una nuova missione strategica dall'hub.</p>
                <Link href="/missions/new" className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">/ Initialize Fleet</Link>
            </div>
        )}

        <div className="mt-32 pb-12 flex flex-col items-center gap-3 text-center opacity-30">
            <Sparkles size={20} className="text-zinc-800" />
            <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-[0.2em]">
                ANIMA OS — Strategic Management v2.4
            </p>
        </div>
      </main>
    </div>
  );
}
