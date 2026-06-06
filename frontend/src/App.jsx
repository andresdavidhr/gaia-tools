import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Downloads from "./pages/Downloads";
import Generator from "./pages/Generator";
import Conversor from "./pages/Conversor";
import QRCode from "./pages/QRCode";
import TextUtils from "./pages/TextUtils";
import HashGen from "./pages/HashGen";
import JSONFormatter from "./pages/JSONFormatter";
import Compressor from "./pages/Compressor";
import Base64 from "./pages/Base64";
import JWTDecoder from "./pages/JWTDecoder";
import Diff from "./pages/Diff";
import ImageOptimizer from "./pages/ImageOptimizer";
import PDFTool from "./pages/PDFTool";
import Cron from "./pages/Cron";
import ColorTool from "./pages/ColorTool";
import EXIF from "./pages/EXIF";
import Resize from "./pages/Resize";
import Barcode from "./pages/Barcode";
import SSLChecker from "./pages/SSLChecker";
import HTTPHeaders from "./pages/HTTPHeaders";
import DNSLookup from "./pages/DNSLookup";
import Whois from "./pages/Whois";
import MetadataRemover from "./pages/MetadataRemover";
import SQLFormatter from "./pages/SQLFormatter";

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
      <Route path="/compress" element={<Compressor />} />
      <Route path="/base64" element={<Base64 />} />
      <Route path="/jwt" element={<JWTDecoder />} />
      <Route path="/diff" element={<Diff />} />
      <Route path="/optimize" element={<ImageOptimizer />} />
      <Route path="/pdf" element={<PDFTool />} />
      <Route path="/cron" element={<Cron />} />
      <Route path="/color" element={<ColorTool />} />
      <Route path="/exif" element={<EXIF />} />
      <Route path="/resize" element={<Resize />} />
      <Route path="/barcode"   element={<Barcode />} />
      <Route path="/ssl"       element={<SSLChecker />} />
      <Route path="/headers"   element={<HTTPHeaders />} />
      <Route path="/dns"       element={<DNSLookup />} />
      <Route path="/whois"     element={<Whois />} />
      <Route path="/metadata"  element={<MetadataRemover />} />
      <Route path="/sql"       element={<SQLFormatter />} />
    </Routes>
  );
}
