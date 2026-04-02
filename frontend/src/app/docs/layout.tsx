import React from 'react';
import { DocsSidebar } from '@/components/DocsSidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full bg-zinc-950/20 backdrop-blur-3xl overflow-hidden">
      {/* Internal Docs Sidebar */}
      <DocsSidebar />
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide">
        <div className="max-w-4xl mx-auto py-16 px-12 pb-32">
          {children}
        </div>
      </div>

      {/* Floating Index Area (Right - Optional) */}
      <div className="w-64 hidden xl:block border-l border-white/5 p-8">
        <div className="sticky top-0">
          <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-4">On this page</h4>
          <div className="space-y-4">
             <div className="h-px bg-white/5 w-full" />
             <p className="text-[11px] text-zinc-500 italic">Navigation indices will appear automatically for long guides.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
