/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Lock,
  UserPlus,
  LogIn,
  Loader2,
  X
} from 'lucide-react';
import { UserSession } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession, token: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle PIN input strictly limited to 4 numeric digits
  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(rawVal);
    if (errorMessage) setErrorMessage(null);
  };

  const handleConfirmPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(rawVal);
    if (errorMessage) setErrorMessage(null);
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setPin('');
    setConfirmPin('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Submit Handler for Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanFlat = flatNo.trim();
    const cleanPin = pin.trim();

    if (!cleanFlat) {
      setErrorMessage('Flat number is required.');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Resident name is required.');
      return;
    }
    if (cleanPin.length !== 4) {
      setErrorMessage('PIN must be exactly 4 numeric digits.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          flat: cleanFlat,
          pin: cleanPin
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Login failed. Please verify your name, flat number, and PIN.');
        return;
      }

      // Success
      if (data.user && data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage('Unexpected server response format.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Unable to connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler for Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = name.trim();
    const cleanFlat = flatNo.trim();
    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanFlat) {
      setErrorMessage('Flat number is required.');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Resident name is required.');
      return;
    }
    if (cleanPin.length !== 4) {
      setErrorMessage('PIN must be exactly 4 numeric digits.');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setErrorMessage('PIN confirmation does not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          flat: cleanFlat,
          pin: cleanPin
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Registration failed. Please check your resident details.');
        return;
      }

      // Registration successful! Direct resident to login
      setSuccessMessage('Registration successful! You may now log in with your name, flat number, and chosen 4-digit PIN.');
      setMode('login');
      setPin('');
      setConfirmPin('');
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMessage('Unable to connect to registration server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3.5 sm:p-6 overflow-x-hidden overflow-y-auto bg-[#0d041a] text-white select-none">
      
      {/* 
        ========================================================================
        LOCAL SVG & CSS NIGHT-CITY ILLUSTRATION (NO EXTERNAL ASSETS / URLS)
        Deep purple night sky, stars, moon halo, multi-layered violet skyline
        silhouettes with lit windows and street silhouettes.
        ========================================================================
      */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      >
        <svg 
          viewBox="0 0 1440 900" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full object-cover preserve-3d"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Deep purple gradient for atmospheric night sky */}
            <linearGradient id="skyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#0a0316" />
              <stop offset="35%" stopColor="#19062d" />
              <stop offset="65%" stopColor="#2c0b4d" />
              <stop offset="85%" stopColor="#41136b" />
              <stop offset="100%" stopColor="#531685" />
            </linearGradient>

            {/* Violet skyline back layer gradient */}
            <linearGradient id="backSkylineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#260b42" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#140424" />
            </linearGradient>

            {/* Midground violet skyline gradient */}
            <linearGradient id="midSkylineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3d1466" />
              <stop offset="100%" stopColor="#19052b" />
            </linearGradient>

            {/* Foreground street & structures gradient */}
            <linearGradient id="streetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1b062e" />
              <stop offset="100%" stopColor="#090212" />
            </linearGradient>

            {/* Street lamp glow radial */}
            <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#e9d5ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0" />
            </radialGradient>

            {/* Soft moon atmospheric halo */}
            <radialGradient id="moonHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e9d5ff" stopOpacity="0.35" />
              <stop offset="45%" stopColor="#c084fc" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#581c87" stopOpacity="0" />
            </radialGradient>

            {/* City horizon neon haze */}
            <linearGradient id="horizonHaze" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="0" />
              <stop offset="60%" stopColor="#c084fc" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* 1. Deep Sky Background */}
          <rect width="1440" height="900" fill="url(#skyGrad)" />

          {/* 2. Moon & Atmospheric Glow */}
          <circle cx="1180" cy="190" r="160" fill="url(#moonHalo)" />
          {/* Subtle stylized crescent moon */}
          <path 
            d="M1205 130 C1245 150 1260 200 1235 240 C1215 270 1175 280 1145 260 C1175 270 1210 255 1225 225 C1240 190 1230 155 1205 130 Z" 
            fill="#fae8ff" 
            opacity="0.85" 
          />

          {/* 3. Night Sky Stars */}
          <g opacity="0.75">
            <circle cx="120" cy="80" r="1.5" fill="#ffffff" />
            <circle cx="190" cy="140" r="1" fill="#e9d5ff" />
            <circle cx="280" cy="95" r="2" fill="#ffffff" opacity="0.9" />
            <circle cx="340" cy="180" r="1.2" fill="#d8b4fe" />
            <circle cx="450" cy="110" r="1.5" fill="#ffffff" />
            <circle cx="560" cy="65" r="2" fill="#ffffff" />
            <circle cx="680" cy="150" r="1" fill="#e9d5ff" />
            <circle cx="790" cy="90" r="1.8" fill="#ffffff" />
            <circle cx="890" cy="130" r="1.2" fill="#c084fc" />
            <circle cx="980" cy="75" r="2" fill="#ffffff" />
            <circle cx="1060" cy="140" r="1" fill="#e9d5ff" />
            <circle cx="1320" cy="85" r="1.5" fill="#ffffff" />
            <circle cx="1380" cy="170" r="1.2" fill="#fae8ff" />
            <circle cx="70" cy="220" r="1" fill="#ffffff" />
            <circle cx="240" cy="260" r="1.4" fill="#e9d5ff" />
            <circle cx="410" cy="240" r="1" fill="#ffffff" />
            <circle cx="630" cy="220" r="1.6" fill="#c084fc" />
            <circle cx="850" cy="250" r="1.2" fill="#ffffff" />
            <circle cx="1030" cy="230" r="1.5" fill="#e9d5ff" />
            <circle cx="1360" cy="290" r="1.8" fill="#ffffff" />
          </g>

          {/* 4. Distant Skyline (Layer 1 - deep violet silhouette) */}
          <g fill="url(#backSkylineGrad)">
            {/* Left background towers */}
            <rect x="20" y="320" width="70" height="420" />
            <rect x="75" y="270" width="55" height="470" />
            <polygon points="102,230 102,270 103,270 103,230" stroke="#a855f7" strokeWidth="2" />
            <rect x="150" y="340" width="85" height="400" />
            <rect x="225" y="310" width="60" height="430" />
            <rect x="310" y="290" width="90" height="450" />
            {/* Center background high-rises */}
            <rect x="420" y="330" width="70" height="410" />
            <rect x="510" y="260" width="100" height="480" />
            <polygon points="560,200 560,260 561,260 561,200" stroke="#f43f5e" strokeWidth="2" />
            <rect x="630" y="320" width="80" height="420" />
            <rect x="730" y="350" width="65" height="390" />
            <rect x="820" y="280" width="90" height="460" />
            <rect x="930" y="300" width="75" height="440" />
            {/* Right background skyscrapers */}
            <rect x="1030" y="260" width="85" height="480" />
            <polygon points="1072,210 1072,260 1073,260 1073,210" stroke="#38bdf8" strokeWidth="2" />
            <rect x="1135" y="330" width="70" height="410" />
            <rect x="1230" y="290" width="95" height="450" />
            <rect x="1340" y="340" width="90" height="400" />
          </g>

          {/* 5. Midground Skyline Layer (Layer 2 - crisp purple silhouettes with lit windows) */}
          <g fill="url(#midSkylineGrad)">
            {/* Far Left Skyscraper */}
            <rect x="0" y="380" width="95" height="440" />
            {/* Stepped Deco Tower */}
            <rect x="110" y="330" width="115" height="490" />
            <rect x="125" y="290" width="85" height="40" />
            <rect x="145" y="250" width="45" height="40" />
            <line x1="167" y1="210" x2="167" y2="250" stroke="#e879f9" strokeWidth="3" />
            <circle cx="167" cy="210" r="3" fill="#f43f5e" />

            {/* Tower 3 */}
            <rect x="245" y="370" width="95" height="450" />

            {/* Tower 4 */}
            <rect x="360" y="340" width="120" height="480" />

            {/* Center Skyscraper with spire */}
            <rect x="500" y="310" width="140" height="510" />
            <rect x="535" y="270" width="70" height="40" />
            <line x1="570" y1="200" x2="570" y2="270" stroke="#c084fc" strokeWidth="4" />
            <circle cx="570" cy="198" r="4" fill="#fb7185" />

            {/* Tower 6 */}
            <rect x="660" y="390" width="110" height="430" />

            {/* Tower 7 */}
            <rect x="790" y="330" width="130" height="490" />
            <rect x="825" y="290" width="60" height="40" />

            {/* Right Mega Towers */}
            <rect x="940" y="360" width="115" height="460" />

            <rect x="1075" y="300" width="125" height="520" />
            <rect x="1110" y="260" width="55" height="40" />
            <line x1="1137" y1="215" x2="1137" y2="260" stroke="#f472b6" strokeWidth="3" />
            <circle cx="1137" cy="215" r="3" fill="#f43f5e" />

            <rect x="1220" y="380" width="100" height="440" />
            <rect x="1340" y="360" width="100" height="460" />
          </g>

          {/* 6. Lit Windows Patterns on Midground Buildings */}
          <g>
            {/* Deco Tower Windows (left) */}
            <g fill="#fef08a" opacity="0.85">
              <rect x="125" y="350" width="6" height="9" rx="1" />
              <rect x="140" y="350" width="6" height="9" rx="1" />
              <rect x="155" y="350" width="6" height="9" rx="1" />
              <rect x="185" y="350" width="6" height="9" rx="1" />
              <rect x="200" y="350" width="6" height="9" rx="1" />
              
              <rect x="125" y="375" width="6" height="9" rx="1" />
              <rect x="170" y="375" width="6" height="9" rx="1" />
              <rect x="185" y="375" width="6" height="9" rx="1" />
              
              <rect x="140" y="405" width="6" height="9" rx="1" />
              <rect x="155" y="405" width="6" height="9" rx="1" />
              <rect x="200" y="405" width="6" height="9" rx="1" />

              <rect x="125" y="435" width="6" height="9" rx="1" />
              <rect x="170" y="435" width="6" height="9" rx="1" />
              <rect x="185" y="435" width="6" height="9" rx="1" />
            </g>

            {/* Lavender / Pale White Windows */}
            <g fill="#f3e8ff" opacity="0.75">
              <rect x="170" y="350" width="6" height="9" rx="1" />
              <rect x="140" y="375" width="6" height="9" rx="1" />
              <rect x="200" y="375" width="6" height="9" rx="1" />
              <rect x="125" y="405" width="6" height="9" rx="1" />
              <rect x="185" y="405" width="6" height="9" rx="1" />
              <rect x="155" y="435" width="6" height="9" rx="1" />
              <rect x="200" y="435" width="6" height="9" rx="1" />
            </g>

            {/* Center Skyscraper Windows */}
            <g fill="#fef08a" opacity="0.9">
              <rect x="520" y="330" width="8" height="12" rx="1" />
              <rect x="540" y="330" width="8" height="12" rx="1" />
              <rect x="580" y="330" width="8" height="12" rx="1" />
              <rect x="600" y="330" width="8" height="12" rx="1" />
              
              <rect x="520" y="360" width="8" height="12" rx="1" />
              <rect x="560" y="360" width="8" height="12" rx="1" />
              <rect x="600" y="360" width="8" height="12" rx="1" />

              <rect x="540" y="390" width="8" height="12" rx="1" />
              <rect x="560" y="390" width="8" height="12" rx="1" />
              <rect x="580" y="390" width="8" height="12" rx="1" />

              <rect x="520" y="420" width="8" height="12" rx="1" />
              <rect x="580" y="420" width="8" height="12" rx="1" />
              <rect x="600" y="420" width="8" height="12" rx="1" />

              <rect x="540" y="450" width="8" height="12" rx="1" />
              <rect x="560" y="450" width="8" height="12" rx="1" />
            </g>

            {/* Right Skyscraper Windows */}
            <g fill="#fef08a" opacity="0.85">
              <rect x="1095" y="330" width="7" height="10" rx="1" />
              <rect x="1115" y="330" width="7" height="10" rx="1" />
              <rect x="1155" y="330" width="7" height="10" rx="1" />
              <rect x="1175" y="330" width="7" height="10" rx="1" />

              <rect x="1095" y="360" width="7" height="10" rx="1" />
              <rect x="1135" y="360" width="7" height="10" rx="1" />
              <rect x="1175" y="360" width="7" height="10" rx="1" />

              <rect x="1115" y="390" width="7" height="10" rx="1" />
              <rect x="1135" y="390" width="7" height="10" rx="1" />
              <rect x="1155" y="390" width="7" height="10" rx="1" />

              <rect x="1095" y="420" width="7" height="10" rx="1" />
              <rect x="1155" y="420" width="7" height="10" rx="1" />
              <rect x="1175" y="420" width="7" height="10" rx="1" />
            </g>

            {/* Other buildings scattered warm window lights */}
            <g fill="#e9d5ff" opacity="0.7">
              <rect x="260" y="400" width="7" height="8" />
              <rect x="280" y="400" width="7" height="8" />
              <rect x="310" y="400" width="7" height="8" />
              <rect x="270" y="430" width="7" height="8" />
              <rect x="300" y="430" width="7" height="8" />

              <rect x="380" y="370" width="8" height="10" />
              <rect x="420" y="370" width="8" height="10" />
              <rect x="450" y="370" width="8" height="10" />
              <rect x="390" y="400" width="8" height="10" />
              <rect x="430" y="400" width="8" height="10" />

              <rect x="815" y="360" width="7" height="10" />
              <rect x="840" y="360" width="7" height="10" />
              <rect x="880" y="360" width="7" height="10" />
              <rect x="825" y="390" width="7" height="10" />
              <rect x="865" y="390" width="7" height="10" />

              <rect x="965" y="390" width="6" height="9" />
              <rect x="990" y="390" width="6" height="9" />
              <rect x="1020" y="390" width="6" height="9" />
              <rect x="975" y="420" width="6" height="9" />
              <rect x="1005" y="420" width="6" height="9" />
            </g>
          </g>

          {/* 7. Horizon City Glow & Violet Haze */}
          <rect x="0" y="450" width="1440" height="260" fill="url(#horizonHaze)" />

          {/* 8. Foreground Street Silhouettes, Highway Bridge & Lampposts */}
          <g fill="url(#streetGrad)">
            {/* Elevated highway / roadway silhouette */}
            <path d="M0 640 Q 720 620 1440 640 L 1440 900 L 0 900 Z" />
            {/* Lower highway roadbed */}
            <path d="M0 720 Q 720 705 1440 720 L 1440 900 L 0 900 Z" opacity="0.9" />

            {/* Overpass bridge support pillars */}
            <rect x="140" y="640" width="22" height="180" />
            <rect x="380" y="635" width="22" height="180" />
            <rect x="620" y="630" width="22" height="180" />
            <rect x="860" y="630" width="22" height="180" />
            <rect x="1100" y="635" width="22" height="180" />
            <rect x="1300" y="640" width="22" height="180" />

            {/* Bridge railings */}
            <line x1="0" y1="635" x2="1440" y2="635" stroke="#2e0854" strokeWidth="4" />
          </g>

          {/* 9. Street Silhouettes: Street Light Poles & Conic Glows */}
          <g>
            {/* Street light 1 (Left) */}
            <path d="M 210 635 L 210 575 Q 210 550 230 550 L 245 550" stroke="#120424" strokeWidth="3" fill="none" />
            <polygon points="245,550 240,555 250,555" fill="#e9d5ff" />
            <polygon points="245,555 200,660 290,660" fill="url(#lampGlow)" opacity="0.45" />

            {/* Street light 2 (Mid-Left) */}
            <path d="M 450 630 L 450 570 Q 450 545 470 545 L 485 545" stroke="#120424" strokeWidth="3" fill="none" />
            <polygon points="485,545 480,550 490,550" fill="#e9d5ff" />
            <polygon points="485,550 440,655 530,655" fill="url(#lampGlow)" opacity="0.45" />

            {/* Street light 3 (Mid-Right) */}
            <path d="M 970 630 L 970 570 Q 970 545 990 545 L 1005 545" stroke="#120424" strokeWidth="3" fill="none" />
            <polygon points="1005,545 1000,550 1010,550" fill="#e9d5ff" />
            <polygon points="1005,550 960,655 1050,655" fill="url(#lampGlow)" opacity="0.45" />

            {/* Street light 4 (Right) */}
            <path d="M 1210 635 L 1210 575 Q 1210 550 1230 550 L 1245 550" stroke="#120424" strokeWidth="3" fill="none" />
            <polygon points="1245,550 1240,555 1250,555" fill="#e9d5ff" />
            <polygon points="1245,555 1200,660 1290,660" fill="url(#lampGlow)" opacity="0.45" />
          </g>

          {/* 10. Distant vehicle taillight and headlight streaks on street */}
          <g opacity="0.8">
            <line x1="80" y1="645" x2="350" y2="645" stroke="#ef4444" strokeWidth="2" strokeDasharray="30 15" opacity="0.6" />
            <line x1="380" y1="645" x2="680" y2="645" stroke="#ef4444" strokeWidth="2" strokeDasharray="40 20" opacity="0.7" />
            <line x1="720" y1="645" x2="1100" y2="645" stroke="#ef4444" strokeWidth="2" strokeDasharray="50 25" opacity="0.6" />

            <line x1="200" y1="653" x2="520" y2="653" stroke="#fef08a" strokeWidth="2" strokeDasharray="45 20" opacity="0.75" />
            <line x1="560" y1="653" x2="890" y2="653" stroke="#fef08a" strokeWidth="2" strokeDasharray="35 15" opacity="0.85" />
            <line x1="930" y1="653" x2="1350" y2="653" stroke="#fef08a" strokeWidth="2" strokeDasharray="60 30" opacity="0.7" />
          </g>
        </svg>

        {/* Ambient atmospheric depth gradients */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#1a0633]/30 to-[#0e031a]/85 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0a0214] via-[#120421]/80 to-transparent pointer-events-none" />
      </div>

      {/* 
        ========================================================================
        CENTERED TRANSLUCENT DARK-PURPLE ROUNDED GLASS CARD
        On phones the card fits the screen seamlessly (responsive w-full max-w)
        ========================================================================
      */}
      <main className="relative z-10 w-full max-w-[390px] xs:max-w-[410px] sm:max-w-[430px] mx-auto my-auto">
        <div className="relative rounded-3xl bg-[#240b3b]/75 sm:bg-[#200936]/80 backdrop-blur-xl border border-purple-400/25 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85),0_0_40px_rgba(168,85,247,0.18)] p-6 sm:p-8 transition-all">
          
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

          {/* Header section with branding & Mode title */}
          <div className="text-center space-y-1.5 mb-5">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-900/60 border border-purple-400/30 text-purple-200 shadow-inner mb-1.5">
              <Building2 className="w-5 h-5 text-purple-300" />
            </div>

            <div className="space-y-0.5">
              <p className="text-[11px] font-mono tracking-widest text-purple-300/80 uppercase font-semibold">
                CoopMart Society Billing
              </p>
              {/* Heading LOGIN or REGISTER */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-widest text-white uppercase drop-shadow-sm">
                {mode === 'login' ? 'LOGIN' : 'REGISTER'}
              </h1>
            </div>
            
            <p className="text-xs text-purple-200/70 font-medium pt-0.5">
              {mode === 'login' 
                ? 'Resident Member Portal Sign In' 
                : 'Open Resident Registration (No Pre-Existing Record Required)'}
            </p>
          </div>

          {/* College Demo Registration Explainer Banner (in register mode) */}
          {mode === 'register' && (
            <div className="mb-4 p-3 rounded-2xl bg-purple-900/40 border border-purple-400/30 text-purple-200 text-xs">
              <p className="leading-relaxed text-[11.5px]">
                <strong className="text-white font-bold block mb-0.5">College Demo Setup:</strong>
                Anyone can register! Enter any resident name, flat number, and chosen 4-digit PIN. No pre-existing society record is required (new accounts are provisioned automatically).
              </p>
              <p className="mt-1.5 text-[10px] text-amber-300 font-semibold bg-amber-950/40 border border-amber-500/30 p-1.5 rounded-lg">
                ⚠️ Demonstration gate only — NOT secure for real or sensitive personal data.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div 
              role="alert" 
              className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs shadow-lg flex items-start space-x-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11.5px] leading-relaxed pr-2">
                {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-300 hover:text-white p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div 
              role="status" 
              className="mb-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs shadow-lg flex items-start space-x-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11.5px] leading-relaxed pr-2">
                {successMessage}
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-300 hover:text-white p-0.5 cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-3.5">
            
            {/* Field: Name */}
            <div className="space-y-1.5 text-left">
              <label 
                htmlFor="resident-name" 
                className="block text-xs font-semibold text-purple-200 uppercase tracking-wide"
              >
                Name
              </label>
              <input
                id="resident-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={mode === 'login' ? 'e.g. Ramesh Sharma' : 'Full name as recorded in society'}
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#170629]/70 border border-purple-400/25 text-white placeholder-purple-300/40 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all shadow-inner"
              />
            </div>

            {/* Field: Flat number (required) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="resident-flat-number" 
                  className="block text-xs font-semibold text-purple-200 uppercase tracking-wide"
                >
                  Flat number <span className="text-pink-400 lowercase font-medium text-[11px]">(required)</span>
                </label>
              </div>
              <input
                id="resident-flat-number"
                name="flatNo"
                type="text"
                required
                autoComplete="address-line1"
                value={flatNo}
                onChange={(e) => {
                  setFlatNo(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. A-102"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#170629]/70 border border-purple-400/25 text-white placeholder-purple-300/40 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all shadow-inner"
              />
            </div>

            {/* Field: Password (4 Digits) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="resident-password-pin" 
                  className="block text-xs font-semibold text-purple-200 uppercase tracking-wide"
                >
                  {mode === 'login' ? 'Password (4 Digits)' : 'Set 4-Digit PIN'}
                </label>
                <span className="text-[10px] text-purple-300/60 font-mono">4 digits</span>
              </div>
              
              <div className="relative">
                <input
                  id="resident-password-pin"
                  name="pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  className="w-full pl-4 pr-11 py-2.5 sm:py-3 rounded-xl bg-[#170629]/70 border border-purple-400/25 text-white placeholder-purple-300/40 text-sm tracking-widest focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all font-mono shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-purple-300/70 hover:text-white transition-colors cursor-pointer"
                >
                  {showPin ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Four small PIN guide dashes */}
              <div 
                className="flex items-center justify-center space-x-2.5 pt-1 pb-0.5" 
                aria-label="Four PIN guide dashes"
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-200 ${
                        isFilled
                          ? 'w-7 sm:w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.85)]'
                          : 'w-6 sm:w-7 bg-purple-400/30'
                      }`}
                      title={`PIN digit ${index + 1} ${isFilled ? 'entered' : 'pending'}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Field: Confirm PIN (in register mode) */}
            {mode === 'register' && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="resident-confirm-pin" 
                    className="block text-xs font-semibold text-purple-200 uppercase tracking-wide"
                  >
                    Confirm 4-Digit PIN
                  </label>
                  <span className="text-[10px] text-purple-300/60 font-mono">re-enter PIN</span>
                </div>
                <input
                  id="resident-confirm-pin"
                  name="confirmPin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoComplete="new-password"
                  value={confirmPin}
                  onChange={handleConfirmPinChange}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#170629]/70 border border-purple-400/25 text-white placeholder-purple-300/40 text-sm tracking-widest focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all font-mono shadow-inner"
                />
              </div>
            )}

            {/* White rounded Submit button */}
            <div className="pt-2">
              <button
                id="btn-auth-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 sm:py-3.5 px-6 rounded-full bg-white hover:bg-purple-50 active:bg-purple-100 text-[#1b0630] font-extrabold text-sm sm:text-base shadow-lg shadow-purple-950/60 hover:shadow-xl transition-all transform active:scale-[0.99] disabled:opacity-75 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-900" />
                    <span>{mode === 'login' ? 'Verifying PIN...' : 'Enrolling PIN...'}</span>
                  </>
                ) : (
                  <>
                    {mode === 'login' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Login</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register & Set PIN</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>

            {/* Mode switch link below button */}
            <div className="text-center pt-1.5 text-xs text-purple-200/80">
              {mode === 'login' ? (
                <>
                  <span>Don&apos;t have an account?</span>{' '}
                  <button
                    id="btn-switch-to-register"
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-bold text-white hover:text-purple-200 underline cursor-pointer transition-colors"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  <span>Already have a PIN registered?</span>{' '}
                  <button
                    id="btn-switch-to-login"
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-bold text-white hover:text-purple-200 underline cursor-pointer transition-colors"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Card footer college-demo gate notice */}
          <div className="mt-6 pt-4 border-t border-purple-400/20 text-center space-y-1">
            <p className="text-[10px] text-purple-300/80 leading-tight">
              <strong>College Demo Notice:</strong> Anyone can register with any name & flat number. No pre-existing record required.
            </p>
            <p className="text-[9.5px] text-amber-300/80 leading-tight">
              ⚠️ Educational demonstration only — NOT secure for production or real personal data.
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}
