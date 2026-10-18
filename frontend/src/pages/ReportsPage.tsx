import React, { useState, useEffect } from 'react';
import { Plot } from '../types';
import { api } from '../services/api';
import { Printer, Download, Sprout, ShieldAlert, CheckCircle, FileText } from 'lucide-react';

interface ReportsPageProps {
  initialPlotId?: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialPlotId }) => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState(initialPlotId || '');
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await api.plots.list();
        setPlots(res.plots);
        if (res.plots.length > 0) {
          const plotId = initialPlotId || res.plots[0]._id;
          setSelectedPlotId(plotId);
          loadReport(plotId);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, [initialPlotId]);

  const loadReport = async (plotId: string) => {
    if (!plotId) return;
    try {
      setLoading(true);
      const res = await api.reports.getPlotReport(plotId);
      setReport(res.report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Crop Health & Progression Dossier</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exportable multi-modal diagnostic report compiling leaf predictions, risk models, progression delta, and intervention costs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPlotId}
            onChange={(e) => {
              setSelectedPlotId(e.target.value);
              loadReport(e.target.value);
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {plots.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.cropType})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center text-xs font-semibold px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Compiling report...</div>
      ) : report ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Document Header */}
          <div className="border-b-2 border-emerald-600 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <Sprout className="w-6 h-6 text-emerald-600" />
                <span className="text-xl font-bold text-slate-900">CropCare AI</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                Integrated Phytosanitary Decision Support Report
              </span>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Report Generated: {new Date(report.generatedAt).toLocaleString()}</div>
              <div>Plot ID: {report.plotSummary.id}</div>
            </div>
          </div>

          {/* Plot Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Field Name</span>
              <span className="font-bold text-slate-800 text-sm">{report.plotSummary.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Crop & Variety</span>
              <span className="font-bold text-slate-800 text-sm">
                {report.plotSummary.cropType} ({report.plotSummary.variety})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Planting Date</span>
              <span className="font-bold text-slate-800 text-sm">{report.plotSummary.plantingDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Location</span>
              <span className="font-bold text-slate-800 text-sm">{report.plotSummary.location.region}</span>
            </div>
          </div>

          {/* Meteorological Threat Status */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Atmospheric & Microclimate Risk Status
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm block">
                  {report.currentRiskStatus.primaryThreats.join(', ')}
                </span>
                <span className="text-slate-500 mt-1 block">
                  Models: {report.currentRiskStatus.rulesApplied.join('; ')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-slate-900">
                  {report.currentRiskStatus.riskScore} / 100
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {report.currentRiskStatus.riskLevel} Level Risk
                </span>
              </div>
            </div>
          </div>

          {/* Economic Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Economic & Intervention Record
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
              <span>Total Logged Interventions: <strong>{report.economicSummary.totalInterventionsLogged}</strong></span>
              <span>Cumulative Cost: <strong className="text-emerald-700 font-bold">${report.economicSummary.totalCostReported}</strong></span>
            </div>
          </div>

          {/* Observation History Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Observation Chronology & Progression
            </h3>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left divide-y divide-slate-200 border border-slate-200 rounded-lg">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">AI Prediction</th>
                    <th className="py-2 px-3">Confidence</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Expert Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.observationTimeline.map((obs: any) => (
                    <tr key={obs._id}>
                      <td className="py-2 px-3">{new Date(obs.timestamp).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-medium">
                        {obs.prediction ? obs.prediction.topDisplayName : 'Unanalyzed'}
                      </td>
                      <td className="py-2 px-3">
                        {obs.prediction ? `${(obs.prediction.confidence * 100).toFixed(0)}%` : '--'}
                      </td>
                      <td className="py-2 px-3">
                        {obs.prediction?.accepted ? (
                          <span className="text-emerald-700 font-bold">Accepted</span>
                        ) : (
                          <span className="text-amber-700 font-bold">Flagged for Review</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {obs.expertReview?.verifiedDiagnosis ? (
                          <span className="text-purple-700 font-semibold">
                            {obs.expertReview.verifiedDiagnosis} (Severity: {obs.expertReview.severityRating}/5)
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal / Scientific Disclaimer */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
            <strong>Advisory Notice:</strong> {report.disclaimer}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">Select a plot to generate report.</div>
      )}
    </div>
  );
};
