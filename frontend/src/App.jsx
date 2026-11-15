import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Timetables from './pages/Timetables';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import './App.css';
import Register from './pages/Register';
import Settings from './pages/Settings';
import RouteMap from './pages/RouteMap';
import RideHistory from './pages/RideHistory';
import AccountPreferences from './pages/AccountPreferences';
import PrivacyPermissions from './pages/PrivacyPermissions';
import HelpAbout from './pages/HelpAbout';

export default function App() {
  const [theme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="mobile-app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timetables" element={<Timetables />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/route-map" element={<RouteMap />} />
          <Route path="/ride-history" element={<RideHistory />} />
          <Route path="/account-preferences" element={<AccountPreferences />} />
          <Route path="/privacy-permissions" element={<PrivacyPermissions />} />
          <Route path="/help-about" element={<HelpAbout />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}