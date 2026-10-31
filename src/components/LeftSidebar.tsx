import React, { useEffect, useRef } from 'react';
import { Building2, ChevronRight, Compass, Search, X } from 'lucide-react';
import { CityData, ProvinceData, RegionId } from '../data/sierraLeoneData';
import { DataLayerId, resolveChoroplethStyle, TelemetryStore } from '../utils/telemetryEngine';

interface LeftSidebarProps {
  isOpen: boolean;
  provinces: ProvinceData[];
  cities: CityData[];
  selectedCityId: string;
  selectedProvinceId: RegionId | null;
  searchQuery: string;
  showAllCities: boolean;
  activeLayer: DataLayerId;
  telemetryStore: TelemetryStore;
  onSearchChange: (q: string) => void;
  onSelectCity: (cityId: string) => void;
  onSelectProvince: (provinceId: RegionId) => void;
  onToggleShowAllCities: () => void;
  onClose: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  provinces,
  cities,
  selectedCityId,
  selectedProvinceId,
  searchQuery,
  showAllCities,
  activeLayer,
  telemetryStore,
  onSearchChange,
  onSelectCity,
  onSelectProvince,
  onToggleShowAllCities,
  onClose,
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', trapFocus);
    return () => document.removeEventListener('keydown', trapFocus);
  }, [isOpen]);

  return (
    <aside
      ref={sidebarRef}
      id="left-navigation-sidebar"
      role={isOpen ? 'dialog' : undefined}
      aria-modal={isOpen || undefined}
      aria-label="Sierra Leone Regions and Cities Navigation"
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-[min(316px,90vw)] shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200/80 bg-white px-4 py-4 select-none custom-scrollbar transition-transform duration-200 md:relative md:inset-auto md:z-20 md:h-full md:w-[316px] md:translate-x-0 ${
        isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full md:visible'
      }`}
    >
      <div>
        {/* Top Brand Header with Flag */}
        <div className="flex items-center justify-between gap-3.5 px-1 pt-0.5 pb-3">
          <div
            className="w-[50px] h-[42px] rounded-lg overflow-hidden shadow-xs border border-slate-200/80 shrink-0 flex flex-col"
            aria-label="Flag of Sierra Leone"
            role="img"
          >
            <div className="flex-1 bg-[#1EB53A]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#0072C6]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[21px] font-bold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
              Sierra Leone
            </h1>
            <p className="text-[13px] text-slate-500 font-medium leading-snug whitespace-nowrap">
              Interactive Political Map
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-1 mb-2">
          <label htmlFor="map-search-input" className="sr-only">
            Search for a city, district or region
          </label>
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="map-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for a city, district or region..."
            className="w-full pl-9 pr-8 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200/90 rounded-full shadow-2xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 5 Regions / Provinces List */}
        <nav aria-label="Provinces of Sierra Leone" className="divide-y divide-slate-100">
          {provinces.map((prov) => {
            const isSelected = selectedProvinceId === prov.id;
            const layerMetric =
              activeLayer !== 'political' ? telemetryStore[prov.id][activeLayer] : null;
            const dotColor =
              activeLayer !== 'political' && layerMetric
                ? resolveChoroplethStyle(activeLayer, layerMetric.primaryScore, prov.dotColor)
                    .fillColor
                : prov.dotColor;

            return (
              <button
                key={prov.id}
                type="button"
                onClick={() => onSelectProvince(prov.id)}
                aria-pressed={isSelected}
                className={`w-full flex items-center justify-between py-2.5 px-2.5 rounded-xl text-left transition-colors group ${
                  isSelected
                    ? 'bg-slate-100/90 text-slate-950 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800 font-semibold'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-2xs transition-colors"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="text-[13.5px] truncate">{prov.name}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {layerMetric && (
                    <span className="text-[11.5px] font-mono tabular-nums text-slate-600 font-semibold">
                      {layerMetric.primaryScore.toFixed(1)}%
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? 'text-slate-900 translate-x-0.5'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </nav>

        {/* Major Cities Section */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/70">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700 stroke-[2.2]" />
              <h2 className="text-[13.5px] font-bold text-slate-900">
                {selectedProvinceId
                  ? `${provinces.find((p) => p.id === selectedProvinceId)?.shortName || 'Region'} Cities`
                  : showAllCities || searchQuery
                  ? `Cities (${cities.length})`
                  : 'Major Cities'}
              </h2>
            </div>
            {selectedProvinceId && (
              <button
                type="button"
                onClick={() => onSelectProvince(selectedProvinceId)}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
              >
                All regions
              </button>
            )}
          </div>

          <div
            className={`space-y-0.5 ${
              showAllCities || searchQuery || selectedProvinceId
                ? 'max-h-[190px] overflow-y-auto pr-1 custom-scrollbar'
                : ''
            }`}
          >
            {cities.length === 0 ? (
              <p className="text-xs text-slate-400 px-2.5 py-3">
                No matching cities or towns found.
              </p>
            ) : (
              cities.map((city) => {
                const isActive = city.id === selectedCityId;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => onSelectCity(city.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-colors ${
                      isActive
                        ? 'bg-[#e8f1fb] text-slate-900 font-semibold'
                        : 'text-slate-700 font-medium hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isActive ? 'bg-[#1565c0]' : 'bg-[#1e293b]'
                        }`}
                      />
                      <span className="text-[13.5px] truncate">{city.name}</span>
                    </span>
                    {(showAllCities || searchQuery) && (
                      <span className="text-[11px] text-slate-400 truncate ml-2">
                        {city.regionName.replace(' Province', '')}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Show all cities toggle button */}
          <button
            type="button"
            onClick={onToggleShowAllCities}
            className="mt-1 pt-2 border-t border-slate-100 w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors group"
          >
            <span className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-slate-600" />
              <span className="text-[13px] font-medium text-slate-700">
                {showAllCities ? 'Show major cities only' : `Show all cities`}
              </span>
            </span>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                showAllCities ? 'rotate-90 text-slate-700' : 'group-hover:translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bottom Africa Locator Inset Map Card */}
      <div className="mt-2 pt-1">
        <div className="rounded-2xl border border-slate-200/90 bg-[#f9f9fb] overflow-hidden shadow-2xs">
          <img
            src="/assets/africa-inset.png"
            alt="Locator map of Sierra Leone in West Africa with scale bar 0 to 150 km"
            referrerPolicy="no-referrer"
            className="w-full h-auto block object-contain"
          />
        </div>
      </div>
    </aside>
  );
};
