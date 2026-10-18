import React, { useState, useEffect } from 'react';
import { Plot, RiskAssessment } from '../types';
import { api } from '../services/api';
import { WeatherRiskCard } from '../components/WeatherRiskCard';
import { CloudRain, Sprout, MapPin, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export const RiskPage: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlots() {
      try {
        const res = await api.plots.list();
        setPlots(res.plots);
        if (res.plots.length > 0) {
          setSelectedPlotId(res.plots[0]._id);
          fetchRisk(res.plots[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPlots();
  }, []);

  const fetchRisk = async (plotId: string) => {
    if (!plotId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.plots.getRisk(plotId);
      setAssessment(res.assessment);
    } catch (err: any) {
      setError(err.message || 'Error evaluating weather risk');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlot = (id: string) => {
    setSelectedPlotId(id);
    fetchRisk(id);
  };

  const selectedPlot = plots.find((p) => p._id === selectedPlotId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Weather-Aware Agronomic Risk Assessment</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Microclimate evaluation combining live temperature, relative humidity, and precipitation with documented epidemiological disease rules.
          </p>
        </div>

        {selectedPlotId && (
          <button
            onClick={() => fetchRisk(selectedPlotId)}
            disabled={loading}
            className="inline-flex items-center text-xs font-semibold px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Weather Station Data
          </button>
        )}
      </div>

      {/* Plot Select Carousel */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {plots.map((plot) => (
          <button
            key={plot._id}
            onClick={() => handleSelectPlot(plot._id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-medium whitespace-nowrap transition flex items-center space-x-2 ${
              selectedPlotId === plot._id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>{plot.name} ({plot.cropType})</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Detailed Weather Risk Evaluation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <WeatherRiskCard assessment={assessment} plotName={selectedPlot?.name} />
        </div>

        {/* Agronomic Models Explanations Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" /> Documented Pathogen Models
            </h3>

            <div className="space-y-3 divide-y divide-slate-100 text-[11px] text-slate-600">
              <div className="pt-2">
                <span className="font-semibold text-slate-800 block">Tomato & Potato Late Blight</span>
                <span className="text-slate-500">Wallin Blitecast Model: Elevated infection severity occurs when relative humidity remains &gt;80% for &ge;10 hours within 14&ndash;25°C.</span>
              </div>

              <div className="pt-2">
                <span className="font-semibold text-slate-800 block">Corn Common Rust</span>
                <span className="text-slate-500">Thermal-Moisture Index: Spore pustules proliferate under moderate temperatures (16&ndash;25°C) and extended dew periods (&gt;6 hrs).</span>
              </div>

              <div className="pt-2">
                <span className="font-semibold text-slate-800 block">Bell Pepper Bacterial Spot</span>
                <span className="text-slate-500">Hydro-Thermal Model: High rainfall and splashing combined with warm days (&gt;24°C) dramatically accelerate bacterial propagation.</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
            <strong>Prototype Disclaimer:</strong> Meteorological risk is a decision-support heuristic. Microclimate sensors and weather APIs estimate regional conditions; local microtopography and canopy density may vary.
          </div>
        </div>
      </div>
    </div>
  );
};
