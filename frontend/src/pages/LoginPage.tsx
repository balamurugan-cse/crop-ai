import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { Sprout, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'expert' | 'admin'>('farmer');
  const [consentData, setConsentData] = useState(true);
  const [consentResearch, setConsentResearch] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!consentData || !consentResearch) {
          setError('You must grant consent for agricultural data collection and research.');
          setLoading(false);
          return;
        }
        const res = await api.auth.register({
          name,
          email,
          password,
          role,
          consent: { dataCollection: consentData, researchUse: consentResearch },
        });
        localStorage.setItem('cropcare_token', res.token);
        onLoginSuccess(res.user, res.token);
      } else {
        const res = await api.auth.login({ email, password });
        localStorage.setItem('cropcare_token', res.token);
        onLoginSuccess(res.user, res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoRole: 'farmer' | 'expert' | 'admin') => {
    setEmail(demoEmail);
    setPassword('CropCare2026!');
    setRole(demoRole);
    setIsRegistering(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-950 mb-3">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          CropCare<span className="text-emerald-400">.AI</span>
        </h2>
        <p className="mt-1 text-sm text-emerald-200/80">
          Multi-Crop Disease Recovery Monitoring & Weather-Aware Risk Assessment Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Persona quick select */}
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 text-center">
              Quick Demonstration Personas
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemo('farmer@cropcare.ai', 'farmer')}
                className="p-2 text-center rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium transition"
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => fillDemo('expert@cropcare.ai', 'expert')}
                className="p-2 text-center rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium transition"
              >
                Agronomist
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@cropcare.ai', 'admin')}
                className="p-2 text-center rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-medium transition"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 mb-6">
            <button
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                !isRegistering ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400'
              }`}
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
            >
              Sign In
            </button>
            <button
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                isRegistering ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400'
              }`}
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
            >
              Register Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@cropcare.ai"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="farmer">Farmer (Track plots, upload leaves, request reviews)</option>
                    <option value="expert">Agricultural Expert (Clinical diagnosis, review queue)</option>
                    <option value="admin">Administrator (Audit logs & system overview)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentData}
                      onChange={(e) => setConsentData(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I consent to storage of observation photographs and plot coordinates.</span>
                  </label>
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentResearch}
                      onChange={(e) => setConsentResearch(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I agree to anonymized research use for model calibration.</span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-md shadow-emerald-200 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : isRegistering ? (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Complete Registration
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" /> Sign In to Portal
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
