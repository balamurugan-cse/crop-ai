import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { PlotsPage } from './pages/PlotsPage';
import { DiagnosePage } from './pages/DiagnosePage';
import { RiskPage } from './pages/RiskPage';
import { ExpertQueuePage } from './pages/ExpertQueuePage';
import { ResearchPage } from './pages/ResearchPage';
import { ReportsPage } from './pages/ReportsPage';
import { Sprout, ShieldCheck, HeartHandshake } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetPlotId, setTargetPlotId] = useState<string | undefined>(undefined);
  const [systemHealth, setSystemHealth] = useState<any | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('cropcare_token');
      if (token) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
        } catch (err) {
          localStorage.removeItem('cropcare_token');
          setUser(null);
        }
      }

      // Check system health
      try {
        const health = await api.health.check();
        setSystemHealth(health);
      } catch (e) {
        // backend might be starting
      } finally {
        setInitializing(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cropcare_token');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleNavigate = (tab: string, plotId?: string) => {
    setActiveTab(tab);
    if (plotId) setTargetPlotId(plotId);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
        <div className="text-center space-y-3">
          <Sprout className="w-8 h-8 text-emerald-500 animate-pulse mx-auto" />
          <span>Initializing CropCare AI Decision-Support Platform...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleNavigate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard user={user} onNavigate={handleNavigate} />
        )}
        {activeTab === 'plots' && (
          <PlotsPage
            initialPlotId={targetPlotId}
            onDiagnosePlot={(plotId) => handleNavigate('diagnose', plotId)}
            onViewReport={(plotId) => handleNavigate('report', plotId)}
          />
        )}
        {activeTab === 'diagnose' && (
          <DiagnosePage
            initialPlotId={targetPlotId}
            onNavigatePlot={(plotId) => handleNavigate('plots', plotId)}
          />
        )}
        {activeTab === 'risk' && <RiskPage />}
        {activeTab === 'expert' && <ExpertQueuePage />}
        {activeTab === 'research' && <ResearchPage />}
        {activeTab === 'report' && <ReportsPage initialPlotId={targetPlotId} />}
      </main>

      {/* System Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">CropCare AI Decision-Support System</span>
            <span>&middot;</span>
            <span>B.E. Computer Science Engineering Major Project</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="flex items-center text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5"></span>
              Backend API Active (:5000)
            </span>
            <span className="flex items-center text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5"></span>
              PyTorch AI Service (:8000)
            </span>
            <span className="flex items-center text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5"></span>
              Open-Meteo V1
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
