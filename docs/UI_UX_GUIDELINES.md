# ANIMA UI/UX Guidelines (Paperclip V2)

Questa guida definisce lo standard visivo e interattivo per la piattaforma ANIMA, garantendo coerenza tra i vari moduli e un'esperienza da "Mission Control Center".

## 🎨 Design Tokens

### Colori Core
- **Background**: `#050505` (Deep Space Black)
- **Primary Accent**: `#22d3ee` (Cyan-400) - Usato per indicare attività neuronale.
- **Success**: `#34d399` (Emerald-400) - Agenti pronti, task completati.
- **Alert**: `#fb7185` (Rose-400) - Errori di sistema, blocchi critici.
- **Dormant**: `#52525b` (Zinc-600) - Inattività, archiviazione.

### Tipografia
- **Brand/Headers**: `font-sans font-black uppercase italic`.
- **Dati/System**: `font-mono tracking-tighter`.
- **Body**: `font-sans font-medium tracking-tight`.

---

## 🕹️ Interattività & Feedback

### Regola d'Oro del Cursore
Tutti gli elementi interattivi (bottoni, link di navigazione, agent cards cliccabili) **devono** mostrare `cursor: pointer`.

### Stati Hover
- **Pulsanti**: Leggera scala (1.05) e bagliore esterno (`shadow-cyan`).
- **Cards**: Transizione di bordo da `zinc-800` a `cyan-500/30`.
- **Navigation**: Sfondo `white/5` con indicatore laterale attivo.

---

## 📐 Layout (Mission Control)
- **Densità**: Evitare padding eccessivi. Utilizzare griglie compatte.
- **Monospaced Content**: Gli ID degli agenti e i timestamp devono essere sempre in font monospaced.
- **Live Indicators**: Animazione `animate-pulse` costante per lo stato del sistema.

---

## 📋 Checklist Client-Ready
- [ ] Tutti i link `/` funzionano?
- [ ] Ogni card ha un hover effect?
- [ ] I font sono coerenti?
- [ ] Le animazioni sono fluide (<200ms)?
