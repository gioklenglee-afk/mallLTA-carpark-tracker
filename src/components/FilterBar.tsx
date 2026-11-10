import React from 'react';
import { Search, X, MapPin, Car, Bike, Truck, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { FilterState, VehicleType, UserLocation } from '../types/carpark';
import { SINGAPORE_REGIONS, DEFAULT_USER_LOCATIONS } from '../data/singaporeCarparks';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  userLocation: UserLocation;
  onUserLocationChange: (loc: UserLocation) => void;
  totalCount: number;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  userLocation,
  onUserLocationChange,
  totalCount,
  filteredCount,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const clearSearch = () => {
    onFilterChange({ ...filters, searchQuery: '' });
  };

  const handleVehicleChange = (type: VehicleType) => {
    onFilterChange({ ...filters, vehicleType: type });
  };

  const handleRegionChange = (region: string) => {
    onFilterChange({ ...filters, selectedRegion: region });
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    onFilterChange({ ...filters, sortBy });
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 space-y-3">
      {/* Top Search Bar & Vehicle Segmented Switch & Location */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearch}
            placeholder="Search carpark code (e.g. ACB), mall, road, or postal code..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
          />
          {filters.searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vehicle Type Segmented Control (Interactive Button Control - Allowed per guidelines §1.A) */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => handleVehicleChange('car')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filters.vehicleType === 'car'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars</span>
          </button>
          <button
            onClick={() => handleVehicleChange('motorcycle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filters.vehicleType === 'motorcycle'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles</span>
          </button>
          <button
            onClick={() => handleVehicleChange('heavy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filters.vehicleType === 'heavy'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy Vehicles</span>
          </button>
        </div>

        {/* Simulated User Location Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Near:</span>
          </div>
          <select
            value={userLocation.label}
            onChange={(e) => {
              const matched = DEFAULT_USER_LOCATIONS.find((l) => l.label === e.target.value);
              if (matched) onUserLocationChange(matched);
            }}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
          >
            {DEFAULT_USER_LOCATIONS.map((loc) => (
              <option key={loc.label} value={loc.label}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Region Tabs & Quick Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Region Pills / Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {SINGAPORE_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => handleRegionChange(region)}
              className={`px-3 py-1 text-xs rounded-md whitespace-nowrap font-medium transition-colors cursor-pointer ${
                filters.selectedRegion === region
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle & Sort */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-slate-600 hover:text-slate-900 transition-colors cursor-pointer ${
              showAdvanced ? 'border-slate-900 bg-slate-50 text-slate-900 font-medium' : 'border-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-1.5 text-slate-500">
            <ArrowUpDown className="w-3 h-3" />
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="available">Most Available Lots</option>
              <option value="occupancy">Lowest Occupancy</option>
              <option value="distance">Nearest Distance</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          <div className="text-slate-400 font-mono tabular-nums">
            {filteredCount} of {totalCount} carparks
          </div>
        </div>
      </div>

      {/* Advanced Filter Collapsible Bar */}
      {showAdvanced && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Managing Agency</label>
            <select
              value={filters.agency}
              onChange={(e) => onFilterChange({ ...filters, agency: e.target.value })}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
            >
              <option value="ALL">All Agencies & Malls</option>
              <option value="HDB">HDB (Housing & Development Board)</option>
              <option value="MALL">Commercial & Shopping Malls</option>
              <option value="URA">URA (Urban Redevelopment Authority)</option>
              <option value="LTA">LTA (Land Transport Authority)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Min Clearance Height</label>
            <select
              value={filters.minClearance}
              onChange={(e) => onFilterChange({ ...filters, minClearance: Number(e.target.value) })}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-md text-slate-800"
            >
              <option value={0}>Any Clearance Height</option>
              <option value={1.9}>1.9m or higher</option>
              <option value={2.0}>2.0m or higher</option>
              <option value={2.1}>2.1m or higher</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filters.onlyAvailable}
                onChange={(e) => onFilterChange({ ...filters, onlyAvailable: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Only show available (&gt;10 lots)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filters.hasEvCharging}
                onChange={(e) => onFilterChange({ ...filters, hasEvCharging: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>EV Charging Lots</span>
            </label>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={filters.hasFreeParking}
                onChange={(e) => onFilterChange({ ...filters, hasFreeParking: e.target.checked })}
                className="rounded border-slate-300 text-slate-900 focus:ring-0"
              />
              <span>Free Parking Schemes (Sun/PH/Lunch)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
