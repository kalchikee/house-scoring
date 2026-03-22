import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import useAppStore from '../store/useAppStore';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom home icon (indigo)
const homeIcon = L.divIcon({
  html: `
    <div style="
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(99,102,241,0.5);
    ">
      <div style="
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        font-size: 16px; line-height: 1;
      ">🏠</div>
    </div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

// Trader Joe's icon (red)
const tjIcon = L.divIcon({
  html: `
    <div style="
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(239,68,68,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    ">🛒</div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -34],
});

// Component that flies the map to the new location
function FlyTo({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 14, { duration: 1.5 });
    }
  }, [lat, lon, map]);
  return null;
}

export default function MapView({ fullscreen }) {
  const { location, traderJoes, scores } = useAppStore();

  const defaultCenter = [39.8283, -98.5795]; // Center of USA
  const defaultZoom = 4;

  return (
    <div className={`relative w-full h-full ${fullscreen ? '' : 'rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl'}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      >
        {/* Dark map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />

        {/* Fly to searched location */}
        {location && <FlyTo lat={location.lat} lon={location.lon} />}

        {/* Home pin */}
        {location && (
          <Marker position={[location.lat, location.lon]} icon={homeIcon}>
            <Popup className="dark-popup">
              <div className="text-slate-900 p-1">
                <div className="font-bold text-sm mb-1">Searched Location</div>
                <div className="text-xs text-slate-600 mb-2 max-w-[200px]">{location.display_name}</div>
                {scores && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-700">Score:</span>
                    <span className="text-sm font-bold text-indigo-600">{scores.composite}/100</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Trader Joe's pin */}
        {traderJoes?.found && traderJoes.lat && traderJoes.lon && (
          <Marker position={[traderJoes.lat, traderJoes.lon]} icon={tjIcon}>
            <Popup>
              <div className="text-slate-900 p-1">
                <div className="font-bold text-sm mb-1">{traderJoes.name || "Trader Joe's"}</div>
                <div className="text-xs text-slate-600 mb-1">{traderJoes.address}</div>
                <div className="text-xs text-slate-500">
                  {traderJoes.distance?.toFixed(1)} miles away
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map overlay — no location yet */}
      {!location && (
        <div className="absolute inset-0 z-[999] flex items-end justify-center pb-16 pointer-events-none">
          <div className="
            bg-slate-900/80 backdrop-blur-md border border-slate-700/30
            rounded-2xl px-6 py-4 text-center shadow-xl
          ">
            <div className="text-3xl mb-2">🗺️</div>
            <div className="text-slate-300 font-medium text-sm">Search an address above to begin</div>
            <div className="text-slate-500 text-xs mt-1">Crime · Walkability · Property · Trader Joe's</div>
          </div>
        </div>
      )}
    </div>
  );
}
