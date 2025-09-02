'use client';

import BudgetOverview from '@/components/budget-overview';
import { InvestmentsView } from '@/components/investments-view-minimal';
import { SettingsView } from '@/components/settings-view';
import { Investment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import React, { useState, useEffect } from 'react';
import Logo from '@/components/ui/logo';
import SavingsView from '@/components/savings-view';

const TABS = [
  { 
    key: 'presupuesto', 
    label: 'Presupuesto',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    )
  },
  { 
    key: 'inversiones', 
    label: 'Inversiones',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    )
  },
  {
    key: 'ahorro',
    label: 'Ahorro',
    disabled: true,
    icon: (
      <svg fill="currentColor" height="24px" width="24px" version="1.2" baseProfile="tiny" viewBox="0 0 256 245" className="w-6 h-6">
        <path d="M254,128.7c0,2.3,0,36,0,49.5c0,4.6-3.6,5.5-6.1,5.5c-2.6,0-30.9,0-30.9,0c-6.1,7.8-13.9,14.7-22.9,20.7v27.2 c0,4-3.3,7.3-7.3,7.3h-26.6c-4,0-7.3-3.3-7.3-7.3v-9.7c-11,2.6-22.8,4-35,4c-13.4,0-26.2-1.7-38.1-4.8v10.5c0,4-3.3,7.3-7.3,7.3 H45.8c-4,0-7.3-3.3-7.3-7.3v-29.3C16.7,186.7,3,164.8,3,140.6c0-31.2,22.6-58.4,56.3-73.3l0.3,0c7.6,22.1,28.6,38.1,53.3,38.1 c25.9,0,47.9-17.6,54.5-41.6c5.7,2,11.1,4.3,16.2,7c5.1-11,22.2-23.1,46.3-18c2.7,0.6,4.2,3.5,3.1,6.1l-16.4,38.3 c6.7,8.3,11.5,17.6,14,27.4c0,0,14.8,0,18.2,0C252.1,124.6,254,125.8,254,128.7z M68.5,49.4C68.3,24.2,88.6,3.7,113.9,4.1 c24,0.4,43.6,20,44,44c0.4,25.6-20.6,46.3-46.2,45.5C87.9,92.9,68.7,73.3,68.5,49.4z M119,59.4c0,3.1-2.5,5.3-7.6,5.3 c-4.8,0-9.3-1.7-12.1-3.1L97,70.7c2.6,1.5,8,2.9,13.3,2.9v6.8h6.2v-7c9.1-2,13.3-7.4,13.3-14.4s-3.9-11.3-12.4-14.4 c-6.2-2.5-9.1-3.7-9.1-6.8c0-2.3,2.5-4.5,7-4.5s7.9,1.4,9.9,2.3l2.5-8.8c-2.7-1.5-6.4-2.5-11.6-2.5v-7h-6.2v7.4 c-8.3,1.7-12.8,7-12.8,13.8c0,7.4,5.1,11.5,13.3,14.4C116.6,55,119,56.3,119,59.4z"/>
      </svg>
    )
  },
  { 
    key: 'configuracion', 
    label: 'Configuración',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  },
];

export default function Home() {
  const { user, loading, isConfigured, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('presupuesto');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [expenses, setExpenses] = useState([]);
  const [userSettings, setUserSettings] = useState({
    profile: {
      name: '',
      email: '',
      currency: 'USD',
      language: 'es',
    },
    appearance: {
      colorTheme: 'default',
      fontSize: 'medium',
      compactMode: false,
    },
  });

  // Actualizar perfil del usuario cuando cambie la autenticación
  useEffect(() => {
    if (user) {
      setUserSettings(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: user.user_metadata?.full_name || user.email || 'Usuario',
          email: user.email || 'usuario@email.com',
          phone: user.user_metadata?.phone || '',
        }
      }));
    }
  }, [user]);

  const updateUserSettings = (newSettings: typeof userSettings) => {
    setUserSettings(newSettings);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'presupuesto':
        return <BudgetOverview />;
      case 'inversiones':
        return <InvestmentsView investments={investments} setInvestments={setInvestments} />;
      case 'ahorro':
        return <SavingsView />;
      case 'configuracion':
        return <SettingsView userSettings={userSettings} setUserSettings={updateUserSettings} expenses={expenses} investments={investments} />;
      default:
        return null;
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('demo_user');
    await signOut();
  };

  if (isConfigured && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center space-y-8">
          {/* Beautiful loading animation */}
          <div className="relative">
            {/* Outer rotating ring */}
            <div className="w-24 h-24 border-4 border-slate-700 rounded-full animate-spin relative">
              <div 
                className="absolute -top-1 -left-1 w-6 h-6 rounded-full shadow-lg"
                style={{
                  background: 'linear-gradient(to right, var(--primary), var(--primary-light))',
                  boxShadow: `0 8px 25px var(--primary-glow)`
                }}
              ></div>
            </div>
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-0 w-24 h-24 flex items-center justify-center">
              <div 
                className="w-12 h-12 rounded-full animate-pulse"
                style={{
                  background: 'linear-gradient(to right, var(--primary-hover), var(--primary-hover))',
                  borderColor: 'var(--primary-border)',
                  border: '1px solid'
                }}
              ></div>
            </div>
            
            {/* Center dot */}
            <div className="absolute inset-0 w-24 h-24 flex items-center justify-center">
              <div 
                className="w-4 h-4 rounded-full"
                style={{
                  background: 'linear-gradient(to right, var(--primary), var(--primary-light))'
                }}
              ></div>
            </div>
            
            {/* Glow effect */}
            <div 
              className="absolute inset-0 w-24 h-24 rounded-full blur-xl animate-pulse"
              style={{
                background: 'linear-gradient(to right, var(--primary-hover), var(--primary-hover))'
              }}
            ></div>
          </div>
          
          {/* Loading text with gradient */}
          <div className="space-y-3">
            <h2 
              className="text-2xl font-bold bg-clip-text text-transparent animate-pulse"
              style={{
                backgroundImage: 'linear-gradient(to right, white, var(--primary-light), white)'
              }}
            >
              Cargando Savvy
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--primary)' }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--primary)', animationDelay: '0.1s' }}
                ></div>
                <div 
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: 'var(--primary-light)', animationDelay: '0.2s' }}
                ></div>
              </div>
              <p className="text-slate-400 ml-2">Preparando tu dashboard financiero</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((isConfigured && !user) || !isConfigured) {
    return <LoginPage />;
  }

  const isDemoMode = !isConfigured || localStorage.getItem('demo_user') === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="min-h-screen">
        <div className="flex flex-col h-screen max-w-[95%] sm:max-w-[80%] mx-auto">
          {/* Header con glassmorphism */}
          <header className="backdrop-blur-xl bg-slate-900/70 border-b border-slate-800/50 px-4 sm:px-8 py-3 sm:py-5 relative">
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, var(--primary-hover), var(--primary-hover))'
              }}
            />
            <div className="relative flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                    style={{
                      background: 'linear-gradient(to bottom right, var(--primary), var(--primary-dark))',
                      boxShadow: `0 10px 25px var(--primary-glow)`
                    }}
                  >
                 <Logo />
                  </div>
                  <div 
                    className="absolute -inset-1 rounded-xl blur opacity-20"
                    style={{
                      background: 'linear-gradient(to bottom right, var(--primary), var(--primary-dark))'
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    Savvy
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400">Dashboard Financiero</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                
                <div className="flex items-center gap-3">                  
                  <button
                    onClick={handleSignOut}
                    className="group flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white transition-all duration-200 px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50"
                  >
                    <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Salir
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Content con mejores sombras y bordes */}
          <main className="flex-1 overflow-hidden p-2 sm:p-6">
            <div className="h-full bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl shadow-black/20 relative overflow-y-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-slate-900/20 pointer-events-none" />
              <div className="relative min-h-full">
                {renderContent()}
              </div>
            </div>
          </main>

          {/* Bottom Navigation mejorado */}
          <nav className="relative flex justify-center pb-2 sm:pb-0">          
              <div className="flex gap-1 bg-slate-800/30 p-1 sm:p-2 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => !tab.disabled && setActiveTab(tab.key)}
                    disabled={tab.disabled}
                    className={`relative flex flex-col items-center py-2 sm:py-3 px-3 sm:px-6 rounded-xl transition-all duration-300 group ${
                      activeTab === tab.key
                        ? 'text-white shadow-lg scale-105'
                        : tab.disabled 
                          ? 'text-slate-600 opacity-50 cursor-not-allowed'
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                    }`}
                    style={activeTab === tab.key ? {
                      background: 'linear-gradient(to top, var(--primary), var(--primary-light))',
                      boxShadow: `0 10px 25px var(--primary-glow)`
                    } : {}}
                  >
                    {activeTab === tab.key && (
                      <div 
                        className="absolute inset-0 rounded-xl blur opacity-20"
                        style={{
                          background: 'linear-gradient(to top, var(--primary), var(--primary-light))'
                        }}
                      />
                    )}
                    <div className={`relative mb-1 transition-transform duration-200 ${
                      activeTab === tab.key ? '' : 'group-hover:scale-110'
                    }`}>
                      {tab.icon}
                    </div>
                    <span className={`relative text-xs sm:text-xs font-medium transition-all duration-200 ${
                      activeTab === tab.key ? 'font-semibold' : ''
                    }`}>
                      {tab.label}
                      {tab.disabled && <div className="text-[10px] text-slate-500">(Pronto)</div>}
                    </span>
                  </button>
                ))}
              </div>
         
          </nav>
        </div>
      </div>
    </div>
  );
}
