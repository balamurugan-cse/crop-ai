import React from 'react';
import { User } from '../types';
import { Sprout, LogOut, ShieldAlert, Award, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, activeTab, setActiveTab }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-200">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                CropCare<span className="text-emerald-600">.AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Major Project Decision-Support
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('plots')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'plots'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Plots & Crops
              </button>
              <button
                onClick={() => setActiveTab('diagnose')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'diagnose'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Diagnose Leaf
              </button>
              <button
                onClick={() => setActiveTab('risk')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'risk'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Weather Risk
              </button>
              {(user.role === 'expert' || user.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('expert')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'expert'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Expert Review Queue
                </button>
              )}
              <button
                onClick={() => setActiveTab('research')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'research'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Research & Benchmarks
              </button>
            </nav>
          )}

          {/* User profile & Logout */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">{user.name}</div>
                <div className="flex items-center justify-end space-x-1">
                  {user.role === 'expert' ? (
                    <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Award className="w-3 h-3 mr-1" /> Agricultural Expert
                    </span>
                  ) : user.role === 'admin' ? (
                    <span className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      <ShieldAlert className="w-3 h-3 mr-1" /> Administrator
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <UserIcon className="w-3 h-3 mr-1" /> Farmer
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="text-sm font-medium text-slate-500">Sign in to continue</div>
          )}
        </div>
      </div>
    </header>
  );
};
