import axios from "axios";

const OPENROUTER_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function gruplarOlustur(kisiler, grupSayisi) {
  const aktifKisiler = kisiler
    .filter(k => !k.izinli)
    .sort(() => Math.random() - 0.5);

  const prompt = `Aşağıdaki ${aktifKisiler.length} kişiyi ${grupSayisi} gruba böl. Aynı birimden kişiler farklı gruplara gitsin. Gruplar eşit sayıda olsun. Gerekçede sadece verilen bilgileri kullan, tahmin yürütme.

Ekip:
${aktifKisiler.map(k => `${k.isim}${k.ekip ? ` (${k.ekip})` : ""}`).join(", ")}

Yanıt SADECE JSON olsun:
{"gruplar":[{"no":1,"uyeler":["isim1","isim2"],"gerekce":"kısa açıklama"}]}`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: "Sadece JSON formatında yanıt ver. Başka hiçbir şey yazma." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
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