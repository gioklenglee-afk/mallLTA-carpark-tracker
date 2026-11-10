export type VehicleType = 'car' | 'motorcycle' | 'heavy';

export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'MALL';

export type CarparkType = 'MSCP' | 'SURFACE' | 'BASEMENT' | 'MECHANISED';

export type AvailabilityStatus = 'available' | 'limited' | 'full';

export interface LotBreakdown {
  total: number;
  available: number;
  type: VehicleType;
}

export interface ParkingRate {
  weekdayDayRate: string; // e.g. "$0.60 per 30 mins (7:00 AM - 5:00 PM)"
  weekdayPeakRate?: string;
  weekendRate: string;
  nightRate: string; // e.g. "$0.60 per 30 mins, capped at $5.00"
  gracePeriodMins: number; // e.g. 15 mins
  freeParkingScheme?: string; // e.g. "Sun & PH 7:30 AM - 10:30 PM"
}

export interface EVCharger {
  provider: string; // e.g. "SP Mobility", "CDG ENGIE", "Shell Recharge"
  count: number;
  powerKw: number;
  type: 'AC' | 'DC';
}

export interface Carpark {
  id: string;
  carparkNumber: string; // e.g., "ACB", "TP24", "VIV01"
  name: string;
  address: string;
  postalCode: string;
  region: 'Central' | 'East' | 'West' | 'North' | 'North-East';
  coordinates: {
    lat: number;
    lng: number;
  };
  agency: CarparkAgency;
  carparkType: CarparkType;
  clearanceHeightMeters?: number; // e.g. 2.1
  hasEps: boolean; // Electronic Parking System
  nightParking: boolean;
  freeParkingScheme?: string;
  evChargers?: EVCharger[];
  rates: ParkingRate;
  lots: {
    car: LotBreakdown;
    motorcycle?: LotBreakdown;
    heavy?: LotBreakdown;
  };
  updatedAt: string;
  // Trend simulation data: 24-hour occupancy percentages [0h ... 23h]
  hourlyOccupancyHistory: number[];
}

export interface FilterState {
  searchQuery: string;
  selectedRegion: string;
  vehicleType: VehicleType;
  agency: string;
  onlyAvailable: boolean;
  hasEvCharging: boolean;
  hasFreeParking: boolean;
  minClearance: number; // in meters (0 = any)
  sortBy: 'available' | 'occupancy' | 'distance' | 'name';
}

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}
