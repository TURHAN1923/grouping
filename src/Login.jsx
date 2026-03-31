import { useState } from "react";
import { supabase } from "./supabase";

export default function Login({ onGiris }) {
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap() {
    if (!email.trim() || !sifre.trim()) {
      setHata("E-posta ve şifre boş olamaz!");
      return;
    }
    setYukleniyor(true);
    setHata("");

    const { data, error } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("email", email.trim())
      .eq("sifre", sifre.trim())
      .single();

    if (error || !data) {
      setHata("E-posta veya şifre hatalı!");
    } else {
      onGiris(data);
    }
    setYukleniyor(false);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#111118", border: "1px solid #00ff8833",
        borderTop: "3px solid #00ff88", borderRadius: "12px",
        padding: "40px", width: "100%", maxWidth: "380px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "16px", color: "#00ff88", marginBottom: "8px" }}>
            ⚔️ EKİP DAĞITIM
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555" }}>
            Giriş yapın
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555", marginBottom: "6px" }}>
            E-POSTA
          </div>
          <input
            type="email"
            placeholder="ornek@sirket.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && girisYap()}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#555", marginBottom: "6px" }}>
            ŞİFRE
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={sifre}
            onChange={e => setSifre(e.target.value)}
            onKeyDown={e => e.key === "Enter" && girisYap()}
            style={inputStyle}
          />
        </div>

        {hata && (
          <div style={{
            background: "#ff333322", border: "1px solid #ff3333",
            borderRadius: "6px", padding: "10px 12px", marginBottom: "16px",
            fontFamily: "monospace", fontSize: "12px", color: "#ff6644",
          }}>
            ⚠️ {hata}
          </div>
        )}

        <button
          onClick={girisYap}
          disabled={yukleniyor}
          style={{
            width: "100%", padding: "14px",
            background: "#00ff8822", border: "1px solid #00ff88",
            color: "#00ff88", borderRadius: "8px",
            fontFamily: "'Press Start 2P', monospace", fontSize: "12px",
            cursor: yukleniyor ? "not-allowed" : "pointer",
            opacity: yukleniyor ? 0.6 : 1,
            transition: "all 0.2s",
          }}>
          {yukleniyor ? "⏳ Kontrol..." : "GİRİŞ YAP"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#0a0a0f",
  border: "1px solid #333", borderRadius: "6px",
  padding: "12px", color: "#e0e0e0",
  fontFamily: "monospace", fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};