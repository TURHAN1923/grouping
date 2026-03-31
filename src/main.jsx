import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";

function Root() {
  const [kullanici, setKullanici] = useState(null);

  if (!kullanici) {
    return <Login onGiris={setKullanici} />;
  }

  return <App kullanici={kullanici} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);