import { useState, useEffect, useRef } from "react";
import { gruplarOlustur } from "./groq";
import "./index.css";

const RENKLER = ["#00ff88", "#00aaff", "#ff6644", "#ffcc00", "#cc44ff", "#ff44aa", "#44ffcc", "#ff8800"];
const bos_kisi = { isim: "", ekip: "", projeler: "", izinli: false, foto: null };
const bos_gorev = { baslik: "", aciklama: "" };

function rastgeleKaristir(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resimSikistir(file, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 120;
      let w = img.width, h = img.height;
      if (w > h) { h = (h / w) * MAX; w = MAX; }
      else { w = (w / h) * MAX; h = MAX; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export default function App() {
  const [sekme, setSekme] = useState("liste");
  const [kisiler, setKisiler] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kisiler")) || []; } catch { return []; }
  });
  const [yeniKisi, setYeniKisi] = useState({ ...bos_kisi });
  const [grupSayisi, setGrupSayisi] = useState(4);
  const [gruplar, setGruplar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");
  const [gorevler, setGorevler] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gorevler")) || []; } catch { return []; }
  });
  const [yeniGorev, setYeniGorev] = useState({ ...bos_gorev });
  const [gecmis, setGecmis] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gecmis")) || []; } catch { return []; }
  });
  const [seciliGecmis, setSeciliGecmis] = useState(null);
  const fotoRef = useRef();

  useEffect(() => { localStorage.setItem("kisiler", JSON.stringify(kisiler)); }, [kisiler]);
  useEffect(() => { localStorage.setItem("gorevler", JSON.stringify(gorevler)); }, [gorevler]);
  useEffect(() => { localStorage.setItem("gecmis", JSON.stringify(gecmis)); }, [gecmis]);

  function kisiEkle() {
    if (!yeniKisi.isim.trim()) return;
    setKisiler([...kisiler, { ...yeniKisi, id: Date.now() }]);
    setYeniKisi({ ...bos_kisi });
  }

  function kisiSil(id) { setKisiler(kisiler.filter(k => k.id !== id)); }
  function izinToggle(id) { setKisiler(kisiler.map(k => k.id === id ? { ...k, izinli: !k.izinli } : k)); }

  function fotoEkle(id, file) {
    resimSikistir(file, (base64) => {
      setKisiler(kisiler.map(k => k.id === id ? { ...k, foto: base64 } : k));
    });
  }

  function yeniFotoEkle(file) {
    resimSikistir(file, (base64) => {
      setYeniKisi({ ...yeniKisi, foto: base64 });
    });
  }

  function gorevEkle() {
    if (!yeniGorev.baslik.trim()) return;
    setGorevler([...gorevler, { ...yeniGorev, id: Date.now() }]);
    setYeniGorev({ ...bos_gorev });
  }

  function gorevSil(id) { setGorevler(gorevler.filter(g => g.id !== id)); }

  async function grupla() {
    if (kisiler.filter(k => !k.izinli).length < grupSayisi) {
      setHata("Aktif kişi sayısı grup sayısından az olamaz!");
      return;
    }
    setHata("");
    setYukleniyor(true);
    try {
      const sonuc = await gruplarOlustur(kisiler, grupSayisi);
      const karisikGorevler = rastgeleKaristir(gorevler);
      const gruplarlaGorev = sonuc.map((g, i) => ({
        ...g,
        gorev: karisikGorevler[i % karisikGorevler.length] || null,
      }));
      setGruplar(gruplarlaGorev);

      const yeniKayit = {
        id: Date.now(),
        tarih: new Date().toLocaleString("tr-TR"),
        grupSayisi,
        aktifSayisi: kisiler.filter(k => !k.izinli).length,
        gruplar: gruplarlaGorev,
        kisiler: [...kisiler],
      };
      setGecmis(prev => [yeniKayit, ...prev.slice(0, 19)]);
      setSekme("sonuc");
    } catch (e) {
      setHata("Hata oluştu: " + e.message);
    }
    setYukleniyor(false);
  }

  const aktifSayisi = kisiler.filter(k => !k.izinli).length;
  const izinliSayisi = kisiler.filter(k => k.izinli).length;

  const gosterilecekGruplar = seciliGecmis ? seciliGecmis.gruplar : gruplar;
  const gosterilecekKisiler = seciliGecmis ? seciliGecmis.kisiler : kisiler;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div style={{ background: "#111118", borderBottom: "3px solid #00ff88", padding: "16px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "18px", color: "#00ff88", letterSpacing: "2px" }}>
          ⚔️ EKİP DAĞITIM
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555", marginTop: "4px" }}>powered by AI</div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>

        {/* SOL PANEL — GEÇMİŞ */}
        <div style={{ width: "220px", background: "#0d0d14", borderRight: "1px solid #1a1a2a", padding: "16px 12px", flexShrink: 0 }}>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#00ff88", marginBottom: "12px", letterSpacing: "1px" }}>
            📁 GEÇMİŞ
          </div>
          {gecmis.length === 0 && (
            <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#333", lineHeight: "1.6" }}>
              Henüz gruplama yapılmadı.
            </div>
          )}
          {gecmis.map((g, i) => (
            <div key={g.id} onClick={() => { setSeciliGecmis(g); setSekme("sonuc"); }}
              style={{
                background: seciliGecmis?.id === g.id ? "#1a1a2a" : "transparent",
                border: `1px solid ${seciliGecmis?.id === g.id ? "#00ff8844" : "#1a1a2a"}`,
                borderRadius: "6px", padding: "8px 10px", marginBottom: "6px",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#00ff88", fontWeight: "bold" }}>
                #{gecmis.length - i} — {g.grupSayisi} grup
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#444", marginTop: "3px" }}>
                {g.aktifSayisi} kişi
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#333", marginTop: "2px" }}>
                {g.tarih}
              </div>
            </div>
          ))}
          {gecmis.length > 0 && (
            <button onClick={() => { setGecmis([]); setSeciliGecmis(null); }}
              style={{ ...btnStyle("#ff3333", "6px 10px"), width: "100%", marginTop: "8px", fontSize: "10px" }}>
              🗑 Geçmişi Temizle
            </button>
          )}
        </div>

        {/* SAĞ İÇERİK */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* SEKMELER */}
          <div style={{ display: "flex", borderBottom: "2px solid #222", background: "#111118" }}>
            {[
              { key: "liste", label: "👥 Ekip" },
              { key: "gorevler", label: "📋 Görevler" },
              { key: "dagit", label: "⚡ Dağıtım" },
              { key: "sonuc", label: "🏆 Sonuç" },
            ].map(s => (
              <button key={s.key} onClick={() => { setSekme(s.key); setSeciliGecmis(null); }} style={{
                flex: 1, padding: "14px", border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: "13px", fontWeight: "bold",
                background: sekme === s.key ? "#0a0a0f" : "#111118",
                color: sekme === s.key ? "#00ff88" : "#555",
                borderBottom: sekme === s.key ? "2px solid #00ff88" : "2px solid transparent",
                transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>

          <div style={{ padding: "24px 20px", maxWidth: "860px", width: "100%" }}>

            {/* SEKME: EKİP LİSTESİ */}
            {sekme === "liste" && (
              <div>
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { label: "Toplam", val: kisiler.length, renk: "#00ff88" },
                    { label: "Aktif", val: aktifSayisi, renk: "#00aaff" },
                    { label: "İzinli", val: izinliSayisi, renk: "#ff6644" },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, background: "#111118", border: `1px solid ${s.renk}33`,
                      borderRadius: "8px", padding: "14px", textAlign: "center"
                    }}>
                      <div style={{ fontSize: "28px", fontWeight: "bold", color: s.renk, fontFamily: "monospace" }}>{s.val}</div>
                      <div style={{ fontSize: "11px", color: "#555", marginTop: "4px", fontFamily: "monospace" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Yeni kişi formu */}
                <div style={{ background: "#111118", border: "1px solid #222", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#00ff88", marginBottom: "12px" }}>+ YENİ KİŞİ EKLE</div>

                  {/* Fotoğraf alanı */}
                  <div style={{ display: "flex", gap: "16px", marginBottom: "12px", alignItems: "center" }}>
                    <div onClick={() => document.getElementById("yeni-foto").click()}
                      style={{
                        width: "64px", height: "64px", borderRadius: "8px",
                        border: "2px dashed #333", cursor: "pointer",
                        overflow: "hidden", flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: "#0a0a0f",
                      }}>
                      {yeniKisi.foto
                        ? <img src={yeniKisi.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "24px" }}>📷</span>
                      }
                    </div>
                    <input id="yeni-foto" type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => e.target.files[0] && yeniFotoEkle(e.target.files[0])} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <input placeholder="İsim Soyisim" value={yeniKisi.isim}
                          onChange={e => setYeniKisi({ ...yeniKisi, isim: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && kisiEkle()}
                          style={inputStyle} />
                        <input placeholder="Ekip / Birim" value={yeniKisi.ekip}
                          onChange={e => setYeniKisi({ ...yeniKisi, ekip: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && kisiEkle()}
                          style={inputStyle} />
                      </div>
                      <input placeholder="Önceki projeler (virgülle ayır)" value={yeniKisi.projeler}
                        onChange={e => setYeniKisi({ ...yeniKisi, projeler: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && kisiEkle()}
                        style={{ ...inputStyle, width: "100%" }} />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "monospace", fontSize: "12px", color: "#aaa", cursor: "pointer" }}>
                      <input type="checkbox" checked={yeniKisi.izinli}
                        onChange={e => setYeniKisi({ ...yeniKisi, izinli: e.target.checked })} />
                      İzinli
                    </label>
                    <button onClick={kisiEkle} style={btnStyle("#00ff88")}>EKLE</button>
                  </div>
                </div>

                {/* Kişi listesi */}
                {kisiler.length === 0 && (
                  <div style={{ textAlign: "center", color: "#333", fontFamily: "monospace", padding: "40px" }}>
                    Henüz kimse yok. Ekip üyesi ekle!
                  </div>
                )}
                {kisiler.map((k, i) => (
                  <div key={k.id} style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: "#111118", border: `1px solid ${k.izinli ? "#ff664433" : "#222"}`,
                    borderRadius: "8px", padding: "10px 14px", marginBottom: "8px",
                    opacity: k.izinli ? 0.6 : 1,
                  }}>
                    {/* Fotoğraf */}
                    <div onClick={() => document.getElementById(`foto-${k.id}`).click()}
                      style={{
                        width: "48px", height: "48px", borderRadius: "8px",
                        border: "2px dashed #333", cursor: "pointer",
                        overflow: "hidden", flexShrink: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: "#0a0a0f",
                      }}>
                      {k.foto
                        ? <img src={k.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "20px" }}>📷</span>
                      }
                    </div>
                    <input id={`foto-${k.id}`} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => e.target.files[0] && fotoEkle(k.id, e.target.files[0])} />

                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", color: k.izinli ? "#555" : "#e0e0e0" }}>
                        {k.isim}
                        {k.izinli && <span style={{ marginLeft: "8px", fontSize: "10px", color: "#ff6644", background: "#ff664422", padding: "2px 6px", borderRadius: "4px" }}>İZİNLİ</span>}
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555", marginTop: "2px" }}>
                        {k.ekip} {k.projeler && `• ${k.projeler}`}
                      </div>
                    </div>
                    <button onClick={() => izinToggle(k.id)} style={btnStyle(k.izinli ? "#ff6644" : "#444", "8px 10px")}>
                      {k.izinli ? "✓ İzinli" : "İzin"}
                    </button>
                    <button onClick={() => kisiSil(k.id)} style={btnStyle("#ff3333", "8px 10px")}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* SEKME: GÖREVLER */}
            {sekme === "gorevler" && (
              <div>
                <div style={{ background: "#111118", border: "1px solid #222", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#00ff88", marginBottom: "12px" }}>+ YENİ GÖREV EKLE</div>
                  <input placeholder="Görev başlığı" value={yeniGorev.baslik}
                    onChange={e => setYeniGorev({ ...yeniGorev, baslik: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && gorevEkle()}
                    style={{ ...inputStyle, width: "100%", marginBottom: "10px" }} />
                  <input placeholder="Açıklama (isteğe bağlı)" value={yeniGorev.aciklama}
                    onChange={e => setYeniGorev({ ...yeniGorev, aciklama: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && gorevEkle()}
                    style={{ ...inputStyle, width: "100%", marginBottom: "10px" }} />
                  <button onClick={gorevEkle} style={btnStyle("#00ff88")}>EKLE</button>
                </div>
                {gorevler.length === 0 && (
                  <div style={{ textAlign: "center", color: "#333", fontFamily: "monospace", padding: "40px" }}>
                    Henüz görev yok. Görev havuzunu doldur!
                  </div>
                )}
                {gorevler.map((g, i) => (
                  <div key={g.id} style={{
                    background: "#111118", border: `1px solid ${RENKLER[i % RENKLER.length]}44`,
                    borderLeft: `3px solid ${RENKLER[i % RENKLER.length]}`,
                    borderRadius: "8px", padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", color: "#e0e0e0" }}>🎯 {g.baslik}</div>
                      {g.aciklama && <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555", marginTop: "4px" }}>{g.aciklama}</div>}
                    </div>
                    <button onClick={() => gorevSil(g.id)} style={btnStyle("#ff3333", "8px 10px")}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* SEKME: DAĞITIM */}
            {sekme === "dagit" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "14px", color: "#00ff88", marginBottom: "32px" }}>
                  AI GRUPLAMA
                </div>
                <div style={{ background: "#111118", border: "1px solid #222", borderRadius: "10px", padding: "32px", marginBottom: "24px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#aaa", marginBottom: "8px" }}>
                    Aktif: <span style={{ color: "#00ff88" }}>{aktifSayisi}</span> &nbsp;|&nbsp;
                    İzinli: <span style={{ color: "#ff6644" }}>{izinliSayisi}</span> &nbsp;|&nbsp;
                    Görev: <span style={{ color: "#ffcc00" }}>{gorevler.length}</span>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#aaa", marginBottom: "24px" }}>Kaç gruba bölünsün?</div>
                  <input type="number" min="2" max="20" value={grupSayisi}
                    onChange={e => setGrupSayisi(Number(e.target.value))}
                    style={{ ...inputStyle, width: "100px", textAlign: "center", fontSize: "24px", padding: "12px" }} />
                  <div style={{ marginTop: "8px", fontFamily: "monospace", fontSize: "11px", color: "#333" }}>
                    Grup başına ~{Math.ceil(aktifSayisi / grupSayisi)} kişi
                  </div>
                </div>
                {hata && (
                  <div style={{ background: "#ff333322", border: "1px solid #ff3333", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontFamily: "monospace", fontSize: "12px", color: "#ff6644" }}>
                    ⚠️ {hata}
                  </div>
                )}
                <button onClick={grupla} disabled={yukleniyor || kisiler.length === 0} style={{
                  ...btnStyle("#00ff88"), fontSize: "14px", padding: "16px 40px",
                  opacity: yukleniyor || kisiler.length === 0 ? 0.5 : 1,
                  fontFamily: "'Press Start 2P', monospace",
                }}>
                  {yukleniyor ? "⏳ AI düşünüyor..." : "⚡ GRUPLARI OLUŞTUR"}
                </button>
              </div>
            )}

            {/* SEKME: SONUÇ */}
            {sekme === "sonuc" && (
              <div>
                {seciliGecmis && (
                  <div style={{ background: "#1a1a2a", border: "1px solid #00ff8833", borderRadius: "8px", padding: "10px 16px", marginBottom: "16px", fontFamily: "monospace", fontSize: "12px", color: "#00ff88" }}>
                    📁 Geçmiş kayıt görüntüleniyor — {seciliGecmis.tarih}
                    <button onClick={() => setSeciliGecmis(null)} style={{ ...btnStyle("#555", "4px 10px"), marginLeft: "12px", fontSize: "11px" }}>✕ Kapat</button>
                  </div>
                )}
                {gosterilecekGruplar.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#333", fontFamily: "monospace", padding: "40px" }}>
                    Henüz gruplar oluşturulmadı.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                    {gosterilecekGruplar.map((g, i) => (
                      <div key={i} style={{
                        background: "#111118",
                        border: `1px solid ${RENKLER[i % RENKLER.length]}44`,
                        borderTop: `3px solid ${RENKLER[i % RENKLER.length]}`,
                        borderRadius: "10px", padding: "16px",
                      }}>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "11px", color: RENKLER[i % RENKLER.length], marginBottom: "12px" }}>
                          GRUP {g.no}
                        </div>
                        {g.gorev && (
                          <div style={{
                            background: "#0a0a0f", border: `1px solid ${RENKLER[i % RENKLER.length]}55`,
                            borderRadius: "6px", padding: "10px", marginBottom: "12px",
                          }}>
                            <div style={{ fontFamily: "monospace", fontSize: "10px", color: RENKLER[i % RENKLER.length], marginBottom: "4px" }}>🎯 GÖREV</div>
                            <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#e0e0e0", fontWeight: "bold" }}>{g.gorev.baslik}</div>
                            {g.gorev.aciklama && <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#555", marginTop: "4px" }}>{g.gorev.aciklama}</div>}
                          </div>
                        )}
                        {g.uyeler.map((u, j) => {
                          const kisi = gosterilecekKisiler.find(k => k.isim === u);
                          return (
                            <div key={j} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                              <div style={{
                                width: "40px", height: "40px", borderRadius: "8px",
                                overflow: "hidden", flexShrink: 0, background: "#0a0a0f",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: `1px solid ${RENKLER[i % RENKLER.length]}33`,
                              }}>
                                {kisi?.foto
                                  ? <img src={kisi.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <span style={{ fontSize: "18px" }}>👤</span>
                                }
                              </div>
                              <div>
                                <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", color: "#e0e0e0" }}>{u}</div>
                                {kisi && <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#555" }}>{kisi.ekip}</div>}
                              </div>
                            </div>
                          );
                        })}
                        {g.gerekce && (
                          <div style={{ marginTop: "12px", padding: "10px", background: "#0a0a0f", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px", color: "#555", lineHeight: "1.6", borderLeft: `2px solid ${RENKLER[i % RENKLER.length]}44` }}>
                            💬 {g.gerekce}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#0a0a0f", border: "1px solid #333", borderRadius: "6px",
  padding: "10px 12px", color: "#e0e0e0", fontFamily: "monospace", fontSize: "13px",
  outline: "none", width: "100%",
};

function btnStyle(renk, padding = "10px 20px") {
  return {
    background: renk + "22", border: `1px solid ${renk}`,
    color: renk, borderRadius: "6px", padding,
    fontFamily: "monospace", fontSize: "12px", fontWeight: "bold",
    cursor: "pointer", transition: "all 0.2s",
  };
}