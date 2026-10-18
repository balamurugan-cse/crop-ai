import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ClassProbability } from '../types';

interface PredictionChartProps {
  probabilities: ClassProbability[];
  confidenceThreshold?: number;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({
  probabilities,
  confidenceThreshold = 0.65,
}) => {
  const data = probabilities.slice(0, 5).map((p) => ({
    name: p.displayName,
    probPercent: parseFloat((p.probability * 100).toFixed(1)),
    isHealthy: p.isHealthy,
  }));

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Softmax Disease Class Probabilities (Top 5)
        </h4>
        <span className="text-xs text-slate-500">
          Rejection Threshold: <strong className="text-amber-600">{(confidenceThreshold * 100).toFixed(0)}%</strong>
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={140}
            />
            <Tooltip
              formatter={(value: any) => [`${value}%`, 'Probability']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
            />
            <ReferenceLine
              x={confidenceThreshold * 100}
              stroke="#d97706"
              strokeDasharray="3 3"
              label={{ value: 'Safety Cutoff', position: 'top', fill: '#d97706', fontSize: 10 }}
            />
            <Bar dataKey="probPercent" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isHealthy ? '#16a34a' : entry.probPercent > 50 ? '#dc2626' : '#ea580c'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block mr-1"></span> Healthy
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block mr-1"></span> Primary Pathogen
          </span>
          <span className="flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block mr-1"></span> Secondary
          </span>
        </div>
        <span className="italic">Calibrated transfer learning probabilities</span>
      </div>
    </div>
  );
};
