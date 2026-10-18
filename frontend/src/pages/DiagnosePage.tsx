import React, { useState, useEffect } from 'react';
import { Plot, Observation, Prediction, ProgressRecord } from '../types';
import { api } from '../services/api';
import { PredictionChart } from '../components/PredictionChart';
import { UncertaintyBanner } from '../components/UncertaintyBanner';
import {
  Upload,
  Camera,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface DiagnosePageProps {
  initialPlotId?: string;
  onNavigatePlot: (plotId: string) => void;
}

export const DiagnosePage: React.FC<DiagnosePageProps> = ({ initialPlotId, onNavigatePlot }) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState(initialPlotId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [symptomsReported, setSymptomsReported] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentObservation, setCurrentObservation] = useState<Observation | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [currentProgression, setCurrentProgression] = useState<ProgressRecord | null>(null);
  const [reviewRequested, setReviewRequested] = useState(false);

  useEffect(() => {
    async function fetchPlots() {
      try {
        const res = await api.plots.list();
        setPlots(res.plots);
        if (!selectedPlotId && res.plots.length > 0) {
          setSelectedPlotId(res.plots[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchPlots();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Reset previous results
      setCurrentPrediction(null);
      setCurrentProgression(null);
      setCurrentObservation(null);
      setError(null);
    }
  };

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose or capture a leaf photo.');
      return;
    }
    if (!selectedPlotId) {
      setError('Please select the plot associated with this plant.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload photograph
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('plotId', selectedPlotId);
      if (symptomsReported) formData.append('symptomsReported', symptomsReported);
      if (notes) formData.append('notes', notes);

      const uploadRes = await api.observations.upload(formData);
      const obs = uploadRes.observation;
      setCurrentObservation(obs);

      // 2. Request AI analysis
      const analyzeRes = await api.observations.analyze(obs._id);
      setCurrentPrediction(analyzeRes.prediction);
      setCurrentProgression(analyzeRes.progressRecord);
      setCurrentObservation(analyzeRes.observation);
    } catch (err: any) {
      setError(err.message || 'Error executing AI disease diagnosis.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async () => {
    if (!currentObservation) return;
    try {
      const res = await api.observations.requestReview(currentObservation._id);
      setReviewRequested(true);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Error requesting review');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">AI Disease Classification & foliar Diagnosis</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload a clear photograph of a single crop leaf. The system validates image quality, executes calibrated transfer learning, estimates symptom progression, and flags uncertain predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
              <Camera className="w-4 h-4 mr-2 text-emerald-600" /> Upload Foliar Specimen
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDiagnose} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Crop Plot</label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  {plots.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.cropType} - {p.location.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Drop Area */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Leaf Photograph</label>
                <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-50/60 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-44 object-contain rounded-lg bg-black/10"
                      />
                      <span className="text-emerald-700 font-semibold block text-[11px]">
                        Click or drag to replace image
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-slate-600 font-medium">Click to select or drag and drop leaf photo</div>
                      <div className="text-slate-400 text-[10px]">JPEG, PNG, WebP (Min 128x128px, Max 10MB)</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Symptoms Noticed by Farmer (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yellowing concentric halos on lower leaves"
                  value={symptomsReported}
                  onChange={(e) => setSymptomsReported(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Field Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Heavy rainfall 2 days ago, overhead sprinkler used."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md shadow-emerald-200 transition disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span>Running AI Diagnostics...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Execute Foliar Analysis
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Diagnostic & Progression Results (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {currentPrediction ? (
            <div className="space-y-4">
              {/* Primary Prediction Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      AI Diagnostic Result
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {currentPrediction.topDisplayName}
                    </h2>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Model: {currentPrediction.modelVersion} &middot; Shannon Entropy:{' '}
                      <strong>{currentPrediction.entropy.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {(currentPrediction.confidence * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                      Prediction Confidence
                    </span>
                  </div>
                </div>

                {/* Quality Check Status */}
                {currentObservation?.imageQuality && (
                  <div className="mt-3 text-xs flex flex-wrap items-center gap-4 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">Image Verification:</span>
                    <span>Resolution: {currentObservation.imageQuality.width}x{currentObservation.imageQuality.height}px</span>
                    <span>Blur Variance: {currentObservation.imageQuality.blurVariance ?? 'N/A'} (Sharper &gt; 15)</span>
                    <span className="text-emerald-700 font-semibold flex items-center">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Passed Quality Filter
                    </span>
                  </div>
                )}

                {/* Uncertainty Rejection Banner */}
                <div className="mt-4">
                  <UncertaintyBanner
                    prediction={currentPrediction}
                    onRequestExpertReview={handleRequestReview}
                    isReviewRequested={reviewRequested || currentObservation?.expertReviewRequested}
                  />
                </div>

                {/* Probability Distribution Chart */}
                <div className="mt-4">
                  <PredictionChart probabilities={currentPrediction.classProbabilities} />
                </div>
              </div>

              {/* Longitudinal Symptom Progression (If prior observations exist) */}
              {currentProgression && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" />
                    Longitudinal Symptom Progression Delta
                  </h3>
                  <span className="text-xs text-slate-500 block mb-3">
                    Comparison with previous observation of this plot
                  </span>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Trend</span>
                      <span className="font-bold text-sm text-slate-800 capitalize">
                        {currentProgression.symptomTrend}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Necrotic Lesion Delta</span>
                      <span
                        className={`font-bold text-sm ${
                          (currentProgression.lesionDeltaPercent ?? 0) <= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {currentProgression.lesionDeltaPercent !== undefined
                          ? `${currentProgression.lesionDeltaPercent > 0 ? '+' : ''}${currentProgression.lesionDeltaPercent.toFixed(1)}%`
                          : 'Baseline'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">ExG Vegetative Shift</span>
                      <span className="font-bold text-sm text-slate-800">
                        {currentProgression.vegetativeIndexExGDelta !== undefined
                          ? `${currentProgression.vegetativeIndexExGDelta > 0 ? '+' : ''}${currentProgression.vegetativeIndexExGDelta.toFixed(1)}`
                          : 'Baseline'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic mt-3">
                    {currentProgression.scientificDisclaimer}
                  </p>
                </div>
              )}

              {/* Decision Support Limitations Notice */}
              <div className="p-4 bg-slate-100 rounded-xl text-slate-600 text-xs flex items-start space-x-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Important Agronomic Disclaimer:</strong> CropCare AI provides decision-support predictions based on transfer learning and foliar computer vision. Variations in lighting, background foliage, or secondary nutrient deficiencies can influence scores. Always confirm with an agronomist before applying chemical treatments.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-sm">
              <Sparkles className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-700">Awaiting Leaf Specimen</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Select a plot and upload a photograph to view neural network predictions, calibrated confidence metrics, and estimated symptom progression trends.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
