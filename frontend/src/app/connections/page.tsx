"use client";

import React, { useState, useEffect } from 'react';
import { 
  Key, Globe, Trash2, Plus, Mail, Calendar, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight,
  Shield, Zap, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Connection {
  id: string;
  type: 'gmail' | 'gcal' | 'scoro';
  name: string;
  created_at: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newConnectionType, setNewConnectionType] = useState<'gmail' | 'gcal' | 'scoro' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scoro Form State
  const [scoroForm, setScoroForm] = useState({
    name: '',
    apiKey: '',
    companyId: '',
    baseUrl: 'https://proweb.scoro.com/api/v2/'
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) setConnections(data.connections);
    } catch (err) {
      console.error("Failed to fetch connections", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScoro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scoro',
          name: scoroForm.name,
          credentials: {
            apiKey: scoroForm.apiKey,
            companyId: scoroForm.companyId,
            baseUrl: scoroForm.baseUrl
          }
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setNewConnectionType(null);
        fetchConnections();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa connessione?')) return;
    try {
      const res = await fetch(`/api/connections?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <Link href="/team" className="p-3 bg-white/5 rounded-2xl border border-white/10 text-zinc-500 hover:text-white transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                  <Key size={18} className="text-black" />
                </div>
                <h1 className="text-2xl font-black italic tracking-tighter">CONNECTIONS</h1>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold ml-1">Secure Credential Vault</p>
            </div>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Plus size={18} strokeWidth={3} />
            ADD NEW ACCOUNT
          </button>
        </header>

        {/* --- INFO CARD --- */}
        <div className="bg-cyan-400/5 border border-cyan-400/20 rounded-3xl p-8 mb-12 flex items-start gap-6">
          <div className="p-4 bg-cyan-400/10 rounded-2xl text-cyan-400">
            <Shield size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Zero Human Security Protocol</h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Le tue chiavi API e i token OAuth vengono criptati utilizzando **AES-256-GCM** prima di essere salvati. 
              ANIMA le utilizza solo durante l'esecuzione dei task autorizzati e non vengono mai esposte nel frontend.
            </p>
          </div>
        </div>

        {/* --- CONNECTIONS GRID --- */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => <div key={i} className="h-32 bg-white/5 rounded-3xl border border-white/10 animate-pulse" />)}
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]">
            <Globe size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-bold italic">Nessun account collegato. Aggiungi la tua prima integrazione per potenziare i tuoi agenti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {connections.map(conn => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={conn.id} 
                className="group relative bg-[#0C0C0C] border border-white/10 rounded-3xl p-6 hover:border-cyan-400/30 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 ${
                    conn.type === 'scoro' ? 'bg-orange-500/10 text-orange-500' : 
                    conn.type === 'gmail' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {conn.type === 'scoro' ? <Zap size={28} /> : 
                     conn.type === 'gmail' ? <Mail size={28} /> : <Calendar size={28} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{conn.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none mt-1">
                      {conn.type} account • Linked {new Date(conn.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(conn.id)}
                    className="p-3 bg-white/5 rounded-xl text-zinc-700 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* --- ADD CONNECTION MODAL --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0E0E0E] rounded-[3rem] border border-white/10 p-10 relative shadow-2xl"
            >
              <button 
                onClick={() => { setIsAddModalOpen(false); setNewConnectionType(null); }}
                className="absolute top-8 right-8 text-zinc-600 hover:text-white"
              >
                <X size={24} />
              </button>

              {!newConnectionType ? (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter mb-2 text-cyan-400">CONNECT SERVICE</h2>
                    <p className="text-sm text-zinc-500">Scegli il provider che desideri integrare.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <ProviderButton 
                      icon={<Zap size={24} />} 
                      name="Scoro" 
                      onClick={() => setNewConnectionType('scoro')} 
                      color="orange"
                    />
                    <ProviderButton 
                      icon={<Mail size={24} />} 
                      name="Gmail" 
                      onClick={() => window.location.href = '/api/auth/google'} 
                      color="red"
                    />
                    <ProviderButton 
                      icon={<Calendar size={24} />} 
                      name="GCal" 
                      onClick={() => window.location.href = '/api/auth/google'} 
                      color="blue"
                    />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddScoro} className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter mb-2 uppercase text-orange-500">SCORO SETUP</h2>
                    <p className="text-xs text-zinc-500">Inserisci le credenziali API per il tuo account Scoro.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Account Nickname</label>
                      <input required type="text" placeholder="e.g. Scoro Client XYZ" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-orange-500/50 outline-none" value={scoroForm.name} onChange={e => setScoroForm({...scoroForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">API Key</label>
                      <input required type="password" placeholder="••••••••••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-orange-500/50 outline-none" value={scoroForm.apiKey} onChange={e => setScoroForm({...scoroForm, apiKey: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Company ID</label>
                      <input required type="text" placeholder="e.g. 123456" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-orange-500/50 outline-none" value={scoroForm.companyId} onChange={e => setScoroForm({...scoroForm, companyId: e.target.value})} />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 text-black py-5 rounded-3xl font-black text-lg tracking-tighter italic hover:shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : "FINALIZE CONNECTION"}
                  </button>
                  <button type="button" onClick={() => setNewConnectionType(null)} className="w-full text-zinc-600 text-[10px] font-black uppercase hover:text-white">Back to selection</button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

function ProviderButton({ icon, name, onClick, color, disabled = false }: any) {
  const colors: any = {
    orange: 'hover:bg-orange-500/20 border-orange-500/10 text-orange-500',
    red: 'hover:bg-red-500/20 border-red-500/10 text-red-500',
    blue: 'hover:bg-blue-500/20 border-blue-500/10 text-blue-500'
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between p-6 bg-white/5 border rounded-3xl transition-all ${colors[color]} ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xl font-black italic uppercase tracking-tighter">{name}</span>
      </div>
      {!disabled && <ChevronRight size={20} />}
      {disabled && <span className="text-[8px] font-black uppercase opacity-50">Coming Soon</span>}
    </button>
  );
}
