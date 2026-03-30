"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, Search, Shield, Zap, ChevronRight, Bot, Cpu, GitBranch, 
  MoreVertical, X, CheckCircle2, AlertCircle, Loader2, Settings, Mail, Briefcase,
  Plus, Trash2, Key, Globe, RefreshCw, ChevronDown, ChevronUp, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  bio?: string;
  avatar_url?: string;
  model_id?: string;
  reports_to?: string;
  traits?: string[];
  directives?: string;
}

interface Department {
  id: string;
  name: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  api_key?: string;
  base_url?: string;
}

export default function HiringHall() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [aiModels, setAiModels] = useState<AIModel[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isHiringModalOpen, setIsHiringModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'org'>('grid');
  
  // Form state for New/Edit Agent
  const [newAgent, setNewAgent] = useState<Agent>({
    id: '',
    name: '',
    role: '',
    department: '',
    bio: '',
    model_id: '',
    reports_to: '',
    traits: [],
    directives: '',
    status: 'offline'
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugChecking, setIsSlugChecking] = useState(false);
  const [isIdManual, setIsIdManual] = useState(false);
  
  const [updatingAgentId, setUpdatingAgentId] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [agencyConstitution, setAgencyConstitution] = useState<string>('');
  const [isConstitutionSaving, setIsConstitutionSaving] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'identity' | 'traits' | 'directives'>('identity');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'team' | 'agency'>('team');

  useEffect(() => {
    fetchInitialData();
    fetchSystemHealth();
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) setSystemHealth(await res.json());
    } catch (err) {
      console.error("Health check error", err);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [agRes, depRes, modRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/departments'),
        fetch('/api/ai-models')
      ]);
      
      const [agData, depData, modData] = await Promise.all([
        agRes.json(),
        depRes.json(),
        modRes.json()
      ]);
      
      if (agData.agents) setAgents(agData.agents);
      if (depData.departments) setDepartments(depData.departments);
      if (modData.models) setAiModels(modData.models);

      // Fetch Global Constitution
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        const constitution = configData.config.find((c: any) => c.key === 'agency_constitution');
        if (constitution) setAgencyConstitution(typeof constitution.value === 'string' ? constitution.value : JSON.stringify(constitution.value));
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openHireModal = () => {
    setIsEditMode(false);
    setIsIdManual(false);
    setIsAdvancedOpen(false);
    setNewAgent({
      id: '',
      name: '',
      role: '',
      department: departments[0]?.id || '',
      bio: '',
      model_id: aiModels[0]?.id || '',
      reports_to: '',
      traits: [],
      directives: '',
      status: 'offline'
    });
    setActiveModalTab('identity');
    setIsHiringModalOpen(true);
  };

  const openEditModal = (agent: Agent) => {
    setIsEditMode(true);
    setIsIdManual(true);
    setIsAdvancedOpen(false);
    setNewAgent({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      department: agent.department || '',
      bio: agent.bio || '',
      model_id: agent.model_id || '',
      reports_to: agent.reports_to || '',
      traits: agent.traits || [],
      directives: agent.directives || '',
      status: agent.status || 'offline'
    });
    setActiveModalTab('identity');
    setIsHiringModalOpen(true);
  };

  // --- Unique Slug Logic ---
  const generateUniqueSlug = async (name: string) => {
    if (!name) return "";
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let isUnique = false;
    let counter = 0;

    setIsSlugChecking(true);
    while (!isUnique && counter < 10) {
      const res = await fetch(`/api/agents?check_slug=${slug}`);
      const data = await res.json();
      if (data.unique) {
        isUnique = true;
      } else {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    }
    setIsSlugChecking(false);
    return slug;
  };

  const handleNameBlur = async () => {
    if (!isEditMode && newAgent.name && !isIdManual) {
      const slug = await generateUniqueSlug(newAgent.name);
      setNewAgent(p => ({...p, id: slug}));
    }
  };

  const handleHireAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = isEditMode ? 'PATCH' : 'POST';
      const body = isEditMode ? { ...newAgent } : {
          ...newAgent,
          system_prompt: `Sei il ${newAgent.role} di Mirror Agency. Il tuo compito è ${newAgent.bio}.`
      };

      const res = await fetch('/api/agents', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setIsHiringModalOpen(false);
        fetchInitialData();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (err) {
      console.error("Error saving agent", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickModelUpdate = async (agentId: string, modelId: string) => {
    setUpdatingAgentId(agentId);
    try {
      const res = await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: agentId, model_id: modelId })
      });
      
      if (res.ok) {
        // Update local state without full reload for instant feedback
        setAgents(prev => prev.map(a => a.id === agentId ? { ...a, model_id: modelId } : a));
      } else {
        const error = await res.json();
        alert(`Errore aggiornamento rapido: ${error.error}`);
      }
    } catch (err) {
      console.error("Error quick updating model", err);
    } finally {
      setUpdatingAgentId(null);
    }
  };

  const handleSaveConstitution = async () => {
    setIsConstitutionSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'agency_constitution', value: agencyConstitution })
      });
      if (!res.ok) alert("Error saving constitution");
    } catch (err) {
      console.error(err);
    } finally {
      setIsConstitutionSaving(false);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.department && a.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- ORG CHART DATA BUILDER ---
  const buildAgentTree = (list: Agent[]) => {
    const map = new Map<string, any>();
    const roots: any[] = [];

    list.forEach(a => map.set(a.id, { ...a, children: [] }));
    
    list.forEach(a => {
      const node = map.get(a.id);
      if (a.reports_to && map.has(a.reports_to)) {
        map.get(a.reports_to).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const agentTree = buildAgentTree(agents);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Users size={28} className="text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter">HIRING HALL</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Autonomous Workforce Management</p>
            </div>
          </div>
          <p className="text-zinc-400 max-w-xl text-sm leading-relaxed">
            Gestisci il tuo team di agenti autonomi. Definisci gerarchie, assegna modelli LLM specializzati e scala la tua operatività Mirror.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {systemHealth && (
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl mr-2">
              <div className="flex flex-col gap-1">
                <StatusItem label="SUPABASE" status={systemHealth.services.supabase.status} />
                <StatusItem label="OLLAMA" status={systemHealth.services.ollama.status} />
              </div>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <div className="flex flex-col gap-1">
                <StatusItem label="GEMINI" status={systemHealth.services.ai_providers.gemini.status} />
                <StatusItem label="OPENROUTER" status={systemHealth.services.ai_providers.openrouter.status} />
              </div>
            </div>
          )}

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setActiveSettingsTab('team')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSettingsTab === 'team' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>TEAM</button>
            <button onClick={() => setActiveSettingsTab('agency')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSettingsTab === 'agency' ? 'bg-cyan-400 text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>AGENCY</button>
          </div>
          
          <div className="w-px h-6 bg-white/10 mx-2" />

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><Users size={16} /></button>
            <button onClick={() => setViewMode('org')} className={`p-2 rounded-lg transition-all ${viewMode === 'org' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}><GitBranch size={16} /></button>
          </div>
          <button onClick={openHireModal} className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
            <UserPlus size={18} strokeWidth={3} />
            HIRE AGENT
          </button>
        </div>
      </header>

      {/* --- SEARCH & FILTERS --- */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            type="text" 
            placeholder="Search agents by name, role or unit..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:border-cyan-400/50 focus:bg-white/[0.07] outline-none transition-all placeholder:text-zinc-700"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setIsDeptModalOpen(true)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-cyan-400 transition-colors">DEPARTMENTS</button>
            <button onClick={() => setIsModelModalOpen(true)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-cyan-400 transition-colors">MODELS</button>
        </div>
      </div>      {/* --- AGENT GRID / ORG CHART --- */}
      {activeSettingsTab === 'agency' ? (
        /* --- AGENCY CONFIGURATION --- */
        <main className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0C0C0C] border border-white/10 rounded-[3rem] p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] rounded-full" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-cyan-400">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter">AGENCY CONSTITUTION</h2>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Global Behavioral Governance</p>
              </div>
            </div>

            <p className="text-zinc-400 text-sm mb-8 leading-relaxed italic">
              Questi mandati universali vengono iniettati nel subconscio di ogni agente. Definiscono i confini etici, stilistici e operativi insuperabili per l'intera Mirror Agency.
            </p>

            <div className="space-y-4 mb-10">
              <textarea 
                rows={12}
                placeholder="Inserisci i mandati globali..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-sm focus:border-cyan-400/50 outline-none resize-none font-mono leading-relaxed"
                value={agencyConstitution}
                onChange={e => setAgencyConstitution(e.target.value)}
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleSaveConstitution}
                  disabled={isConstitutionSaving}
                  className="flex items-center gap-2 bg-cyan-400 text-black px-8 py-3 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  {isConstitutionSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  SAVE CONSTITUTION
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Zap size={14} className="text-cyan-400" />
                  Esempi di Mandati
                </h4>
                <ul className="text-[11px] text-zinc-500 space-y-2 list-disc pl-4">
                  <li>"Tutti i report finanziari devono includere un'analisi dei rischi."</li>
                  <li>"Non usare mai un linguaggio eccessivamente generico."</li>
                  <li>"Attribuisci sempre le fonti di dati esterni."</li>
                </ul>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Bot size={14} className="text-cyan-400" />
                  Governance Automatica
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Queste direttive vengono lette dal motore Mirror prima di ogni task, garantendo che anche i modelli più ampi (come Claude 3.5 o GPT-4o) rispettino il protocollo locale.
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      ) : viewMode === 'grid' ? (
        <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-[2rem] border border-white/5 animate-pulse" />
              ))
            ) : filteredAgents.map((agent) => (
              <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={agent.id} className="group relative bg-[#0C0C0C] border border-white/10 rounded-[2rem] p-8 hover:border-cyan-400/30 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 blur-[50px] rounded-full group-hover:bg-cyan-400/10 transition-all" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group-hover:border-cyan-400/50 transition-colors">
                    <Bot size={28} className="text-cyan-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditModal(agent)} className="p-2 bg-white/5 rounded-lg border border-white/10 text-zinc-600 hover:text-cyan-400 hover:bg-white/10 transition-all">
                        <Edit3 size={14} />
                    </button>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${agent.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                        {agent.status}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold tracking-tight mb-1 group-hover:text-cyan-400 transition-colors">{agent.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-2">
                    {agent.department || 'General'}  <span className="w-1 h-1 bg-zinc-800 rounded-full" /> {agent.role}
                  </p>
                </div>

                {agent.traits && agent.traits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {agent.traits.slice(0, 3).map(trait => (
                      <span key={trait} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-bold text-zinc-500 group-hover:border-cyan-400/20 group-hover:text-zinc-300 transition-all">{trait}</span>
                    ))}
                    {agent.traits.length > 3 && <span className="text-[8px] text-zinc-700 font-bold">+{agent.traits.length - 3}</span>}
                  </div>
                )}
                
                <p className="text-sm text-zinc-400 line-clamp-2 min-h-[2.5rem] mb-6 leading-relaxed">{agent.bio || 'Nessuna biografia definita.'}</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 flex-grow">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {updatingAgentId === agent.id ? <Loader2 size={12} className="animate-spin text-cyan-400" /> : <Cpu size={14} className="text-zinc-500" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest leading-none mb-1">AI Engine Provider</p>
                      <div className="relative">
                        <select 
                          className="w-full bg-transparent text-[10px] font-bold text-zinc-300 italic border-none outline-none appearance-none cursor-pointer hover:text-cyan-400 transition-colors"
                          value={agent.model_id || ''}
                          onChange={(e) => handleQuickModelUpdate(agent.id, e.target.value)}
                          disabled={updatingAgentId !== null}
                        >
                          <option value="" disabled>Not Set</option>
                          {aiModels.map(m => (
                            <option key={m.id} value={m.id} className="bg-[#0E0E0E] text-white py-2">{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>
      ) : (
        /* --- ORG CHART --- */
        <main className="max-w-7xl mx-auto bg-white/[0.02] border border-white/5 rounded-[3rem] p-12 min-h-[60vh] overflow-x-auto overflow-y-visible">
            <div className="flex justify-center min-w-max pb-12">
                {agentTree.map(node => (
                    <OrgNode key={node.id} agent={node} onEdit={openEditModal} />
                ))}
            </div>
            {agentTree.length === 0 && !isLoading && (
                <div className="text-center text-zinc-500 uppercase text-[10px] font-black tracking-widest italic py-20">Nessuna gerarchia definita. Assungi il tuo primo agente.</div>
            )}
        </main>
      )}

      {/* --- HIRING / EDIT MODAL --- */}
      <AnimatePresence>
        {isHiringModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-w-xl h-full bg-[#0E0E0E] rounded-[3rem] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-white/[0.02] border-b border-white/5 flex px-8">
                {['identity', 'traits', 'directives'].map((tab) => (
                  <button 
                    key={tab}
                    type="button" 
                    onClick={() => setActiveModalTab(tab as any)}
                    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeModalTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <form onSubmit={handleHireAgent} className="flex-1 overflow-y-auto p-10 space-y-8">
                {activeModalTab === 'identity' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Full Agent Name</label>
                        <input required type="text" placeholder="e.g. Leo Mirror" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none" value={newAgent.name} 
                              onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                              onBlur={handleNameBlur}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Strategic Role</label>
                        <input required type="text" placeholder="e.g. Head of Strategy" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none" value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex justify-between items-center px-1">
                            Department
                        </label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none appearance-none" value={newAgent.department} onChange={e => setNewAgent({...newAgent, department: e.target.value})}>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          {departments.length === 0 && <option value="">No Departments Defined</option>}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex justify-between items-center px-1">
                            AI Model Engine
                        </label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none appearance-none" value={newAgent.model_id} onChange={e => setNewAgent({...newAgent, model_id: e.target.value})}>
                          {aiModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          {aiModels.length === 0 && <option value="">No Models Configured</option>}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Reports To</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none appearance-none" value={newAgent.reports_to} onChange={e => setNewAgent({...newAgent, reports_to: e.target.value})}>
                          <option value="">Directly to Board (Umano)</option>
                          {agents.filter(a => a.id !== newAgent.id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Mission & Bio</label>
                      <textarea rows={4} required placeholder="Descrivi l'obiettivo primario..." className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none resize-none" value={newAgent.bio} onChange={e => setNewAgent({...newAgent, bio: e.target.value})} />
                    </div>
                  </motion.div>
                )}

                {activeModalTab === 'traits' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={14} className="text-cyan-400" />
                        Behavioral Matrix
                      </h4>
                      <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed italic">
                        Seleziona le caratteristiche che definiscono la personalità di questo agente. Influenzano il tono, la meticolosità e la propensione al rischio.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Analytical', 'Meticulous', 'Aggressive', 'Cautious', 'Direct', 'Creative', 'Frugal', 'Fast-Paced', 'Formal', 'Collaborative'].map(trait => {
                          const isActive = newAgent.traits?.includes(trait);
                          return (
                            <button 
                              key={trait}
                              type="button"
                              onClick={() => {
                                const currentTraits = newAgent.traits || [];
                                const nextTraits = isActive 
                                  ? currentTraits.filter((t: string) => t !== trait)
                                  : [...currentTraits, trait];
                                setNewAgent({...newAgent, traits: nextTraits});
                              }}
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${isActive ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                            >
                              {trait}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeModalTab === 'directives' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Role Directives & Mandates</label>
                      <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                        Regole specifiche che l'agente DEVE seguire in ogni task. Esempi: "Non citare competitor", "Mantieni il budget sotto i 5k", "Usa tabelle per i dati".
                      </p>
                      <textarea rows={10} placeholder="Uno per riga o paragrafo..." className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-sm focus:border-cyan-400/50 outline-none resize-none font-mono" value={newAgent.directives} onChange={e => setNewAgent({...newAgent, directives: e.target.value})} />
                    </div>
                  </motion.div>
                )}

                <div className="pt-6 border-t border-white/5">
                    <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                        {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        Advanced Technical Details
                    </button>
                    
                    <AnimatePresence>
                        {isAdvancedOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex justify-between items-center px-1">
                                            Unique ID (Slug / Handle)
                                            {isSlugChecking && <RefreshCw size={10} className="animate-spin text-cyan-400" />}
                                        </label>
                                        <input type="text" placeholder="auto-generated-slug" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none placeholder:italic" value={newAgent.id} 
                                            onChange={e => {
                                                setNewAgent({...newAgent, id: e.target.value});
                                                setIsIdManual(true);
                                            }} 
                                            disabled={isEditMode && !isAdvancedOpen}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black text-lg tracking-tighter italic hover:shadow-[0_20px_50px_rgba(34,211,238,0.2)] disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : isEditMode ? "UPDATE AGENT" : "AUTHORIZE DEPLOYMENT"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DEPARTMENTS MODAL --- */}
      <AnimatePresence>
        {isDeptModalOpen && <EntityManagementModal title="DEPARTMENTS" items={departments} apiPath="/api/departments" onClose={() => { setIsDeptModalOpen(false); fetchInitialData(); }} />}
      </AnimatePresence>

      {/* --- MODELS MODAL --- */}
      <AnimatePresence>
        {isModelModalOpen && <ModelManagementModal title="AI ENGINE CONFIG" items={aiModels} apiPath="/api/ai-models" onClose={() => { setIsModelModalOpen(false); fetchInitialData(); }} />}
      </AnimatePresence>

    </div>
  );
}

// --- ORG CHART COMPONENTS ---

function OrgNode({ agent, onEdit }: { agent: any, onEdit: (agent: any) => void }) {
    return (
        <div className="flex flex-col items-center relative mx-4">
            {/* Agent Card */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="group relative bg-[#0C0C0C] border border-white/10 rounded-2xl p-6 w-56 hover:border-cyan-400/50 transition-all duration-300 z-10 shadow-xl">
                <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-cyan-400">
                        <Bot size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate tracking-tight">{agent.name}</h4>
                        <p className="text-[10px] text-zinc-500 uppercase font-black truncate">{agent.role}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 ${agent.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'}`}>
                        <span className={`w-1 h-1 rounded-full ${agent.status === 'online' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        {agent.status}
                    </div>
                    <button onClick={() => onEdit(agent)} className="text-zinc-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Settings size={12} />
                    </button>
                </div>
            </motion.div>

            {/* Sub-agents / Connection Lines */}
            {agent.children && agent.children.length > 0 && (
                <>
                    <div className="w-px h-12 bg-white/20 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <div className="relative flex justify-center">
                        {/* Horizontal connector line */}
                        {agent.children.length > 1 && (
                            <div className="absolute top-0 h-px bg-white/20" 
                                 style={{ 
                                     left: `calc(50% / ${agent.children.length})`,
                                     right: `calc(50% / ${agent.children.length})`
                                 }} 
                            />
                        )}
                        {agent.children.map((child: any) => (
                            <OrgNode key={child.id} agent={child} onEdit={onEdit} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}


// --- SUB-COMPONENTS FOR ENTITY MANAGEMENT ---

function EntityManagementModal({ title, items, apiPath, onClose }: any) {
    const [newItem, setNewItem] = useState({ id: '', name: '' });
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    
    const handleAdd = async () => {
        if (!newItem.name) return;
        // Auto-generate ID if empty
        const id = newItem.id || newItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await fetch(apiPath, { method: 'POST', body: JSON.stringify({ ...newItem, id }) });
        setNewItem({ id: '', name: '' });
        onClose();
    };

    const handleDelete = async (id: string) => {
        await fetch(`${apiPath}?id=${id}`, { method: 'DELETE' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0E0E0E] p-8 rounded-[3rem] border border-white/10 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-black italic">{title}</h2>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                
                <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2">
                    {items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl group">
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <p className="text-[10px] text-zinc-600 font-black uppercase">{item.id}</p>
                            </div>
                            <button onClick={() => handleDelete(item.id)} className="text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 border-t border-white/5 pt-6">
                    <input type="text" placeholder="Display Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    
                    <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="text-[9px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-1 hover:text-white transition-all">
                        {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Advanced
                    </button>
                    
                    {isAdvancedOpen && (
                        <input type="text" placeholder="ID (auto-generated if empty)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] outline-none" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})} />
                    )}
                    
                    <button onClick={handleAdd} className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase hover:bg-cyan-400 transition-colors">ADD {title.slice(0,-1)}</button>
                </div>
            </motion.div>
        </div>
    );
}

function ModelManagementModal({ title, items, apiPath, onClose }: any) {
    const [newItem, setNewItem] = useState({ id: '', name: '', provider: 'gemini', api_key: '', base_url: '' });
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    const handleAdd = async () => {
        if (!newItem.name) return;
        const id = newItem.id || newItem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await fetch(apiPath, { method: 'POST', body: JSON.stringify({...newItem, id, is_active: true}) });
        onClose();
    };

    const handleDelete = async (id: string) => {
        await fetch(`${apiPath}?id=${id}`, { method: 'DELETE' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0E0E0E] p-10 rounded-[3rem] border border-white/10 w-full max-w-2xl shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black italic">{title}</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Engines</p>
                        {items.map((item: any) => (
                            <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl group relative">
                                <p className="font-bold text-sm text-cyan-400">{item.name}</p>
                                <p className="text-[9px] text-zinc-500 font-black uppercase">{item.provider} • {item.id}</p>
                                <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 border-l border-white/5 pl-8">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Register New Model</p>
                        <input type="text" placeholder="Visual Name (e.g. Gemini 2.0)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                        
                        <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="text-[9px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-1 hover:text-white transition-all">
                            {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Advanced
                        </button>
                        
                        {isAdvancedOpen && (
                            <input type="text" placeholder="Model ID / Slug" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] outline-none" value={newItem.id} onChange={e => setNewItem({...newItem, id: e.target.value})} />
                        )}

                        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none appearance-none" value={newItem.provider} onChange={e => setNewItem({...newItem, provider: e.target.value})}>
                            <option value="gemini">Google Gemini</option>
                            <option value="anthropic">Anthropic Claude</option>
                            <option value="openai">OpenAI GPT</option>
                            <option value="ollama">Ollama (Local)</option>
                        </select>
                        <div className="relative">
                            <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input type="password" placeholder="API Key" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs outline-none" value={newItem.api_key} onChange={e => setNewItem({...newItem, api_key: e.target.value})} />
                        </div>
                        <div className="relative">
                            <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input type="text" placeholder="Base URL (Ollama only)" className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs outline-none" value={newItem.base_url} onChange={e => setNewItem({...newItem, base_url: e.target.value})} />
                        </div>
                        <button onClick={handleAdd} className="w-full bg-cyan-400 text-black py-4 rounded-xl font-black text-xs uppercase hover:shadow-[0_10px_30px_rgba(34,211,238,0.2)] transition-all">REGISTER ENGINE</button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function StatusItem({ label, status }: { label: string, status: string }) {
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'connected':
      case 'configured': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'missing': return 'bg-zinc-700';
      case 'offline':
      case 'error': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
      default: return 'bg-zinc-500';
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(status)}`} />
      <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[6px] text-zinc-600 font-medium ml-auto">
        {status === 'configured' || status === 'connected' ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
