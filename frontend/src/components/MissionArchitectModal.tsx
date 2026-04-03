import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Target, Zap, Loader2, Bot, CheckCircle2, AlertCircle, 
  Activity, Cpu, ShieldCheck, Volume2, VolumeX, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Unit {
  id: string;
  name: string;
  lead_id?: string;
}

interface MissionArchitectProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCreated: (missionId: string) => void;
}

export default function MissionArchitectModal({ isOpen, onClose, onMissionCreated }: MissionArchitectProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [step, setStep] = useState<'config' | 'orchestrating'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  
  // Live Stream State
  const [missionId, setMissionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUnits();
    } else {
      // Reset state on close
      setStep('config');
      setMissionId(null);
      setMessages([]);
      setTitle('');
      setObjective('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchUnits = async () => {
    const { data } = await supabase.from('anima_units').select('id, name, lead_id').order('name');
    if (data) setUnits(data);
  };

  const playBeep = useCallback(() => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }, [audioEnabled]);

  const handleLaunch = async () => {
    if (!title || !objective || !selectedUnitId) {
      toast.error("Missing mission parameters.");
      return;
    }

    const unit = units.find(u => u.id === selectedUnitId);
    if (!unit?.lead_id) {
      toast.error("The selected unit has no lead assigned. A 'Brain' is required to plan.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Mission
      const { data: mission, error: mError } = await supabase
        .from('anima_missions')
        .insert([{
          title,
          objective,
          unit_id: selectedUnitId,
          plannerAgentId: unit.lead_id,
          status: 'active',
          execution_mode: 'autonomous'
        }])
        .select()
        .single();

      if (mError) throw mError;
      setMissionId(mission.id);

      // 2. Create initial "Strategic Planning" Task for the Lead
      const { error: tError } = await supabase
        .from('anima_tasks')
        .insert([{
          mission_id: mission.id,
          agent_id: unit.lead_id,
          title: "NEURAL_ORCHESTRATION_PHASE",
          description: `Analyze the objective "${objective}" and generate the operational task sequence for the unit.`,
          status: 'pending',
          order_index: 0
        }]);

      if (tError) throw tError;

      // 3. Start Realtime Listener
      const channel = supabase
        .channel(`mission-architect-${mission.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'anima_messages',
            filter: `mission_id=eq.${mission.id}` 
        }, (payload) => {
            setMessages(prev => [...prev, payload.new]);
            playBeep();
        })
        .subscribe();

      setStep('orchestrating');
      
      // 4. Trigger heartbeat for the planner task
      // We'll call the API to run the specific task
      fetch('/api/tasks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: (await supabase.from('anima_tasks').select('id').eq('mission_id', mission.id).single()).data?.id })
      });

    } catch (err: any) {
      toast.error(`Launch failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
               <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2.5 text-cyan-500 font-mono text-[8px] font-black uppercase tracking-[0.4em] mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    System_Module: <span className="text-white">Mission_Architect</span>
                 </div>
                 <h2 className="text-2xl font-black italic uppercase italic">Launch_Sequence</h2>
               </div>
               <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-xl border transition-all ${audioEnabled ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-white/5 border-white/10 text-zinc-600'}`}
                 >
                   {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                 </button>
                 <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all text-zinc-500"><X size={24} /></button>
               </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-10">
              {step === 'config' ? (
                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Intent Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Operation Deep Scan" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none italic font-bold"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Strategic Objective</label>
                      <textarea 
                        rows={4}
                        placeholder="Describe the high-level intent..." 
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 text-sm focus:border-cyan-400/50 outline-none resize-none italic font-bold"
                        value={objective}
                        onChange={e => setObjective(e.target.value)}
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Unit Resource Delegation</label>
                      <div className="grid grid-cols-2 gap-3">
                        {units.map(unit => (
                          <button
                            key={unit.id}
                            onClick={() => setSelectedUnitId(unit.id)}
                            className={`p-4 rounded-2xl border text-left transition-all ${selectedUnitId === unit.id ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                          >
                             <div className="flex items-center justify-between mb-1">
                               <span className={`text-[10px] font-black uppercase italic ${selectedUnitId === unit.id ? 'text-cyan-400' : 'text-zinc-400'}`}>{unit.name}</span>
                               {selectedUnitId === unit.id && <CheckCircle2 size={12} className="text-cyan-400" />}
                             </div>
                             <p className="text-[7px] text-zinc-800 font-mono uppercase tracking-widest leading-none">
                               Lead: {unit.lead_id ? unit.lead_id.toUpperCase() : 'NO_LEAD_ASSIGNED'}
                             </p>
                          </button>
                        ))}
                      </div>
                   </div>

                   <button 
                    disabled={isLoading || !title || !objective || !selectedUnitId}
                    onClick={handleLaunch}
                    className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] italic hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-30 flex items-center justify-center gap-3"
                   >
                     {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                     INITIALIZE_NEURAL_AUTO_PILOT
                   </button>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col h-full min-h-[400px]">
                  <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl shrink-0">
                    <div className="flex items-center gap-3">
                       <Activity size={16} className="text-cyan-500 animate-neural-pulse" />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white italic uppercase tracking-widest">Brain_Architecting_Phase</span>
                          <span className="text-[7px] text-zinc-700 font-mono font-black uppercase">Executing Strategic Planning Skill...</span>
                       </div>
                    </div>
                    <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[8px] font-black text-cyan-400 uppercase tracking-widest animate-pulse">
                      Live_Datalink
                    </div>
                  </div>

                  <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl p-6 overflow-y-auto font-mono text-[10px] space-y-4 scrollbar-hide">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-800 italic opacity-50 uppercase tracking-widest gap-3">
                        <Loader2 className="animate-spin" size={24} />
                        <p>Awaiting Neural Flux...</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={msg.id} 
                        className={`p-4 rounded-2xl border transition-all ${msg.role === 'system' ? 'bg-cyan-500/[0.02] border-cyan-500/10 text-cyan-600/60' : 'bg-white/[0.02] border-white/5 text-zinc-500'}`}
                      >
                         <div className="flex justify-between items-center mb-2 opacity-50 font-black text-[7px] uppercase tracking-widest">
                           <span className="italic flex items-center gap-1">
                             <div className="w-1 h-1 rounded-full bg-cyan-500" /> {msg.agent_id}
                           </span>
                           <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                         </div>
                         <div className="prose prose-invert prose-xs font-sans italic font-bold text-zinc-400">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                         </div>
                      </motion.div>
                    ))}
                    <div ref={streamEndRef} />
                  </div>

                  <button 
                    onClick={() => {
                        if (missionId) onMissionCreated(missionId);
                        onClose();
                    }}
                    className="w-full py-4 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white hover:bg-white/5 transition-all italic"
                  >
                    CONTINUE_TO_COMMAND_DASHBOARD
                  </button>
                </div>
              )}
            </div>

            {/* Footer decoration */}
            <div className="px-10 py-5 bg-white/[0.01] border-t border-white/5 flex items-center justify-between opacity-30 text-[8px] font-black tracking-widest text-zinc-700 italic uppercase">
               <span>Anima_OS // Strategic_Architect_v2</span>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500" /> GRID_STABLE</div>
                  <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-cyan-500" /> SYNC_HOT</div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
