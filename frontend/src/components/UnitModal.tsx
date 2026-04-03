import React, { useState, useEffect } from 'react';
import { X, Briefcase, User, Target, Zap, Loader2, RefreshCw, ChevronDown, ChevronUp, GitBranch, Share2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentInfo, Unit, createUnit, updateUnit, listAllAgents, listUnits, listUnitConnections } from '@/lib/anima';
import { toast } from 'sonner';

interface UnitModalProps {
  unit?: Unit | null;
  onClose: () => void;
  onSave: () => void;
}

export default function UnitModal({ unit, onClose, onSave }: UnitModalProps) {
  const isEditMode = !!unit;
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [activeTab, setActiveTab] = useState<'identity' | 'structural' | 'mandate'>('identity');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [formData, setFormData] = useState<Unit>({
    id: unit?.id || '',
    name: unit?.name || '',
    lead_id: unit?.lead_id || '',
    description: unit?.description || '',
    reports_to: unit?.reports_to || '',
    connections: unit?.connections || []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allAgents, unitsList] = await Promise.all([
          listAllAgents(),
          listUnits()
        ]);
        setAgents(allAgents);
        setAllUnits(unitsList);

        if (isEditMode && unit?.id) {
          const existingConns = await listUnitConnections(unit.id);
          setFormData(prev => ({ ...prev, connections: existingConns }));
        }
      } catch (err) {
        console.error("Error fetching data for unit modal:", err);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [isEditMode, unit?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEditMode && unit?.id) {
        await updateUnit(unit.id, formData);
        toast.success(`Unit ${formData.name} recalibrated.`);
      } else {
        const id = formData.id || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await createUnit({ ...formData, id });
        toast.success(`Unit ${formData.name} deployed to structural layer.`);
      }
      onSave();
      onClose();
    } catch (err: any) {
        console.error("Error saving unit:", err);
        toast.error(`Sync Error: ${err.message || "Protocol mismatch"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleConnection = (id: string) => {
    const current = formData.connections || [];
    const next = current.includes(id) 
      ? current.filter(cid => cid !== id)
      : [...current, id];
    setFormData({ ...formData, connections: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div 
        initial={{ x: '100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
        className="w-full max-w-xl h-full bg-[#0E0E0E] rounded-[3rem] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
            {isEditMode ? '✦ RECONFIGURE_UNIT' : '✦ INITIALIZE_CORE_UNIT'}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/5 flex px-8 shrink-0 overflow-x-auto scrollbar-hide">
          {[
            { id: 'identity', label: 'Identity' },
            { id: 'structural', label: 'Structural Layers' },
            { id: 'mandate', label: 'Strategic Mandate' }
          ].map((tab) => (
            <button 
              key={tab.id}
              type="button" 
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          
          {activeTab === 'identity' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Unit Designation</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Neural Research Labs" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none placeholder:italic" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              {/* Lead Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic leading-none">
                    Orchestrator Lead
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none appearance-none cursor-pointer" 
                    value={formData.lead_id || ''} 
                    onChange={e => setFormData({...formData, lead_id: e.target.value})}
                    disabled={isDataLoading}
                  >
                    <option value="" className="bg-[#0e0e0e] text-zinc-600 font-black uppercase italic">DIRECT_BOARD_PILOT</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id} className="bg-[#0e0e0e] text-white">
                        {agent.name.toUpperCase()} // {agent.role.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700">
                    {isDataLoading ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={14} />}
                  </div>
                </div>
                <p className="text-[10px] text-zinc-700 italic ml-1 mt-1 uppercase font-bold tracking-tight">The lead will coordinate all unit-bound missions by default.</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'structural' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              {/* Reports To (Hierarchy) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <GitBranch size={12} className="text-cyan-400" />
                  Parent Unit (Hierarchical Anchor)
                </label>
                <div className="relative">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none appearance-none cursor-pointer" 
                    value={formData.reports_to || ''} 
                    onChange={e => setFormData({...formData, reports_to: e.target.value})}
                  >
                    <option value="" className="bg-[#0e0e0e] text-zinc-600 font-black uppercase italic">AGENCY_OS_CORE (ROOT)</option>
                    {allUnits.filter(u => u.id !== unit?.id).map(u => (
                      <option key={u.id} value={u.id} className="bg-[#0e0e0e] text-white">
                        {u.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-700">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Connections (Peer links) */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Share2 size={12} className="text-cyan-400" />
                  Strategic Peer Connections
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {allUnits.filter(u => u.id !== unit?.id).map(u => {
                    const isSelected = formData.connections?.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleConnection(u.id)}
                        className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${isSelected ? 'bg-cyan-400/10 border-cyan-400/50 text-white' : 'bg-white/5 border-white/10 text-zinc-600 hover:border-white/20'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-zinc-800'}`} />
                          <span className="text-xs font-bold uppercase tracking-tight">{u.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 size={14} className="text-cyan-400" />}
                      </button>
                    );
                  })}
                  {allUnits.length <= 1 && (
                    <p className="text-center py-4 text-[10px] text-zinc-700 font-black uppercase italic">No other units available for connection</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'mandate' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Core Directive & Mandate</label>
                <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed italic">
                    Definisci il perimetro operativo e gli obiettivi strategici di questo nucleo.
                </p>
                <textarea 
                  rows={8} 
                  placeholder="Define the primary operational purpose..." 
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-sm focus:border-cyan-400/50 outline-none resize-none font-medium italic leading-relaxed" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </motion.div>
          )}

          {/* Advanced Section */}
          <div className="pt-6 border-t border-white/5">
             <button type="button" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="flex items-center gap-2 text-zinc-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.2em] italic">
                {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                SYSTEM_ACCESS_PARAMETERS
             </button>
             
             <AnimatePresence>
                {isAdvancedOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-1 flex justify-between items-center px-1">
                          Unique Core Identifier (Slug)
                          {isLoading && <RefreshCw size={10} className="animate-spin text-cyan-400" />}
                        </label>
                        <input 
                          disabled={isEditMode}
                          type="text" 
                          placeholder="unit-id-manual-override" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-[13px] focus:border-cyan-400/50 outline-none font-mono text-zinc-400 disabled:opacity-30" 
                          value={formData.id} 
                          onChange={e => setFormData({...formData, id: e.target.value})} 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !formData.name} 
            className="group relative w-full bg-white text-black py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-30 italic overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} strokeWidth={3} />
                    SYNCHRONIZING_CORE_DATA...
                  </>
              ) : (
                  <>
                    {isEditMode ? <RefreshCw size={14} strokeWidth={3} /> : <Zap size={14} strokeWidth={3} />}
                    {isEditMode ? "AUTHORIZE_PARAM_UPDATE" : "AUTHORIZE_UNIT_DEPLOYMENT"}
                  </>
              )}
            </div>
            <div className="absolute inset-0 bg-cyan-400 rounded-[2rem] blur-[20px] opacity-0 group-hover:opacity-30 transition-opacity" />
          </button>
        </form>

        <div className="p-8 border-t border-white/5 bg-black/20 text-center shrink-0">
            <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.3em] italic">
                Cortex Integrity Protocol v3.1  ·  Secure Socket
            </p>
        </div>
      </motion.div>
    </div>
  );
}
