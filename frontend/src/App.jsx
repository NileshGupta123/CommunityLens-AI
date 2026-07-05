import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Predictions from "./pages/Predictions";
import Chat from "./pages/Chat";
import Alerts from "./pages/Alerts";

function App() {
  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/alerts" element={<Alerts />} />
      </Routes>
    </div>
  );
}

export default App;