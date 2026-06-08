/* ══════════════════════════════════════════════════════════════
   Nihongo N5 Pro — AI Sensei Edge Function
   Proxy ke NVIDIA DeepSeek API agar API key tidak terekspos
   Path: /api/ai
   ══════════════════════════════════════════════════════════════ */

const SYSTEM_PROMPTS = {

  chat: `Kamu adalah Sensei AI — guru bahasa Jepang yang ramah, sabar, dan ahli untuk pelajar JLPT N5.
Jawab dalam Bahasa Indonesia yang santai tapi informatif.
Kalau menjelaskan kata/kalimat Jepang, selalu sertakan:
- Tulisan kanji/hiragana/katakana
- Romaji
- Arti dalam Bahasa Indonesia
- Contoh kalimat singkat jika relevan
Fokus pada materi N5: hiragana, katakana, kanji N5, grammar dasar, kosakata N5.
Jawaban singkat dan to the point — maksimal 3-4 paragraf.`,

  koreksi: `Kamu adalah guru bahasa Jepang yang bertugas mengoreksi kalimat buatan pelajar N5.
Jawab dalam Bahasa Indonesia.
Format jawaban WAJIB seperti ini:

✅ Koreksi: [kalimat yang sudah benar dalam Jepang]
📖 Romaji: [romaji dari kalimat yang benar]
🇮🇩 Arti: [terjemahan Indonesia]

❌ Kesalahan:
• [jelaskan kesalahan 1 secara singkat]
• [jelaskan kesalahan 2 jika ada]

💡 Tips: [satu tips grammar/vocab terkait]

Kalau kalimatnya sudah benar, katakan "Kalimat sudah benar! ✨" lalu berikan pujian singkat.`,

  soal: `Kamu adalah pembuat soal latihan JLPT N5.
Buat TEPAT 5 soal pilihan ganda sesuai format JLPT N5.
Jawab dalam Bahasa Indonesia untuk instruksi, Bahasa Jepang untuk soal.

Format WAJIB untuk setiap soal:

**Soal [N]:** [pertanyaan dalam Jepang dengan (　) untuk blank jika perlu]
A) [pilihan A]
B) [pilihan B]
C) [pilihan C]
D) [pilihan D]
✅ Jawaban: [huruf] — [penjelasan singkat dalam Indonesia]

---

Topik soal bervariasi: kosakata N5, partikel, pola kalimat dasar, kanji N5.
Tingkat kesulitan sesuai N5.`

};

export default async (request) => {

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const API_KEY = Deno.env.get('NVIDIA_API_KEY');
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API key tidak dikonfigurasi' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages, mode } = await request.json();
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model:       'deepseek-ai/deepseek-v4-flash',
        messages:    [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.7,
        top_p:       0.95,
        max_tokens:  1024,
        stream:      false
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: `NVIDIA API error: ${res.status}`, detail: err }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};

export const config = { path: '/api/ai' };
