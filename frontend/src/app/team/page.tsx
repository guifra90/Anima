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
  skills?: string[];
  active_connections?: string[];
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
    skills: [],
    active_connections: [],
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
  const [activeModalTab, setActiveModalTab] = useState<'identity' | 'traits' | 'directives' | 'skills' | 'connections'>('identity');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'team' | 'agency'>('team');
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);

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

      // Fetch Skills and Connections
      const [skillsRes, connRes] = await Promise.all([
        fetch('/api/skills'),
        fetch('/api/connections')
      ]);
      if (skillsRes.ok) {
        const skillsData = await skillsRes.json();
        setAvailableSkills(skillsData.skills || []);
      }
      if (connRes.ok) {
        const connData = await connRes.json();
        setUserConnections(connData.connections || []);
      }

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
      skills: [],
      active_connections: [],
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
      skills: agent.skills || [],
      active_connections: agent.active_connections || [],
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
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 border-b border-white/[0.03] pb-10">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
            Workforce Status: <span className="text-white">Optimized</span>
          </div>
          <h1 className="text-6xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white to-white/20 bg-clip-text text-transparent uppercase">
            Hiring Hall
          </h1>
          <p className="text-zinc-500 max-w-xl text-xs font-bold italic leading-relaxed mt-4">
            Gestisci la tua rete di agenti autonomi. Definisci gerarchie, assegna modelli LLM specializzati e scala la tua operatività Mirror con precisione millimetrica.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-3xl">
            <button onClick={() => setActiveSettingsTab('team')} className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${activeSettingsTab === 'team' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>ROSTER</button>
            <button onClick={() => setActiveSettingsTab('agency')} className={`px-6 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${activeSettingsTab === 'agency' ? 'bg-cyan-500 text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}>GOVERNANCE</button>
          </div>
          
          <div className="w-px h-8 bg-white/10 mx-2" />

          <button onClick={openHireModal} className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] hover:bg-cyan-500 hover:text-white transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <UserPlus size={20} strokeWidth={3} />
            HIRE_AGENT
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
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 ml-4">
            <button onClick={() => setViewMode('grid')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${viewMode === 'grid' ? 'bg-white text-black shadow-lg shadow-black/40' : 'text-zinc-600 hover:text-white'}`}>GRID</button>
            <button onClick={() => setViewMode('org')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${viewMode === 'org' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-zinc-600 hover:text-white'}`}>ORG</button>
        </div>
        <div className="w-px h-8 bg-white/10 mx-2" />
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
                <div key={i} className="h-64 bg-white/5 rounded-[3rem] border border-white/5 animate-pulse" />
              ))
            ) : filteredAgents.map((agent) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                key={agent.id} 
                className="group relative bg-zinc-950/40 backdrop-blur-3xl border border-white/[0.05] rounded-[3rem] p-10 hover:border-cyan-500/30 transition-all duration-500 overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full group-hover:bg-cyan-500/10 transition-all" />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors shadow-inner">
                    <Bot size={32} className="text-cyan-500" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEditModal(agent)} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-zinc-600 hover:text-cyan-400 hover:bg-white/10 transition-all">
                        <Edit3 size={16} />
                    </button>
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${agent.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-800'}`} />
                        {agent.status}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-2xl font-black italic tracking-tight mb-2 group-hover:text-cyan-400 transition-colors uppercase">{agent.name}</h3>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">{agent.department || 'CORE_UNIT'}</span>
                    <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">{agent.role}</span>
                  </div>
                </div>

                {agent.traits && agent.traits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {agent.traits.slice(0, 3).map(trait => (
                      <span key={trait} className="px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-all italic">{trait}</span>
                    ))}
                    {agent.traits.length > 3 && <span className="text-[9px] text-zinc-800 font-black italic">+{agent.traits.length - 3}</span>}
                  </div>
                )}
                
                <p className="text-xs text-zinc-500 line-clamp-2 min-h-[3rem] mb-8 leading-relaxed font-bold italic">{agent.bio || 'Initial_Orchestration_Mandate: Pending Description...'}</p>
                
                <div className="pt-8 border-t border-white/[0.03] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {updatingAgentId === agent.id ? <Loader2 size={16} className="animate-spin text-cyan-400" /> : <Cpu size={18} className="text-zinc-600" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[8px] text-zinc-700 font-black uppercase tracking-widest leading-none mb-1.5 italic">Engine_Provider</p>
                      <div className="relative">
                        <select 
                          className="w-full bg-transparent text-[10px] font-black text-cyan-500 italic border-none outline-none appearance-none cursor-pointer hover:text-white transition-all uppercase tracking-widest"
                          value={agent.model_id || ''}
                          onChange={(e) => handleQuickModelUpdate(agent.id, e.target.value)}
                          disabled={updatingAgentId !== null}
                        >
                          <option value="" disabled>NOT_ALLOCATED</option>
                          {aiModels.map(m => (
                            <option key={m.id} value={m.id} className="bg-[#0E0E0E] text-white py-2">{m.name.toUpperCase()}</option>
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
          <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setIsHiringModalOpen(false); }}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="w-full max-w-xl h-full bg-[#0E0E0E] rounded-[3rem] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Header: Title + X button — always visible, never scrolled */}
              <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                  {isEditMode ? '✦ EDIT AGENT' : '✦ HIRE AGENT'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsHiringModalOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                  title="Chiudi pannello"
                >
                  <X size={16} />
                </button>
              </div>
              {/* Tabs row — scrollable independently */}
              <div className="border-b border-white/5 flex px-8 overflow-x-auto scrollbar-hide shrink-0">
                {['identity', 'traits', 'directives', 'skills', 'connections'].map((tab) => (
                  <button 
                    key={tab}
                    type="button" 
                    onClick={() => setActiveModalTab(tab as any)}
                    className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeModalTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
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

                {activeModalTab === 'skills' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap size={14} className="text-cyan-400" />
                        Available Skills & Toolsets
                      </h4>
                      <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed italic">
                        Seleziona i set di strumenti che l'agente sarà in grado di utilizzare autonomamente.
                      </p>
                      <div className="space-y-3">
                        {availableSkills.map(skill => {
                          const isActive = newAgent.skills?.includes(skill.id);
                          return (
                            <button 
                              key={skill.id}
                              type="button"
                              onClick={() => {
                                const current = newAgent.skills || [];
                                const next = isActive ? current.filter(id => id !== skill.id) : [...current, skill.id];
                                setNewAgent({...newAgent, skills: next});
                              }}
                              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${isActive ? 'bg-cyan-400/10 border-cyan-400/50 text-white' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                            >
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest">{skill.name}</p>
                                <p className="text-[10px] opacity-60 mt-1">{skill.description}</p>
                              </div>
                              {isActive && <CheckCircle2 size={16} className="text-cyan-400" />}
                            </button>
                          );
                        })}
                        {availableSkills.length === 0 && <p className="text-center text-[10px] text-zinc-600 uppercase font-black py-4">No skills registered in /skills directory</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeModalTab === 'connections' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Key size={14} className="text-cyan-400" />
                        Authorized Connections
                      </h4>
                      <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed italic">
                        Scegli a quali dei tuoi account collegati questo agente può accedere.
                      </p>
                      {userConnections.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-[10px] text-zinc-600 uppercase font-black mb-4">No connections found</p>
                          <button type="button" onClick={() => window.location.href='/connections'} className="text-xs text-cyan-400 hover:underline font-bold">Go to Connections Page</button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userConnections.map(conn => {
                            const isActive = newAgent.active_connections?.includes(conn.id);
                            return (
                              <button 
                                key={conn.id}
                                type="button"
                                onClick={() => {
                                  const current = newAgent.active_connections || [];
                                  const next = isActive ? current.filter(id => id !== conn.id) : [...current, conn.id];
                                  setNewAgent({...newAgent, active_connections: next});
                                }}
                                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${isActive ? 'bg-cyan-400/10 border-cyan-400/50 text-white' : 'bg-white/5 border-white/10 text-zinc-500 hover:border-white/20'}`}
                              >
                                <div>
                                  <p className="text-xs font-black uppercase tracking-widest">{conn.name}</p>
                                  <p className="text-[10px] opacity-60 mt-1 capitalize">{conn.type} account</p>
                                </div>
                                {isActive && <CheckCircle2 size={16} className="text-cyan-400" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
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
        <div className="flex flex-col items-center relative mx-8">
            {/* Agent Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="group relative bg-[#0C0C0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-6 w-64 hover:border-cyan-400/50 transition-all duration-500 z-10 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <GitBranch size={40} />
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                        <Bot size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-base font-black truncate tracking-tight uppercase italic text-white group-hover:text-cyan-400 transition-colors">{agent.name}</h4>
                        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest italic">{agent.role}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 ${agent.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500 font-bold'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-zinc-800'}`} />
                        {agent.status}
                    </div>
                    <button onClick={() => onEdit(agent)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-zinc-600 hover:text-cyan-400 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                        <Settings size={14} />
                    </button>
                </div>
            </motion.div>

            {/* Sub-agents / Connection Lines */}
            {agent.children && agent.children.length > 0 && (
                <>
                    <div className="w-px h-16 bg-gradient-to-b from-cyan-400 to-white/10 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    </div>
                    <div className="relative flex justify-center gap-4">
                        {/* Horizontal connector line */}
                        {agent.children.length > 1 && (
                            <div className="absolute top-0 h-px bg-white/10" 
                                 style={{ 
                                     left: `calc(100% / (${agent.children.length} * 2))`,
                                     right: `calc(100% / (${agent.children.length} * 2))`
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
