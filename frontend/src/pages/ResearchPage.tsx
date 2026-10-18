import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BookOpen, Award, CheckCircle, ShieldAlert, Cpu, Database, RefreshCw } from 'lucide-react';

export const ResearchPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResearch();
  }, []);

  async function loadResearch() {
    try {
      setLoading(true);
      const res = await api.reports.getResearchMetrics();
      setMetrics(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const evalData = metrics?.evaluation;
  const pvEval = evalData?.internalControlledEvaluation;
  const pdEval = evalData?.externalFieldEvaluation;
  const gap = evalData?.generalizationGap;
  const rejectionCurves = evalData?.uncertaintyRejectionTradeoff?.rejectionCurves || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Research & Benchmark Evaluation Console</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Authentic Empirical Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical validation of Domain Generalization Gap (PlantVillage vs PlantDoc), Expected Calibration Error (ECE), and Rejection Safety Thresholds.
          </p>
        </div>

        <button
          onClick={loadResearch}
          className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Experiment Metrics
        </button>
      </div>

      {/* Experimental Hypotheses Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Hypothesis H1</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Evaluated
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Field-Domain Generalization Gap</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Comparing models on controlled uniform leaves (PlantVillage) vs natural field images (PlantDoc) to expose external performance drop.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Hypothesis H2</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Evaluated
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Confidence Rejection Error Suppression</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Rejecting predictions with $p &lt; 0.65$ or Shannon Entropy &gt; 1.20 reduces false accepted diagnoses and safely refers cases to experts.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Hypothesis H3</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Active in UI
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-800">Longitudinal Symptom Tracking</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Repeated observations linked chronologically provide visible necrotic delta estimates rather than assuming cure from a single photo.
          </p>
        </div>
      </div>

      {/* Dual Domain Benchmark Comparison Table & Stats */}
      {pvEval && pdEval ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparative Metrics Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dual-Dataset Comparative Performance</h3>
                <span className="text-xs text-slate-500">
                  Model: {evalData?.checkpointPath ? 'MobileNetV2 Transfer Learning' : 'Baseline'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {evalData.evaluationTimestamp}
              </span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Metric</th>
                    <th className="py-2 px-3">Controlled (PlantVillage)</th>
                    <th className="py-2 px-3">External Field (PlantDoc)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-2 px-3 font-medium">Test Set Samples</td>
                    <td className="py-2 px-3">{pvEval.sampleCount} leaves</td>
                    <td className="py-2 px-3">{pdEval.sampleCount} in-situ photos</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Test Accuracy</td>
                    <td className="py-2 px-3 font-bold text-emerald-700">{pvEval.accuracyPercent}%</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{pdEval.accuracyPercent}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Macro-F1 Score</td>
                    <td className="py-2 px-3 font-bold text-emerald-700">{pvEval.macroF1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{pdEval.macroF1}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Macro Precision</td>
                    <td className="py-2 px-3">{pvEval.macroPrecision}</td>
                    <td className="py-2 px-3">{pdEval.macroPrecision}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Macro Recall</td>
                    <td className="py-2 px-3">{pvEval.macroRecall}</td>
                    <td className="py-2 px-3">{pdEval.macroRecall}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Expected Calibration Error (ECE)</td>
                    <td className="py-2 px-3 text-emerald-700 font-mono">{pvEval.expectedCalibrationError}</td>
                    <td className="py-2 px-3 text-slate-800 font-mono">{pdEval.expectedCalibrationError}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium">Multi-Class Brier Score</td>
                    <td className="py-2 px-3 font-mono">{pvEval.brierScore}</td>
                    <td className="py-2 px-3 font-mono">{pdEval.brierScore}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {gap && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <strong>Empirical Generalization Note:</strong> {gap.conclusion}
              </div>
            )}
          </div>

          {/* Uncertainty Rejection Tradeoff Chart (Hypothesis H2) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Uncertainty Rejection Trade-Off (H2 Validation)
              </h3>
              <span className="text-xs text-slate-500">
                Accepted-prediction error rate vs Expert referral rate across confidence thresholds $\tau$
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rejectionCurves}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="threshold"
                    unit=" τ"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Confidence Cutoff (τ)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                  />
                  <YAxis unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val: any) => [`${val}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="acceptedErrorRatePercent"
                    name="Accepted Error Rate (%)"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="referralRatePercent"
                    name="Expert Referral Rate (%)"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="coveragePercent"
                    name="Model Coverage (%)"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed italic border-t border-slate-100 pt-2">
              Raising the cutoff $\tau$ suppresses errors in accepted predictions while escalating referral to agricultural experts, guaranteeing farm safety.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          {loading ? 'Compiling experimental metrics...' : 'Evaluation pipeline ready for execution.'}
        </div>
      )}

      {/* Supported Taxonomy Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center">
          <Database className="w-4 h-4 mr-2 text-emerald-600" />
          Standardized Disease Taxonomy (11 Supported Crop-Condition Classes)
        </h3>
        <p className="text-xs text-slate-500">
          Mapped between PlantVillage laboratory folder taxonomies and PlantDoc in-situ foliage classes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            { crop: 'Tomato', disease: 'Early Blight (Alternaria solani)' },
            { crop: 'Tomato', disease: 'Late Blight (Phytophthora infestans)' },
            { crop: 'Tomato', disease: 'Healthy' },
            { crop: 'Potato', disease: 'Early Blight (Alternaria solani)' },
            { crop: 'Potato', disease: 'Late Blight (Phytophthora infestans)' },
            { crop: 'Potato', disease: 'Healthy' },
            { crop: 'Corn (Maize)', disease: 'Common Rust (Puccinia sorghi)' },
            { crop: 'Corn (Maize)', disease: 'Northern Leaf Blight (Exserohilum turcicum)' },
            { crop: 'Corn (Maize)', disease: 'Healthy' },
            { crop: 'Bell Pepper', disease: 'Bacterial Spot (Xanthomonas campestris)' },
            { crop: 'Bell Pepper', disease: 'Healthy' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
            >
              <span className="font-semibold text-slate-800">{item.crop}</span>
              <span className="text-[11px] text-slate-500">{item.disease}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
