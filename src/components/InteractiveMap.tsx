import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Shelter, HazardIncident, SOSRequest, Language } from '../types/disaster';
import { SAFE_ROUTE_COORDS, DANGEROUS_ROUTE_COORDS } from '../data/mockVelloreData';
import { Route, ShieldCheck, AlertTriangle } from 'lucide-react';

interface InteractiveMapProps {
  shelters: Shelter[];
  hazards: HazardIncident[];
  sosRequests: SOSRequest[];
  selectedShelter: Shelter | null;
  onSelectShelter: (shelter: Shelter) => void;
  lang: Language;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  shelters,
  hazards,
  sosRequests,
  selectedShelter,
  onSelectShelter,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeRouteView, setActiveRouteView] = useState<'SAFE' | 'DANGEROUS' | 'BOTH'>('SAFE');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Vellore & Katpadi (Palar River corridor)
    const map = L.map(mapContainerRef.current, {
      center: [12.9520, 79.1450],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | SurakshaSetu Crisis GIS',
      maxZoom: 18,
      className: 'tactical-tiles',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. User Position Marker (Katpadi)
    const userIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `
        <div style="position:relative; width:28px; height:28px;">
          <div style="position:absolute; inset:0; border-radius:9999px; background:rgba(59,130,246,0.5); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative; width:28px; height:28px; border-radius:9999px; background:#2563eb; border:3px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(37,99,235,0.8);">
            <div style="width:8px; height:8px; border-radius:9999px; background:#ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([12.9698, 79.1396], { icon: userIcon })
      .addTo(layerGroup)
      .bindPopup(`
        <div style="color:#0f172a; font-family:sans-serif; padding:4px;">
          <b style="color:#2563eb;">📍 ${lang === 'en' ? 'Your Location' : 'உங்கள் இருப்பிடம்'}</b><br/>
          <small>Katpadi Junction, Vellore</small><br/>
          <span style="font-size:11px; color:#d97706; font-weight:bold;">Elevation: 216m (Moderate Risk Zone)</span>
        </div>
      `);

    // 2. Shelter Markers (Green shields)
    shelters.forEach((shelter) => {
      const remainingBeds = shelter.capacityTotal - shelter.capacityOccupied;
      const isSelected = selectedShelter?.id === shelter.id;

      const shelterIcon = L.divIcon({
        className: 'shelter-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
            <div style="background:${isSelected ? '#059669' : '#10b981'}; color:#ffffff; font-weight:800; font-size:11px; padding:3px 8px; border-radius:9999px; border:2px solid #ffffff; box-shadow:0 4px 12px rgba(16,185,129,0.5); white-space:nowrap; display:flex; align-items:center; gap:4px;">
              <span>🏠</span>
              <span>${remainingBeds} ${lang === 'en' ? 'beds' : 'படுக்கைகள்'}</span>
            </div>
            <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid #10b981;"></div>
          </div>
        `,
        iconSize: [80, 36],
        iconAnchor: [40, 36],
      });

      const marker = L.marker(shelter.location, { icon: shelterIcon }).addTo(layerGroup);
      marker.on('click', () => onSelectShelter(shelter));
      marker.bindPopup(`
        <div style="color:#0f172a; font-family:sans-serif; min-width:180px;">
          <strong style="color:#059669;">${lang === 'en' ? shelter.name : shelter.tamilName}</strong><br/>
          <span style="font-size:11px; color:#475569;">${shelter.address}</span><br/>
          <div style="margin-top:6px; font-size:12px; font-weight:bold;">
            Available: <span style="color:#059669;">${remainingBeds} / ${shelter.capacityTotal} beds</span>
          </div>
          <div style="margin-top:4px; font-size:11px; color:#2563eb;">
            ⚡ Solar: ${shelter.amenities.solarPower ? 'Active' : 'No'} | 🍼 Food: ${shelter.amenities.babyFood ? 'Available' : 'Limited'}
          </div>
        </div>
      `);
    });

    // 3. Submerged Hazards & Roadblocks (Crimson hazard icons)
    hazards.forEach((hazard) => {
      const hazardIcon = L.divIcon({
        className: 'hazard-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center;">
            <div style="background:#dc2626; color:#ffffff; font-weight:bold; font-size:10px; padding:3px 6px; border-radius:6px; border:2px solid #ffffff; box-shadow:0 0 12px rgba(220,38,38,0.7); display:flex; align-items:center; gap:3px;">
              <span>⚠️</span>
              <span>${hazard.waterDepthFeet ? `${hazard.waterDepthFeet}ft` : 'BLOCKED'}</span>
            </div>
            <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #dc2626;"></div>
          </div>
        `,
        iconSize: [60, 30],
        iconAnchor: [30, 30],
      });

      L.marker(hazard.location, { icon: hazardIcon })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="color:#0f172a; font-family:sans-serif; min-width:180px;">
            <b style="color:#dc2626;">⛔ ${lang === 'en' ? hazard.title : hazard.tamilTitle}</b><br/>
            <span style="font-size:11px; color:#475569;">${hazard.roadName}</span><br/>
            ${hazard.waterDepthFeet ? `<span style="font-size:12px; font-weight:bold; color:#b91c1c;">Water Depth: ${hazard.waterDepthFeet} feet</span><br/>` : ''}
            <small style="color:#64748b;">Status: <b>${hazard.status}</b> (${hazard.upvotes} reports)</small>
          </div>
        `);
    });

    // 4. Live SOS Emergency Pins (Pulsing Radar Rings)
    sosRequests.forEach((req) => {
      if (req.status === 'RESCUED') return;

      const isCritical = req.priorityLevel === 'P1_CRITICAL';
      const sosIcon = L.divIcon({
        className: 'sos-pin',
        html: `
          <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; inset:0; border-radius:9999px; background:${isCritical ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'}; animation:ping 1s infinite;"></div>
            <div style="position:relative; width:30px; height:30px; border-radius:9999px; background:${isCritical ? '#ef4444' : '#f59e0b'}; border:2px solid #ffffff; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow:0 0 14px rgba(239,68,68,0.9); color:#ffffff; font-weight:900; font-size:10px;">
              <span>SOS</span>
              <span style="font-size:8px;">${req.urgencyScore}</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker(req.location, { icon: sosIcon })
        .addTo(layerGroup)
        .bindPopup(`
          <div style="color:#0f172a; font-family:sans-serif; min-width:200px;">
            <b style="color:#dc2626;">🚨 ${req.citizenName} (${req.trappedCount} Trapped)</b><br/>
            <span style="font-size:11px; color:#475569;">${req.landmark}</span><br/>
            <div style="margin:4px 0; font-size:12px; font-weight:bold; color:#991b1b;">
              Triage Score: ${req.urgencyScore}/100 [${req.priorityLevel}]
            </div>
            ${req.medicalDetails ? `<div style="font-size:11px; color:#b91c1c; font-style:italic;">"${req.medicalDetails}"</div>` : ''}
            <div style="margin-top:4px; font-size:11px; font-weight:bold; color:${req.status === 'WAITING_DISPATCH' ? '#d97706' : '#2563eb'};">
              Status: ${req.status}
            </div>
          </div>
        `);
    });

    // 5. Draw Routes (Safe Corridor vs Submerged Blocked Route)
    if (activeRouteView === 'DANGEROUS' || activeRouteView === 'BOTH') {
      L.polyline(DANGEROUS_ROUTE_COORDS, {
        color: '#ef4444',
        weight: 5,
        dashArray: '8, 8',
        opacity: 0.8,
      })
        .addTo(layerGroup)
        .bindPopup('<b style="color:#dc2626;">SUBMERGED ROUTE (DANGEROUS): Kangeyanallur Causeway is impassable!</b>');
    }

    if (activeRouteView === 'SAFE' || activeRouteView === 'BOTH') {
      L.polyline(SAFE_ROUTE_COORDS, {
        color: '#10b981',
        weight: 6,
        opacity: 0.95,
      })
        .addTo(layerGroup)
        .bindPopup('<b style="color:#059669;">RECOMMENDED EVACUATION CORRIDOR: Elevated Bypass avoiding Palar River flood zones.</b>');
    }
  }, [shelters, hazards, sosRequests, selectedShelter, activeRouteView, lang, onSelectShelter]);

  return (
    <div className="relative w-full h-[55vh] md:h-[62vh] bg-slate-950 border-b border-slate-800">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Route Toggle Widget */}
      <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-2xl max-w-[280px]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-2">
          <Route size={14} className="text-emerald-400" />
          <span>{lang === 'en' ? 'Evacuation Routing Logic' : 'பாதுகாப்பு வழித்தட தேர்வு'}</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
          <button
            onClick={() => setActiveRouteView('SAFE')}
            className={`px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              activeRouteView === 'SAFE'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck size={13} />
            <span>{lang === 'en' ? 'Safe Route' : 'பாதுகாப்பான வழி'}</span>
          </button>

          <button
            onClick={() => setActiveRouteView('DANGEROUS')}
            className={`px-2 py-1.5 rounded-lg flex items-center justify-center gap-1 transition ${
              activeRouteView === 'DANGEROUS'
                ? 'bg-red-600 text-white font-bold shadow'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <AlertTriangle size={13} />
            <span>{lang === 'en' ? 'Flooded Path' : 'மூழ்கிய வழி'}</span>
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {lang === 'en' ? 'High ground (Dry)' : 'மேட்டுப் பகுதி'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            {lang === 'en' ? 'Submerged (4.8ft)' : 'வெள்ள நீர்'}
          </span>
        </div>
      </div>
    </div>
  );
};
