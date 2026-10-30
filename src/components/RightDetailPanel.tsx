import React, { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  HeartPulse,
  Info,
  Map,
  MapPin,
  MessageSquareShare,
  Radio,
  Send,
  Sprout,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { CityData, ProvinceData, RegionId } from '../data/sierraLeoneData';
import {
  buildWhatsAppFieldReportMessage,
  DATA_LAYERS,
  DataLayerId,
  FieldReportEntry,
  formatMetricsToCsv,
  formatMetricsToJson,
  MetricLayerId,
  resolveChoroplethStyle,
  TelemetryStore,
} from '../utils/telemetryEngine';

interface RightDetailPanelProps {
  city: CityData;
  province: ProvinceData;
  siblingCities: CityData[];
  isFavorite: boolean;
  activeLayer: DataLayerId;
  telemetryStore: TelemetryStore;
  fieldReports: FieldReportEntry[];
  onSelectLayer: (layerId: DataLayerId) => void;
  onAddFieldReport: (report: Omit<FieldReportEntry, 'id' | 'timestamp'>) => void;
  onToggleFavorite: (cityId: string) => void;
  onSelectCity: (cityId: string) => void;
  onExploreRegion: (regionId: RegionId) => void;
  onClose: () => void;
}

type DetailTab = 'overview' | 'metrics' | 'facts' | 'places' | 'more';

const SECTOR_ICONS: Record<MetricLayerId, React.FC<{ className?: string }>> = {
  healthcare: HeartPulse,
  telecom: Radio,
  energy: Zap,
  agri_trade: Sprout,
};

const CityLandscapeIllustration: React.FC<{ city: CityData }> = ({ city }) => {
  if (city.photoUrl) {
    return (
      <img
        src={city.photoUrl}
        alt={`${city.name} scenic view in ${city.regionName}`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover block"
      />
    );
  }

  const palettes: Record<
    CityData['landscapeTheme'],
    { skyTop: string; skyBottom: string; farHill: string; midHill: string; water: string }
  > = {
    coastal: {
      skyTop: '#3b82f6',
      skyBottom: '#bae6fd',
      farHill: '#335c67',
      midHill: '#1e3a5f',
      water: '#1d4ed8',
    },
    highlands: {
      skyTop: '#2563eb',
      skyBottom: '#dbeafe',
      farHill: '#475569',
      midHill: '#1e293b',
      water: '#0284c7',
    },
    savanna: {
      skyTop: '#0284c7',
      skyBottom: '#fef3c7',
      farHill: '#65a30d',
      midHill: '#3f6212',
      water: '#0369a1',
    },
    rainforest: {
      skyTop: '#0ea5e9',
      skyBottom: '#d1fae5',
      farHill: '#047857',
      midHill: '#064e3b',
      water: '#0f766e',
    },
    riverine: {
      skyTop: '#38bdf8',
      skyBottom: '#e0f2fe',
      farHill: '#15803d',
      midHill: '#14532d',
      water: '#0284c7',
    },
  };

  const p = palettes[city.landscapeTheme];

  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg
        viewBox="0 0 320 180"
        className="w-full h-full object-cover block"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Scenic landscape of ${city.name}, ${city.regionName}`}
      >
        <defs>
          <linearGradient id={`sky-${city.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.skyTop} />
            <stop offset="100%" stopColor={p.skyBottom} />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#sky-${city.id})`} />
        <ellipse cx="75" cy="36" rx="38" ry="9" fill="#ffffff" fillOpacity="0.45" />
        <ellipse cx="230" cy="28" rx="46" ry="11" fill="#ffffff" fillOpacity="0.35" />
        <path
          d="M0 115 L48 76 L105 98 L168 62 L235 92 L285 70 L320 88 L320 180 L0 180 Z"
          fill={p.farHill}
          fillOpacity="0.78"
        />
        <path
          d="M0 128 L65 96 L135 118 L205 88 L272 112 L320 98 L320 180 L0 180 Z"
          fill={p.midHill}
        />
        <path d="M0 136 Q160 128 320 138 L320 180 L0 180 Z" fill={p.water} />
        <g fill="#f8fafc" fillOpacity="0.9">
          <rect x="44" y="121" width="14" height="11" rx="1" />
          <rect x="62" y="118" width="18" height="14" rx="1" />
          <rect x="84" y="123" width="12" height="9" rx="1" />
          <rect x="195" y="119" width="16" height="13" rx="1" />
          <rect x="215" y="122" width="14" height="10" rx="1" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent px-3.5 py-2.5 flex items-end justify-between">
        <span className="text-[11px] font-semibold text-white/95 tracking-wide">
          {city.keyFacts.district} · {city.keyFacts.elevation.split('—')[0].trim()}
        </span>
      </div>
    </div>
  );
};

export const RightDetailPanel: React.FC<RightDetailPanelProps> = ({
  city,
  province,
  siblingCities,
  isFavorite,
  activeLayer,
  telemetryStore,
  fieldReports,
  onSelectLayer,
  onAddFieldReport,
  onToggleFavorite,
  onSelectCity,
  onExploreRegion,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>(
    activeLayer !== 'political' ? 'metrics' : 'overview'
  );
  const [inspectedMetricLayer, setInspectedMetricLayer] = useState<MetricLayerId>(
    activeLayer !== 'political' ? activeLayer : 'healthcare'
  );
  const [exportFeedback, setExportFeedback] = useState<'csv' | 'json' | null>(null);

  // WhatsApp Field Reporting state
  const [reportStatus, setReportStatus] = useState<'Nominal' | 'Maintenance' | 'Priority Alert'>(
    'Nominal'
  );
  const [reporterName, setReporterName] = useState<string>('SL District Coordinator');
  const [reportNote, setReportNote] = useState<string>(
    'Verified regional telemetry feed and district infrastructure readiness.'
  );
  const [reportError, setReportError] = useState<string | null>(null);
  const [lastLoggedWhatsAppUrl, setLastLoggedWhatsAppUrl] = useState<string | null>(null);
  const [lastLoggedMessageText, setLastLoggedMessageText] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  // Sync tab and inspected sector when user switches map layer from the top bar
  useEffect(() => {
    if (activeLayer !== 'political') {
      setInspectedMetricLayer(activeLayer);
      setActiveTab('metrics');
    }
  }, [activeLayer]);

  const currentSnapshot = telemetryStore[province.id][inspectedMetricLayer];
  const currentStyle = resolveChoroplethStyle(
    inspectedMetricLayer,
    currentSnapshot.primaryScore,
    province.fillColor
  );
  const currentLayerDef =
    DATA_LAYERS.find((l) => l.id === inspectedMetricLayer) ?? DATA_LAYERS[1];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${city.name}, Sierra Leone`
  )}`;

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csv = formatMetricsToCsv(city, province, inspectedMetricLayer, telemetryStore);
    const filename = `sierra-leone-${province.id}-${inspectedMetricLayer}.csv`;
    triggerDownload(csv, filename, 'text/csv;charset=utf-8;');
    setExportFeedback('csv');
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleExportJson = () => {
    const json = formatMetricsToJson(
      city,
      province,
      inspectedMetricLayer,
      telemetryStore,
      fieldReports
    );
    const filename = `sierra-leone-${province.id}-${inspectedMetricLayer}.json`;
    triggerDownload(json, filename, 'application/json;charset=utf-8;');
    setExportFeedback('json');
    setTimeout(() => setExportFeedback(null), 2500);
  };

  const handleFieldReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNote = reportNote.trim();
    if (!trimmedNote) {
      setReportError('Please enter a brief field observation before logging.');
      return;
    }
    setReportError(null);

    const cleanReporter = reporterName.trim() || 'SL Field Officer';
    onAddFieldReport({
      cityId: city.id,
      cityName: city.name,
      regionId: province.id,
      regionName: province.name,
      layerId: inspectedMetricLayer,
      statusLevel: reportStatus,
      note: trimmedNote,
      reporter: cleanReporter,
      gps: `${city.lat.toFixed(4)}° N, ${Math.abs(city.lng).toFixed(4)}° W`,
    });

    const messageText = buildWhatsAppFieldReportMessage(
      city,
      inspectedMetricLayer,
      currentSnapshot,
      reportStatus,
      trimmedNote,
      cleanReporter
    );

    const waUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;
    setLastLoggedMessageText(messageText);
    setLastLoggedWhatsAppUrl(waUrl);
  };

  const handleCopyReportText = () => {
    if (!lastLoggedMessageText) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastLoggedMessageText).catch(() => {});
    }
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const regionReports = fieldReports.filter((r) => r.regionId === province.id);

  return (
    <aside
      aria-label={`${city.name} Details`}
      className="absolute right-4 top-5 bottom-5 w-[346px] bg-white rounded-[24px] shadow-xl border border-slate-200/80 flex flex-col z-20 overflow-hidden select-none"
    >
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-5 custom-scrollbar">
        {/* Top Row: Close button */}
        <div className="flex items-start justify-between px-1">
          <div className="pt-0.5">
            <h2 className="text-[23px] font-bold tracking-tight text-slate-900 leading-tight">
              {city.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details panel"
            className="p-1 -mr-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Subtitle & Star Row */}
        <div className="flex items-center justify-between mt-0.5 px-1">
          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-500 font-medium">
            <span>{city.regionName}</span>
            <span aria-hidden="true">·</span>
            <span>{city.status}</span>
          </div>
          <button
            type="button"
            onClick={() => onToggleFavorite(city.id)}
            aria-label={isFavorite ? `Remove ${city.name} from favorites` : `Save ${city.name}`}
            aria-pressed={isFavorite}
            className="p-1 -mr-1 rounded-full hover:bg-amber-50 transition-colors"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                isFavorite
                  ? 'text-[#f59e0b] fill-[#f59e0b]'
                  : 'text-slate-300 hover:text-[#f59e0b]'
              }`}
            />
          </button>
        </div>

        {/* Hero Photo / Scenic Vista */}
        <div className="mt-2.5 w-full h-[142px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-2xs">
          <CityLandscapeIllustration city={city} />
        </div>

        {/* 5 Interactive Tabs: Overview | Live Metrics | Key Facts | Places | More */}
        <div
          role="tablist"
          aria-label="City information tabs"
          className="mt-3 flex items-center justify-between gap-0.5 bg-slate-100/95 p-1 rounded-xl"
        >
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'metrics', label: 'Live Metrics' },
              { id: 'facts', label: 'Key Facts' },
              { id: 'places', label: 'Places' },
              { id: 'more', label: 'More' },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] whitespace-nowrap shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#0d3b2e] text-white font-semibold shadow-2xs'
                    : 'text-slate-700 font-medium hover:text-slate-950'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="mt-3 space-y-2.5 px-1">
            {/* Quick Live Telemetry Teaser Banner */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {province.name} · {currentLayerDef.shortLabel}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">
                  {currentSnapshot.headlineStat}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                className="px-2.5 py-1 rounded-lg bg-[#0d3b2e] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 hover:bg-[#145340] transition-colors tabular-nums"
              >
                {currentSnapshot.primaryScore.toFixed(1)}% · View
              </button>
            </div>

            {/* Region */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 flex justify-center shrink-0 text-slate-700">
                <MapPin className="w-4 h-4 fill-slate-700 text-white stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 leading-snug">Region</div>
                <div className="text-[12px] text-slate-600 leading-snug">{city.regionName}</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 flex justify-center shrink-0 text-slate-700">
                <Building2 className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 leading-snug">Status</div>
                <div className="text-[12px] text-slate-600 leading-snug">{city.status}</div>
              </div>
            </div>

            {/* Population (Est.) */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 flex justify-center shrink-0 text-slate-700">
                <Users className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 leading-snug">
                  Population (Est.)
                </div>
                <div className="text-[12px] text-slate-600 leading-snug tabular-nums">
                  {city.population}
                </div>
              </div>
            </div>

            {/* Known for */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 flex justify-center shrink-0 text-slate-700">
                <Map className="w-4 h-4 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 leading-snug">Known for</div>
                <div className="text-[12px] text-slate-600 leading-snug">{city.knownFor}</div>
              </div>
            </div>

            {/* About */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-5 flex justify-center shrink-0 text-slate-700">
                <Info className="w-4 h-4 fill-slate-700 text-white stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 leading-snug">About</div>
                <p className="text-[12px] text-slate-600 leading-[1.4] mt-0.5">{city.about}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE METRICS & TELEMETRY */}
        {activeTab === 'metrics' && (
          <div className="mt-3 space-y-3">
            {/* Sector Switcher Pills */}
            <div
              role="group"
              aria-label="Select telemetry sector"
              className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl"
            >
              {(['healthcare', 'telecom', 'energy', 'agri_trade'] as MetricLayerId[]).map(
                (sectorId) => {
                  const Icon = SECTOR_ICONS[sectorId];
                  const isSelected = inspectedMetricLayer === sectorId;
                  const labelMap: Record<MetricLayerId, string> = {
                    healthcare: 'Health',
                    telecom: 'Telecom',
                    energy: 'Energy',
                    agri_trade: 'Agri',
                  };
                  return (
                    <button
                      key={sectorId}
                      type="button"
                      onClick={() => {
                        setInspectedMetricLayer(sectorId);
                        onSelectLayer(sectorId);
                      }}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span>{labelMap[sectorId]}</span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Primary Regional KPI Summary Card */}
            <div className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/70">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                    {province.name} · {currentLayerDef.label}
                  </div>
                  <div className="text-[12px] font-semibold text-slate-800 mt-0.5">
                    {currentLayerDef.primaryMetricLabel}
                  </div>
                </div>
                <span
                  className="px-2 py-0.5 rounded-md text-[10.5px] font-bold whitespace-nowrap shrink-0 border"
                  style={{
                    backgroundColor: currentStyle.badgeBg,
                    color: currentStyle.badgeText,
                    borderColor: currentStyle.fillColor,
                  }}
                >
                  {currentSnapshot.statusLabel}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-extrabold text-slate-900 tracking-tight tabular-nums leading-none">
                    {currentSnapshot.primaryScore.toFixed(1)}%
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11.5px] font-bold tabular-nums ${
                      currentSnapshot.delta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {currentSnapshot.delta >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {currentSnapshot.delta >= 0 ? '+' : ''}
                    {currentSnapshot.delta.toFixed(1)}%
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-500 font-medium tabular-nums">
                  GPS {city.lat.toFixed(2)}°N, {Math.abs(city.lng).toFixed(2)}°W
                </span>
              </div>

              <div className="mt-1.5 text-[11.5px] text-slate-600 font-medium">
                {currentSnapshot.headlineStat}
              </div>
            </div>

            {/* 4 Sub-Metric Bars */}
            <div className="space-y-2">
              {currentSnapshot.subMetrics.map((sub) => {
                const progressPct =
                  sub.unit === '%'
                    ? Math.min(100, Math.max(8, sub.value))
                    : Math.min(100, Math.max(12, (sub.value / (sub.target || 100)) * 85));

                return (
                  <div
                    key={sub.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11.5px]">
                      <span className="font-semibold text-slate-800 truncate">{sub.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                        <span className="font-bold text-slate-900">
                          {sub.value} {sub.unit}
                        </span>
                        <span
                          className={`text-[10.5px] font-semibold ${
                            sub.delta >= 0 ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          ({sub.delta >= 0 ? '+' : ''}
                          {sub.delta}
                          {sub.unit === '%' ? '%' : ''})
                        </span>
                      </div>
                    </div>

                    <div className="mt-1.5 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: currentStyle.fillColor,
                        }}
                      />
                    </div>

                    {sub.target !== undefined && (
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 tabular-nums">
                        <span>Regional Hub: {city.name}</span>
                        <span>
                          Target: {sub.target} {sub.unit}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CSV & JSON Data Export Controls */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Regional Telemetry Export
                </span>
                {exportFeedback && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Check className="w-3 h-3" />
                    {exportFeedback.toUpperCase()} Downloaded
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-100 text-[11.5px] font-semibold text-slate-800 whitespace-nowrap transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Export CSV</span>
                  <Download className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-100 text-[11.5px] font-semibold text-slate-800 whitespace-nowrap transition-colors shadow-2xs"
                >
                  <FileJson className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>Export JSON</span>
                  <Download className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* WhatsApp Field Reporting Module */}
            <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquareShare className="w-4 h-4 text-emerald-800 shrink-0" />
                  <h4 className="text-[12px] font-bold text-slate-900">
                    WhatsApp Field Reporting
                  </h4>
                </div>
                <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  {city.name} Dispatch
                </span>
              </div>

              <form onSubmit={handleFieldReportSubmit} className="mt-2.5 space-y-2">
                {/* Status Level Selector */}
                <div className="grid grid-cols-3 gap-1">
                  {(['Nominal', 'Maintenance', 'Priority Alert'] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setReportStatus(level)}
                      className={`py-1 px-1.5 rounded-lg text-[10.5px] font-semibold whitespace-nowrap border transition-colors ${
                        reportStatus === level
                          ? 'bg-[#0d3b2e] text-white border-[#0d3b2e]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                {/* Reporter Name */}
                <div>
                  <label
                    htmlFor="field-reporter-input"
                    className="block text-[10.5px] font-semibold text-slate-700 mb-0.5"
                  >
                    Reporting Officer / Unit
                  </label>
                  <input
                    id="field-reporter-input"
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="e.g., Bo District Health Officer"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/90 text-[11.5px] text-slate-900 focus:outline-none focus:border-emerald-700"
                  />
                </div>

                {/* Observation Note */}
                <div>
                  <label
                    htmlFor="field-note-input"
                    className="block text-[10.5px] font-semibold text-slate-700 mb-0.5"
                  >
                    Field Observation Note
                  </label>
                  <textarea
                    id="field-note-input"
                    rows={2}
                    value={reportNote}
                    onChange={(e) => {
                      setReportNote(e.target.value);
                      if (reportError) setReportError(null);
                    }}
                    placeholder="Enter district status update or infrastructure reading..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/90 text-[11.5px] text-slate-900 focus:outline-none focus:border-emerald-700 resize-none"
                  />
                  {reportError && (
                    <p className="text-[10.5px] text-red-600 font-medium mt-0.5">{reportError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0d3b2e] hover:bg-[#145340] text-white text-[11.5px] font-semibold whitespace-nowrap transition-colors shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>Log & Prepare WhatsApp Dispatch</span>
                </button>
              </form>

              {/* Prepared WhatsApp Dispatch Action Bar */}
              {lastLoggedWhatsAppUrl && (
                <div className="mt-2.5 p-2 rounded-xl bg-white border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-emerald-800">
                    <span>Field Report Logged ({city.name})</span>
                    <button
                      type="button"
                      onClick={handleCopyReportText}
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                    >
                      {copiedReport ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <a
                    href={lastLoggedWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold whitespace-nowrap transition-colors"
                  >
                    <span>Send via WhatsApp Web / App</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}

              {/* Recent Logged Field Reports */}
              {regionReports.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-emerald-200/70 space-y-1.5">
                  <div className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider">
                    Recent Regional Dispatches ({regionReports.length})
                  </div>
                  {regionReports.slice(0, 2).map((rep) => (
                    <div
                      key={rep.id}
                      className="p-2 rounded-lg bg-white/90 border border-slate-200/70 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-1 font-semibold text-slate-800">
                        <span className="truncate">
                          {rep.cityName} · {rep.statusLevel}
                        </span>
                        <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                          {rep.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{rep.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KEY FACTS */}
        {activeTab === 'facts' && (
          <div className="mt-4 space-y-2.5 px-1">
            {[
              { label: 'District', value: city.keyFacts.district },
              { label: 'Elevation', value: city.keyFacts.elevation },
              { label: 'Established', value: city.keyFacts.established },
              { label: 'Climate', value: city.keyFacts.climate },
              { label: 'Metropolitan Area', value: city.keyFacts.area },
              { label: 'Primary Languages', value: city.keyFacts.languages },
              {
                label: 'Coordinates',
                value: `${city.lat.toFixed(4)}° N, ${Math.abs(city.lng).toFixed(4)}° W`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0 text-[12.5px]"
              >
                <span className="font-semibold text-slate-700 shrink-0">{item.label}</span>
                <span className="text-slate-600 text-right tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PLACES */}
        {activeTab === 'places' && (
          <div className="mt-4 space-y-3 px-1">
            {city.places.map((place) => (
              <div
                key={place.name}
                className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[12.5px] font-bold text-slate-900">{place.name}</h4>
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  {place.category}
                </div>
                <p className="text-[12px] text-slate-600 leading-snug mt-1">{place.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: MORE */}
        {activeTab === 'more' && (
          <div className="mt-4 space-y-3 text-[12.5px] px-1">
            <div>
              <h4 className="font-bold text-slate-800">Economy & Trade</h4>
              <p className="text-slate-600 leading-snug mt-0.5">{city.moreInfo.economy}</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Transport & Connectivity</h4>
              <p className="text-slate-600 leading-snug mt-0.5">{city.moreInfo.transport}</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Education & Institutions</h4>
              <p className="text-slate-600 leading-snug mt-0.5">{city.moreInfo.education}</p>
            </div>
            <div>
              <h4 className="font-bold text-slate-800">Cultural Identity</h4>
              <p className="text-slate-600 leading-snug mt-0.5">{city.moreInfo.culturalNote}</p>
            </div>
          </div>
        )}

        {/* View on Google Maps Pill Button */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full flex items-center justify-between px-3.5 py-2 rounded-full border border-slate-200/90 bg-slate-50/60 hover:bg-slate-100/90 transition-colors group"
        >
          <span className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span className="text-[12px] font-bold text-slate-800 whitespace-nowrap">
              View on Google Maps
            </span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors" />
        </a>

        {/* Other cities in Region */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 px-1">
          <button
            type="button"
            onClick={() => onExploreRegion(city.regionId)}
            className="w-full flex items-center justify-between text-left group mb-1"
          >
            <span className="text-[12.5px] font-bold text-slate-900">
              Other cities in {city.regionName}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </button>

          <ul className="space-y-0.5">
            {siblingCities.map((sibling) => (
              <li key={sibling.id}>
                <button
                  type="button"
                  onClick={() => onSelectCity(sibling.id)}
                  className="w-full flex items-center gap-2.5 py-0.5 px-1 rounded-lg text-[12px] text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0" />
                  <span className="truncate">{sibling.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};
