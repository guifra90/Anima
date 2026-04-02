---
description: Come lanciare una missione in ANIMA definendo obiettivi e agenti pianificatori.
---

# Workflow: Lancio Missione

Le missioni sono il cuore operativo di ANIMA. Una missione scompone un obiettivo complesso in task atomici assegnati agli agenti corretti.

## 1. Definizione Obiettivo
Identifica un obiettivo chiaro e misurabile (es. "Lancio Campagna Twitter Q2").

## 2. Selezione Planner
Scegli un agente che fungerà da **Planner**. Tipicamente:
- `strategic-planner`: Per strategie ad alto livello.
- `project-manager`: Per esecuzione tecnica e scadenze.

## 3. Creazione Missione (Dashboard)
Usa il modulo "Mission Control" nella dashboard di ANIMA:
- Inserisci **Titolo** e **Obiettivo**.
- Seleziona l'**Agente Pianificatore**.
- Scegli la **Modalità**: `manual` (revisione board) o `autonomous` (esecuzione diretta).

## 4. Pianificazione & Tasking
Una volta lanciata, la missione compare nella tabella `anima_missions`. Il planner inizierà a generare record in `anima_tasks` assegnati agli agenti di reparto.

## 5. Monitoraggio (npm run help)
Puoi monitorare l'andamento delle missioni attive tramite il menu di controllo:
- Controlla i log dell'agente assegnato.
- Verifica lo stato dei task (`pending`, `in_progress`, `done`).

## 6. Chiusura & Report
Al completamento di tutti i task, il Planner genera un report finale in `anima_messages` che viene notificato alla Board.
