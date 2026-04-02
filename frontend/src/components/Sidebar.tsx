'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Cpu, 
  Briefcase, 
  Workflow, 
  Database, 
  Key,
  ChevronRight,
  ShieldCheck,
  Bot,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { name: 'Missions', href: '/', icon: Workflow },
  { name: 'Hiring Hall', href: '/team', icon: Users },
  { name: 'Agent Hub', href: '/agents', icon: Bot },
  { name: 'Knowledge Base', href: '/sops', icon: ShieldCheck },
  { name: 'Departments', href: '/departments', icon: Briefcase },
  { name: 'Governance', href: '/governance', icon: Shield },
  { name: 'Connections', href: '/connections', icon: Key },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-68 bg-zinc-950/40 backdrop-blur-3xl border-r border-white-[0.03] flex flex-col h-screen sticky top-0 overflow-hidden shadow-[20px_0_50px_-20px_rgba(0,0,0,0.5)]">
      {/* Brand Header */}
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-white/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <Cpu size={20} className="text-white relative z-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[15px] font-black tracking-[-0.05em] text-white uppercase leading-none mb-0.5">ANIMA</h1>
            <p className="text-[8px] font-black text-cyan-500/80 uppercase tracking-[0.25em] leading-none">Intelligence OS</p>
          </div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-10 overflow-y-auto scrollbar-hide">
        <section>
          <div className="px-4 mb-4 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em]">Core Execution</span>
            <div className="h-px bg-white/5 flex-1 ml-4" />
          </div>
          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-white/[0.04] text-white border border-white/10 shadow-inner" 
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02] border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div className={cn(
                      "p-1.5 rounded-lg transition-colors duration-300",
                      isActive ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"
                    )}>
                      <Icon size={16} />
                    </div>
                    <span className="text-[13px] font-semibold tracking-tight transition-all group-hover:translate-x-0.5">{item.name}</span>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-5 bg-cyan-500 rounded-r-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                    />
                  )}
                  {isActive && <ChevronRight size={12} className="text-cyan-500/40 relative z-10" />}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Resources Section */}
        <section>
          <div className="px-4 mb-4 flex items-center justify-between">
            <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.2em]">Resources</span>
            <div className="h-px bg-white/5 flex-1 ml-4" />
          </div>
          <div className="space-y-1.5">
            <Link
              href="/docs"
              className={cn(
                "group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all border border-transparent hover:border-white/5",
                pathname.startsWith('/docs') ? "bg-white/[0.04] text-white border-white/10" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02]"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                pathname.startsWith('/docs') ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"
              )}>
                <BarChart3 size={16} /> {/* Placeholder for BookOpen or similar if not imported */}
              </div>
              <span className="text-[13px] font-semibold tracking-tight">Manual & Docs</span>
            </Link>
             <Link
              href="/settings"
              className="group flex items-center gap-3.5 px-4 py-2.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.02] rounded-xl transition-all border border-transparent hover:border-white/5"
            >
              <div className="p-1.5 rounded-lg text-zinc-600 group-hover:text-zinc-400">
                <Settings size={16} />
              </div>
              <span className="text-[13px] font-semibold tracking-tight">System Core</span>
            </Link>
          </div>
        </section>
      </nav>

      {/* Profile / Status Area */}
      <div className="mt-auto p-4 border-t border-white-[0.03] bg-gradient-to-b from-transparent to-black/40">
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-all group cursor-pointer overflow-hidden relative">
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center relative overflow-hidden">
            <ShieldCheck size={18} className="text-cyan-500/40 group-hover:text-cyan-500 transition-colors" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black text-zinc-100 tracking-tight">OPERATOR_01</p>
              <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_emerald]" />
            </div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Admin Privilege</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
