import React, { useState } from 'react';
import { X, Calculator, Info } from 'lucide-react';
import { Carpark } from '../types/carpark';
import { estimateParkingCost } from '../services/carparkService';

interface FeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
}

export const FeeCalculatorModal: React.FC<FeeCalculatorModalProps> = ({
  isOpen,
  onClose,
  carparks,
  selectedCarpark: initialSelected,
}) => {
  const [selectedCarparkId, setSelectedCarparkId] = useState<string>(
    initialSelected?.id || carparks[0]?.id || ''
  );
  const [durationHours, setDurationHours] = useState<number>(2);
  const [isWeekend, setIsWeekend] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentCarpark = carparks.find((c) => c.id === selectedCarparkId) || carparks[0];
  const estimation = currentCarpark
    ? estimateParkingCost(currentCarpark, durationHours, isWeekend)
    : { cost: 0, breakdownText: '', isWithinGracePeriod: false };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Singapore Parking Fee Calculator
              </h3>
              <p className="text-xs text-slate-500">
                Estimate rates based on official HDB, URA & Mall pricing tiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Select Carpark */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Select Destination Carpark
            </label>
            <select
              value={selectedCarparkId}
              onChange={(e) => setSelectedCarparkId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-medium"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  [{cp.agency}] {cp.name} ({cp.carparkNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Timing & Day selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Day of Week</label>
              <div className="flex p-0.5 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsWeekend(false)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    !isWeekend ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Weekday
                </button>
                <button
                  type="button"
                  onClick={() => setIsWeekend(true)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    isWeekend ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Weekend / PH
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-700 font-semibold">Duration</label>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {durationHours} {durationHours === 1 ? 'hr' : 'hrs'}
                </span>
              </div>
              <input
                type="range"
                min={0.25}
                max={10}
                step={0.25}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full accent-slate-900 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Rate Card Preview */}
          {currentCarpark && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                Selected Carpark Rate Rules
              </div>
              <div className="flex justify-between">
                <span>Standard Daytime Rate:</span>
                <span className="font-medium text-slate-900 text-right">
                  {currentCarpark.rates.weekdayDayRate}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Grace Period:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentCarpark.rates.gracePeriodMins} minutes free
                </span>
              </div>
              {currentCarpark.rates.freeParkingScheme && (
                <div className="flex justify-between text-blue-700">
                  <span>Special Scheme:</span>
                  <span className="font-semibold text-right">
                    {currentCarpark.rates.freeParkingScheme}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Result Output Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Total Estimated Fee</span>
                <span className="text-xs text-slate-300 font-mono mt-0.5 block">
                  {estimation.breakdownText}
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                ${estimation.cost.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 text-[11px] text-slate-500 bg-slate-50 rounded-lg">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              HDB and URA Electronic Parking System (EPS) charges are billed per-minute in blocks of
              30 minutes. Malls vary by shopping hour tiers and promotional redemptions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
