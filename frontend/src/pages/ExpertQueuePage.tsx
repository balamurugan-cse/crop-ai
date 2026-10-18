import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Award, CheckCircle, Clock, FileText, AlertCircle, Eye, X } from 'lucide-react';

export const ExpertQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Review form
  const [verifiedDiagnosis, setVerifiedDiagnosis] = useState('');
  const [severityRating, setSeverityRating] = useState('3');
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [recommendedIntervention, setRecommendedIntervention] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    try {
      setLoading(true);
      const res = await api.expert.getQueue();
      setQueue(res.queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenReview = (item: any) => {
    setSelectedItem(item);
    setVerifiedDiagnosis(item.prediction?.topDisplayName || 'Tomato Early Blight');
    setSeverityRating('3');
    setClinicalAssessment('');
    setRecommendedIntervention('');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await api.expert.submitReview({
        reviewId: selectedItem._id,
        verifiedDiagnosis,
        severityRating: parseInt(severityRating, 10),
        clinicalAssessment,
        recommendedIntervention,
      });

      alert('Expert review submitted successfully!');
      setSelectedItem(null);
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Agricultural Expert Review Console</h1>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              Agronomist Access
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review cases flagged by the uncertainty-aware rejection engine ($p &lt; 0.65$ or high entropy) or submitted directly by farmers.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
        >
          Refresh Queue ({queue.length})
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading expert queue...</div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-slate-800">Review Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All submitted cases have been verified. New uncertain observations will populate here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queue.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Case #{item._id.slice(0, 8)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                      {item.plot?.name || 'Unspecified Plot'} ({item.plot?.cropType})
                    </h3>
                    <span className="text-xs text-slate-500">Farmer: {item.farmerName}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Pending Review
                  </span>
                </div>

                {item.observation && (
                  <div className="flex space-x-3 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <img
                      src={item.observation.imageUrl}
                      alt="observation"
                      className="w-16 h-16 rounded-md object-cover bg-black/10 border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div>
                        <strong>AI Tentative:</strong> {item.prediction?.topDisplayName || 'Uncertain'} (
                        {((item.prediction?.confidence || 0) * 100).toFixed(0)}%)
                      </div>
                      <div>
                        <strong>Flag Reason:</strong>{' '}
                        <span className="text-amber-700 font-medium">
                          {item.prediction?.reviewReason || 'Farmer requested clinical review'}
                        </span>
                      </div>
                      <div>
                        <strong>Reported:</strong> {item.observation.symptomsReported || 'None provided'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(item.requestedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleOpenReview(item)}
                  className="inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Examine & Prescribe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Specialist Assessment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-900 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Expert Phytosanitary Examination</h3>
                <span className="text-xs text-slate-500">
                  {selectedItem.plot?.name} &middot; {selectedItem.farmerName}
                </span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <img
                  src={selectedItem.observation?.imageUrl}
                  alt="Leaf Specimen"
                  className="w-full h-56 object-cover rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-700 block">Specimen & Model Context:</span>
                <div>
                  <strong>Model Top Guess:</strong> {selectedItem.prediction?.topDisplayName}
                </div>
                <div>
                  <strong>Confidence:</strong>{' '}
                  {((selectedItem.prediction?.confidence || 0) * 100).toFixed(1)}% (Entropy:{' '}
                  {selectedItem.prediction?.entropy?.toFixed(2)})
                </div>
                <div>
                  <strong>Farmer Observation:</strong>{' '}
                  {selectedItem.observation?.symptomsReported || 'None provided'}
                </div>
                <div>
                  <strong>Weather at Capture:</strong>{' '}
                  {selectedItem.observation?.weatherSnapshot?.temperatureC?.toFixed(1)}°C &middot;{' '}
                  {selectedItem.observation?.weatherSnapshot?.relativeHumidityPercent}% RH
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Verified Phytosanitary Diagnosis
                  </label>
                  <input
                    type="text"
                    required
                    value={verifiedDiagnosis}
                    onChange={(e) => setVerifiedDiagnosis(e.target.value)}
                    placeholder="e.g. Tomato Early Blight (Alternaria solani)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Pathological Severity (1 to 5)
                  </label>
                  <select
                    value={severityRating}
                    onChange={(e) => setSeverityRating(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="1">1 - Incipient (Minor chlorotic speckling)</option>
                    <option value="2">2 - Mild (&lt;5% necrotic coverage)</option>
                    <option value="3">3 - Moderate (5-15% foliar lesions)</option>
                    <option value="4">4 - Severe (15-30% defoliation threat)</option>
                    <option value="5">5 - Critical (&gt;30% canopy collapse)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Clinical Notes & Justification</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Characteristic concentric dark rings visible on lower leaflet with yellow halo."
                  value={clinicalAssessment}
                  onChange={(e) => setClinicalAssessment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Recommended Intervention (Cultural & Chemical)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Prune senescent lower leaves to enhance ventilation. Apply copper hydroxide bactericide/fungicide in early morning."
                  value={recommendedIntervention}
                  onChange={(e) => setRecommendedIntervention(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Review...' : 'Submit Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
