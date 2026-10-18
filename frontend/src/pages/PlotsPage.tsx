import React, { useState, useEffect } from 'react';
import { Plot, CropType, Observation, ProgressRecord, Intervention } from '../types';
import { api } from '../services/api';
import { ProgressionTimeline } from '../components/ProgressionTimeline';
import {
  Sprout,
  Plus,
  Calendar,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  X,
  Clock,
  DollarSign,
} from 'lucide-react';

interface PlotsPageProps {
  initialPlotId?: string;
  onDiagnosePlot: (plotId: string) => void;
  onViewReport: (plotId: string) => void;
}

export const PlotsPage: React.FC<PlotsPageProps> = ({
  initialPlotId,
  onDiagnosePlot,
  onViewReport,
}) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [historyObservations, setHistoryObservations] = useState<Observation[]>([]);
  const [historyProgress, setHistoryProgress] = useState<ProgressRecord[]>([]);
  const [historyInterventions, setHistoryInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  // New plot form
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState<CropType>('Tomato');
  const [variety, setVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [region, setRegion] = useState('');
  const [lat, setLat] = useState('38.5816');
  const [lng, setLng] = useState('-121.4944');
  const [plotSizeAcres, setPlotSizeAcres] = useState('3.0');
  const [notes, setNotes] = useState('');

  // New intervention form
  const [intervType, setIntervType] = useState<any>('fungicide');
  const [productUsed, setProductUsed] = useState('');
  const [dosage, setDosage] = useState('');
  const [reportedCost, setReportedCost] = useState('45');
  const [intervNotes, setIntervNotes] = useState('');

  useEffect(() => {
    loadPlots();
  }, []);

  async function loadPlots() {
    try {
      setLoading(true);
      const res = await api.plots.list();
      setPlots(res.plots);

      if (res.plots.length > 0) {
        const target = initialPlotId
          ? res.plots.find((p) => p._id === initialPlotId) || res.plots[0]
          : res.plots[0];
        selectPlot(target);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function selectPlot(plot: Plot) {
    setSelectedPlot(plot);
    try {
      const historyRes = await api.plots.getHistory(plot._id);
      setHistoryObservations(historyRes.observations);
      setHistoryProgress(historyRes.progressRecords);
      setHistoryInterventions(historyRes.interventions);
    } catch (err) {
      console.error('Error fetching plot history:', err);
    }
  }

  async function handleCreatePlot(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.plots.create({
        name,
        cropType,
        variety: variety || undefined,
        plantingDate,
        location: {
          lat: parseFloat(lat) || undefined,
          lng: parseFloat(lng) || undefined,
          region,
        },
        plotSizeAcres: parseFloat(plotSizeAcres) || undefined,
        notes: notes || undefined,
      });

      setPlots([res.plot, ...plots]);
      setSelectedPlot(res.plot);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Failed to create plot');
    }
  }

  async function handleCreateIntervention(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlot) return;
    try {
      const res = await api.interventions.create({
        plotId: selectedPlot._id,
        date: new Date().toISOString().split('T')[0],
        interventionType: intervType,
        productUsed: productUsed || undefined,
        dosage: dosage || undefined,
        reportedCost: parseFloat(reportedCost) || undefined,
        notes: intervNotes || undefined,
      });

      setHistoryInterventions([res.intervention, ...historyInterventions]);
      setShowInterventionModal(false);
      setProductUsed('');
      setIntervNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed logging intervention');
    }
  }

  function resetForm() {
    setName('');
    setVariety('');
    setRegion('');
    setNotes('');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Crop Plots & Longitudinal Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize agricultural plots, track repeated observations chronologically, and log interventions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Register New Plot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Plot Selector List (1 col) */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Registered Plots ({plots.length})
          </span>

          {loading ? (
            <div className="p-4 text-xs text-slate-400 text-center">Loading plots...</div>
          ) : plots.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
              <Sprout className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No plots registered yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {plots.map((plot) => {
                const isSelected = selectedPlot?._id === plot._id;
                return (
                  <div
                    key={plot._id}
                    onClick={() => selectPlot(plot)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{plot.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {plot.cropType}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{plot.location.region}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Plot Detailed View (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {selectedPlot ? (
            <>
              {/* Plot Meta Banner */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-slate-900">{selectedPlot.name}</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                        {selectedPlot.cropType} {selectedPlot.variety ? `(${selectedPlot.variety})` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-4">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {selectedPlot.location.region}{' '}
                        {selectedPlot.location.lat ? `[${selectedPlot.location.lat}, ${selectedPlot.location.lng}]` : ''}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Planted on {selectedPlot.plantingDate}
                      </span>
                      {selectedPlot.plotSizeAcres && (
                        <span>Size: {selectedPlot.plotSizeAcres} Acres</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDiagnosePlot(selectedPlot._id)}
                      className="text-xs font-semibold px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                    >
                      + Upload Leaf Photo
                    </button>
                    <button
                      onClick={() => setShowInterventionModal(true)}
                      className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition"
                    >
                      <DollarSign className="w-3.5 h-3.5 inline mr-1" /> Log Intervention
                    </button>
                    <button
                      onClick={() => onViewReport(selectedPlot._id)}
                      className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1" /> Full Report
                    </button>
                  </div>
                </div>

                {/* Interventions Summary Bar */}
                {historyInterventions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700 block mb-1">
                      Farmer Interventions On Record ({historyInterventions.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {historyInterventions.map((inv) => (
                        <span
                          key={inv._id}
                          className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]"
                        >
                          <strong>{inv.date}</strong>: {inv.interventionType.toUpperCase()}{' '}
                          {inv.productUsed ? `(${inv.productUsed})` : ''} &middot; ${inv.reportedCost ?? 0}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Longitudinal Observation Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Longitudinal Observation History & Estimated Symptom Progression
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {historyObservations.length} Observations linked
                  </span>
                </div>

                <ProgressionTimeline
                  observations={historyObservations}
                  progressRecords={historyProgress}
                />
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              Select or register a crop plot to inspect historical observations.
            </div>
          )}
        </div>
      </div>

      {/* Register New Plot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-900 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Register New Crop Plot</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlot} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Plot Name / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Corn Field Block 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Crop Species</label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value as CropType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Potato">Potato</option>
                    <option value="Corn">Corn (Maize)</option>
                    <option value="Grape">Grape</option>
                    <option value="Bell Pepper">Bell Pepper</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cultivar / Variety (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Russet Burbank"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Planting Date</label>
                  <input
                    type="date"
                    required
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Plot Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={plotSizeAcres}
                    onChange={(e) => setPlotSizeAcres(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Geographic Region</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salinas Valley Agricultural Belt"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latitude (for Weather)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Soil / Agronomic Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sandy loam soil, drip tape, previous cover crop clover."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Save Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Intervention Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-900 border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Log Field Intervention</h3>
              <button
                onClick={() => setShowInterventionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIntervention} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Intervention Category</label>
                <select
                  value={intervType}
                  onChange={(e) => setIntervType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="fungicide">Fungicide Treatment</option>
                  <option value="pesticide">Pesticide / Insecticide</option>
                  <option value="fertilizer">Nutrient / Fertilizer</option>
                  <option value="pruning">Canopy Pruning / Sanitization</option>
                  <option value="irrigation">Irrigation Adjustment</option>
                  <option value="other">Other Cultural Control</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Brand / Formulation</label>
                <input
                  type="text"
                  placeholder="e.g. Copper Hydroxide (Kocide 3000)"
                  value={productUsed}
                  onChange={(e) => setProductUsed(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dosage / Dilution</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.5 lbs / acre"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cost Reported ($)</label>
                  <input
                    type="number"
                    value={reportedCost}
                    onChange={(e) => setReportedCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Field Observations</label>
                <textarea
                  rows={2}
                  value={intervNotes}
                  onChange={(e) => setIntervNotes(e.target.value)}
                  placeholder="e.g. Applied via backpack sprayer in early morning."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInterventionModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Record Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
