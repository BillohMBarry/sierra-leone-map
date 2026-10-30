import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  Compass as CompassIcon,
  HeartPulse,
  Map as MapIcon,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Sprout,
  Zap,
} from 'lucide-react';
import { CityData, ProvinceData, RegionId } from '../data/sierraLeoneData';
import {
  DISTRICT_GEOJSON,
  INTERNATIONAL_BORDER_GEOJSON,
  MAJOR_RIVERS_GEOJSON,
  ringToSvgPath,
  ringsToSvgPath,
  unprojectPoint,
  WEST_AFRICA_LAND_RING,
} from '../data/sierraLeoneGeoJson';
import { clampZoom, findNearestCityAtPoint } from '../utils/mapFilters';
import {
  DATA_LAYERS,
  DataLayerId,
  getLayerDefinition,
  resolveChoroplethStyle,
  TelemetryStore,
} from '../utils/telemetryEngine';

interface InteractiveMapProps {
  provinces: ProvinceData[];
  cities: CityData[];
  selectedCity: CityData;
  selectedProvinceId: RegionId | null;
  activeLayer: DataLayerId;
  telemetryStore: TelemetryStore;
  isStreamActive: boolean;
  isDetailOpen: boolean;
  onSelectCity: (cityId: string) => void;
  onSelectProvince: (provinceId: RegionId) => void;
  onSelectLayer: (layerId: DataLayerId) => void;
  onToggleStream: () => void;
  onPulseTelemetry: () => void;
}

const LAYER_ICONS: Record<DataLayerId, React.FC<{ className?: string }>> = {
  political: MapIcon,
  healthcare: HeartPulse,
  telecom: Radio,
  energy: Zap,
  agri_trade: Sprout,
};

const PROVINCE_LABEL_POSITIONS: Record<RegionId, { x: number; y: number; fontSize: number }> = {
  'north-west': { x: 276, y: 304, fontSize: 14 },
  northern: { x: 512, y: 262, fontSize: 14 },
  western: { x: 70, y: 572, fontSize: 12.5 },
  southern: { x: 362, y: 622, fontSize: 14 },
  eastern: { x: 646, y: 572, fontSize: 14 },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  provinces,
  cities,
  selectedCity,
  selectedProvinceId,
  activeLayer,
  telemetryStore,
  isStreamActive,
  isDetailOpen,
  onSelectCity,
  onSelectProvince,
  onSelectLayer,
  onToggleStream,
  onPulseTelemetry,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCityId, setHoveredCityId] = useState<string | null>(null);
  const [hoveredProvinceId, setHoveredProvinceId] = useState<RegionId | null>(null);
  const [cursorGps, setCursorGps] = useState<[number, number] | null>(null);
  const [showDistrictBorders, setShowDistrictBorders] = useState<boolean>(true);
  const [legendHighlight, setLegendHighlight] = useState<
    'country-capital' | 'province-capital' | 'major-cities' | null
  >(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const didMoveRef = useRef<boolean>(false);

  const activeLayerDef = useMemo(() => getLayerDefinition(activeLayer), [activeLayer]);

  const westAfricaLandPath = useMemo(() => ringToSvgPath(WEST_AFRICA_LAND_RING, true), []);
  const internationalBorderPath = useMemo(
    () => ringToSvgPath(INTERNATIONAL_BORDER_GEOJSON, false),
    []
  );
  const districtPaths = useMemo(
    () =>
      Object.entries(DISTRICT_GEOJSON).map(([name, data]) => ({
        name,
        provinceId: data.provinceId,
        d: ringsToSvgPath(data.rings),
      })),
    []
  );
  const riverPaths = useMemo(
    () =>
      MAJOR_RIVERS_GEOJSON.map((river) => ({
        name: river.name,
        d: ringToSvgPath(river.coordinates, false),
      })),
    []
  );

  const handleZoomIn = () => {
    setZoom((z) => clampZoom(z + 0.25));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const next = clampZoom(z - 0.25);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLegendHighlight(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    didMoveRef.current = false;
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (svgRef.current) {
      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        const [lng, lat] = unprojectPoint(transformed.x, transformed.y);
        if (lat >= 6.5 && lat <= 10.4 && lng >= -13.8 && lng <= -10.0) {
          setCursorGps([lng, lat]);
        }
      }
    }

    if (!isDragging) return;
    const dx = e.clientX - dragStart.x - pan.x;
    const dy = e.clientY - dragStart.y - pan.y;
    if (Math.hypot(dx, dy) > 4) {
      didMoveRef.current = true;
    }
    setPan({
      x: Math.max(-340, Math.min(340, e.clientX - dragStart.x)),
      y: Math.max(-340, Math.min(340, e.clientY - dragStart.y)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (didMoveRef.current || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const transformed = pt.matrixTransform(ctm.inverse());
    const nearest = findNearestCityAtPoint(transformed.x, transformed.y, 20);
    if (nearest) {
      onSelectCity(nearest.id);
    }
  };

  const activeGpsDisplay = cursorGps
    ? `${cursorGps[1].toFixed(4)}° N, ${Math.abs(cursorGps[0]).toFixed(4)}° W`
    : `${selectedCity.lat.toFixed(4)}° N, ${Math.abs(selectedCity.lng).toFixed(4)}° W`;

  return (
    <div
      className="relative flex-1 h-full overflow-hidden bg-[#f3f3e8] select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        handlePointerUp();
        setCursorGps(null);
      }}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Floating Data Layer Switcher & Live Telemetry Stream Bar */}
      <div
        role="toolbar"
        aria-label="Data Layer Switcher and Telemetry Stream Controls"
        className={`absolute top-3 left-[76px] z-20 flex items-center gap-1.5 flex-nowrap transition-all duration-200 ${
          isDetailOpen ? 'right-[364px]' : 'right-5'
        }`}
      >
        <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-xs p-1 rounded-2xl shadow-md border border-slate-200/85">
          {DATA_LAYERS.map((layer) => {
            const Icon = LAYER_ICONS[layer.id];
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11.5px] font-semibold whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#0d3b2e] text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry Stream Simulator Controls */}
        <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-xs p-1 rounded-2xl shadow-md border border-slate-200/85 shrink-0">
          <button
            type="button"
            onClick={onToggleStream}
            aria-pressed={isStreamActive}
            aria-label={isStreamActive ? 'Pause live telemetry stream' : 'Start live telemetry stream'}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
              isStreamActive
                ? 'bg-emerald-700 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isStreamActive ? (
              <Pause className="w-3 h-3 shrink-0" />
            ) : (
              <Play className="w-3 h-3 shrink-0" />
            )}
            <span>{isStreamActive ? 'Live' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={onPulseTelemetry}
            aria-label="Simulate telemetry pulse"
            title="Trigger instant telemetry update across all 5 provinces"
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 whitespace-nowrap shrink-0 transition-colors"
          >
            <RefreshCw className="w-3 h-3 shrink-0" />
            <span>Pulse</span>
          </button>
        </div>
      </div>

      {/* Interactive Zoomable & Pannable Projected GeoJSON Map Stage */}
      <div
        className="w-full h-full flex items-center justify-start transition-transform duration-150 ease-out"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="relative h-full aspect-[850/1024] max-w-none shrink-0"
          data-testid="sierra-leone-map-stage"
        >
          <svg
            ref={svgRef}
            viewBox="0 0 850 1024"
            onClick={handleSvgClick}
            className="w-full h-full block overflow-visible"
            aria-label="Interactive Projected GeoJSON Political Map of Sierra Leone"
          >
            <defs>
              <filter id="coastal-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="6"
                  floodColor="#7cc7f7"
                  floodOpacity="0.55"
                />
              </filter>

              <filter id="pill-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="4"
                  floodColor="#0f172a"
                  floodOpacity="0.18"
                />
              </filter>

              <linearGradient id="land-relief" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5f5ec" />
                <stop offset="55%" stopColor="#f1f1e6" />
                <stop offset="100%" stopColor="#eaeadd" />
              </linearGradient>

              <linearGradient id="ocean-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#94d8fe" />
                <stop offset="60%" stopColor="#9eddfe" />
                <stop offset="100%" stopColor="#a9e2fe" />
              </linearGradient>
            </defs>

            {/* 1. Atlantic Ocean Base Canvas */}
            <rect x="-400" y="-200" width="2000" height="1500" fill="url(#ocean-gradient)" />

            {/* 2. West African Landmass (Guinea, Sierra Leone, Liberia Coastline) */}
            <path
              d={westAfricaLandPath}
              fill="url(#land-relief)"
              stroke="#7ebce6"
              strokeWidth="1.5"
              filter="url(#coastal-glow)"
            />

            {/* Subtle Topographic Relief Contours in Guinea & Liberia */}
            <g stroke="#e3e3d6" strokeWidth="1.2" fill="none" opacity="0.75">
              <path d="M180,95 Q290,45 430,68 T680,52" />
              <path d="M220,62 Q350,22 520,44 T760,35" />
              <path d="M680,120 Q745,165 790,260 T835,410" />
              <path d="M720,85 Q785,140 825,240" />
              <path d="M620,845 Q710,805 795,745" />
              <path d="M600,905 Q715,865 820,795" />
              <path d="M640,955 Q745,915 835,855" />
            </g>

            {/* Neighboring Country Labels (GUINEA & LIBERIA) & ATLANTIC OCEAN */}
            <text
              x="445"
              y="76"
              fill="#7a7a72"
              fontSize="17"
              fontWeight="600"
              letterSpacing="0.45em"
              textAnchor="middle"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              GUINEA
            </text>

            <text
              x="675"
              y="888"
              fill="#7a7a72"
              fontSize="17"
              fontWeight="600"
              letterSpacing="0.42em"
              textAnchor="middle"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              LIBERIA
            </text>

            <g
              fill="#1e6b9e"
              fontSize="16"
              fontStyle="italic"
              fontWeight="500"
              letterSpacing="0.34em"
              textAnchor="middle"
              opacity="0.88"
            >
              <text x="152" y="762">
                ATLANTIC
              </text>
              <text x="152" y="786">
                OCEAN
              </text>
            </g>

            {/* 3. Official Projected GADM 4.1 Province MultiPolygons (Dynamic Choropleth or Political) */}
            <g>
              {provinces.map((prov) => {
                const isSelected = selectedProvinceId === prov.id;
                const isHovered = hoveredProvinceId === prov.id;
                const isDimmed = selectedProvinceId && selectedProvinceId !== prov.id;

                const metricData =
                  activeLayer !== 'political' ? telemetryStore[prov.id][activeLayer] : null;
                const choropleth = resolveChoroplethStyle(
                  activeLayer,
                  metricData ? metricData.primaryScore : 0,
                  prov.mapFillColor
                );

                return (
                  <path
                    key={prov.id}
                    d={prov.svgPath}
                    fill={choropleth.fillColor}
                    fillOpacity={isDimmed ? 0.55 : 1}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.8}
                    strokeLinejoin="round"
                    onMouseEnter={() => setHoveredProvinceId(prov.id)}
                    onMouseLeave={() => setHoveredProvinceId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const pt = svgRef.current?.createSVGPoint();
                      if (pt && svgRef.current) {
                        pt.x = e.clientX;
                        pt.y = e.clientY;
                        const ctm = svgRef.current.getScreenCTM();
                        if (ctm) {
                          const t = pt.matrixTransform(ctm.inverse());
                          const nearCity = findNearestCityAtPoint(t.x, t.y, 20);
                          if (nearCity) {
                            onSelectCity(nearCity.id);
                            return;
                          }
                        }
                      }
                      onSelectProvince(prov.id);
                    }}
                    className="cursor-pointer transition-colors duration-200"
                  >
                    <title>
                      {metricData
                        ? `${prov.name} — ${activeLayerDef.primaryMetricLabel}: ${metricData.primaryScore.toFixed(1)}% (${metricData.statusLabel})`
                        : `${prov.name} — Capital: ${prov.capitalName} | Pop: ${prov.population} | Area: ${prov.areaKm2}`}
                    </title>
                  </path>
                );
              })}
            </g>

            {/* 4. Official 16 Districts Boundary Layer */}
            {showDistrictBorders && (
              <g pointerEvents="none">
                {districtPaths.map((dist) => (
                  <path
                    key={dist.name}
                    d={dist.d}
                    fill="none"
                    stroke="rgba(15, 23, 42, 0.14)"
                    strokeWidth="0.9"
                    strokeDasharray="3 2.5"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            )}

            {/* 5. Major Rivers of Sierra Leone (Projected WGS84) */}
            <g pointerEvents="none" fill="none" stroke="#64b5f6" strokeWidth="1.35" opacity="0.75">
              {riverPaths.map((river) => (
                <path key={river.name} d={river.d} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>

            {/* 6. Re-stroke Internal Province Boundaries */}
            <g pointerEvents="none">
              {provinces.map((prov) => (
                <path
                  key={`border-${prov.id}`}
                  d={prov.svgPath}
                  fill="none"
                  stroke={selectedProvinceId === prov.id ? '#0f172a' : '#ffffff'}
                  strokeWidth={selectedProvinceId === prov.id ? 2.4 : 1.7}
                  strokeLinejoin="round"
                />
              ))}
            </g>

            {/* 7. Official International Land Boundary (Red Line: Guinea & Liberia Frontier) */}
            <path
              d={internationalBorderPath}
              fill="none"
              stroke="#ef2323"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />

            {/* 8. Province Cartographic Titles & On-Map KPI Badges */}
            <g pointerEvents="none" fontFamily="Plus Jakarta Sans, sans-serif">
              {provinces.map((prov) => {
                const pos = PROVINCE_LABEL_POSITIONS[prov.id];
                const words =
                  prov.id === 'western'
                    ? ['WESTERN', 'AREA']
                    : prov.id === 'north-west'
                    ? ['NORTH WEST', 'PROVINCE']
                    : [prov.shortName.toUpperCase(), 'PROVINCE'];

                const metricData =
                  activeLayer !== 'political' ? telemetryStore[prov.id][activeLayer] : null;
                const choropleth = resolveChoroplethStyle(
                  activeLayer,
                  metricData ? metricData.primaryScore : 0,
                  prov.mapFillColor
                );

                return (
                  <g key={`label-${prov.id}`}>
                    <text
                      x={pos.x}
                      y={pos.y}
                      fontWeight="800"
                      fontSize={pos.fontSize}
                      fill="#111827"
                      textAnchor="middle"
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'rgba(255, 255, 255, 0.65)',
                        strokeWidth: '3px',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                      }}
                    >
                      <tspan x={pos.x} dy="0">
                        {words[0]}
                      </tspan>
                      <tspan x={pos.x} dy={pos.fontSize + 2.5}>
                        {words[1]}
                      </tspan>
                    </text>

                    {/* On-Map KPI Telemetry Badge when a Data Layer is active */}
                    {metricData && (
                      <g
                        transform={`translate(${pos.x - 58}, ${pos.y + pos.fontSize + 10})`}
                        filter="url(#pill-shadow)"
                      >
                        <rect
                          x="0"
                          y="0"
                          width="116"
                          height="24"
                          rx="7"
                          fill={choropleth.badgeBg}
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                        <text
                          x="58"
                          y="15.5"
                          textAnchor="middle"
                          fill={choropleth.badgeText}
                          fontSize="11"
                          fontWeight="700"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {`${metricData.primaryScore.toFixed(1)}% · ${metricData.statusLabel}`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 9. Real Projected GPS City Markers & Labels */}
            <g>
              {cities.map((city) => {
                const isSelected = city.id === selectedCity.id;
                const isHovered = city.id === hoveredCityId;
                const isCountryCapital = city.status === 'Country Capital';
                const isProvinceCapital =
                  city.status === 'Province Capital' || city.id === 'koidu';
                const isLegendMatched =
                  (legendHighlight === 'country-capital' && isCountryCapital) ||
                  (legendHighlight === 'province-capital' && isProvinceCapital) ||
                  (legendHighlight === 'major-cities' && city.isMajor);

                const dx = city.labelDx ?? 7;
                const dy = city.labelDy ?? 4;
                const anchor = city.labelAnchor ?? 'start';

                return (
                  <g
                    key={city.id}
                    transform={`translate(${city.mapX}, ${city.mapY})`}
                    onMouseEnter={() => setHoveredCityId(city.id)}
                    onMouseLeave={() => setHoveredCityId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCity(city.id);
                    }}
                    className="cursor-pointer"
                  >
                    <title>{`${city.name} (${city.regionName}) — GPS: ${city.lat.toFixed(4)}°N, ${Math.abs(city.lng).toFixed(4)}°W — Pop: ${city.population}`}</title>

                    <circle r={13} fill="transparent" />

                    {isLegendMatched && (
                      <circle
                        r={12}
                        fill="rgba(239, 35, 35, 0.2)"
                        stroke="#ef2323"
                        strokeWidth={2}
                      />
                    )}

                    {isHovered && !isSelected && (
                      <circle
                        r={9}
                        fill="rgba(21, 101, 192, 0.18)"
                        stroke="#1565c0"
                        strokeWidth={1.8}
                      />
                    )}

                    {isCountryCapital ? (
                      <path
                        d="M0 -8.5 L2.4 -2.6 L8.8 -2.1 L3.9 2.1 L5.4 8.3 L0 4.9 L-5.4 8.3 L-3.9 2.1 L-8.8 -2.1 L-2.4 -2.6 Z"
                        fill="#ef2323"
                        stroke="#ffffff"
                        strokeWidth="1.1"
                      />
                    ) : isProvinceCapital ? (
                      <path
                        d="M0 -6.8 L1.9 -2.1 L7.0 -1.7 L3.1 1.7 L4.3 6.6 L0 3.9 L-4.3 6.6 L-3.1 1.7 L-7.0 -1.7 L-1.9 -2.1 Z"
                        fill="#ef2323"
                        stroke="#ffffff"
                        strokeWidth="0.9"
                      />
                    ) : (
                      <circle
                        r={city.status === 'District Capital' ? 3.5 : 2.9}
                        fill="#111827"
                        stroke="#ffffff"
                        strokeWidth="0.7"
                      />
                    )}

                    {!isSelected && (
                      <text
                        x={dx}
                        y={dy}
                        textAnchor={anchor}
                        fill="#111827"
                        fontSize={
                          isCountryCapital || isProvinceCapital
                            ? '12.5'
                            : city.status === 'District Capital'
                            ? '11.5'
                            : '10.8'
                        }
                        fontWeight={isCountryCapital || isProvinceCapital ? '700' : '500'}
                        fontFamily="Plus Jakarta Sans, sans-serif"
                        style={{
                          paintOrder: 'stroke',
                          stroke: 'rgba(255, 255, 255, 0.72)',
                          strokeWidth: '2.4px',
                          strokeLinecap: 'round',
                          strokeLinejoin: 'round',
                        }}
                      >
                        {city.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* 10. Floating Active City Callout Pill at Projected GPS Coordinates */}
            {(() => {
              const activeMetric =
                activeLayer !== 'political'
                  ? telemetryStore[selectedCity.regionId][activeLayer]
                  : null;
              const pillLabel = activeMetric
                ? `${selectedCity.name} · ${activeMetric.primaryScore.toFixed(1)}%`
                : selectedCity.name;
              const pillWidth = Math.max(106, pillLabel.length * 8.6 + 42);
              const pillX = Math.min(Math.max(selectedCity.mapX - 20, 14), 836 - pillWidth);
              const pillY = selectedCity.mapY - 19;
              const isCap =
                selectedCity.status === 'Country Capital' ||
                selectedCity.status === 'Province Capital' ||
                selectedCity.id === 'koidu';

              return (
                <g
                  transform={`translate(${pillX}, ${pillY})`}
                  filter="url(#pill-shadow)"
                  className="pointer-events-none"
                >
                  <rect
                    x="0"
                    y="0"
                    width={pillWidth}
                    height="36"
                    rx="10"
                    fill="#ffffff"
                    fillOpacity="0.97"
                    stroke="#cbd5e1"
                    strokeWidth="1.2"
                  />
                  {isCap ? (
                    <path
                      d="M19 9.5 L21.5 15.4 L27.9 15.9 L23.0 20.1 L24.5 26.3 L19 22.9 L13.5 26.3 L15.0 20.1 L10.1 15.9 L16.5 15.4 Z"
                      fill="#ef2323"
                    />
                  ) : (
                    <circle cx="19" cy="18" r="5" fill="#1565c0" />
                  )}
                  <text
                    x="33"
                    y="23"
                    fill="#0f172a"
                    fontSize="14.5"
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {pillLabel}
                  </text>
                </g>
              );
            })()}

            {/* 11. Top-Left Cartographic Compass Rose (N / W / E / S) */}
            <g transform="translate(44, 58)" pointerEvents="none">
              <text
                x="0"
                y="-24"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="#1e293b"
              >
                N
              </text>
              <text
                x="0"
                y="32"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="#1e293b"
              >
                S
              </text>
              <text
                x="-28"
                y="4"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="#1e293b"
              >
                W
              </text>
              <text
                x="28"
                y="4"
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="#1e293b"
              >
                E
              </text>
              <circle r="10" fill="none" stroke="#334155" strokeWidth="1.2" />
              <polygon points="0,-19 3.2,-3.2 0,0 -3.2,-3.2" fill="#1e293b" />
              <polygon points="0,19 3.2,3.2 0,0 -3.2,3.2" fill="#64748b" />
              <polygon points="-19,0 -3.2,-3.2 0,0 -3.2,3.2" fill="#64748b" />
              <polygon points="19,0 3.2,-3.2 0,0 3.2,3.2" fill="#1e293b" />
              <circle r="2" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
            </g>
          </svg>
        </div>
      </div>

      {/* Live WGS84 GPS Coordinate Readout Pill */}
      <div className="absolute bottom-3.5 left-[234px] bg-white/95 backdrop-blur-xs rounded-full shadow-sm border border-slate-200/80 px-3 py-1.5 flex items-center gap-2 text-[11px] text-slate-600 font-medium z-10 pointer-events-none">
        <CompassIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="font-mono tabular-nums text-slate-800">{activeGpsDisplay}</span>
        <span aria-hidden="true">·</span>
        <span>WGS84 GeoJSON</span>
      </div>

      {/* Bottom-Left Adaptive Legend Card */}
      <div
        aria-label="Map Legend"
        className="absolute left-4 bottom-3.5 bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200/80 px-3.5 py-2.5 w-[218px] z-10"
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[12.5px] font-bold text-slate-900 truncate">
            {activeLayer === 'political' ? 'Legend' : `${activeLayerDef.label} Legend`}
          </h3>
          <button
            type="button"
            onClick={() => setShowDistrictBorders((prev) => !prev)}
            className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            {showDistrictBorders ? 'Hide Districts' : 'Show Districts'}
          </button>
        </div>

        {/* Choropleth Scale when Data Layer is Active */}
        {activeLayer !== 'political' && (
          <div className="mb-2 pb-2 border-b border-slate-100 space-y-1">
            <div className="text-[10.5px] font-semibold text-slate-500">
              {activeLayerDef.primaryMetricLabel}
            </div>
            {activeLayerDef.choroplethTiers.map((tier) => (
              <div
                key={tier.tier}
                className="flex items-center justify-between text-[11px] text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-2.5 rounded-xs border border-slate-300/80 shrink-0"
                    style={{ backgroundColor: tier.fillColor }}
                  />
                  <span className="font-semibold text-slate-800">{tier.tier}</span>
                </span>
                <span className="font-mono tabular-nums text-[10.5px] text-slate-500">
                  {tier.rangeLabel}
                </span>
              </div>
            ))}
          </div>
        )}

        <ul className="space-y-1 text-[11.5px] text-slate-700 font-medium">
          <li className="flex items-center gap-3">
            <span className="w-6 flex items-center justify-center shrink-0">
              <span className="w-6 h-[2px] bg-[#ef2323] rounded-full" />
            </span>
            <span className="whitespace-nowrap">International Boundary</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="w-6 flex items-center justify-center shrink-0">
              <span className="w-6 h-[1.5px] bg-slate-300 rounded-full" />
            </span>
            <span className="whitespace-nowrap">Province Boundary</span>
          </li>
          <li>
            <button
              type="button"
              onClick={() =>
                setLegendHighlight((prev) =>
                  prev === 'country-capital' ? null : 'country-capital'
                )
              }
              className={`w-full flex items-center gap-3 text-left rounded-md py-0.5 transition-colors ${
                legendHighlight === 'country-capital'
                  ? 'text-red-600 font-semibold'
                  : 'hover:text-slate-950'
              }`}
            >
              <span className="w-6 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#ef2323] fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
                </svg>
              </span>
              <span className="whitespace-nowrap">Country Capital</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() =>
                setLegendHighlight((prev) =>
                  prev === 'province-capital' ? null : 'province-capital'
                )
              }
              className={`w-full flex items-center gap-3 text-left rounded-md py-0.5 transition-colors ${
                legendHighlight === 'province-capital'
                  ? 'text-red-600 font-semibold'
                  : 'hover:text-slate-950'
              }`}
            >
              <span className="w-6 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-[#ef2323] fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
                </svg>
              </span>
              <span className="whitespace-nowrap">Province Capital</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() =>
                setLegendHighlight((prev) => (prev === 'major-cities' ? null : 'major-cities'))
              }
              className={`w-full flex items-center gap-3 text-left rounded-md py-0.5 transition-colors ${
                legendHighlight === 'major-cities'
                  ? 'text-blue-700 font-semibold'
                  : 'hover:text-slate-950'
              }`}
            >
              <span className="w-6 flex items-center justify-center shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              </span>
              <span className="whitespace-nowrap">Major Cities</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Bottom-Right Floating Zoom & Recenter Controls */}
      <div
        className={`absolute bottom-5 flex flex-col bg-white/95 backdrop-blur-xs rounded-xl shadow-md border border-slate-200/80 divide-y divide-slate-200/70 overflow-hidden z-10 transition-all duration-200 ${
          isDetailOpen ? 'right-[376px]' : 'right-6'
        }`}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          aria-label="Reset map view"
          className="w-9 h-9 flex items-center justify-center text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <span className="w-3.5 h-3.5 rounded-full bg-slate-900 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-white" />
          </span>
        </button>
      </div>
    </div>
  );
};
