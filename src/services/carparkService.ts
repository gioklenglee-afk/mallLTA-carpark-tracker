import { Carpark, AvailabilityStatus, VehicleType } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/singaporeCarparks';

const FAVORITES_KEY = 'sg_parkpulse_favorites';
const BACKEND_CONFIG_KEY = 'sg_parkpulse_backend_endpoint';

export interface BackendEndpointConfig {
  endpointUrl: string;
  apiKey?: string;
  autoRefreshIntervalSecs: number;
  useLiveMockIfOffline: boolean;
}

export function getAvailabilityStatus(available: number, total: number): AvailabilityStatus {
  if (total <= 0) return 'full';
  const percentage = (available / total) * 100;
  if (available <= 4 || percentage <= 4) {
    return 'full';
  }
  if (available < 25 || percentage < 20) {
    return 'limited';
  }
  return 'available';
}

export function getStatusColor(status: AvailabilityStatus): {
  badge: string;
  border: string;
  text: string;
  bg: string;
  dot: string;
  hex: string;
} {
  switch (status) {
    case 'available':
      return {
        badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        border: 'border-emerald-300',
        text: 'text-emerald-600',
        bg: 'bg-emerald-500',
        dot: 'bg-emerald-500',
        hex: '#10b981',
      };
    case 'limited':
      return {
        badge: 'text-amber-700 bg-amber-50 border-amber-200',
        border: 'border-amber-300',
        text: 'text-amber-600',
        bg: 'bg-amber-500',
        dot: 'bg-amber-500',
        hex: '#f59e0b',
      };
    case 'full':
    default:
      return {
        badge: 'text-rose-700 bg-rose-50 border-rose-200',
        border: 'border-rose-300',
        text: 'text-rose-600',
        bg: 'bg-rose-500',
        dot: 'bg-rose-500',
        hex: '#ef4444',
      };
  }
}

/**
 * Calculates distance between two coordinates in kilometers via Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * LocalStorage favorites management
 */
export function getSavedFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(carparkId: string): string[] {
  const current = getSavedFavorites();
  const next = current.includes(carparkId)
    ? current.filter((id) => id !== carparkId)
    : [...current, carparkId];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save favorites', e);
  }
  return next;
}

export function getBackendConfig(): BackendEndpointConfig {
  try {
    const raw = localStorage.getItem(BACKEND_CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return {
    endpointUrl: 'https://api.data.gov.sg/v1/transport/carpark-availability',
    apiKey: '',
    autoRefreshIntervalSecs: 15,
    useLiveMockIfOffline: true,
  };
}

export function saveBackendConfig(config: BackendEndpointConfig) {
  try {
    localStorage.setItem(BACKEND_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Simulates realistic lot fluctuations for demo mode
 */
export function simulateLotUpdates(carparks: Carpark[]): Carpark[] {
  return carparks.map((cp) => {
    // 60% chance lot count shifts slightly (+/- 1 to 4 lots)
    if (Math.random() < 0.6) {
      const deltaCar = Math.floor(Math.random() * 7) - 3;
      const currentCar = cp.lots.car.available;
      const newCarAvail = Math.max(0, Math.min(cp.lots.car.total, currentCar + deltaCar));

      let updatedMoto = cp.lots.motorcycle;
      if (cp.lots.motorcycle) {
        const deltaMoto = Math.floor(Math.random() * 3) - 1;
        const newMotoAvail = Math.max(
          0,
          Math.min(cp.lots.motorcycle.total, cp.lots.motorcycle.available + deltaMoto)
        );
        updatedMoto = { ...cp.lots.motorcycle, available: newMotoAvail };
      }

      return {
        ...cp,
        lots: {
          ...cp.lots,
          car: {
            ...cp.lots.car,
            available: newCarAvail,
          },
          motorcycle: updatedMoto,
        },
        updatedAt: new Date().toISOString(),
      };
    }
    return cp;
  });
}

/**
 * Estimate parking fee in SGD
 */
export function estimateParkingCost(
  carpark: Carpark,
  durationHours: number,
  isWeekend: boolean
): { cost: number; breakdownText: string; isWithinGracePeriod: boolean } {
  const durationMins = durationHours * 60;

  if (durationMins <= carpark.rates.gracePeriodMins) {
    return {
      cost: 0,
      breakdownText: `Within ${carpark.rates.gracePeriodMins}-minute grace period (Free)`,
      isWithinGracePeriod: true,
    };
  }

  // Rough estimation logic based on agency
  if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
    const isCentral = carpark.region === 'Central';
    const ratePerHalfHr = isCentral ? 1.2 : 0.6;
    const halfHourBlocks = Math.ceil(durationMins / 30);
    const cost = halfHourBlocks * ratePerHalfHr;
    return {
      cost: Number(cost.toFixed(2)),
      breakdownText: `${halfHourBlocks} × 30-min blocks @ $${ratePerHalfHr.toFixed(2)} (${isCentral ? 'Central Area rate' : 'Standard HDB rate'})`,
      isWithinGracePeriod: false,
    };
  }

  // Mall estimation
  const firstHrRate = isWeekend ? 3.5 : 2.5;
  const subsequentHalfHr = isWeekend ? 1.5 : 1.0;
  if (durationHours <= 1) {
    return {
      cost: firstHrRate,
      breakdownText: `First hour base rate: $${firstHrRate.toFixed(2)}`,
      isWithinGracePeriod: false,
    };
  }

  const remainingMins = durationMins - 60;
  const extraBlocks = Math.ceil(remainingMins / 30);
  const total = firstHrRate + extraBlocks * subsequentHalfHr;
  return {
    cost: Number(total.toFixed(2)),
    breakdownText: `1st hr ($${firstHrRate.toFixed(2)}) + ${extraBlocks} × 30-min ($${subsequentHalfHr.toFixed(2)})`,
    isWithinGracePeriod: false,
  };
}
