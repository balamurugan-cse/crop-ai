import React from 'react';
import { RiskAssessment } from '../types';
import { CloudRain, Wind, Thermometer, Droplets, ShieldAlert, CheckCircle, Info } from 'lucide-react';

interface WeatherRiskCardProps {
  assessment: RiskAssessment | null;
  plotName?: string;
}

export const WeatherRiskCard: React.FC<WeatherRiskCardProps> = ({ assessment, plotName }) => {
  if (!assessment) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 text-center py-8">
        <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Select a plot to inspect weather-aware disease risk.</p>
      </div>
    );
  }

  const { riskScore, riskLevel, primaryThreats, riskFactors, rulesApplied, weatherSnapshot, agronomicRecommendations } =
    assessment;

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'severe':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-3 py-1 rounded-full text-xs">Severe Risk ({riskScore}/100)</span>;
      case 'high':
        return <span className="bg-orange-100 text-orange-800 border border-orange-300 font-bold px-3 py-1 rounded-full text-xs">High Risk ({riskScore}/100)</span>;
      case 'moderate':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs">Moderate Risk ({riskScore}/100)</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs">Low Environmental Risk ({riskScore}/100)</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Meteorological Risk Assessment
          </span>
          <h3 className="text-base font-bold text-slate-900">
            {plotName || assessment.cropType} Field Microclimate
          </h3>
        </div>
        {getRiskBadge()}
      </div>

      {/* Weather Snapshot Grid */}
      {weatherSnapshot && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 text-center text-xs">
          <div className="bg-white p-3">
            <span className="text-slate-400 flex items-center justify-center mb-1">
              <Thermometer className="w-3.5 h-3.5 mr-1 text-rose-500" /> Temperature
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {weatherSnapshot.temperatureC?.toFixed(1) ?? '--'}°C
            </span>
          </div>

          <div className="bg-white p-3">
            <span className="text-slate-400 flex items-center justify-center mb-1">
              <Droplets className="w-3.5 h-3.5 mr-1 text-blue-500" /> Humidity
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {weatherSnapshot.relativeHumidityPercent ?? '--'}%
            </span>
          </div>

          <div className="bg-white p-3">
            <span className="text-slate-400 flex items-center justify-center mb-1">
              <CloudRain className="w-3.5 h-3.5 mr-1 text-cyan-500" /> Precipitation
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {weatherSnapshot.precipitationMm ?? 0} mm
            </span>
          </div>

          <div className="bg-white p-3">
            <span className="text-slate-400 flex items-center justify-center mb-1">
              <Wind className="w-3.5 h-3.5 mr-1 text-slate-500" /> Wind
            </span>
            <span className="font-bold text-slate-800 text-sm">
              {weatherSnapshot.windSpeedKmh?.toFixed(1) ?? '--'} km/h
            </span>
          </div>
        </div>
      )}

      {weatherSnapshot?.isStaleOrUnavailable && (
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-[11px] text-amber-800 flex items-center">
          <Info className="w-3.5 h-3.5 mr-1.5 shrink-0" />
          <span>Notice: Microclimate sensors offline. Calculated using regional climate baselines.</span>
        </div>
      )}

      {/* Main Details */}
      <div className="p-5 space-y-4 text-xs">
        {/* Primary Threats */}
        <div>
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Pathogens with Elevated Atmospheric Risk
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {primaryThreats.map((threat, idx) => (
              <span
                key={idx}
                className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 font-medium"
              >
                {threat}
              </span>
            ))}
          </div>
        </div>

        {/* Risk Factors & Rules */}
        <div>
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
            Triggered Agronomic Rules & Epidemiological Factors
          </h4>
          <ul className="space-y-1 text-slate-600 pl-4 list-disc">
            {riskFactors.map((factor, idx) => (
              <li key={idx} className="leading-relaxed">{factor}</li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="bg-emerald-50/70 p-3.5 rounded-lg border border-emerald-100">
          <h4 className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] mb-1.5 flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Recommended Cultural Actions
          </h4>
          <ul className="space-y-1 text-emerald-800 pl-4 list-disc">
            {agronomicRecommendations.map((rec, idx) => (
              <li key={idx} className="leading-relaxed font-medium">{rec}</li>
            ))}
          </ul>
        </div>

        {/* Models Applied */}
        <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 flex flex-wrap justify-between">
          <span>Models: {rulesApplied.join(', ')}</span>
          <span>Source: {weatherSnapshot?.source || 'Open-Meteo V1'}</span>
        </div>
      </div>
    </div>
  );
};
