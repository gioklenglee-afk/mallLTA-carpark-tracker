import React, { useState, useEffect, useMemo } from 'react';
import {
  Carpark,
  FilterState,
  VehicleType,
  UserLocation,
} from './types/carpark';
import {
  INITIAL_CARPARKS,
  DEFAULT_USER_LOCATIONS,
} from './data/singaporeCarparks';
import {
  calculateDistanceKm,
  getSavedFavorites,
  toggleFavorite,
  simulateLotUpdates,
  getBackendConfig,
  BackendEndpointConfig,
} from './services/carparkService';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { CarparkCard } from './components/CarparkCard';
import { CarparkMap } from './components/CarparkMap';
import { CarparkDetail } from './components/CarparkDetail';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { FeeCalculatorModal } from './components/FeeCalculatorModal';
import {
  Map as MapIcon,
  List as ListIcon,
  Columns2,
  Clock,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_USER_LOCATIONS[0]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState<boolean>(false);
  const [isAutoSimulation, setIsAutoSimulation] = useState<boolean>(true);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedRegion: 'All Singapore',
    vehicleType: 'car',
    agency: 'ALL',
    onlyAvailable: false,
    hasEvCharging: false,
    hasFreeParking: false,
    minClearance: 0,
    sortBy: 'available',
  });

  // Load saved favorites on mount
  useEffect(() => {
    setFavorites(getSavedFavorites());
  }, []);

  // Real-time automatic background lot fluctuation simulator
  useEffect(() => {
    if (!isAutoSimulation) return;
    const interval = setInterval(() => {
      setCarparks((prev) => simulateLotUpdates(prev));
      setLastSyncTime(new Date());
    }, 12000); // Ticks every 12s to mimic live IU sensors

    return () => clearInterval(interval);
  }, [isAutoSimulation]);

  // Handle manual sync
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCarparks((prev) => simulateLotUpdates(prev));
      setLastSyncTime(new Date());
      setIsRefreshing(false);
    }, 600);
  };

  const handleToggleFavorite = (carparkId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = toggleFavorite(carparkId);
    setFavorites(updated);
  };

  // Filter & Sort carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Search query filter (matches name, code, postal code, address)
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchCode = cp.carparkNumber.toLowerCase().includes(q);
          const matchPostal = cp.postalCode.includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          if (!matchName && !matchCode && !matchPostal && !matchAddress) {
            return false;
          }
        }

        // Region filter
        if (filters.selectedRegion !== 'All Singapore' && cp.region !== filters.selectedRegion) {
          return false;
        }

        // Agency filter
        if (filters.agency !== 'ALL' && cp.agency !== filters.agency) {
          return false;
        }

        // Minimum clearance
        if (
          filters.minClearance > 0 &&
          cp.clearanceHeightMeters &&
          cp.clearanceHeightMeters < filters.minClearance
        ) {
          return false;
        }

        // Vehicle type availability check
        const lotData =
          filters.vehicleType === 'motorcycle'
            ? cp.lots.motorcycle
            : filters.vehicleType === 'heavy'
            ? cp.lots.heavy
            : cp.lots.car;

        if (!lotData) return false;

        // Only available (>10 lots)
        if (filters.onlyAvailable && lotData.available < 10) {
          return false;
        }

        // EV Charging
        if (filters.hasEvCharging && (!cp.evChargers || cp.evChargers.length === 0)) {
          return false;
        }

        // Free parking scheme
        if (filters.hasFreeParking && !cp.freeParkingScheme) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const lotA =
          filters.vehicleType === 'motorcycle'
            ? a.lots.motorcycle?.available || 0
            : filters.vehicleType === 'heavy'
            ? a.lots.heavy?.available || 0
            : a.lots.car.available;

        const lotB =
          filters.vehicleType === 'motorcycle'
            ? b.lots.motorcycle?.available || 0
            : filters.vehicleType === 'heavy'
            ? b.lots.heavy?.available || 0
            : b.lots.car.available;

        if (filters.sortBy === 'available') {
          return lotB - lotA;
        }

        if (filters.sortBy === 'occupancy') {
          const occA =
            a.lots.car.total > 0
              ? (a.lots.car.total - a.lots.car.available) / a.lots.car.total
              : 1;
          const occB =
            b.lots.car.total > 0
              ? (b.lots.car.total - b.lots.car.available) / b.lots.car.total
              : 1;
          return occA - occB;
        }

        if (filters.sortBy === 'distance') {
          const distA = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            a.coordinates.lat,
            a.coordinates.lng
          );
          const distB = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            b.coordinates.lat,
            b.coordinates.lng
          );
          return distA - distB;
        }

        if (filters.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }

        return 0;
      });
  }, [carparks, filters, userLocation]);

  // Keep selected carpark data in sync with real-time updates
  useEffect(() => {
    if (selectedCarpark) {
      const updated = carparks.find((c) => c.id === selectedCarpark.id);
      if (updated) setSelectedCarpark(updated);
    }
  }, [carparks]);

  // Fast header navigation shortcuts
  const handleNavAgencyFilter = (agency: 'all' | 'HDB' | 'MALL' | 'URA') => {
    setFilters((prev) => ({
      ...prev,
      agency: agency === 'all' ? 'ALL' : agency,
      selectedRegion: 'All Singapore',
    }));
  };

  // Island-wide statistics
  const totalLotsAvailable = useMemo(() => {
    return filteredCarparks.reduce((sum, c) => {
      const breakdown =
        filters.vehicleType === 'motorcycle'
          ? c.lots.motorcycle?.available || 0
          : filters.vehicleType === 'heavy'
          ? c.lots.heavy?.available || 0
          : c.lots.car.available;
      return sum + breakdown;
    }, 0);
  }, [filteredCarparks, filters.vehicleType]);

  const resetAllFilters = () => {
    setFilters({
      searchQuery: '',
      selectedRegion: 'All Singapore',
      vehicleType: 'car',
      agency: 'ALL',
      onlyAvailable: false,
      hasEvCharging: false,
      hasFreeParking: false,
      minClearance: 0,
      sortBy: 'available',
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* 1. Top Bar Navigation adhering to strict 3-zone contract */}
      <Header
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onOpenFeeEstimator={() => setIsFeeModalOpen(true)}
        onSelectNavFilter={handleNavAgencyFilter}
        activeFilter={filters.agency === 'ALL' ? 'all' : filters.agency}
      />

      {/* 2. Interactive Filter & Region Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        userLocation={userLocation}
        onUserLocationChange={setUserLocation}
        totalCount={carparks.length}
        filteredCount={filteredCarparks.length}
      />

      {/* Subheader Toolbar: Live lot count, sync status, and View Mode Switches */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 text-xs">
        {/* Left: Island summary */}
        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
              {totalLotsAvailable.toLocaleString()}
            </span>
            <span>
              {filters.vehicleType === 'car'
                ? 'car'
                : filters.vehicleType === 'motorcycle'
                ? 'motorcycle'
                : 'heavy'}{' '}
              lots currently vacant
            </span>
          </div>

          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>

          <div className="hidden sm:flex items-center gap-1 text-slate-500 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Updated {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* Right: Simulation toggle & View Switcher */}
        <div className="flex items-center gap-3">
          <label className="hidden md:flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
            <input
              type="checkbox"
              checked={isAutoSimulation}
              onChange={(e) => setIsAutoSimulation(e.target.checked)}
              className="rounded text-slate-900 border-slate-300 focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[11px] font-medium">Live Lot Ticker</span>
          </label>

          {/* View Mode Segmented Controls */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Split View (List + Map)"
            >
              <Columns2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Full List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Full Map View"
            >
              <MapIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <main className="flex-1 flex overflow-hidden relative" style={{ height: 'calc(100vh - 150px)' }}>
        {/* Carpark List Pane */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div
            className={`${
              viewMode === 'list' ? 'w-full' : 'w-full md:w-[480px] lg:w-[520px]'
            } border-r border-slate-200 overflow-y-auto bg-slate-50 flex flex-col`}
          >
            {filteredCarparks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-400 mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No carparks match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
                  Try clearing specific clearance filters, vehicle types, or search keywords.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div
                className={`p-4 gap-3 ${
                  viewMode === 'list'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'flex flex-col'
                }`}
              >
                {filteredCarparks.map((cp) => {
                  const dist = calculateDistanceKm(
                    userLocation.lat,
                    userLocation.lng,
                    cp.coordinates.lat,
                    cp.coordinates.lng
                  );
                  return (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      isSelected={selectedCarpark?.id === cp.id}
                      isFavorite={favorites.includes(cp.id)}
                      distanceKm={dist}
                      vehicleType={filters.vehicleType}
                      onSelect={() => setSelectedCarpark(cp)}
                      onToggleFavorite={(e) => handleToggleFavorite(cp.id, e)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Map Pane */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className="flex-1 h-full relative">
            <CarparkMap
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(cp) => setSelectedCarpark(cp)}
              userLocation={userLocation}
              vehicleType={filters.vehicleType}
            />
          </div>
        )}

        {/* Selected Carpark Slide-in Inspector Panel */}
        {selectedCarpark && (
          <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] lg:w-[440px] z-40 shadow-2xl">
            <CarparkDetail
              carpark={selectedCarpark}
              distanceKm={calculateDistanceKm(
                userLocation.lat,
                userLocation.lng,
                selectedCarpark.coordinates.lat,
                selectedCarpark.coordinates.lng
              )}
              isFavorite={favorites.includes(selectedCarpark.id)}
              onToggleFavorite={() => handleToggleFavorite(selectedCarpark.id)}
              onClose={() => setSelectedCarpark(null)}
              vehicleType={filters.vehicleType}
            />
          </div>
        )}
      </main>

      {/* Backend Integration Hub Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onApplyConfig={(cfg) => {
          console.log('Applied backend config:', cfg);
        }}
      />

      {/* Singapore Fee Calculator Modal */}
      <FeeCalculatorModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        carparks={carparks}
        selectedCarpark={selectedCarpark}
      />
    </div>
  );
}
