'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Rocket, 
  User, 
  Terminal, 
  FileText,
  ChevronRight
} from 'lucide-react';

const DOCS_NAV = [
  {
    title: 'Getting Started',
    items: [
      { name: 'What is ANIMA?', href: '/docs', icon: Rocket },
      { name: 'Introduction', href: '/docs/intro', icon: FileText },
    ]
  },
  {
    title: 'User Guide',
    items: [
      { name: 'Missions Control', href: '/docs/user-guide/missions', icon: User },
      { name: 'Hiring & Teams', href: '/docs/user-guide/hiring', icon: User },
      { name: 'Skills & Tools', href: '/docs/user-guide/skills', icon: User },
    ]
  },
  {
    title: 'Developer Guide',
    items: [
      { name: 'Agent DNA (Spec)', href: '/docs/developer-guide/dna', icon: Terminal },
      { name: 'Sync Engine', href: '/docs/developer-guide/sync', icon: Terminal },
      { name: 'Custom Skills', href: '/docs/developer-guide/custom-skills', icon: Terminal },
    ]
  }
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full flex flex-col py-8 px-4 bg-zinc-950/20 border-r border-white/5">
      <div className="px-4 mb-8">
        <h2 className="text-xs font-black uppercase text-cyan-500 tracking-widest">Documentation</h2>
        <p className="text-[10px] text-zinc-500 font-medium mt-1">v2.0.0 — Zero Human Spec</p>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide">
        {DOCS_NAV.map((section) => (
          <section key={section.title}>
            <h3 className="px-4 mb-3 text-[10px] font-bold uppercase text-zinc-600 tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-4 py-2 rounded-lg transition-all text-sm",
                      isActive 
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={14} className={isActive ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"} />
                      <span className="font-medium tracking-tight whitespace-nowrap">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight size={12} className="text-cyan-500/40" />}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
