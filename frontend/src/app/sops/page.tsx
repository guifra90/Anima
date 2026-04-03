"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Shield, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  X,
  Save,
  CheckCircle,
  Clock,
  Briefcase,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SOP {
  id?: string;
  title: string;
  units: string[];
  owner: string;
  content: string;
  version: string;
  status: string;
  last_updated: string;
}

export default function SOPSPage() {
  const [sops, setSops] = useState<SOP[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSOP, setCurrentSOP] = useState<SOP | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSops();
  }, []);

  const fetchSops = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/sops');
      const data = await res.json();
      if (data.sops) setSops(data.sops);
    } catch (err) {
      console.error("Error fetching SOPs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSOP) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/sops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentSOP)
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        setCurrentSOP(null);
        fetchSops();
      }
    } catch (err) {
      console.error("Error saving SOP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Sei sicuro di voler eliminare questa procedura? L'azione è irreversibile e i dati verranno rimossi anche dalla memoria semantica (RAG).")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sops?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchSops();
      }
    } catch (err) {
      console.error("Error deleting SOP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openNewSOP = () => {
    setCurrentSOP({
      title: '',
      units: ['Operations'],
      owner: 'Francesco Guidotti',
      content: '',
      version: '1.0.0',
      status: 'active',
      last_updated: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const filteredSops = sops.filter(sop => 
    sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sop.units && sop.units.some(u => u.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="flex-1 h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Header Area */}
      <header className="px-10 py-12 border-b border-white/[0.03] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Semantic Engine: <span className="text-white">Indexed</span>
          </div>
          <h1 className="text-6xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent uppercase">
            Knowledge Base
          </h1>
          <p className="text-zinc-500 text-xs font-bold mt-4 uppercase tracking-widest italic leading-relaxed">Standard Operating Procedures & Intelligence Assets</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={openNewSOP}
            className="bg-white text-black px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-cyan-500 hover:text-white transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
          >
            <Plus size={20} strokeWidth={3} />
            AUTHOR_PROTOCOL
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-8 relative">
        {isEditing ? (
          <div className="max-w-4xl mx-auto anime-fade-in">
            <button 
              onClick={() => setIsEditing(false)}
              className="text-zinc-500 hover:text-white flex items-center gap-2 mb-8 transition-all"
            >
              <ArrowLeft size={18} />
              Torna alla lista
            </button>

            <form onSubmit={handleSave} className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Titolo Procedura</label>
                  <input 
                    required
                    value={currentSOP?.title}
                    onChange={e => setCurrentSOP(prev => prev ? {...prev, title: e.target.value} : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-400 outline-none transition-all placeholder:text-zinc-700"
                    placeholder="E.g. Procedura Setup Progetto Scoro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Unità Operativa</label>
                  <select 
                    value={currentSOP?.units?.[0] || ''}
                    onChange={e => setCurrentSOP(prev => prev ? {...prev, units: [e.target.value]} : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-400 outline-none transition-all"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Creative">Creative</option>
                    <option value="Finance">Finance</option>
                    <option value="Strategy">Strategy</option>
                    <option value="Production">Production</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Contenuto (Markdown)</label>
                <textarea 
                  required
                  rows={15}
                  value={currentSOP?.content}
                  onChange={e => setCurrentSOP(prev => prev ? {...prev, content: e.target.value} : null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-400 outline-none transition-all font-mono text-sm leading-relaxed"
                  placeholder="# Scrivi qui la procedura operativa..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 text-zinc-400 hover:text-white transition-all uppercase text-xs font-bold tracking-widest"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-cyan-400 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Salvataggio...' : (
                    <>
                      <Save size={18} />
                      SALVA E INDICIZZA
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-10 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <input 
                type="text"
                placeholder="Cerca per titolo o reparto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-cyan-400/20 focus:border-cyan-400 outline-none transition-all text-lg backdrop-blur-sm"
              />
            </div>

            {/* Empty State */}
            {filteredSops.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center anime-fade-in">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <FileText size={40} className="text-zinc-700" />
                </div>
                <h3 className="text-xl font-medium text-zinc-400">Nessuna procedura trovata</h3>
                <p className="text-zinc-600 max-w-xs mt-2">Inizia a digitalizzare il know-how aziendale aggiungendo la prima SOP.</p>
                <button 
                  onClick={openNewSOP}
                  className="mt-8 text-cyan-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:gap-3 transition-all"
                >
                  Crea SOP <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* SOP List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto pb-20">
              {filteredSops.map((sop) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={sop.id} 
                  className="group bg-zinc-950/40 backdrop-blur-3xl border border-white/[0.05] rounded-[3rem] p-10 hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden shadow-2xl"
                  onClick={() => {
                    setCurrentSOP(sop);
                    setIsEditing(true);
                  }}
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Shield size={80} />
                  </div>

                  <div className="flex justify-between items-start mb-8">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20 transition-all shadow-inner">
                      <FileText size={28} className="text-zinc-600 group-hover:text-cyan-500 transition-all" />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] uppercase tracking-widest text-zinc-500 font-black italic">
                        V{sop.version}
                       </span>
                       <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] uppercase tracking-widest text-emerald-400 font-black italic">
                        {sop.status}
                       </span>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black italic group-hover:text-cyan-400 transition-all mb-4 uppercase leading-tight">{sop.title}</h3>
                  <div className="flex items-center gap-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest italic pt-6 border-t border-white/[0.03]">
                    <span className="flex items-center gap-2">
                      <Briefcase size={14} className="text-zinc-700" /> {sop.units?.join(', ') || 'UNASSIGNED'}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-zinc-700" /> {new Date(sop.last_updated).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="absolute bottom-10 right-10 flex items-center gap-4">
                    <button
                      onClick={(e) => handleDelete(sop.id!, e)}
                      className="p-3 text-zinc-800 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all z-20 group/del"
                      title="Elimina SOP"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-zinc-800 group-hover:text-cyan-400 group-hover:bg-white/10 transition-all">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
