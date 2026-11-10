import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType, UserLocation } from '../types/carpark';
import { getAvailabilityStatus, getStatusColor } from '../services/carparkService';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userLocation: UserLocation;
  vehicleType: VehicleType;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
  vehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [1.3521, 103.8198], // Singapore central coordinates
        zoom: 12,
        zoomControl: false,
      });

      // Add clean, modern OpenStreetMap / CartoDB Voyager tiles (crisp, readable, fast)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom control to bottom right for optimal ergonomics
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update User Location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userHtml = `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute w-7 h-7 rounded-full bg-blue-500/25 animate-ping"></span>
        <span class="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
      </div>
    `;

    const userIcon = L.divIcon({
      className: 'user-pin-icon',
      html: userHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.bindPopup(`
      <div class="p-2 text-xs font-sans">
        <p class="font-bold text-slate-800">Your Current Simulated Location</p>
        <p class="text-slate-600">${userLocation.label}</p>
      </div>
    `);

    userMarkerRef.current = marker;
  }, [userLocation]);

  // Update Carpark markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    carparks.forEach((cp) => {
      const breakdown =
        vehicleType === 'motorcycle'
          ? cp.lots.motorcycle || { available: 0, total: 0 }
          : vehicleType === 'heavy'
          ? cp.lots.heavy || { available: 0, total: 0 }
          : cp.lots.car;

      const status = getAvailabilityStatus(breakdown.available, breakdown.total);
      const colors = getStatusColor(status);
      const isSelected = selectedCarpark?.id === cp.id;

      const markerHtml = `
        <div class="relative group cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-10'
        }">
          <div class="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full shadow-md border-2 ${
            isSelected ? 'border-slate-900 ring-2 ring-slate-900/20' : colors.border
          } text-slate-900 text-xs font-semibold whitespace-nowrap">
            <span class="w-2 h-2 rounded-full ${colors.dot} shrink-0"></span>
            <span class="font-mono tabular-nums">${breakdown.available}</span>
          </div>
          <div class="w-2 h-2 bg-white border-b-2 border-r-2 ${
            isSelected ? 'border-slate-900' : colors.border
          } rotate-45 mx-auto -mt-1 shadow-sm"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-marker',
        html: markerHtml,
        iconSize: [64, 34],
        iconAnchor: [32, 34],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], {
        icon: customIcon,
      }).addTo(map);

      // Popup content
      const popupHtml = `
        <div class="custom-carpark-popup-card font-sans p-3 max-w-[260px]">
          <div class="flex items-center justify-between text-xs text-slate-500 pb-1 mb-1 border-b border-slate-100">
            <span class="font-bold text-slate-700">${cp.agency} · ${cp.carparkNumber}</span>
            <span class="font-mono ${colors.text} font-semibold uppercase text-[11px]">${status}</span>
          </div>
          <h4 class="font-bold text-sm text-slate-900 line-clamp-1">${cp.name}</h4>
          <p class="text-xs text-slate-500 mt-0.5 line-clamp-1">${cp.address}</p>
          
          <div class="flex items-center justify-between my-2.5 p-2 bg-slate-50 rounded-lg">
            <div>
              <div class="text-[10px] text-slate-500 uppercase tracking-wider">Available</div>
              <div class="text-base font-bold text-slate-900 font-mono tabular-nums leading-none mt-0.5">${breakdown.available} <span class="text-xs font-normal text-slate-400">/ ${breakdown.total}</span></div>
            </div>
            <div class="text-right">
              <div class="text-[10px] text-slate-500 uppercase tracking-wider">Occupancy</div>
              <div class="text-sm font-semibold text-slate-700 font-mono tabular-nums mt-0.5">${Math.round(
                ((breakdown.total - breakdown.available) / breakdown.total) * 100
              )}%</div>
            </div>
          </div>

          <button id="view-details-btn-${cp.id}" class="w-full py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors text-center cursor-pointer">
            Inspect Carpark & Rates
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'custom-carpark-popup',
        closeButton: false,
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-btn-${cp.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCarpark(cp);
          };
        }
      });

      markersRef.current[cp.id] = marker;
    });
  }, [carparks, selectedCarpark, onSelectCarpark, vehicleType]);

  // Pan to selected carpark when changed
  useEffect(() => {
    if (!selectedCarpark || !mapInstanceRef.current) return;
    const { lat, lng } = selectedCarpark.coordinates;
    mapInstanceRef.current.flyTo([lat, lng], 15, {
      duration: 0.8,
    });
    const marker = markersRef.current[selectedCarpark.id];
    if (marker && !marker.isPopupOpen()) {
      marker.openPopup();
    }
  }, [selectedCarpark]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([1.3521, 103.8198], 12);
    }
  };

  const handleCenterUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 14);
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-100 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating map controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1.5">
        <button
          onClick={handleCenterUser}
          title="Center on simulated user position"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/95 backdrop-blur text-slate-700 hover:text-slate-900 rounded-lg shadow-sm border border-slate-200 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>My Location</span>
        </button>

        <button
          onClick={handleResetView}
          title="Reset to whole Singapore view"
          className="px-3 py-1.5 text-xs font-medium bg-white/95 backdrop-blur text-slate-700 hover:text-slate-900 rounded-lg shadow-sm border border-slate-200 transition-colors"
        >
          Island View
        </button>
      </div>

      {/* Map Legend (quiet unboxed bottom banner) */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Available (&gt;25%)</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Limited (&lt;20%)</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Full (&lt;5 lots)</span>
        </div>
      </div>
    </div>
  );
};
