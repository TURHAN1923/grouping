import axios from "axios";

const OPENROUTER_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function gruplarOlustur(kisiler, grupSayisi) {
  const aktifKisiler = kisiler
    .filter(k => !k.izinli)
    .sort(() => Math.random() - 0.5);

  const prompt = `${aktifKisiler.length} kişiyi ${grupSayisi} gruba böl. Aynı birimden kişiler farklı gruplara gitsin.

Kişiler:
${aktifKisiler.map((k, i) => `${i + 1}. ${k.isim}${k.ekip ? ` [${k.ekip}]` : ""}`).join("\n")}

Yanıt formatı (SADECE bu JSON, başka hiçbir şey yazma):
{"gruplar":[{"no":1,"uyeler":["Tam Isim 1","Tam Isim 2"],"gerekce":"1-2 cümle kısa açıklama"}]}`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Sadece geçerli JSON döndür. Başka hiçbir şey yazma. gerekce alanına kişi ismi yazma, sadece gruplama mantığını açıkla." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const text = res.data.choices[0].message.content;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI geçerli bir yanıt vermedi, tekrar deneyin.");
  const json = JSON.parse(match[0]);
  return json.gruplar;
}