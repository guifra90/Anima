---
description: Come creare un nuovo agente in ANIMA seguendo lo standard Agent Companies.
---

# Workflow: Aggiunta Agente

Per mantenere la coerenza tra il sistema di ingegneria e il runtime operativo, segui questi passi ogni volta che devi aggiungere un nuovo ruolo alla squadra.

## 1. Definizione del DNA (Filesystem)
Usa lo script di scaffolding per creare la struttura iniziale dell'agente.

// turbo
```bash
npm run add-agent
```

Segui le istruzioni interattive (Nome, Reparto, Responsabilità). Lo script creerà:
- `agents/<slug>/AGENTS.md`: Il documento di identità.
- `agents/<slug>/prompts/system.md`: Le istruzioni per l'LLM.
- `agents/<slug>/tests/`: La suite di validazione.

## 2. Personalizzazione
Modifica i file generati per riflettere le capacità reali:
- In `AGENTS.md`, aggiorna la sezione `skills` e `tags`.
- In `prompts/system.md`, definisci il comportamento specifico e il tono di voce.

## 3. Sincronizzazione (Auto-Push)
Lo script `add-agent` esegue automaticamente il sync. Se hai fatto modifiche manuali ai file dopo la creazione, lancia il sync manualmente:

// turbo
```bash
npm run sync
```

## 4. Validazione
Assicurati che l'agente funzioni come previsto lanciando i suoi test:

```bash
node agents/<slug>/tests/<slug>.test.js
```

## 6. Protocollo Paperclip (Estetica e Localizzazione)
Ogni agente deve rispettare rigorosamente il **MASTER_STYLE** di ANIMA per garantire un'esperienza premium e uniforme:

1. **TITOLI**: Usa sempre `## TITOLO IN TUTTO MAIUSCOLO`. È **tassativamente vietato** l'uso di underscore (`_`) o asterischi (`*`) nei titoli. (Esempio: `## ANALISI PROGETTI`).
2. **LOCALIZZAZIONE**: Usa il formato europeo per i numeri (punto per migliaia, virgola per decimali: `1.250,50 €`) e il formato italiano per le date (`GG/MM/AAAA`).
3. **TONO**: Adotta un tono "Human-Authoritative". Sii tecnico, preciso e professionale. Salta i saluti e vai dritto al punto.
4. **TABELLE**: Presenta i dati strutturati (ID, scadenze, budget) esclusivamente tramite tabelle GFM.

> [!TIP]
> Queste regole sono imposte a livello di Bridge AI; non duplicarle nel `system.md` dell'agente se non per rinforzi logici specifici del ruolo.
