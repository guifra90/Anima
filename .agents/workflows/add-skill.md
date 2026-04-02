---
description: Come creare una nuova skill operativa in ANIMA seguendo lo standard SKILL.md.
---

# Workflow: Aggiunta Skill

Le skill sono capacità operative che gli agenti possono "imparare" (es: Invio Email, Gestione Google Calendar).

## 1. Definizione della Categoria
Le skill sono organizzate per categoria in `skills/`:
- `skills/operational/`: Per task di routine.
- `skills/ai/`: Per capacità di elaborazione avanzata.
- `skills/custom/`: Per integrazioni specifiche dell'azienda Mirror.

## 2. Struttura della Skill
Crea una nuova cartella `skills/<category>/<skill-slug>/` e il file `SKILL.md`.

## 3. Schema SKILL.md
Il file deve contenere metadati YAML canonici:

```markdown
---
name: [Nome Human Readable]
description: [Cosa fa la skill]
schema: [JSON_SCHEMA_URL o riferimento locale]
metadata:
  paperclip:
    version: 1.0.0
    category: [Categoria]
---

# [Nome Skill]
... (Istruzioni di implementazione e utilizzo)
```

## 4. Associazione agli Agenti
Per rendere la skill disponibile a un agente:
- Modifica il file `AGENTS.md` dell'agente.
- Aggiungi la skill nell'array `skills` (es. `- operational/gcal`).

## 5. Sincronizzazione
Affinché l'agente la "veda" anche sulla dashboard, lancia la sincronizzazione:

// turbo
```bash
npm run sync
```

## 6. Verifica
Controlla il log dell'agente nel menu `help` per assicurarti che la nuova capacità sia stata correttamente caricata nel suo contesto.
