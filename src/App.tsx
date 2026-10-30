/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CITIES, PROVINCES, RegionId } from './data/sierraLeoneData';
import {
  filterCities,
  filterProvinces,
  getCityById,
  getProvinceById,
  getSiblingCities,
} from './utils/mapFilters';
import {
  createInitialTelemetryStore,
  DataLayerId,
  FieldReportEntry,
  simulateTelemetryTick,
  TelemetryStore,
} from './utils/telemetryEngine';
import { LeftSidebar } from './components/LeftSidebar';
import { InteractiveMap } from './components/InteractiveMap';
import { RightDetailPanel } from './components/RightDetailPanel';

const INITIAL_FIELD_REPORTS: FieldReportEntry[] = [
  {
    id: 'rep-1',
    cityId: 'freetown',
    cityName: 'Freetown',
    regionId: 'western',
    regionName: 'Western Area',
    layerId: 'healthcare',
    statusLevel: 'Nominal',
    note: 'Connaught & Ola During cold-chain telemetry verified at 96.2% uptime.',
    reporter: 'Western Area Health Dispatch',
    timestamp: '14:20 UTC',
    gps: '8.4844° N, 13.2344° W',
  },
  {
    id: 'rep-2',
    cityId: 'bo',
    cityName: 'Bo',
    regionId: 'southern',
    regionName: 'Southern Province',
    layerId: 'energy',
    statusLevel: 'Nominal',
    note: 'CLSG 225kV substation and Bo–Kenema solar mini-grid load balanced.',
    reporter: 'Southern Grid Control',
    timestamp: '13:55 UTC',
    gps: '7.9647° N, 11.7383° W',
  },
];

export default function App() {
  const [selectedCityId, setSelectedCityId] = useState<string>('freetown');
  const [selectedProvinceId, setSelectedProvinceId] = useState<RegionId | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllCities, setShowAllCities] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(true);
  const [favoriteCityIds, setFavoriteCityIds] = useState<string[]>(['freetown']);

  // Real-Time Regional Metrics & Data Layer Switcher state
  const [activeLayer, setActiveLayer] = useState<DataLayerId>('political');
  const [telemetryStore, setTelemetryStore] = useState<TelemetryStore>(() =>
    createInitialTelemetryStore()
  );
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);
  const [, setTickCounter] = useState<number>(1);
  const [fieldReports, setFieldReports] = useState<FieldReportEntry[]>(INITIAL_FIELD_REPORTS);

  const selectedCity = useMemo(() => getCityById(selectedCityId), [selectedCityId]);
  const selectedCityProvince = useMemo(
    () => getProvinceById(selectedCity.regionId),
    [selectedCity.regionId]
  );

  const filteredProvinces = useMemo(
    () => filterProvinces(PROVINCES, searchQuery),
    [searchQuery]
  );

  const filteredCities = useMemo(
    () => filterCities(CITIES, searchQuery, selectedProvinceId, showAllCities),
    [searchQuery, selectedProvinceId, showAllCities]
  );

  const siblingCities = useMemo(() => getSiblingCities(selectedCity), [selectedCity]);

  const handlePulseTelemetry = useCallback(() => {
    setTickCounter((prevTick) => {
      const nextTick = prevTick + 1;
      const nowIso = new Date().toISOString();
      setTelemetryStore((prevStore) => simulateTelemetryTick(prevStore, nextTick, nowIso));
      return nextTick;
    });
  }, []);

  useEffect(() => {
    if (!isStreamActive) return;
    const interval = window.setInterval(() => {
      handlePulseTelemetry();
    }, 4500);
    return () => window.clearInterval(interval);
  }, [isStreamActive, handlePulseTelemetry]);

  const handleSelectCity = (cityId: string) => {
    setSelectedCityId(cityId);
    setIsDetailOpen(true);
  };

  const handleSelectProvince = (provinceId: RegionId) => {
    if (selectedProvinceId === provinceId) {
      setSelectedProvinceId(null);
    } else {
      setSelectedProvinceId(provinceId);
      const prov = getProvinceById(provinceId);
      if (prov.capitalId) {
        setSelectedCityId(prov.capitalId);
        setIsDetailOpen(true);
      }
    }
  };

  const handleExploreRegion = (regionId: RegionId) => {
    setSelectedProvinceId(regionId);
    setShowAllCities(true);
  };

  const handleToggleFavorite = (cityId: string) => {
    setFavoriteCityIds((prev) =>
      prev.includes(cityId) ? prev.filter((id) => id !== cityId) : [...prev, cityId]
    );
  };

  const handleAddFieldReport = (report: Omit<FieldReportEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes()
    ).padStart(2, '0')} UTC`;

    const newEntry: FieldReportEntry = {
      ...report,
      id: `rep-${Date.now()}`,
      timestamp,
    };

    setFieldReports((prev) => [newEntry, ...prev]);

    // Nudge the reported region & sector telemetry to reflect live field report ingestion
    setTelemetryStore((prev) => {
      const next = structuredClone(prev);
      const snap = next[report.regionId][report.layerId];
      const nudge =
        report.statusLevel === 'Nominal'
          ? 0.4
          : report.statusLevel === 'Maintenance'
            ? -0.2
            : -0.6;
      snap.primaryScore = Number(
        Math.min(99.4, Math.max(25, snap.primaryScore + nudge)).toFixed(1)
      );
      snap.delta = Number((snap.delta + nudge).toFixed(1));
      snap.lastUpdatedIso = now.toISOString();
      return next;
    });
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden flex bg-[#f3f3e8]">
      {/* Left Navigation Sidebar */}
      <LeftSidebar
        provinces={filteredProvinces}
        cities={filteredCities}
        selectedCityId={selectedCityId}
        selectedProvinceId={selectedProvinceId}
        searchQuery={searchQuery}
        showAllCities={showAllCities}
        totalCityCount={CITIES.length}
        activeLayer={activeLayer}
        telemetryStore={telemetryStore}
        onSearchChange={setSearchQuery}
        onSelectCity={handleSelectCity}
        onSelectProvince={handleSelectProvince}
        onToggleShowAllCities={() => setShowAllCities((prev) => !prev)}
      />

      {/* Center Interactive Political & Telemetry Map Canvas + Floating Right Detail Panel */}
      <div className="relative flex-1 h-full overflow-hidden flex">
        <InteractiveMap
          provinces={PROVINCES}
          cities={CITIES}
          selectedCity={selectedCity}
          selectedProvinceId={selectedProvinceId}
          isDetailOpen={isDetailOpen}
          activeLayer={activeLayer}
          telemetryStore={telemetryStore}
          isStreamActive={isStreamActive}
          onSelectLayer={setActiveLayer}
          onToggleStream={() => setIsStreamActive((prev) => !prev)}
          onPulseTelemetry={handlePulseTelemetry}
          onSelectCity={handleSelectCity}
          onSelectProvince={handleSelectProvince}
        />

        {isDetailOpen ? (
          <RightDetailPanel
            city={selectedCity}
            province={selectedCityProvince}
            siblingCities={siblingCities}
            isFavorite={favoriteCityIds.includes(selectedCity.id)}
            activeLayer={activeLayer}
            telemetryStore={telemetryStore}
            fieldReports={fieldReports}
            onSelectLayer={setActiveLayer}
            onAddFieldReport={handleAddFieldReport}
            onToggleFavorite={handleToggleFavorite}
            onSelectCity={handleSelectCity}
            onExploreRegion={handleExploreRegion}
            onClose={() => setIsDetailOpen(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsDetailOpen(true)}
            className="absolute right-5 top-5 z-20 px-4 py-2.5 bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200/80 text-[13px] font-bold text-slate-900 hover:bg-white transition-colors"
          >
            Show {selectedCity.name} Details
          </button>
        )}
      </div>
    </main>
  );
}
