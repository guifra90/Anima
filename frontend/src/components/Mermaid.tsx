'use client';

import React, { useEffect, useState } from 'react';

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      import('mermaid').then((m) => {
        const mermaid = m.default;
        mermaid.initialize({
          startOnLoad: true,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
          themeVariables: {
            primaryColor: '#06b6d4', // Cyan 500
            primaryTextColor: '#fff',
            primaryBorderColor: '#0891b2',
            lineColor: '#3f3f46', // Zinc 700
            secondaryColor: '#1e1b4b', // Indigo 950
            tertiaryColor: '#0a0a0a' // Black
          }
        });
        mermaid.contentLoaded();
      });
    }
  }, [isClient, chart]);

  if (!isClient) {
    return (
      <div className="my-8 bg-zinc-950/40 p-8 rounded-3xl border border-white/5 flex justify-center h-[200px] items-center text-zinc-500 font-mono text-xs">
        Loading Diagram...
      </div>
    );
  }

  return (
    <div className="mermaid my-8 bg-zinc-950/40 p-8 rounded-3xl border border-white/5 flex justify-center overflow-x-auto scrollbar-hide">
      {chart}
    </div>
  );
}
