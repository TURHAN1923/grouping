import { useState, useEffect } from "react";
import { gruplarOlustur } from "./groq";
import "./index.css";

const RENKLER = ["#91b900", "#4b96d2", "#e40045", "#ffcd00", "#afafaf", "#303c49", "#91b900", "#4b96d2"];

const bos_kisi = { isim: "", ekip: "", projeler: "", izinli: false, foto: null };
const bos_gorev = { baslik: "", aciklama: "" };

const ManLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" stroke="#afafaf" strokeWidth="4" fill="none"/>
    <text x="50" y="58" textAnchor="middle" fontSize="28" fontWeight="bold" fontFamily="Arial" fill="#afafaf">MAN</text>
  </svg>
);

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
      canvas.width = w; canvas.height = h;
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
  const [duzenleId, setDuzenleId] = useState(null);
  const [duzenleData, setDuzenleData] = useState({});

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

  function kisiKaydet() {
    setKisiler(kisiler.map(k => k.id === duzenleId ? { ...k, ...duzenleData } : k));
    setDuzenleId(null);
    setDuzenleData({});
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
        ...g, gorev: karisikGorevler[i % karisikGorevler.length] || null,
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
    <div style={{ minHeight: "100vh", background: "#1a1f24", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div style={{ background: "#222830", borderBottom: "3px solid #91b900", padding: "14px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <ManLogo size={40} />
        <div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "18px", fontWeight: "bold", color: "#afafaf", letterSpacing: "3px" }}>
            MEVAT-T
          </div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "1px" }}>
            EKİP DAĞITIM SİSTEMİ
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>

        {/* SOL PANEL */}
        <div style={{ width: "220px", background: "#1e2329", borderRight: "1px solid #303c49", padding: "16px 12px", flexShrink: 0 }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#91b900", marginBottom: "12px", letterSpacing: "2px", fontWeight: "bold" }}>
            GECMIS
          </div>
          {gecmis.length === 0 && (
            <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#333", lineHeight: "1.6" }}>Henüz gruplama yapılmadı.</div>
          )}
          {gecmis.map((g, i) => (
            <div key={g.id} onClick={() => { setSeciliGecmis(g); setSekme("sonuc"); }}
              style={{
                background: seciliGecmis?.id === g.id ? "#2a3340" : "transparent",
                border: `1px solid ${seciliGecmis?.id === g.id ? "#91b90044" : "#2a3340"}`,
                borderRadius: "4px", padding: "8px 10px", marginBottom: "6px", cursor: "pointer",
              }}>
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#91b900", fontWeight: "bold" }}>#{gecmis.length - i} — {g.grupSayisi} grup</div>
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#555", marginTop: "3px" }}>{g.aktifSayisi} kişi</div>
              <div style={{ fontFamily: "Arial, sans-serif", fontSize: "9px", color: "#444", marginTop: "2px" }}>{g.tarih}</div>
            </div>
          ))}
          {gecmis.length > 0 && (
            <button onClick={() => { setGecmis([]); setSeciliGecmis(null); }}
              style={{ ...btnStyle("#e40045", "6px 10px"), width: "100%", marginTop: "8px", fontSize: "10px" }}>
              Gecmisi Temizle
            </button>
          )}
        </div>

        {/* SAG ICERIK */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* SEKMELER */}
          <div style={{ display: "flex", borderBottom: "2px solid #303c49", background: "#222830" }}>
            {[
              { key: "liste", label: "EKİP LİSTESİ" },
              { key: "gorevler", label: "GÖREVLER" },
              { key: "dagit", label: "DAGITIN" },
              { key: "sonuc", label: "SONUC" },
            ].map(s => (
              <button key={s.key} onClick={() => { setSekme(s.key); setSeciliGecmis(null); }} style={{
                flex: 1, padding: "14px", border: "none", cursor: "pointer",
                fontFamily: "Arial, sans-serif", fontSize: "12px", fontWeight: "bold",
                letterSpacing: "1px",
                background: sekme === s.key ? "#1a1f24" : "#222830",
                color: sekme === s.key ? "#91b900" : "#555",
                borderBottom: sekme === s.key ? "2px solid #91b900" : "2px solid transparent",
                transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>

          <div style={{ padding: "24px 20px", maxWidth: "860px", width: "100%" }}>

            {/* EKİP LİSTESİ */}
            {sekme === "liste" && (
              <div>
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { label: "TOPLAM", val: kisiler.length, renk: "#afafaf" },
                    { label: "AKTİF", val: aktifSayisi, renk: "#91b900" },
                    { label: "İZİNLİ", val: izinliSayisi, renk: "#e40045" },
                  ].map(s => (
                    <div key={s.label} style={{ flex: 1, background: "#222830", border: `1px solid ${s.renk}33`, borderTop: `2px solid ${s.renk}`, borderRadius: "4px", padding: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "28px", fontWeight: "bold", color: s.renk, fontFamily: "Arial, sans-serif" }}>{s.val}</div>
                      <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", fontFamily: "Arial, sans-serif", letterSpacing: "2px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* YENİ KİŞİ FORMU */}
                <div style={{ background: "#222830", border: "1px solid #303c49", borderRadius: "4px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#91b900", marginBottom: "12px", letterSpacing: "2px", fontWeight: "bold" }}>YENİ KİŞİ EKLE</div>
                  <div style={{ display: "flex", gap: "16px", marginBottom: "12px", alignItems: "center" }}>
                    <div onClick={() => document.getElementById("yeni-foto").click()}
                      style={{ width: "64px", height: "64px", borderRadius: "4px", border: "2px dashed #303c49", cursor: "pointer", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f24" }}>
                      {yeniKisi.foto ? <img src={yeniKisi.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "24px" }}>+</span>}
                    </div>
                    <input id="yeni-foto" type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => e.target.files[0] && yeniFotoEkle(e.target.files[0])} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <input placeholder="İsim Soyisim" value={yeniKisi.isim}
                          onChange={e => setYeniKisi({ ...yeniKisi, isim: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && kisiEkle()} style={inputStyle} />
                        <input placeholder="Ekip / Birim" value={yeniKisi.ekip}
                          onChange={e => setYeniKisi({ ...yeniKisi, ekip: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && kisiEkle()} style={inputStyle} />
                      </div>
                      <input placeholder="Önceki projeler (virgülle ayır)" value={yeniKisi.projeler}
                        onChange={e => setYeniKisi({ ...yeniKisi, projeler: e.target.value })}
                        onKeyDown={e => e.key === "Enter" && kisiEkle()}
                        style={{ ...inputStyle, width: "100%" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#afafaf", cursor: "pointer" }}>
                      <input type="checkbox" checked={yeniKisi.izinli} onChange={e => setYeniKisi({ ...yeniKisi, izinli: e.target.checked })} />
                      İzinli
                    </label>
                    <button onClick={kisiEkle} style={btnStyle("#91b900")}>EKLE</button>
                  </div>
                </div>

                {/* KİŞİ LİSTESİ */}
                {kisiler.length === 0 && (
                  <div style={{ textAlign: "center", color: "#333", fontFamily: "Arial, sans-serif", padding: "40px" }}>Henüz kimse yok. Ekip üyesi ekle!</div>
                )}
                {kisiler.map((k, i) => (
                  <div key={k.id} style={{
                    background: "#222830",
                    border: `1px solid ${duzenleId === k.id ? "#91b90044" : k.izinli ? "#e4004533" : "#303c49"}`,
                    borderLeft: `3px solid ${duzenleId === k.id ? "#91b900" : k.izinli ? "#e40045" : "#303c49"}`,
                    borderRadius: "4px", padding: "10px 14px", marginBottom: "8px",
                    opacity: k.izinli && duzenleId !== k.id ? 0.6 : 1,
                  }}>
                    {duzenleId === k.id ? (
                      <div>
                        <div style={{ display: "flex", gap: "16px", marginBottom: "10px", alignItems: "center" }}>
                          <div onClick={() => document.getElementById(`duzenle-foto-${k.id}`).click()}
                            style={{ width: "48px", height: "48px", borderRadius: "4px", border: "2px dashed #91b900", cursor: "pointer", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f24" }}>
                            {duzenleData.foto ? <img src={duzenleData.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "20px" }}>+</span>}
                          </div>
                          <input id={`duzenle-foto-${k.id}`} type="file" accept="image/*" style={{ display: "none" }}
                            onChange={e => e.target.files[0] && resimSikistir(e.target.files[0], (b) => setDuzenleData({ ...duzenleData, foto: b }))} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                              <input value={duzenleData.isim || ""} placeholder="İsim Soyisim"
                                onChange={e => setDuzenleData({ ...duzenleData, isim: e.target.value })} style={inputStyle} />
                              <input value={duzenleData.ekip || ""} placeholder="Ekip / Birim"
                                onChange={e => setDuzenleData({ ...duzenleData, ekip: e.target.value })} style={inputStyle} />
                            </div>
                            <input value={duzenleData.projeler || ""} placeholder="Önceki projeler"
                              onChange={e => setDuzenleData({ ...duzenleData, projeler: e.target.value })}
                              style={{ ...inputStyle, width: "100%" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#afafaf", cursor: "pointer" }}>
                            <input type="checkbox" checked={duzenleData.izinli || false}
                              onChange={e => setDuzenleData({ ...duzenleData, izinli: e.target.checked })} />
                            İzinli
                          </label>
                          <button onClick={kisiKaydet} style={btnStyle("#91b900", "8px 14px")}>KAYDET</button>
                          <button onClick={() => { setDuzenleId(null); setDuzenleData({}); }} style={btnStyle("#555", "8px 14px")}>İPTAL</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div onClick={() => document.getElementById(`foto-${k.id}`).click()}
                          style={{ width: "48px", height: "48px", borderRadius: "4px", border: "2px dashed #303c49", cursor: "pointer", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f24" }}>
                          {k.foto ? <img src={k.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "20px", color: "#555" }}>+</span>}
                        </div>
                        <input id={`foto-${k.id}`} type="file" accept="image/*" style={{ display: "none" }}
                          onChange={e => e.target.files[0] && fotoEkle(k.id, e.target.files[0])} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", fontWeight: "bold", color: k.izinli ? "#555" : "#e0e0e0" }}>
                            {k.isim}
                            {k.izinli && <span style={{ marginLeft: "8px", fontSize: "10px", color: "#e40045", background: "#e4004522", padding: "2px 8px", borderRadius: "2px", letterSpacing: "1px" }}>İZİNLİ</span>}
                          </div>
                          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#555", marginTop: "2px" }}>
                            {k.ekip} {k.projeler && `— ${k.projeler}`}
                          </div>
                        </div>
                        <button onClick={() => { setDuzenleId(k.id); setDuzenleData({ ...k }); }} style={btnStyle("#ffcd00", "8px 10px")}>DUZENLE</button>
                        <button onClick={() => izinToggle(k.id)} style={btnStyle(k.izinli ? "#e40045" : "#303c49", "8px 10px")}>
                          {k.izinli ? "İZİNLİ" : "İZİN"}
                        </button>
                        <button onClick={() => kisiSil(k.id)} style={btnStyle("#e40045", "8px 10px")}>SİL</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* GÖREVLER */}
            {sekme === "gorevler" && (
              <div>
                <div style={{ background: "#222830", border: "1px solid #303c49", borderRadius: "4px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#91b900", marginBottom: "12px", letterSpacing: "2px", fontWeight: "bold" }}>YENİ GÖREV EKLE</div>
                  <input placeholder="Görev başlığı" value={yeniGorev.baslik}
                    onChange={e => setYeniGorev({ ...yeniGorev, baslik: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && gorevEkle()}
                    style={{ ...inputStyle, width: "100%", marginBottom: "10px" }} />
                  <input placeholder="Açıklama (isteğe bağlı)" value={yeniGorev.aciklama}
                    onChange={e => setYeniGorev({ ...yeniGorev, aciklama: e.target.value })}
                    onKeyDown={e => e.key === "Enter" && gorevEkle()}
                    style={{ ...inputStyle, width: "100%", marginBottom: "10px" }} />
                  <button onClick={gorevEkle} style={btnStyle("#91b900")}>EKLE</button>
                </div>
                {gorevler.length === 0 && (
                  <div style={{ textAlign: "center", color: "#333", fontFamily: "Arial, sans-serif", padding: "40px" }}>Henüz görev yok.</div>
                )}
                {gorevler.map((g, i) => (
                  <div key={g.id} style={{ background: "#222830", border: `1px solid #303c49`, borderLeft: `3px solid ${RENKLER[i % RENKLER.length]}`, borderRadius: "4px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", fontWeight: "bold", color: "#e0e0e0" }}>{g.baslik}</div>
                      {g.aciklama && <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#555", marginTop: "4px" }}>{g.aciklama}</div>}
                    </div>
                    <button onClick={() => gorevSil(g.id)} style={btnStyle("#e40045", "8px 10px")}>SİL</button>
                  </div>
                ))}
              </div>
            )}

            {/* DAĞITIM */}
            {sekme === "dagit" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Arial, sans-serif", fontSize: "16px", fontWeight: "bold", color: "#afafaf", marginBottom: "32px", letterSpacing: "4px" }}>
                  AI GRUPLAMA
                </div>
                <div style={{ background: "#222830", border: "1px solid #303c49", borderRadius: "4px", padding: "32px", marginBottom: "24px" }}>
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#afafaf", marginBottom: "8px" }}>
                    Aktif: <span style={{ color: "#91b900" }}>{aktifSayisi}</span> &nbsp;|&nbsp;
                    İzinli: <span style={{ color: "#e40045" }}>{izinliSayisi}</span> &nbsp;|&nbsp;
                    Görev: <span style={{ color: "#ffcd00" }}>{gorevler.length}</span>
                  </div>
                  <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", color: "#afafaf", marginBottom: "24px" }}>Kaç gruba bölünsün?</div>
                  <input type="number" min="2" max="20" value={grupSayisi}
                    onChange={e => setGrupSayisi(Number(e.target.value))}
                    style={{ ...inputStyle, width: "100px", textAlign: "center", fontSize: "24px", padding: "12px" }} />
                  <div style={{ marginTop: "8px", fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#444" }}>
                    Grup başına ~{Math.ceil(aktifSayisi / grupSayisi)} kişi
                  </div>
                </div>
                {hata && (
                  <div style={{ background: "#e4004522", border: "1px solid #e40045", borderRadius: "4px", padding: "12px", marginBottom: "16px", fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#e40045" }}>
                    {hata}
                  </div>
                )}
                <button onClick={grupla} disabled={yukleniyor || kisiler.length === 0} style={{
                  ...btnStyle("#91b900"), fontSize: "14px", padding: "16px 48px",
                  opacity: yukleniyor || kisiler.length === 0 ? 0.5 : 1,
                  letterSpacing: "3px",
                }}>
                  {yukleniyor ? "ISLENIYOR..." : "GRUPLARI OLUSTUR"}
                </button>
              </div>
            )}

            {/* SONUÇ */}
            {sekme === "sonuc" && (
              <div>
                {seciliGecmis && (
                  <div style={{ background: "#222830", border: "1px solid #91b90033", borderRadius: "4px", padding: "10px 16px", marginBottom: "16px", fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#91b900" }}>
                    Gecmis kayit — {seciliGecmis.tarih}
                    <button onClick={() => setSeciliGecmis(null)} style={{ ...btnStyle("#555", "4px 10px"), marginLeft: "12px", fontSize: "11px" }}>KAPAT</button>
                  </div>
                )}
                {gosterilecekGruplar.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#333", fontFamily: "Arial, sans-serif", padding: "40px" }}>Henüz gruplar oluşturulmadı.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                    {gosterilecekGruplar.map((g, i) => (
                      <div key={i} style={{ background: "#222830", border: `1px solid #303c49`, borderTop: `3px solid ${RENKLER[i % RENKLER.length]}`, borderRadius: "4px", padding: "16px" }}>
                        <div style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", fontWeight: "bold", color: RENKLER[i % RENKLER.length], marginBottom: "12px", letterSpacing: "2px" }}>
                          GRUP {g.no}
                        </div>
                        {g.gorev && (
                          <div style={{ background: "#1a1f24", border: `1px solid ${RENKLER[i % RENKLER.length]}44`, borderRadius: "4px", padding: "10px", marginBottom: "12px" }}>
                            <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: RENKLER[i % RENKLER.length], marginBottom: "4px", letterSpacing: "1px" }}>GOREV</div>
                            <div style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#e0e0e0", fontWeight: "bold" }}>{g.gorev.baslik}</div>
                            {g.gorev.aciklama && <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#555", marginTop: "4px" }}>{g.gorev.aciklama}</div>}
                          </div>
                        )}
                        {g.uyeler.map((u, j) => {
                          const kisi = gosterilecekKisiler.find(k => k.isim === u);
                          return (
                            <div key={j} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                              <div style={{ width: "40px", height: "40px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, background: "#1a1f24", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid #303c49` }}>
                                {kisi?.foto ? <img src={kisi.foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "18px", color: "#555" }}>?</span>}
                              </div>
                              <div>
                                <div style={{ fontFamily: "Arial, sans-serif", fontSize: "13px", fontWeight: "bold", color: "#e0e0e0" }}>{u}</div>
                                {kisi && <div style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", color: "#555" }}>{kisi.ekip}</div>}
                              </div>
                            </div>
                          );
                        })}
                        {g.gerekce && (
                          <div style={{ marginTop: "12px", padding: "10px", background: "#1a1f24", borderRadius: "4px", fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#555", lineHeight: "1.6", borderLeft: `2px solid ${RENKLER[i % RENKLER.length]}44` }}>
                            {g.gerekce}
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
  background: "#1a1f24", border: "1px solid #303c49", borderRadius: "4px",
  padding: "10px 12px", color: "#e0e0e0", fontFamily: "Arial, sans-serif", fontSize: "13px",
  outline: "none", width: "100%",
};

function btnStyle(renk, padding = "10px 20px") {
  return {
    background: renk + "22", border: `1px solid ${renk}`,
    color: renk, borderRadius: "4px", padding,
    fontFamily: "Arial, sans-serif", fontSize: "12px", fontWeight: "bold",
    letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s",
  };
}