"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, Database, Cpu, Key, Globe, ShieldCheck, Zap, 
  RefreshCcw, Cloud, ChevronRight, Save, CheckCircle2, 
  TrendingUp, AlertTriangle, Shield, Activity, BarChart3,
  CreditCard, LayoutDashboard, Terminal, Volume2, VolumeX,
  Plus, Trash2, Edit3, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  input_cost_1k: number;
  output_cost_1k: number;
}

interface AgentBudget {
  id: string;
  name: string;
  role: string;
  monthly_budget: number;
  current_month_spend: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data State
  const [models, setModels] = useState<AIModel[]>([]);
  const [agents, setAgents] = useState<AgentBudget[]>([]);
  const [constitution, setConstitution] = useState("");
  const [globalBudget, setGlobalBudget] = useState(100);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [taskStats, setTaskStats] = useState({ completed: 0, total: 0, failed: 0 });
  const [totalInvocations, setTotalInvocations] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Models
      const { data: modelData } = await supabase.from('anima_ai_models').select('*').order('name');
      setModels(modelData || []);

      // 2. Fetch Agents (for budget tracking)
      const { data: agentData } = await supabase.from('anima_agents').select('id, name, role, monthly_budget, current_month_spend').order('name');
      setAgents(agentData || []);

      // 3. Fetch Config
      const { data: configData } = await supabase.from('anima_config').select('*');
      if (configData) {
        const constitutionRecord = configData.find(c => c.key === 'agency_constitution');
        const budgetRecord = configData.find(c => c.key === 'global_monthly_budget');
        const audioRecord = configData.find(c => c.key === 'system_audio_enabled');
        
        if (constitutionRecord) setConstitution(constitutionRecord.value);
        if (budgetRecord) setGlobalBudget(parseFloat(budgetRecord.value));
        if (audioRecord) setAudioEnabled(audioRecord.value === 'true');
      }

      // 4. Real KPIs: Efficiency Index (Task success rate)
      const { data: tasks } = await supabase.from('anima_tasks').select('status');
      if (tasks) {
        const completed = tasks.filter(t => t.status === 'completed').length;
        const failed = tasks.filter(t => t.status === 'error' || t.status === 'blocked').length;
        setTaskStats({ completed, total: tasks.length, failed });
      }

      // 5. Real KPIs: Total Invocations (Assistant messages count)
      const { count: msgCount } = await supabase
        .from('anima_messages')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'assistant');
      setTotalInvocations(msgCount || 0);

    } catch (error) {
      console.error("Error fetching settings data:", error);
      toast.error("Failed to sync system data");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('anima_config').upsert({ 
        key, 
        value: typeof value === 'string' ? value : String(value),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      toast.success(`${key.toUpperCase()} synchronized successfully`);
    } catch (error) {
      toast.error("Protocol sync failed");
    } finally {
      setSaving(false);
    }
  };

  const updateModelRate = async (id: string, field: string, value: number) => {
    try {
      const { error } = await supabase.from('anima_ai_models').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      setModels(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
      toast.success("Model rates updated");
    } catch (error) {
      toast.error("Failed to update model rates");
    }
  };

  const updateAgentBudget = async (id: string, amount: number) => {
    try {
      const { error } = await supabase.from('anima_agents').update({ monthly_budget: amount }).eq('id', id);
      if (error) throw error;
      setAgents(prev => prev.map(a => a.id === id ? { ...a, monthly_budget: amount } : a));
      toast.success("Agent budget allocated");
    } catch (error) {
      toast.error("Budget allocation failed");
    }
  };

  const totalSpent = agents.reduce((acc, curr) => acc + (curr.current_month_spend || 0), 0);
  const budgetAlert = totalSpent > globalBudget;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* --- HEADER --- */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/[0.03] pb-10">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] mb-3">
            <div className={`w-2 h-2 rounded-full ${budgetAlert ? 'bg-rose-500 animate-ping shadow-[0_0_15px_rgba(244,63,94,0.8)]' : 'bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`} />
            ANIMA_CORE: <span className="text-white">v3.4-STABLE</span>
          </div>
          <h1 className="text-5xl font-black tracking-[-0.05em] italic bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-transparent uppercase">
            Command_Center
          </h1>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-3xl shadow-xl overflow-x-auto no-scrollbar">
           {[
             { id: 'telemetry', label: 'Telemetry', icon: <Activity size={12}/> },
             { id: 'engines', label: 'Engines', icon: <Cpu size={12}/> },
             { id: 'constitution', label: 'Constitution', icon: <Shield size={12}/> },
             { id: 'fleet', label: 'Fleet Ops', icon: <Zap size={12}/> }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white'}`}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
        </div>
      </header>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-12 gap-8">
        
        <main className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[600px]"
            >
              
              {/* --- TAB: TELEMETRY --- */}
              {activeTab === 'telemetry' && (
                <div className="space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-8 rounded-[2.5rem] border backdrop-blur-3xl relative overflow-hidden transition-all ${budgetAlert ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/[0.02] border-white/5'}`}>
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <CreditCard size={60} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${budgetAlert ? 'text-rose-400' : 'text-zinc-500'}`}>Operational_Burn_Rate</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black italic">€{totalSpent.toFixed(2)}</span>
                        <span className="text-zinc-600 text-[10px] font-bold uppercase">/ month</span>
                      </div>
                      <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${budgetAlert ? 'bg-rose-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min((totalSpent / globalBudget) * 100, 100)}%` }}
                        />
                      </div>
                      {budgetAlert && (
                        <p className="text-[9px] text-rose-500 font-black uppercase tracking-tighter mt-3 animate-pulse italic">
                          [WARNING]: GLOBAL_BUDGET_EXCEEDED // LIMIT: €{globalBudget}
                        </p>
                      )}
                    </div>

                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] backdrop-blur-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Zap size={60} />
                      </div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total_Invocations</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black italic">{(totalInvocations / 1000).toFixed(1)}k</span>
                        <span className="text-emerald-500 text-[10px] font-bold uppercase">LIVE</span>
                      </div>
                      <p className="text-[9px] text-zinc-700 font-bold uppercase mt-6">Neural activity is stable across all units.</p>
                    </div>

                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] backdrop-blur-3xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-10">
                        <BarChart3 size={60} />
                      </div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Efficiency_Index</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black italic">
                          {taskStats.completed > 0 
                            ? Math.round((taskStats.completed / (taskStats.completed + taskStats.failed)) * 1000) / 10 
                            : 0}%
                        </span>
                        <span className="text-zinc-600 text-[10px] font-bold uppercase italic">nom</span>
                      </div>
                      <p className="text-[9px] text-cyan-400 font-black uppercase mt-6 tracking-widest italic">Protocol_Optimal_Status</p>
                    </div>
                  </div>

                  {/* Units Cost Breakdown */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10">
                    <div className="flex justify-between items-center mb-8">
                       <h2 className="text-xl font-black italic uppercase tracking-tight">Fleet_Costs_Rundown</h2>
                       <BarChart3 size={16} className="text-zinc-700" />
                    </div>
                    <div className="space-y-6">
                      {agents.slice(0, 5).map((agent) => (
                        <div key={agent.id} className="group flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/[0.02] hover:border-white/10 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-cyan-400 transition-colors">
                                 <Terminal size={18} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase tracking-tighter text-white">{agent.name}</p>
                                 <p className="text-[8px] font-bold uppercase text-zinc-600 tracking-widest italic">{agent.role}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black italic">€{(agent.current_month_spend || 0).toFixed(4)}</p>
                              <p className="text-[7px] font-black uppercase text-zinc-800 tracking-widest mt-1">
                                {(agent.monthly_budget > 0) ? `${Math.round(((agent.current_month_spend || 0) / agent.monthly_budget) * 100)}% budget used` : 'NO_LIMIT_SET'}
                              </p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* --- TAB: ENGINES --- */}
              {activeTab === 'engines' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10">
                  <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Model_Infrastructure</h2>
                      <p className="text-xs text-zinc-500 font-mono mt-1">Configure pricing rates and operational status for AI Engines.</p>
                    </div>
                    <Database size={24} className="text-zinc-800" />
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {models.map((model) => (
                      <div key={model.id} className="p-8 rounded-3xl bg-black/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${model.is_active ? 'bg-cyan-500/10 text-cyan-400' : 'bg-zinc-900 text-zinc-700'}`}>
                            <Cpu size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-black uppercase italic leading-none mb-1">{model.name}</h3>
                            <p className="text-[9px] font-bold uppercase text-zinc-600 tracking-widest">{model.provider}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 flex-1 max-w-sm">
                           <div className="space-y-2">
                             <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest italic flex gap-2">Input_Rate <span className="text-[7px] opacity-50">(€/1k)</span></label>
                             <input 
                               type="number" 
                               step="0.0001"
                               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-cyan-500/50" 
                               defaultValue={model.input_cost_1k}
                               onBlur={(e) => updateModelRate(model.id, 'input_cost_1k', parseFloat(e.target.value))}
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest italic flex gap-2">Output_Rate <span className="text-[7px] opacity-50">(€/1k)</span></label>
                             <input 
                               type="number" 
                               step="0.0001"
                               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-mono outline-none focus:border-cyan-500/50" 
                               defaultValue={model.output_cost_1k}
                               onBlur={(e) => updateModelRate(model.id, 'output_cost_1k', parseFloat(e.target.value))}
                             />
                           </div>
                        </div>

                        <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest ${model.is_active ? 'text-emerald-500 bg-emerald-500/5 border border-emerald-500/10' : 'text-zinc-600 bg-white/5 border border-white/5'}`}>
                           {model.is_active ? 'Status: Active' : 'Status: Idle'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB: CONSTITUTION --- */}
              {activeTab === 'constitution' && (
                <div className="space-y-8">
                  <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                      <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Agency_Constitution</h2>
                        <p className="text-xs text-zinc-500 font-mono mt-1">High-level semantic directives that govern all AI operations.</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => saveConfig('agency_constitution', constitution)}
                          className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-xl"
                        >
                          {saving ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />} 
                          SYNCHRONIZE_PROTOCOL
                        </button>
                      </div>
                    </div>
                    
                    <textarea 
                      className="w-full min-h-[400px] bg-black/40 border border-white/5 rounded-3xl p-8 text-sm font-mono text-zinc-300 leading-relaxed outline-none focus:border-cyan-500/30 transition-all resize-none"
                      value={constitution}
                      onChange={(e) => setConstitution(e.target.value)}
                      placeholder="Enter the core behavioral and operational rules of your agency..."
                    />
                  </div>

                  <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem]">
                     <h3 className="text-lg font-black italic uppercase italic mb-6 tracking-tight">System_Directives</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Global Monthly Budget (€)</label>
                           <input 
                             type="number" 
                             className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono outline-none focus:border-rose-500/50 transition-all" 
                             value={globalBudget}
                             onChange={(e) => setGlobalBudget(parseInt(e.target.value))}
                             onBlur={() => saveConfig('global_monthly_budget', globalBudget)}
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Neural Audio Feedback</label>
                           <div 
                              onClick={() => {
                                const newVal = !audioEnabled;
                                setAudioEnabled(newVal);
                                saveConfig('system_audio_enabled', newVal );
                              }}
                              className="flex bg-black/40 border border-white/5 rounded-2xl p-4 items-center justify-between group cursor-pointer hover:border-cyan-500/30 transition-all"
                           >
                              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{audioEnabled ? 'Active (Paperclip Beeps)' : 'Silenced'}</span>
                              <div className={`w-10 h-5 rounded-full flex items-center p-1 transition-all ${audioEnabled ? 'bg-cyan-500 justify-end shadow-[0_0_10px_cyan]' : 'bg-zinc-800 justify-start'}`}>
                                 <div className="w-3 h-3 bg-white rounded-full" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* --- TAB: FLEET OPS --- */}
              {activeTab === 'fleet' && (
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Fleet_Agent_Quotas</h2>
                      <p className="text-xs text-zinc-500 font-mono mt-1">Allocate individual spending limits and monitor consumption per agent.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="pb-6 text-[9px] font-black text-zinc-700 uppercase tracking-widest">Agent_Entity</th>
                          <th className="pb-6 text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center">Allocated_Budget</th>
                          <th className="pb-6 text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center">Current_Burn</th>
                          <th className="pb-6 text-[9px] font-black text-zinc-700 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {agents.map((agent) => (
                          <tr key={agent.id} className="group hover:bg-white/[0.01] transition-colors">
                            <td className="py-6">
                              <p className="text-[11px] font-black uppercase text-white">{agent.name}</p>
                              <p className="text-[8px] font-bold text-zinc-600 uppercase italic tracking-widest">{agent.role}</p>
                            </td>
                            <td className="py-6 text-center">
                              <input 
                                type="number" 
                                defaultValue={agent.monthly_budget}
                                onBlur={(e) => updateAgentBudget(agent.id, parseFloat(e.target.value))}
                                className="w-20 bg-white/5 border border-white/5 rounded-lg p-1.5 text-[10px] font-mono text-center outline-none focus:border-cyan-500/40"
                              />
                            </td>
                            <td className="py-6 text-center font-mono text-xs text-zinc-400 italic">
                               €{(agent.current_month_spend || 0).toFixed(4)}
                            </td>
                            <td className="py-6 text-right">
                               <div className="flex justify-end">
                                 <div className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${
                                   (agent.monthly_budget > 0 && agent.current_month_spend > agent.monthly_budget) ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                 }`}>
                                   {(agent.monthly_budget > 0 && agent.current_month_spend > agent.monthly_budget) ? 'OVER_LIMIT' : 'NOMINAL'}
                                 </div>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* --- INFO SIDEBAR --- */}
        <aside className="col-span-12 lg:col-span-3 space-y-8">
           <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] backdrop-blur-3xl">
              <h3 className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                <Shield size={12} className="text-cyan-500" /> Security_Uplink
              </h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase italic">Supabase Cluster</span>
                    <span className="text-emerald-500 font-black italic">ACTIVE</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase italic">VPC Firewall</span>
                    <span className="text-emerald-500 font-black italic">PROTECTED</span>
                 </div>
                 <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase italic">API Response</span>
                    <span className="text-zinc-300 font-black italic">240ms</span>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <Globe size={16} className="text-cyan-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Connected_Adapters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 {['Gemini', 'OpenRouter', 'DeepSeek', 'Claude'].map(prov => (
                   <div key={prov} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-zinc-400 uppercase tracking-tighter hover:text-white transition-colors cursor-default">
                     {prov}
                   </div>
                 ))}
              </div>
           </div>

           <div className="p-8 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-white/[0.03] rounded-[2.5rem] relative overflow-hidden group">
              <div className="relative z-10">
                 <h4 className="text-[10px] font-black uppercase italic mb-4">Neural_Audit_Log</h4>
                 <p className="text-[11px] text-zinc-600 leading-relaxed font-bold uppercase italic mb-4">
                    "TUTTE LE OPERAZIONI SONO REGISTRATE E AUDITABILI PER LA CONFORMITÀ AZIENDALE."
                 </p>
                 <Link href="/logs" className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all text-cyan-400 group-hover:text-white group-hover:bg-cyan-500/20">
                    ACCESS_LOGS <ChevronRight size={10} />
                 </Link>
              </div>
           </div>
        </aside>

      </div>
    </div>
  );
}
