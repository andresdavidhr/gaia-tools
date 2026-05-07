import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Downloads from "./pages/Downloads";
import Generator from "./pages/Generator";
import Conversor from "./pages/Conversor";
import QRCode from "./pages/QRCode";
import TextUtils from "./pages/TextUtils";
import HashGen from "./pages/HashGen";
import JSONFormatter from "./pages/JSONFormatter";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/downloads" element={<Downloads />} />
      <Route path="/generator" element={<Generator />} />
      <Route path="/conversor" element={<Conversor />} />
      <Route path="/qr" element={<QRCode />} />
      <Route path="/text" element={<TextUtils />} />
      <Route path="/hash" element={<HashGen />} />
      <Route path="/json" element={<JSONFormatter />} />
    </Routes>
  );
}
