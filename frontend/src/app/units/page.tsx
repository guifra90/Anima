"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, 
  Plus, 
  ChevronRight, 
  Users, 
  Target, 
  Layers, 
  Zap,
  TrendingUp,
  Cpu,
  Loader2,
  Trash2,
  Settings,
  AlertTriangle,
  Search,
  Network,
  Shield,
  CheckCircle2,
  GitBranch,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { listUnits, listAllAgents, Unit, AgentInfo, getUnitMetrics, deleteUnit } from '@/lib/anima';
import UnitModal from '@/components/UnitModal';
import ModelManagementModal from '@/components/ModelManagementModal';
import { toast } from 'sonner';
import StatusItem from '@/components/StatusItem';
import UnitOrgNode from '@/components/UnitOrgNode';

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'governance'>('roster');
  const [viewMode, setViewMode] = useState<'grid' | 'schema' | 'org'>('grid');
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [agencyConstitution, setAgencyConstitution] = useState('');
  const [isConstitutionSaving, setIsConstitutionSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [u, a] = await Promise.all([listUnits(), listAllAgents()]);
      setUnits(u);
      setAgents(a);
      
      // Fetch models
      const modelsRes = await fetch('/api/ai-models');
      const modelsData = await modelsRes.json();
      setAiModels(modelsData.models || []);

      // Fetch constitution
      const configRes = await fetch('/api/config?key=agency_constitution');
      const configData = await configRes.json();
      if (configData.value) setAgencyConstitution(configData.value);

      // Fetch metrics for each unit
      const metricsMap: Record<string, any> = {};
      await Promise.all(u.map(async (unit) => {
        const m = await getUnitMetrics(unit.id);
        metricsMap[unit.id] = m;
      }));
      setMetrics(metricsMap);
    } catch (err) {
      console.error("Error fetching units data:", err);
      toast.error("Failed to sync units cortex.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleDelete = async (unit: Unit) => {
    if (!confirm(`DANGER: Permanent unit decommissioning. Are you sure you want to delete ${unit.name}?`)) return;
    try {
      await deleteUnit(unit.id);
      toast.success(`Unit ${unit.name} terminated.`);
      fetchData();
    } catch (err) {
      toast.error("Deletion failed: Structural integrity error.");
    }
  };

  const handleSaveConstitution = async () => {
    setIsConstitutionSaving(true);
    try {
      await fetch('/api/config', {
        method: 'POST',
        body: JSON.stringify({ key: 'agency_constitution', value: agencyConstitution }),
        headers: { 'Content-Type': 'application/json' }
      });
      toast.success("CONSTITUTION_UPDATED");
    } catch (err) {
      toast.error("SYNC_ERROR");
    } finally {
      setIsConstitutionSaving(false);
    }
  };

  const getLeadName = (leadId?: string) => {
    if (!leadId) return "UNASSIGNED_CORE";
    const agent = agents.find(a => a.id === leadId);
    return agent ? agent.name : "UNKNOWN_AGENT";
  };

  const getAgentCount = (unitId: string) => {
    return agents.filter(a => a.units && a.units.includes(unitId)).length;
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.description && u.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    getLeadName(u.lead_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buildUnitTree = (list: Unit[]) => {
    const map = new Map<string, any>();
    const roots: any[] = [];

    list.forEach(u => map.set(u.id, { ...u, children: [] }));
    
    list.forEach(u => {
      const node = map.get(u.id);
      if (u.reports_to && map.has(u.reports_to)) {
        map.get(u.reports_to).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const unitTree = buildUnitTree(units);

  if (loading && units.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="text-cyan-500 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* --- HEADER --- */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-white/[0.03] pb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 text-cyan-500 font-mono text-[9px] font-black uppercase tracking-[0.4em] mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-neural-pulse" />
            Agency_Structure: <span className="text-white">Operating_Units_v4.2_Live</span>
          </div>
          <h1 className="text-5xl font-black tracking-[-0.05em] italic bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent uppercase">
            Operating_Units
          </h1>
          <p className="text-zinc-600 max-w-lg text-[11px] font-bold italic leading-relaxed mt-2 uppercase tracking-tight">
            Gestione dei nuclei operativi e dei perimetri strategici. Monitoraggio del carico neurale e allocazione lead.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/[0.01] p-1 rounded-xl border border-white/5 backdrop-blur-md">
            <button onClick={() => setActiveTab('roster')} className={`px-5 py-2.5 rounded-lg text-[9px] font-black tracking-widest transition-all uppercase italic ${activeTab === 'roster' ? 'bg-white text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}>UNITS</button>
            <button onClick={() => setActiveTab('governance')} className={`px-5 py-2.5 rounded-lg text-[9px] font-black tracking-widest transition-all uppercase italic ${activeTab === 'governance' ? 'bg-cyan-500 text-black shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}>HIERARCHY</button>
          </div>
          
          <div className="w-px h-6 bg-white/10 mx-1" />

          <button onClick={() => { setSelectedUnit(null); setIsModalOpen(true); }} className="flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all shadow-xl italic">
            <Plus size={16} strokeWidth={3} />
            INITIALIZE_UNIT_NODE
          </button>
        </div>
      </header>

      {/* --- SUB_NAV (Contextual) --- */}
      {activeTab === 'roster' && (
        <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative group w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-cyan-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH_NODE_REGISTRY..." 
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-xs focus:border-cyan-400/50 outline-none transition-all placeholder:text-zinc-700 font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <StatusItem label="NOMINAL" value={units.length} color="cyan" />
              <div className="w-px h-6 bg-white/5" />
              <StatusItem label="ACTIVE_CORTEX" value={aiModels.length} color="emerald" />
            </div>

            <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5">
              <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-zinc-600 hover:text-white'}`}>
                <Layers size={18} />
              </button>
              <button onClick={() => setViewMode('schema')} className={`p-3 rounded-xl transition-all ${viewMode === 'schema' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-zinc-600 hover:text-white'}`}>
                <Target size={18} />
              </button>
              <button onClick={() => setViewMode('org')} className={`p-3 rounded-xl transition-all ${viewMode === 'org' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-zinc-600 hover:text-white'}`}>
                <GitBranch size={18} />
              </button>
            </div>
            
            <button 
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center gap-3 bg-white/5 text-zinc-400 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
            >
              <Cpu size={14} className="text-cyan-400" />
              Engines
            </button>
          </div>
        </div>
      )}

      {/* --- CONTENT AREA --- */}
      <main className="max-w-7xl mx-auto">
        {activeTab === 'governance' ? (
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0C0C0C]/80 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 overflow-hidden relative shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/[0.03] blur-[120px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center justify-center text-cyan-400">
                  <Network size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Structural_Hierarchy_Map</h2>
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">Neural Node Organization</p>
                </div>
              </div>

              <div className="w-full overflow-x-auto pb-20 scrollbar-hide">
                <div className="flex justify-center min-w-max pt-10">
                  {unitTree.map((root) => (
                    <UnitOrgNode 
                      key={root.id} 
                      unit={root} 
                      agents={agents} 
                      onEdit={handleEdit} 
                    />
                  ))}
                  {unitTree.length === 0 && (
                    <div className="text-center py-20 text-zinc-700 font-black uppercase tracking-widest italic">
                       NO_HIERARCHY_DATA_SYNCED
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0C0C0C]/80 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 shadow-2xl">
              <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-white/[0.03] rounded-3xl border border-white/10 flex items-center justify-center text-rose-500 shadow-inner">
                  <Shield size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Agency_Operating_Constitution</h2>
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">Behavioral Mandates & Protocol</p>
                </div>
              </div>

              <div className="space-y-8">
                <textarea 
                  rows={12}
                  className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-sm focus:border-cyan-400/50 outline-none resize-none font-mono leading-relaxed shadow-inner"
                  placeholder="Inserisci i mandati globali delle unit..."
                  value={agencyConstitution}
                  onChange={e => setAgencyConstitution(e.target.value)}
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleSaveConstitution}
                    disabled={isConstitutionSaving}
                    className="group relative bg-cyan-400 text-black px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-30 italic overflow-hidden"
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {isConstitutionSaving ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                      COMMIT_CORE_DIRECTIVES
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : viewMode === 'schema' ? (
          <div className="bg-[#0C0C0C] border border-white/[0.05] rounded-[3rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Designation</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Core_ID</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Lead_Anchor</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Agent_Roster</th>
                  <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map(u => (
                  <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    <td className="p-8">
                      <p className="text-sm font-black italic uppercase text-white group-hover:text-cyan-400 transition-colors">{u.name}</p>
                    </td>
                    <td className="p-8 font-mono text-[10px] text-zinc-500 uppercase">{u.id}</td>
                    <td className="p-8 text-[10px] font-bold text-zinc-400 uppercase italic">{getLeadName(u.lead_id)}</td>
                    <td className="p-8">
                       <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-zinc-600 uppercase border border-white/5">{getAgentCount(u.id)} ACTORS</span>
                    </td>
                    <td className="p-8 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEdit(u)} className="p-2 hover:text-cyan-400 transition-colors"><Settings size={14} /></button>
                         <button onClick={() => handleDelete(u)} className="p-2 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'org' ? (
          <div className="w-full overflow-x-auto pb-20 scrollbar-hide pt-10">
            <div className="flex justify-center min-w-max">
              {unitTree.map((root) => (
                <UnitOrgNode 
                  key={root.id} 
                  unit={root} 
                  agents={agents} 
                  onEdit={handleEdit} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredUnits.map(unit => {
                const unitMetrics = metrics[unit.id] || { running: 0, waiting: 0, label: 'SYNCING' };
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={unit.id}
                    className="group relative bg-[#0C0C0C] border border-white/[0.05] rounded-[3.5rem] p-9 transition-all duration-500 overflow-hidden hover:border-cyan-400/30 hover:shadow-[0_30px_70px_rgba(0,0,0,0.9)] interactive h-full flex flex-col"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/[0.03] blur-[80px] rounded-full group-hover:bg-cyan-500/[0.08] transition-all" />
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className="w-16 h-16 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-center group-hover:border-cyan-500/30 transition-all shadow-inner">
                        <BoxIcon size={32} className="text-zinc-800 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => handleEdit(unit)} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 text-zinc-600 hover:text-cyan-400 hover:bg-white/10 transition-all"><Settings size={14}/></button>
                         <button onClick={() => handleDelete(unit)} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-700 italic mb-2">Core_Unit_Cluster</p>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white group-hover:text-cyan-400 transition-colors mb-4">{unit.name}</h3>
                      <p className="text-[10px] text-zinc-600 font-bold italic h-12 line-clamp-2 uppercase leading-relaxed tracking-tight">
                        {unit.description || 'Definition pending structural layer authorization.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-6 pt-10 border-t border-white/[0.03]">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 shadow-inner">
                                 <Users size={14} />
                              </div>
                              <div>
                                 <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest leading-none mb-1">Lead_Orchestrator</p>
                                 <p className="text-[10px] font-bold text-white uppercase italic">{getLeadName(unit.lead_id)}</p>
                              </div>
                           </div>
                           <div className="flex -space-x-3">
                              {agents.filter(a => a.units?.includes(unit.id)).slice(0, 3).map((a, i) => (
                                <div key={i} className="w-9 h-9 rounded-xl bg-zinc-900 border-2 border-[#0C0C0C] flex items-center justify-center shadow-2xl relative">
                                   <div className="w-1 h-1 rounded-full bg-cyan-400 absolute top-1 right-1" />
                                   <span className="text-[9px] font-black text-zinc-500">{a.name.slice(0, 2).toUpperCase()}</span>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Neural_Load: Nominal</span>
                           </div>
                           <ChevronRight size={18} className="text-zinc-800 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <UnitModal 
            unit={selectedUnit} 
            onClose={() => setIsModalOpen(false)} 
            onSave={fetchData} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModelModalOpen && (
          <ModelManagementModal 
            title="AI_ENGINE_CONFIG" 
            items={aiModels} 
            apiPath="/api/ai-models" 
            onClose={() => { setIsModelModalOpen(false); fetchData(); }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component wrapper for icon
function BoxIcon({ size, className }: { size: number, className: string }) {
  return (
    <div className={`relative ${className}`}>
      <Briefcase size={size} />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
    </div>
  );
}
