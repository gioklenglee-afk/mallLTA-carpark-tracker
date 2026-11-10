import React from 'react';
import { Star, Zap, Navigation, ShieldCheck } from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityStatus, getStatusColor, formatDistance } from '../services/carparkService';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  isFavorite: boolean;
  distanceKm: number;
  vehicleType: VehicleType;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  isFavorite,
  distanceKm,
  vehicleType,
  onSelect,
  onToggleFavorite,
}) => {
  const breakdown =
    vehicleType === 'motorcycle'
      ? carpark.lots.motorcycle || { available: 0, total: 0 }
      : vehicleType === 'heavy'
      ? carpark.lots.heavy || { available: 0, total: 0 }
      : carpark.lots.car;

  const status = getAvailabilityStatus(breakdown.available, breakdown.total);
  const colors = getStatusColor(status);
  const occupancyPercent =
    breakdown.total > 0
      ? Math.round(((breakdown.total - breakdown.available) / breakdown.total) * 100)
      : 100;

  return (
    <div
      onClick={onSelect}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900/10'
          : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
      }`}
    >
      {/* Top line metadata (unboxed text with middle dots as per anti-slop guidelines) */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-semibold text-slate-700">{carpark.agency}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-slate-600">{carpark.carparkNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{carpark.carparkType}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {formatDistance(distanceKm)} away
          </span>
          <button
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-1 rounded-md text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${
                isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-slate-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Carpark Title & Address */}
      <div className="mb-3">
        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-900 transition-colors">
          {carpark.name}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{carpark.address}</p>
      </div>

      {/* Lot Status Grid & Visual Meter */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2.5">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums leading-none">
              {breakdown.available}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              lots available / <span className="font-mono tabular-nums">{breakdown.total}</span>
            </span>
          </div>

          <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
            {status === 'available' ? 'Available' : status === 'limited' ? 'Filling Fast' : 'Almost Full'}
          </span>
        </div>

        {/* Linear Occupancy Meter */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              status === 'available'
                ? 'bg-emerald-500'
                : status === 'limited'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, occupancyPercent))}%` }}
          />
        </div>
      </div>

      {/* Features & Key Attributes (quiet typography, no pill badges) */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {carpark.clearanceHeightMeters && (
            <span title="Clearance height">
              Ht: <strong className="font-mono text-slate-700">{carpark.clearanceHeightMeters}m</strong>
            </span>
          )}
          {carpark.evChargers && carpark.evChargers.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium" title="EV charging lots available">
              <Zap className="w-3 h-3" />
              <span>EV Ready</span>
            </span>
          )}
          {carpark.freeParkingScheme && (
            <span className="text-blue-700 font-medium line-clamp-1" title={carpark.freeParkingScheme}>
              Free Scheme
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-medium group-hover:text-slate-700 transition-colors">
          Inspect Details &rarr;
        </span>
      </div>
    </div>
  );
};
