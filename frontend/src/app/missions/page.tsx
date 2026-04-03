"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Clock, CheckCircle2, AlertCircle, ChevronLeft, 
  LayoutDashboard, Search, Filter, MoreVertical, Loader2, Bot, Sparkles, Send,
  TrendingUp, Zap, Shield, BarChart3, ArrowUpRight, Calendar, Trash2, History, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MissionArchitectModal from '@/components/MissionArchitectModal';

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
  const [isArchitectOpen, setIsArchitectOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchiveView, setIsArchiveView] = useState(false);

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteMission = async (e: React.MouseEvent, missionId: string, title: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Sei sicuro di voler eliminare la missione "${title}"? Tutti i task correlati verranno rimossi.`)) return;
    
    try {
      const res = await fetch(`/api/missions?id=${missionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`Missione ${title} eliminata correttamente`);
        setMissions(prev => prev.filter(m => m.id !== missionId));
      } else {
        toast.error("Errore durante l'eliminazione della missione");
      }
    } catch (err) {
      console.error("Delete mission error", err);
      toast.error("Errore di rete durante l'eliminazione");
    }
  };

  const stats = {
    total: missions.length,
    active: missions.filter(m => m.status === 'active').length,
    completed: missions.filter(m => m.status === 'completed').length,
    successRate: missions.length > 0 ? Math.round((missions.filter(m => m.status === 'completed').length / missions.length) * 100) : 0
  };

  const filteredMissions = missions.filter(m => {
    const isActuallyArchived = m.status === 'completed' || m.status === 'cancelled';
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.objective.toLowerCase().includes(searchTerm.toLowerCase());
    
    return isArchiveView ? (isActuallyArchived && matchesSearch) : (!isActuallyArchived && matchesSearch);
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans selection:bg-cyan-500/30">
      
      {/* --- HEADER MISSION CONTROL STYLE --- */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-white/[0.03] pb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 text-cyan-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-neural-pulse" />
            Strategic_Protocol: <span className="text-white">Live_Sync</span>
          </div>
          <h1 className="text-5xl font-black tracking-[-0.05em] italic bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent uppercase">
            Mission_Control
          </h1>
          <p className="text-zinc-600 max-w-lg text-[11px] font-bold italic leading-relaxed mt-2 uppercase tracking-tight">
            Hub operativo per la supervisione e l'inizializzazione di flussi di lavoro neurali complessi.
          </p>
        </div>

        <button 
            onClick={() => setIsArchitectOpen(true)}
            className="group relative flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl italic interactive"
        >
            <Plus size={16} strokeWidth={3} />
            INITIALIZE_NEW_SEQUENCE
            <div className="absolute inset-0 bg-cyan-400 rounded-xl blur-[15px] opacity-0 group-hover:opacity-10 transition-opacity" />
        </button>
      </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
                { label: 'Total Missions', value: stats.total, icon: <LayoutDashboard size={14}/>, color: 'text-zinc-600' },
                { label: 'Active Tasks', value: stats.active, icon: <Zap size={14}/>, color: 'text-cyan-500' },
                { label: 'Successful Exec', value: stats.completed, icon: <CheckCircle2 size={14}/>, color: 'text-emerald-500' },
                { label: 'Efficiency Rate', value: `${stats.successRate}%`, icon: <TrendingUp size={14}/>, color: 'text-purple-500' },
            ].map((stat, i) => (
                <div key={i} className="control-card rounded-[1.5rem] p-5 relative overflow-hidden h-fit">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       {stat.icon}
                    </div>
                    <div className={`flex items-center gap-2 ${stat.color} mb-3 font-black text-[8px] uppercase tracking-widest italic`}>
                        {stat.icon} {stat.label}
                    </div>
                    <div className="text-3xl font-black italic tracking-tighter">{stat.value}</div>
                </div>
            ))}
        </div>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4">
            <div className="relative flex-1">
                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" />
                <input 
                    type="text" 
                    placeholder={isArchiveView ? "SCAN_OPERATIONAL_ARCHIVES..." : "SCAN_MISSION_REGISTRY..."} 
                    className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-3.5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest placeholder:text-zinc-800 focus:border-cyan-400/30 transition-all italic outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsArchiveView(!isArchiveView)}
                    className={`flex items-center gap-2 px-6 py-3.5 border rounded-xl font-black text-[9px] uppercase tracking-widest transition-all interactive ${isArchiveView ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/[0.01] border-white/5 text-zinc-600 hover:text-white'}`}
                >
                    {isArchiveView ? <History size={14} /> : <Archive size={14} />}
                    {isArchiveView ? 'OPERATIONAL_LOGS' : 'ACCESS_ARCHIVE'}
                </button>
                <button className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-zinc-700 hover:text-white transition-colors interactive">
                    <Filter size={16} />
                </button>
                <button className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-zinc-700 hover:text-white transition-colors interactive">
                    <BarChart3 size={16} />
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
                            <Link href={`/missions/${m.id}`} className="group block h-full interactive">
                                <div className="h-full control-card rounded-[2.5rem] p-7 transition-all duration-500 overflow-hidden flex flex-col relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/[0.03] blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-all" />
                                    
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-2.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${
                                            m.status === 'active' ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400 animate-pulse' : 
                                            m.status === 'completed' ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' :
                                            'bg-white/5 border-white/10 text-zinc-700'
                                        }`}>
                                            {m.status}
                                        </div>
                                        <div className="flex items-center gap-2 relative z-10">
                                            <button 
                                                onClick={(e) => handleDeleteMission(e, m.id, m.title)}
                                                className="p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-zinc-800 hover:text-rose-500 hover:bg-rose-500/10 transition-all interactive"
                                                title="Elimina Missione"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                            <ArrowUpRight size={14} className="text-zinc-800 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black italic tracking-tight mb-2 uppercase group-hover:text-cyan-400 transition-colors leading-tight">{m.title}</h3>
                                    <p className="text-zinc-600 text-[11px] leading-relaxed italic line-clamp-2 mb-6 flex-1 font-bold">"{m.objective}"</p>

                                    <div className="pt-6 border-t border-white/[0.03] flex items-center justify-between mt-auto">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[7px] text-zinc-800 font-mono font-black italic tracking-widest uppercase opacity-50">SYNC_ID://{m.id.slice(0,10)}</p>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <Calendar size={8} className="text-zinc-700" />
                                                <span className="text-[8px] font-mono font-black text-zinc-700 tracking-tighter italic">
                                                    {new Date(m.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex -space-x-1.5 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                            {[1, 2, 3].map((_, idx) => (
                                                <div key={idx} className="w-5 h-5 rounded-lg border border-zinc-950 bg-zinc-900 flex items-center justify-center text-[7px] font-black text-zinc-500">
                                                    AI
                                                </div>
                                            ))}
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
    
      <MissionArchitectModal 
        isOpen={isArchitectOpen} 
        onClose={() => setIsArchitectOpen(false)}
        onMissionCreated={(id: string) => {
          loadData();
          window.location.href = `/missions/${id}`;
        }}
      />
    </div>
      </main>
    </div>
  );
}
