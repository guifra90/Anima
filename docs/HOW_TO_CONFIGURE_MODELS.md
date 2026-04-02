# Guida alla Configurazione Modelli AI (Hybrid Cloud/Local)

ANIMA OS è progettato per essere flessibile. Puoi scegliere di far girare l'intelligenza artificiale localmente (per privacy e costi zero) o via Cloud (per potenza e semplicità).

## 1. Configurazione OpenRouter (Cloud)
Ideale se il tuo Mac non ha abbastanza potenza o se vuoi usare modelli enormi come DeepSeek-R1 senza installare nulla.

1. Ottieni una chiave API su [openrouter.ai](https://openrouter.ai/).
2. Aggiungi la chiave al tuo file `frontend/.env.local`:
   ```env
   OPENROUTER_API_KEY=tua_chiave_qui
   ```
3. Nel database ANIMA (Supabase), assegna a un agente un modello con provider `openrouter`.
   *   Esempio: `deepseek/deepseek-r1`

## 2. Configurazione Ollama (Locale)
Ideale per il tuo futuro VPS o se hai un Mac potente (M1/M2/M3).

1. Assicurati che Ollama sia in esecuzione (`ollama serve`).
2. Scarica il modello desiderato: `ollama pull deepseek-r1:7b`.
3. Nel file `.env.local` (opzionale se è localhost):
   ```env
   OLLAMA_ENDPOINT=http://localhost:11434
   ```
4. Nel database, assegna all'agente un modello con provider `ollama`.
   *   Esempio: `deepseek-r1:7b`

## 3. Come cambiare il modello di un Agente
Puoi farlo istantaneamente tramite il SQL Editor di Supabase o (prossimamente) dalla Hiring Hall nella UI.

**Esempio per cambiare il CEO (Leo Mirror) a OpenRouter:**
```sql
UPDATE public.anima_agents 
SET model_id = 'deepseek/deepseek-r1' 
WHERE id = 'leo-mirror';
```

**Esempio per cambiare il CEO a Ollama Locale:**
```sql
UPDATE public.anima_agents 
SET model_id = 'deepseek-r1:7b' 
WHERE id = 'leo-mirror';
```

## 4. Perché questa architettura Hybrid?
Questa struttura ti permette di sviluppare sul tuo Mac attuale (usando OpenRouter) e spostare lo stesso identico codice sul VPS futuro (passando a Ollama) semplicemente cambiando una riga nel database.
