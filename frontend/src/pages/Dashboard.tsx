import React, { useEffect, useState } from 'react';
import { User, Plot, Observation, RiskAssessment } from '../types';
import { api } from '../services/api';
import {
  Sprout,
  AlertTriangle,
  Upload,
  Calendar,
  CloudSun,
  MapPin,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (tab: string, plotId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [recentObs, setRecentObs] = useState<Observation[]>([]);
  const [primaryRisk, setPrimaryRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const plotsRes = await api.plots.list();
        setPlots(plotsRes.plots);

        if (plotsRes.plots.length > 0) {
          const firstPlot = plotsRes.plots[0];
          // Load risk for primary plot
          const riskRes = await api.plots.getRisk(firstPlot._id);
          setPrimaryRisk(riskRes.assessment);

          // Load history for primary plot
          const historyRes = await api.plots.getHistory(firstPlot._id);
          setRecentObs(historyRes.observations.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-700/80 rounded-full border border-emerald-500/30 text-emerald-100">
              Active Session: {user.role.toUpperCase()}
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-2">
              Welcome back, {user.name}
            </h1>
            <p className="text-emerald-100/80 text-xs mt-1 max-w-2xl leading-relaxed">
              CropCare AI decision-support platform active. Monitor crop recovery trends across plots, inspect meteorological pathogen risks, and route uncertain predictions for expert verification.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('diagnose')}
              className="inline-flex items-center text-xs font-semibold px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition shadow-md shadow-emerald-950 font-sans"
            >
              <Upload className="w-4 h-4 mr-2" /> Diagnose Leaf Photo
            </button>
            <button
              onClick={() => onNavigate('plots')}
              className="inline-flex items-center text-xs font-semibold px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/20"
            >
              <Sprout className="w-4 h-4 mr-2" /> Add Crop Plot
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Managed Plots</span>
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{plots.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active horticultural acreage</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Environmental Risk</span>
            <CloudSun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {primaryRisk ? `${primaryRisk.riskScore}/100` : '--'}
          </div>
          <span
            className={`text-[11px] font-semibold mt-1 block ${
              primaryRisk?.riskLevel === 'severe'
                ? 'text-rose-600'
                : primaryRisk?.riskLevel === 'high'
                ? 'text-orange-600'
                : 'text-emerald-600'
            }`}
          >
            {primaryRisk?.riskLevel.toUpperCase() || 'CALCULATING'} RISK
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Recent Observations</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{recentObs.length}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Photographic audit records</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Safety Rejection Model</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">Active</div>
          <span className="text-[11px] text-slate-400 mt-1 block">p &lt; 0.65 routed to expert</span>
        </div>
      </div>

      {/* Main Content Split: Plots & Weather Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Plots and Observations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plots Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Crop Plots & Fields</h3>
                <span className="text-xs text-slate-500">Track longitudinal progression by field</span>
              </div>
              <button
                onClick={() => onNavigate('plots')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center"
              >
                View all plots <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>

            {plots.length === 0 ? (
              <div className="text-center py-10">
                <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No crop plots registered yet.</p>
                <button
                  onClick={() => onNavigate('plots')}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 bg-emerald-600 text-white rounded-lg shadow-sm"
                >
                  Create First Plot
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {plots.slice(0, 4).map((plot) => (
                  <div key={plot._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900">{plot.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {plot.cropType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-3">
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" /> {plot.location.region}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" /> Planted {plot.plantingDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onNavigate('diagnose', plot._id)}
                        className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition"
                      >
                        Upload Leaf
                      </button>
                      <button
                        onClick={() => onNavigate('plots', plot._id)}
                        className="text-xs font-medium px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                      >
                        History
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Observations */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Recent Leaf Diagnostic Uploads</h3>
            <span className="text-xs text-slate-500 block mb-4">
              Real-time inference with calibrated uncertainty and image quality filters
            </span>

            {recentObs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No recent observations logged. Upload an image to trigger automated diagnosis.
              </div>
            ) : (
              <div className="space-y-3">
                {recentObs.map((obs) => (
                  <div
                    key={obs._id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                        <img
                          src={obs.imageUrl}
                          alt="observation"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-800">
                          {obs.prediction ? obs.prediction.topDisplayName : 'Processing Diagnosis'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(obs.timestamp).toLocaleDateString()} &middot; {obs.originalFileName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {obs.prediction?.accepted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {(obs.prediction.confidence * 100).toFixed(0)}% Confident
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Uncertain / Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Environmental Risk & Quick Guides */}
        <div className="space-y-6">
          {/* Quick Weather Risk Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Active Weather Threat</h3>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Microclimate</span>
            </div>

            {primaryRisk ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Primary Elevated Threat</span>
                  <span className="font-bold text-slate-900 text-sm block mt-0.5">
                    {primaryRisk.primaryThreats[0] || 'Low Risk'}
                  </span>
                  <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                    {primaryRisk.riskFactors[0] || 'Meteorological conditions are within safe ranges.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold text-[11px] block">Preventive Guidance:</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
                    {primaryRisk.agronomicRecommendations.slice(0, 2).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onNavigate('risk')}
                  className="w-full mt-2 text-xs font-semibold py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                >
                  View Full Meteorological Models
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Loading weather models...</p>
            )}
          </div>

          {/* Research & Decision-Support Notice */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-2 text-xs">
            <div className="flex items-center text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 mr-1.5" /> Major Project Safeguards
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              CropCare AI strictly distinguishes controlled-image laboratory benchmarks from external field photography (PlantDoc). Out-of-domain and blurry images are selectively rejected to maintain trust.
            </p>
            <button
              onClick={() => onNavigate('research')}
              className="text-xs text-emerald-300 hover:text-emerald-200 font-semibold underline block pt-1"
            >
              Inspect Confusion Matrix & ECE Benchmarks &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
