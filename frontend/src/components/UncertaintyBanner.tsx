import React from 'react';
import { AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import { Prediction } from '../types';

interface UncertaintyBannerProps {
  prediction: Prediction;
  onRequestExpertReview?: () => void;
  isReviewRequested?: boolean;
}

export const UncertaintyBanner: React.FC<UncertaintyBannerProps> = ({
  prediction,
  onRequestExpertReview,
  isReviewRequested,
}) => {
  if (prediction.accepted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-emerald-900">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 mt-0.5">
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-emerald-900 text-sm">
            High Confidence Prediction Accepted ({(prediction.confidence * 100).toFixed(1)}%)
          </div>
          <div className="text-xs text-emerald-700 mt-0.5">
            Shannon Entropy: {prediction.entropy.toFixed(2)} (Safe range &lt; 1.20).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-950 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="bg-amber-200 p-2 rounded-lg text-amber-800 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-amber-900 text-sm flex items-center">
            <span>Model Uncertainty Warning — Human Review Recommended</span>
            <span className="ml-2 text-xs bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
              Not Accepted
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            {prediction.reviewReason ||
              'Confidence score is below the reliable safety threshold (65%) or multiple classes exhibit high distribution entropy.'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {onRequestExpertReview && !isReviewRequested ? (
              <button
                onClick={onRequestExpertReview}
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <ShieldAlert className="w-4 h-4 mr-1.5" />
                Request Agricultural Expert Review
              </button>
            ) : isReviewRequested ? (
              <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg">
                ✓ Review requested — Assigned to agronomist queue
              </span>
            ) : null}
            <span className="text-xs text-amber-700 italic">
              Do not apply targeted chemical fungicide or pesticide without specialist confirmation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
