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
  Briefcase
} from 'lucide-react';

interface SOP {
  id?: string;
  title: string;
  department: string;
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

  const openNewSOP = () => {
    setCurrentSOP({
      title: '',
      department: 'Operations',
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
    sop.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
      {/* Header Area */}
      <header className="px-8 py-10 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic">
            Standard Operating Procedures
          </h1>
          <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-medium">MIRROR KNOWLEDGE BASE</p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={openNewSOP}
            className="bg-cyan-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            <Plus size={20} strokeWidth={3} />
            AGGIUNGI PROCEDURA
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
                  <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Reparto</label>
                  <select 
                    value={currentSOP?.department}
                    onChange={e => setCurrentSOP(prev => prev ? {...prev, department: e.target.value} : null)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto anime-fade-in">
              {filteredSops.map((sop) => (
                <div 
                  key={sop.id} 
                  className="group bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-cyan-400/50 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => {
                    setCurrentSOP(sop);
                    setIsEditing(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-cyan-400/10 group-hover:border-cyan-400/20 transition-all">
                      <Shield size={24} className="text-zinc-400 group-hover:text-cyan-400 transition-all" />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] uppercase tracking-tighter text-zinc-500 font-bold">
                        V{sop.version}
                       </span>
                       <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] uppercase tracking-tighter text-emerald-400 font-bold">
                        {sop.status}
                       </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold group-hover:text-cyan-400 transition-all mb-2 truncate pr-6">{sop.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Briefcase size={12} /> {sop.department}
                    </span>
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock size={12} /> {new Date(sop.last_updated).toLocaleDateString()}
                    </span>
                  </div>

                  <ChevronRight size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
