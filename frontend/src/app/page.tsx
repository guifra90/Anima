"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  // Il Creative Director è l'agente predefinito all'avvio
  const [activeAgentId, setActiveAgentId] = useState('creative-director');

  return (
    <main className="flex min-h-screen bg-black overflow-hidden font-sans">
      {/* Sidebar per la navigazione multi-agente */}
      <Sidebar 
        activeAgentId={activeAgentId} 
        onSelectAgent={(id) => setActiveAgentId(id)} 
      />

      {/* Interfaccia di conversazione dinamica */}
      <ChatInterface agentId={activeAgentId} />
    </main>
  );
}
