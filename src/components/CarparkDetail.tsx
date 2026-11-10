import React, { useState } from 'react';
import {
  X,
  Star,
  MapPin,
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Car,
  Bike,
  Truck,
  HelpCircle,
  Navigation,
} from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import {
  getAvailabilityStatus,
  getStatusColor,
  estimateParkingCost,
  formatDistance,
} from '../services/carparkService';

interface CarparkDetailProps {
  carpark: Carpark;
  distanceKm: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  vehicleType: VehicleType;
}

export const CarparkDetail: React.FC<CarparkDetailProps> = ({
  carpark,
  distanceKm,
  isFavorite,
  onToggleFavorite,
  onClose,
  vehicleType,
}) => {
  const [calcDurationHours, setCalcDurationHours] = useState<number>(2);
  const [calcIsWeekend, setCalcIsWeekend] = useState<boolean>(false);

  const selectedLotBreakdown =
    vehicleType === 'motorcycle'
      ? carpark.lots.motorcycle || { available: 0, total: 0 }
      : vehicleType === 'heavy'
      ? carpark.lots.heavy || { available: 0, total: 0 }
      : carpark.lots.car;

  const status = getAvailabilityStatus(
    selectedLotBreakdown.available,
    selectedLotBreakdown.total
  );
  const colors = getStatusColor(status);
  const costEstimate = estimateParkingCost(carpark, calcDurationHours, calcIsWeekend);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`;
  const wazeUrl = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;

  // Current hour of day
  const currentHour = new Date().getHours();

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-y-auto">
      {/* Detail Top Header */}
      <div className="p-5 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur z-20">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{carpark.agency}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-600">{carpark.carparkNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.region}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleFavorite}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-amber-500 transition-colors cursor-pointer"
              title="Bookmark carpark"
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 leading-tight">{carpark.name}</h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{carpark.address}</span>
          <span className="shrink-0 font-mono text-slate-600 font-medium">
            ({formatDistance(distanceKm)})
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Real-time Status Big Metric Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Current Lot Availability
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                  {selectedLotBreakdown.available}
                </span>
                <span className="text-sm text-slate-500">
                  / <span className="font-mono tabular-nums">{selectedLotBreakdown.total}</span> total lots
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${colors.badge}`}>
                {status === 'available' ? 'Lots Available' : status === 'limited' ? 'Limited Lots' : 'Full / Critical'}
              </span>
              <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                {Math.round(
                  ((selectedLotBreakdown.total - selectedLotBreakdown.available) /
                    selectedLotBreakdown.total) *
                    100
                )}
                % Occupied
              </div>
            </div>
          </div>

          {/* Availability progress bar */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-500 ${
                status === 'available'
                  ? 'bg-emerald-500'
                  : status === 'limited'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    5,
                    ((selectedLotBreakdown.total - selectedLotBreakdown.available) /
                      selectedLotBreakdown.total) *
                      100
                  )
                )}%`,
              }}
            />
          </div>

          {/* Breakdown for other vehicle classes */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/80 text-xs">
            <div className="p-2 bg-white rounded-lg border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                <Car className="w-3 h-3" />
                <span>Cars</span>
              </div>
              <div className="font-mono font-bold text-slate-900 tabular-nums">
                {carpark.lots.car.available} <span className="text-[10px] text-slate-400">/{carpark.lots.car.total}</span>
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                <Bike className="w-3 h-3" />
                <span>Motorcycle</span>
              </div>
              <div className="font-mono font-bold text-slate-900 tabular-nums">
                {carpark.lots.motorcycle ? (
                  <>
                    {carpark.lots.motorcycle.available}{' '}
                    <span className="text-[10px] text-slate-400">/{carpark.lots.motorcycle.total}</span>
                  </>
                ) : (
                  'N/A'
                )}
              </div>
            </div>

            <div className="p-2 bg-white rounded-lg border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                <Truck className="w-3 h-3" />
                <span>Heavy</span>
              </div>
              <div className="font-mono font-bold text-slate-900 tabular-nums">
                {carpark.lots.heavy ? (
                  <>
                    {carpark.lots.heavy.available}{' '}
                    <span className="text-[10px] text-slate-400">/{carpark.lots.heavy.total}</span>
                  </>
                ) : (
                  'None'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 24-Hour Typical Occupancy Trend Histogram */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Typical 24-Hour Occupancy Pattern
            </h3>
            <span className="text-[11px] text-slate-500">
              Now: <span className="font-mono font-bold text-slate-800">{currentHour}:00</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="h-24 flex items-end gap-1 pt-2">
              {carpark.hourlyOccupancyHistory.map((val, idx) => {
                const isCurrent = idx === currentHour;
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative h-full justify-end"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:flex bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-30 font-mono">
                      {idx}:00 - {val}%
                    </div>
                    <div
                      className={`w-full rounded-t-xs transition-all ${
                        isCurrent
                          ? 'bg-blue-600 ring-2 ring-blue-300'
                          : val > 90
                          ? 'bg-rose-400'
                          : val > 75
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ height: `${val}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-0.5">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
          </div>
        </div>

        {/* Real Singapore Parking Rates & Fee Estimator */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Official Parking Rates & Charges
          </h3>
          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
            <div className="p-3 bg-white flex justify-between items-start">
              <span className="text-slate-500 font-medium">Day Rates (Weekdays)</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%]">
                {carpark.rates.weekdayDayRate}
              </span>
            </div>
            {carpark.rates.weekdayPeakRate && (
              <div className="p-3 bg-white flex justify-between items-start">
                <span className="text-slate-500 font-medium">Peak / Evening</span>
                <span className="font-semibold text-slate-900 text-right max-w-[60%]">
                  {carpark.rates.weekdayPeakRate}
                </span>
              </div>
            )}
            <div className="p-3 bg-white flex justify-between items-start">
              <span className="text-slate-500 font-medium">Weekends & PH</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%]">
                {carpark.rates.weekendRate}
              </span>
            </div>
            <div className="p-3 bg-white flex justify-between items-start">
              <span className="text-slate-500 font-medium">Night Parking</span>
              <span className="font-semibold text-slate-900 text-right max-w-[60%]">
                {carpark.rates.nightRate}
              </span>
            </div>
            <div className="p-3 bg-slate-50/70 flex justify-between items-center text-slate-600">
              <span>Grace Period</span>
              <span className="font-mono font-bold text-slate-800">
                {carpark.rates.gracePeriodMins} minutes free
              </span>
            </div>
          </div>
        </div>

        {/* Quick Rate Estimator Calculator */}
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              Parking Fee Estimator
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-md">
              <button
                onClick={() => setCalcIsWeekend(false)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  !calcIsWeekend ? 'bg-white text-slate-900' : 'text-slate-300'
                }`}
              >
                Weekday
              </button>
              <button
                onClick={() => setCalcIsWeekend(true)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  calcIsWeekend ? 'bg-white text-slate-900' : 'text-slate-300'
                }`}
              >
                Weekend
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Duration:</span>
              <span className="font-mono font-bold text-white tabular-nums">
                {calcDurationHours} {calcDurationHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>
            <input
              type="range"
              min={0.25}
              max={8}
              step={0.25}
              value={calcDurationHours}
              onChange={(e) => setCalcDurationHours(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>15m (Grace)</span>
              <span>2 hrs</span>
              <span>4 hrs</span>
              <span>8 hrs</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">Estimated Total</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                {costEstimate.breakdownText}
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
              ${costEstimate.cost.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Specifications & Amenities */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Carpark Amenities & Specs
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Clearance Height</span>
              <strong className="text-slate-900 font-mono text-sm">
                {carpark.clearanceHeightMeters ? `${carpark.clearanceHeightMeters}m` : 'Open Air / Surface'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Electronic System</span>
              <strong className="text-slate-900">
                {carpark.hasEps ? 'EPS (In-Vehicle IU)' : 'CashCard / Coupon'}
              </strong>
            </div>
          </div>

          {carpark.evChargers && carpark.evChargers.length > 0 && (
            <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>EV Charging Hub Available</span>
              </div>
              <div className="space-y-1">
                {carpark.evChargers.map((ev, i) => (
                  <div key={i} className="flex justify-between text-xs text-emerald-900">
                    <span>
                      {ev.provider} ({ev.count} lots)
                    </span>
                    <span className="font-mono font-medium">
                      {ev.powerKw}kW {ev.type} Fast Charge
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-2 pb-6 space-y-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navigate with Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <span>Open in Waze</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
