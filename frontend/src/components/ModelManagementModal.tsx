import React, { useState } from 'react';
import { 
  X, Trash2, Key, Globe, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface ModelManagementModalProps {
  title: string;
  items: any[];
  apiPath: string;
  onClose: () => void;
}

export default function ModelManagementModal({ title, items, apiPath, onClose }: ModelManagementModalProps) {
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
