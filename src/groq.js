import axios from "axios";

const OPENROUTER_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function gruplarOlustur(kisiler, grupSayisi) {
  const aktifKisiler = kisiler
    .filter(k => !k.izinli)
    .sort(() => Math.random() - 0.5);

  const prompt = `Aşağıdaki ${aktifKisiler.length} kişiyi ${grupSayisi} gruba böl. Aynı birimden kişiler farklı gruplara gitsin. Gruplar eşit sayıda olsun.

Ekip:
${aktifKisiler.map(k => `${k.isim}${k.ekip ? ` (${k.ekip})` : ""}`).join("\n")}

SADECE bu JSON formatında yanıt ver, başka hiçbir şey yazma:
{"gruplar":[{"no":1,"uyeler":["isim1","isim2"],"gerekce":"açıklama"}]}`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Sen bir JSON üreticisin. Sadece geçerli JSON döndür, başka hiçbir şey yazma." },
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