import axios from "axios";

const OPENROUTER_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export async function gruplarOlustur(kisiler, grupSayisi) {
  const aktifKisiler = kisiler.filter(k => !k.izinli);

  const prompt = `
Sen bir ekip yöneticisisin. Aşağıdaki kişileri ${grupSayisi} gruba böl.
Ekip dengesini ve uzmanlıkları göz önünde bulundur.
Aynı birimden çok kişi aynı gruba düşmesin.
Gruplama gerekçesi yazarken sadece gerçek bilgilere dayan, unvan veya proje bilgisi yoksa o konuda yorum yapma.

Ekip listesi:
${aktifKisiler.map(k => `- ${k.isim}${k.ekip ? ` | Birim: ${k.ekip}` : ""}${k.projeler ? ` | Projeler: ${k.projeler}` : ""}`).join("\n")}

Sadece şu JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "gruplar": [
    { "no": 1, "uyeler": ["isim1", "isim2"], "gerekce": "kısa açıklama" }
  ]
}
`;

  const res = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "MEVAT-T",
      },
    }
  );

  const text = res.data.choices[0].message.content;
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  return json.gruplar;
}