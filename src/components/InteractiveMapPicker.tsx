import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  Check,
  RotateCcw,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Language } from '../i18n';

// Default Baheri / Chanman coordinates (Darbhanga, Bihar 847101)
export const DEFAULT_BAHERI_COORDS = {
  lat: 25.9928,
  lng: 86.1032,
  address: 'Chanman, Baheri, Darbhanga, Bihar 847101'
};

interface InteractiveMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    readableAddress?: string;
    accuracy: 'gps' | 'map_pin' | 'address';
  }) => void;
  lang?: Language;
  className?: string;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  initialLat,
  initialLng,
  onLocationSelect,
  lang = 'en',
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat || DEFAULT_BAHERI_COORDS.lat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng || DEFAULT_BAHERI_COORDS.lng);
  const [readableLocationText, setReadableLocationText] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [activeAccuracy, setActiveAccuracy] = useState<'gps' | 'map_pin' | 'address'>(
    initialLat ? 'map_pin' : 'address'
  );

  // Reverse geocoding helper with fallback to Baheri local zones
  const resolveReadableAddress = useCallback(async (lat: number, lng: number) => {
    // Check local proximity to known Baheri villages & areas
    let fallbackArea = 'Baheri Area, Darbhanga (847101)';
    const distToChanman = Math.hypot(lat - 25.9928, lng - 86.1032);
    if (distToChanman < 0.015) {
      fallbackArea = 'Chanman, Near Baheri Bazar, Darbhanga 847101';
    } else if (lat > 25.99) {
      fallbackArea = 'Paghari / Baheri North Road, Darbhanga';
    } else {
      fallbackArea = 'Athar / Benipur Link Road, Baheri';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
        {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en,hi' }
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          // Format compact readable address
          const addr = data.address || {};
          const parts = [
            addr.road || addr.suburb || addr.neighbourhood,
            addr.village || addr.town || addr.city || 'Baheri',
            addr.county || 'Darbhanga',
            addr.state || 'Bihar',
            addr.postcode || '847101'
          ].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 4).join(',');
          setReadableLocationText(formatted);
          return formatted;
        }
      }
    } catch {
      // Fallback if offline or rate limited
    }

    setReadableLocationText(fallbackArea);
    return fallbackArea;
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const startLat = initialLat || DEFAULT_BAHERI_COORDS.lat;
    const startLng = initialLng || DEFAULT_BAHERI_COORDS.lng;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    // High quality ₹0-cost OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Custom Draggable Pin Icon
    const customPinIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="
            background: linear-gradient(135deg, #024D9C 0%, #0088cc 100%);
            color: white;
            padding: 8px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(2, 77, 156, 0.45);
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 9px solid #024D9C;
            margin-top: -2px;
          "></div>
          <div style="
            width: 14px;
            height: 4px;
            background: rgba(0,0,0,0.3);
            border-radius: 50%;
            filter: blur(1px);
            margin-top: 1px;
          "></div>
        </div>
      `,
      iconSize: [38, 48],
      iconAnchor: [19, 46],
      popupAnchor: [0, -42]
    });

    // Create Draggable Marker
    const marker = L.marker([startLat, startLng], {
      icon: customPinIcon,
      draggable: true,
      autoPan: true
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; font-size: 12px; text-align: center; padding: 2px;">
        <strong style="color: #024D9C;">📍 Selected Delivery Location</strong>
        <p style="margin: 4px 0 0; color: #555;">Drag pin or tap anywhere on map to adjust exact point.</p>
      </div>
    `);

    // Handle marker dragend
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      const newLat = Number(position.lat.toFixed(6));
      const newLng = Number(position.lng.toFixed(6));
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      setActiveAccuracy('map_pin');
      setGeoError('');

      const addr = await resolveReadableAddress(newLat, newLng);
      onLocationSelect({
        lat: newLat,
        lng: newLng,
        readableAddress: addr,
        accuracy: 'map_pin'
      });
    });

    // Handle map click to re-position pin
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const newLat = Number(e.latlng.lat.toFixed(6));
      const newLng = Number(e.latlng.lng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      setActiveAccuracy('map_pin');
      setGeoError('');

      const addr = await resolveReadableAddress(newLat, newLng);
      onLocationSelect({
        lat: newLat,
        lng: newLng,
        readableAddress: addr,
        accuracy: 'map_pin'
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    setIsMapReady(true);

    // Initial address resolution
    resolveReadableAddress(startLat, startLng);

    // Invalidate size after layout renders
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [initialLat, initialLng, onLocationSelect, resolveReadableAddress]);

  // Handle "Use My Current Location" with permission verification
  const handleUseCurrentLocation = () => {
    setGeoError('');

    if (!('geolocation' in navigator)) {
      setGeoError(
        lang === 'hi'
          ? 'आपके ब्राउज़र में जीपीएस लोकेशन उपलब्ध नहीं है।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setCurrentLat(lat);
        setCurrentLng(lng);
        setActiveAccuracy('gps');
        setIsLocating(false);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
          markerRef.current.openPopup();
        }

        const addr = await resolveReadableAddress(lat, lng);
        onLocationSelect({
          lat,
          lng,
          readableAddress: addr,
          accuracy: 'gps'
        });
      },
      error => {
        setIsLocating(false);
        let msg = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg =
              lang === 'hi'
                ? 'लोकेशन अनुमति अस्वीकृत की गई। आप नीचे दिए गए मैप पर पिन को ड्रैग करके अपना स्थान चुन सकते हैं।'
                : 'GPS permission denied. You can still drag the pin or tap the map to set your delivery location.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg =
              lang === 'hi'
                ? 'जीपीएस सिग्नल उपलब्ध नहीं है। कृपया मैप पर पिन को सही स्थान पर रखें।'
                : 'GPS position unavailable. Please drag the pin on the map to set your location.';
            break;
          case error.TIMEOUT:
            msg =
              lang === 'hi'
                ? 'लोकेशन खोजने में समय समाप्त हुआ। कृपया पुनः प्रयास करें या पिन ड्रैग करें।'
                : 'Location request timed out. Please try again or place pin manually.';
            break;
          default:
            msg =
              lang === 'hi'
                ? 'लोकेशन प्राप्त करने में त्रुटि। कृपया मैप पर पिन रखें।'
                : 'Could not access GPS location. Please drag the pin to your address.';
        }
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // Reset to shop / Chanman center
  const handleResetToShop = async () => {
    const lat = DEFAULT_BAHERI_COORDS.lat;
    const lng = DEFAULT_BAHERI_COORDS.lng;
    setCurrentLat(lat);
    setCurrentLng(lng);
    setActiveAccuracy('address');
    setGeoError('');

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    const addr = await resolveReadableAddress(lat, lng);
    onLocationSelect({
      lat,
      lng,
      readableAddress: addr,
      accuracy: 'address'
    });
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Map Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            <Compass size={16} />
          </span>
          <div>
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">
              {lang === 'hi' ? 'इंटरएक्टिव डिलीवरी मैप (पिन ड्रैग करें)' : 'Interactive Delivery Map'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'hi'
                ? 'सटीक डिलीवरी के लिए पिन को अपने घर या दुकान पर ले जाएं'
                : 'Drag pin or tap map to mark exact delivery point'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-70"
          >
            <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
            <span>
              {isLocating
                ? lang === 'hi' ? 'जीपीएस खोज रहे हैं...' : 'Detecting GPS...'
                : lang === 'hi' ? 'मेरा वर्तमान स्थान चुनें' : 'Use My Current Location'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetToShop}
            title="Reset to Chanman, Baheri"
            className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">{lang === 'hi' ? 'बहेड़ी केंद्र' : 'Baheri'}</span>
          </button>
        </div>
      </div>

      {/* Permission / Geolocation Warning */}
      {geoError && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">{lang === 'hi' ? 'लोकेशन सूचना:' : 'Location Notice:'}</span>
            <p className="leading-relaxed">{geoError}</p>
          </div>
        </div>
      )}

      {/* Leaflet Map Frame with Draggable Marker */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 shadow-sm bg-slate-100 dark:bg-slate-800">
        <div
          ref={mapContainerRef}
          style={{ height: '260px', width: '100%', zIndex: 10 }}
          className="focus:outline-none"
        />

        {/* Live Coordinate Badge overlay */}
        <div className="absolute bottom-2.5 left-2.5 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <MapPin size={12} className="text-blue-600 dark:text-blue-400" />
          <span>{currentLat.toFixed(5)}°N, {currentLng.toFixed(5)}°E</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
            {activeAccuracy}
          </span>
        </div>

        {/* External Google Maps Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2.5 right-2.5 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md text-xs font-bold text-blue-700 dark:text-blue-300 hover:text-blue-900 flex items-center gap-1 transition-colors"
        >
          <span>{lang === 'hi' ? 'Google मैप्स में देखें' : 'Open Google Maps'}</span>
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Selected Location Confirmation Bar */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {lang === 'hi' ? 'चुना गया डिलीवरी स्थान:' : 'Confirmed Location for Delivery:'}
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 truncate font-medium">
            {readableLocationText || `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} (Baheri, Darbhanga)`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-900 self-start sm:self-auto flex-shrink-0">
          <Check size={14} className="stroke-[3]" />
          <span>{lang === 'hi' ? 'पिन स्थिति सुरक्षित' : 'Pin Position Captured'}</span>
        </div>
      </div>
    </div>
  );
};
