import React from 'react';
import { Observation, ProgressRecord } from '../types';
import { TrendingUp, TrendingDown, Minus, Camera, AlertCircle } from 'lucide-react';

interface ProgressionTimelineProps {
  observations: Observation[];
  progressRecords: ProgressRecord[];
}

export const ProgressionTimeline: React.FC<ProgressionTimelineProps> = ({
  observations,
  progressRecords,
}) => {
  if (observations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-slate-700 font-semibold text-sm">No Observations Recorded Yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Upload repeated photographs of the same plot over time to monitor visible foliar changes and symptom progression.
        </p>
      </div>
    );
  }

  // Map progress records by currentObservationId
  const progressMap = new Map<string, ProgressRecord>();
  progressRecords.forEach((rec) => {
    progressMap.set(rec.currentObservationId, rec);
  });

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
        <div className="font-semibold text-sm mb-1 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1 text-emerald-700" />
          Evidence-Based Recovery Protocol
        </div>
        Optical foliar progression reflects visible surface lesion changes and vegetative color shifts. A change in classifier label alone is not clinical proof of recovery. Compare chronological images side-by-side.
      </div>

      <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-6">
        {observations.map((obs, idx) => {
          const rec = progressMap.get(obs._id);
          const dateStr = new Date(obs.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={obs._id} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-emerald-600 shadow"></div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition-shadow">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Observation #{observations.length - idx}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-800">{dateStr}</h4>
                  </div>

                  {rec && (
                    <div className="flex items-center space-x-2">
                      {rec.symptomTrend === 'improving' ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <TrendingDown className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Visible Lesions Decreasing
                        </span>
                      ) : rec.symptomTrend === 'worsening' ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          <TrendingUp className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Symptom Area Expanding
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          <Minus className="w-3.5 h-3.5 mr-1" />
                          Stable / Unchanged
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Photo thumbnail */}
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video md:aspect-square flex items-center justify-center">
                    <img
                      src={obs.imageUrl}
                      alt={obs.originalFileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback placeholder leaf icon if image not yet loaded
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-slate-400 absolute bottom-1 right-2 bg-black/60 text-white px-1.5 py-0.5 rounded text-[10px]">
                      {(obs.fileSize / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  {/* Diagnosis & Metrics */}
                  <div className="md:col-span-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Diagnostic Classification:</span>
                      <span className="font-semibold text-slate-800">
                        {obs.prediction ? obs.prediction.topDisplayName : 'Pending AI Diagnosis'}
                      </span>
                    </div>

                    {rec && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block">Lesion Coverage:</span>
                          <span className="font-bold text-slate-800 text-sm">
                            {rec.lesionCoveragePercentCurrent.toFixed(1)}%
                          </span>
                          {rec.lesionDeltaPercent !== undefined && rec.lesionDeltaPercent !== 0 && (
                            <span
                              className={`ml-1 text-[11px] font-semibold ${
                                rec.lesionDeltaPercent < 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              ({rec.lesionDeltaPercent > 0 ? '+' : ''}
                              {rec.lesionDeltaPercent.toFixed(1)}%)
                            </span>
                          )}
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-slate-500 block">ExG Vegetative Shift:</span>
                          <span className="font-bold text-slate-800 text-sm">
                            {rec.vegetativeIndexExGDelta !== undefined
                              ? `${rec.vegetativeIndexExGDelta > 0 ? '+' : ''}${rec.vegetativeIndexExGDelta.toFixed(1)}`
                              : 'Baseline'}
                          </span>
                        </div>
                      </div>
                    )}

                    {obs.weatherSnapshot && (
                      <div className="text-[11px] text-slate-500 flex items-center space-x-3 pt-1">
                        <span>🌡 {obs.weatherSnapshot.temperatureC?.toFixed(1)}°C</span>
                        <span>💧 {obs.weatherSnapshot.relativeHumidityPercent}% RH</span>
                        <span>🌧 {obs.weatherSnapshot.precipitationMm}mm rain</span>
                      </div>
                    )}

                    {rec?.lightingInconsistencyFlag && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                        ⚠️ Warning: Inconsistent lighting detected between observation dates. Interpret lesion delta with care.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
