// api/ai/parse-job.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
// If you're not using @vercel/node types, you can use (req: any, res: any)
import { createClient } from '@supabase/supabase-js';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE; // server key

if (!OPENAI_KEY) {
  console.error('Missing OPENAI_API_KEY env var');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

const SYSTEM_PROMPT = `
You are an assistant that converts a user's job request (free text) into a strict JSON object with this schema:
{
  "title": string,
  "description": string,
  "trade_types": string[],
  "urgency": "low"|"medium"|"high",
  "estimated_budget": string | null,
  "location_hint": string | null,
  "tags": string[]
}
Return ONLY valid JSON (no explanation). Keep descriptions concise.
`;

async function callOpenAI(prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',        // pick model you have access to
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.0,
      max_tokens: 450
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${JSON.stringify(data)}`);
  return data.choices?.[0]?.message?.content ?? '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { text, writeToDb = false } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });

    // Build a compact prompt to send
    const prompt = `User: """${text.replace(/\n/g, ' ')}""" \n\nReturn the JSON now.`;

    const aiText = await callOpenAI(prompt);

    // Try to parse JSON from AI text robustly
    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch (err) {
      // attempt to extract JSON substring
      const m = aiText.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else {
        console.error('AI output parse failed:', aiText);
        return res.status(500).json({ error: 'Failed to parse AI output', raw: aiText });
      }
    }

    // Basic server-side validation (ensure required keys)
    if (!parsed.title || !parsed.description) {
      parsed.title = parsed.title ?? (parsed.description ? parsed.description.slice(0, 60) : 'Untitled');
      parsed.description = parsed.description ?? '';
    }

    let inserted = null;
    if (writeToDb) {
      if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

      const jobRow: any = {
        title: parsed.title,
        description: parsed.description,
        status: 'open',
        suggested_trades: parsed.trade_types ?? [],
        ai_summary: parsed.description ?? null,
        ai_generated: true
      };

      const { data, error } = await supabase.from('jobs').insert(jobRow).select().single();
      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(502).json({ error: 'DB insert failed', detail: error });
      }
      inserted = data;
    }

    return res.status(200).json({ parsed, inserted, raw: aiText });
  } catch (err: any) {
    console.error('parse-job error', err.message || err);
    return res.status(500).json({ error: err.message || err, stack: err.stack });
  }
}