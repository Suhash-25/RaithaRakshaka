import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import GlobalTranslator from './components/GlobalTranslator';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DiseasePage from './pages/DiseasePage';
import ChatPage from './pages/ChatPage';
import WeatherPage from './pages/WeatherPage';
import SchemesPage from './pages/SchemesPage';
import MarketPage from './pages/MarketPage';
import WellnessPage from './pages/WellnessPage';
import MapPage from './pages/MapPage';
import VendorsPage from './pages/VendorsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
          <Navbar />
          <Toast />
          <GlobalTranslator />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/disease" element={<DiseasePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/schemes" element={<SchemesPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/wellness" element={<WellnessPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
