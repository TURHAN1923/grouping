import { useState } from "react";
import { supabase } from "./supabase";

const ManLogo = () => (
  <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" stroke="#afafaf" strokeWidth="4" fill="none"/>
    <path d="M50 8 C26 8 8 26 8 50 C8 74 26 92 50 92 C74 92 92 74 92 50 C92 26 74 8 50 8Z" stroke="#afafaf" strokeWidth="2" fill="none"/>
    <text x="50" y="58" textAnchor="middle" fontSize="28" fontWeight="bold" fontFamily="Arial" fill="#afafaf">MAN</text>
  </svg>
);

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
      minHeight: "100vh", background: "#1a1f24",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#222830", border: "1px solid #303c49",
        borderTop: "3px solid #91b900", borderRadius: "8px",
        padding: "40px", width: "100%", maxWidth: "380px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
            <ManLogo />
          </div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "20px", fontWeight: "bold", color: "#afafaf", letterSpacing: "4px", marginBottom: "6px" }}>
            MEVAT-T
          </div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#555" }}>
            Giriş yapın
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#afafaf", marginBottom: "6px", letterSpacing: "1px" }}>
            E-POSTA
          </div>
          <input
            type="email"
            placeholder="ornek@man.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && girisYap()}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#afafaf", marginBottom: "6px", letterSpacing: "1px" }}>
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
            background: "#e4004522", border: "1px solid #e40045",
            borderRadius: "6px", padding: "10px 12px", marginBottom: "16px",
            fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#e40045",
          }}>
            {hata}
          </div>
        )}

        <button
          onClick={girisYap}
          disabled={yukleniyor}
          style={{
            width: "100%", padding: "14px",
            background: "#91b900", border: "none",
            color: "#fff", borderRadius: "4px",
            fontFamily: "Arial, sans-serif", fontSize: "14px", fontWeight: "bold",
            letterSpacing: "2px",
            cursor: yukleniyor ? "not-allowed" : "pointer",
            opacity: yukleniyor ? 0.7 : 1,
            transition: "all 0.2s",
          }}>
          {yukleniyor ? "KONTROL EDİLİYOR..." : "GİRİŞ YAP"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#1a1f24",
  border: "1px solid #303c49", borderRadius: "4px",
  padding: "12px", color: "#e0e0e0",
  fontFamily: "Arial, sans-serif", fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};