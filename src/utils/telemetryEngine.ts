import { CityData, ProvinceData, RegionId } from '../data/sierraLeoneData';

export type DataLayerId = 'political' | 'healthcare' | 'telecom' | 'energy' | 'agri_trade';

export interface LayerDefinition {
  id: DataLayerId;
  label: string;
  shortLabel: string;
  primaryMetricLabel: string;
  unit: string;
  description: string;
  choroplethTiers: {
    tier: 'Optimal' | 'Good' | 'Moderate' | 'Priority';
    rangeLabel: string;
    min: number;
    fillColor: string;
    badgeBg: string;
    badgeText: string;
  }[];
}

export interface SubMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  delta: number;
  target: number;
}

export interface RegionLayerTelemetry {
  regionId: RegionId;
  layerId: Exclude<DataLayerId, 'political'>;
  primaryScore: number; // 0 - 100
  delta: number;
  statusLabel: 'Optimal' | 'Good' | 'Moderate' | 'Priority';
  headlineStat: string;
  subMetrics: SubMetric[];
  lastUpdatedIso: string;
}

export interface FieldReportEntry {
  id: string;
  cityId: string;
  cityName: string;
  regionId: RegionId;
  regionName: string;
  layerId: Exclude<DataLayerId, 'political'>;
  statusLevel: 'Nominal' | 'Maintenance' | 'Priority Alert';
  note: string;
  reporter: string;
  timestamp: string;
  gps: string;
}

export const DATA_LAYERS: LayerDefinition[] = [
  {
    id: 'political',
    label: 'Political',
    shortLabel: 'Political',
    primaryMetricLabel: 'Administrative Regions',
    unit: '',
    description: 'Official 5 provinces, 16 districts, capitals, and international boundaries.',
    choroplethTiers: [],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    shortLabel: 'Healthcare',
    primaryMetricLabel: 'Health Readiness Index',
    unit: '%',
    description: 'Hospital & PHU readiness, vaccine cold-chain uptime, and maternal care coverage.',
    choroplethTiers: [
      {
        tier: 'Optimal',
        rangeLabel: '80% – 100%',
        min: 80,
        fillColor: '#10b981',
        badgeBg: '#065f46',
        badgeText: '#ecfdf5',
      },
      {
        tier: 'Good',
        rangeLabel: '68% – 79%',
        min: 68,
        fillColor: '#34d399',
        badgeBg: '#047857',
        badgeText: '#ffffff',
      },
      {
        tier: 'Moderate',
        rangeLabel: '55% – 67%',
        min: 55,
        fillColor: '#6ee7b7',
        badgeBg: '#0f766e',
        badgeText: '#ffffff',
      },
      {
        tier: 'Priority',
        rangeLabel: '< 55%',
        min: 0,
        fillColor: '#a7f3d0',
        badgeBg: '#115e59',
        badgeText: '#ffffff',
      },
    ],
  },
  {
    id: 'telecom',
    label: 'Telecom',
    shortLabel: 'Telecom',
    primaryMetricLabel: '4G/Fiber Connectivity',
    unit: '%',
    description: '4G LTE/5G population coverage, national fiber backbone uptime, and throughput.',
    choroplethTiers: [
      {
        tier: 'Optimal',
        rangeLabel: '80% – 100%',
        min: 80,
        fillColor: '#3b82f6',
        badgeBg: '#1e3a8a',
        badgeText: '#eff6ff',
      },
      {
        tier: 'Good',
        rangeLabel: '68% – 79%',
        min: 68,
        fillColor: '#60a5fa',
        badgeBg: '#1d4ed8',
        badgeText: '#ffffff',
      },
      {
        tier: 'Moderate',
        rangeLabel: '55% – 67%',
        min: 55,
        fillColor: '#93c5fd',
        badgeBg: '#1e40af',
        badgeText: '#ffffff',
      },
      {
        tier: 'Priority',
        rangeLabel: '< 55%',
        min: 0,
        fillColor: '#bfdbfe',
        badgeBg: '#1e3a8a',
        badgeText: '#ffffff',
      },
    ],
  },
  {
    id: 'energy',
    label: 'Energy',
    shortLabel: 'Energy',
    primaryMetricLabel: 'Grid & Solar Uptime',
    unit: '%',
    description: 'National grid & solar mini-grid availability, Bumbuna hydro share, and load.',
    choroplethTiers: [
      {
        tier: 'Optimal',
        rangeLabel: '80% – 100%',
        min: 80,
        fillColor: '#f59e0b',
        badgeBg: '#78350f',
        badgeText: '#fffbeb',
      },
      {
        tier: 'Good',
        rangeLabel: '68% – 79%',
        min: 68,
        fillColor: '#fbbf24',
        badgeBg: '#92400e',
        badgeText: '#ffffff',
      },
      {
        tier: 'Moderate',
        rangeLabel: '55% – 67%',
        min: 55,
        fillColor: '#fcd34d',
        badgeBg: '#b45309',
        badgeText: '#ffffff',
      },
      {
        tier: 'Priority',
        rangeLabel: '< 55%',
        min: 0,
        fillColor: '#fde68a',
        badgeBg: '#92400e',
        badgeText: '#ffffff',
      },
    ],
  },
  {
    id: 'agri_trade',
    label: 'Agri & Trade',
    shortLabel: 'Agri & Trade',
    primaryMetricLabel: 'Agri-Trade Output Index',
    unit: '%',
    description: 'Rice & cocoa harvest index, port/border trade volume, and market supply.',
    choroplethTiers: [
      {
        tier: 'Optimal',
        rangeLabel: '80% – 100%',
        min: 80,
        fillColor: '#84cc16',
        badgeBg: '#365314',
        badgeText: '#f7fee7',
      },
      {
        tier: 'Good',
        rangeLabel: '68% – 79%',
        min: 68,
        fillColor: '#a3e635',
        badgeBg: '#3f6212',
        badgeText: '#ffffff',
      },
      {
        tier: 'Moderate',
        rangeLabel: '55% – 67%',
        min: 55,
        fillColor: '#bef264',
        badgeBg: '#4d7c0f',
        badgeText: '#ffffff',
      },
      {
        tier: 'Priority',
        rangeLabel: '< 55%',
        min: 0,
        fillColor: '#d9f99d',
        badgeBg: '#3f6212',
        badgeText: '#ffffff',
      },
    ],
  },
];

export function getLayerDefinition(layerId: DataLayerId): LayerDefinition {
  return DATA_LAYERS.find((l) => l.id === layerId) || DATA_LAYERS[0];
}

export function resolveChoroplethStyle(
  layerId: DataLayerId,
  score: number,
  defaultPoliticalColor: string
): {
  fillColor: string;
  badgeBg: string;
  badgeText: string;
  tier: 'Optimal' | 'Good' | 'Moderate' | 'Priority';
} {
  if (layerId === 'political') {
    return {
      fillColor: defaultPoliticalColor,
      badgeBg: '#0f172a',
      badgeText: '#ffffff',
      tier: 'Optimal',
    };
  }
  const def = getLayerDefinition(layerId);
  for (const t of def.choroplethTiers) {
    if (score >= t.min) {
      return {
        fillColor: t.fillColor,
        badgeBg: t.badgeBg,
        badgeText: t.badgeText,
        tier: t.tier,
      };
    }
  }
  const fallback = def.choroplethTiers[def.choroplethTiers.length - 1];
  return {
    fillColor: fallback.fillColor,
    badgeBg: fallback.badgeBg,
    badgeText: fallback.badgeText,
    tier: fallback.tier,
  };
}

export type TelemetryStore = Record<
  RegionId,
  Record<Exclude<DataLayerId, 'political'>, RegionLayerTelemetry>
>;

export function createInitialTelemetryStore(): TelemetryStore {
  const nowIso = '2026-10-29T13:20:00Z';

  return {
    western: {
      healthcare: {
        regionId: 'western',
        layerId: 'healthcare',
        primaryScore: 88.4,
        delta: 1.4,
        statusLabel: 'Optimal',
        headlineStat: '142 Active PHUs · 96% Cold-Chain',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'phu', label: 'Hospital & PHU Readiness', value: 88.4, unit: '%', delta: 1.4, target: 90 },
          { id: 'cold', label: 'Vaccine Cold-Chain Uptime', value: 96.2, unit: '%', delta: 0.8, target: 95 },
          { id: 'mat', label: 'Skilled Maternal Coverage', value: 91.5, unit: '%', delta: 1.1, target: 90 },
          { id: 'amb', label: 'NEMS Ambulance Response', value: 18.5, unit: 'min', delta: -1.2, target: 15 },
        ],
      },
      telecom: {
        regionId: 'western',
        layerId: 'telecom',
        primaryScore: 94.2,
        delta: 1.8,
        statusLabel: 'Optimal',
        headlineStat: '94.2% 4G/5G · 48.6 Mbps Avg',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'cov', label: '4G LTE / 5G Coverage', value: 94.2, unit: '%', delta: 1.8, target: 95 },
          { id: 'fib', label: 'Metro Fiber Ring Uptime', value: 99.4, unit: '%', delta: 0.2, target: 99 },
          { id: 'spd', label: 'Median Broadband Speed', value: 48.6, unit: 'Mbps', delta: 3.4, target: 50 },
          { id: 'twr', label: 'Active Base Stations', value: 312, unit: 'sites', delta: 4, target: 320 },
        ],
      },
      energy: {
        regionId: 'western',
        layerId: 'energy',
        primaryScore: 84.6,
        delta: 2.1,
        statusLabel: 'Optimal',
        headlineStat: '92.4 MW Peak · 84.6% Grid Availability',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'grd', label: 'EDSA Grid Availability', value: 84.6, unit: '%', delta: 2.1, target: 88 },
          { id: 'ren', label: 'Hydro & Solar Feed Share', value: 64.8, unit: '%', delta: 1.5, target: 70 },
          { id: 'ld', label: 'Western Area Active Load', value: 92.4, unit: 'MW', delta: 3.2, target: 100 },
          { id: 'vlt', label: 'Substation Voltage Stability', value: 97.1, unit: '%', delta: 0.4, target: 98 },
        ],
      },
      agri_trade: {
        regionId: 'western',
        layerId: 'agri_trade',
        primaryScore: 89.5,
        delta: 2.4,
        statusLabel: 'Optimal',
        headlineStat: '42.8k TEU Port · Coastal Fisheries',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'trd', label: 'QE II Quay Port Throughput', value: 89.5, unit: '%', delta: 2.4, target: 90 },
          { id: 'fsh', label: 'Artisanal Marine Catch Index', value: 86.2, unit: '%', delta: 1.2, target: 85 },
          { id: 'mkt', label: 'Urban Food Supply Index', value: 91.0, unit: '%', delta: 0.9, target: 90 },
          { id: 'exp', label: 'Weekly Export Clearance', value: 1480, unit: 'tonnes', delta: 65, target: 1500 },
        ],
      },
    },
    southern: {
      healthcare: {
        regionId: 'southern',
        layerId: 'healthcare',
        primaryScore: 76.8,
        delta: 1.2,
        statusLabel: 'Good',
        headlineStat: '286 Active PHUs · Bo Referral Hub',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'phu', label: 'Hospital & PHU Readiness', value: 76.8, unit: '%', delta: 1.2, target: 80 },
          { id: 'cold', label: 'Solar Vaccine Cold-Chain', value: 89.4, unit: '%', delta: 1.5, target: 90 },
          { id: 'mat', label: 'Skilled Maternal Coverage', value: 82.1, unit: '%', delta: 1.9, target: 85 },
          { id: 'amb', label: 'NEMS Ambulance Response', value: 26.4, unit: 'min', delta: -1.8, target: 20 },
        ],
      },
      telecom: {
        regionId: 'southern',
        layerId: 'telecom',
        primaryScore: 74.5,
        delta: 1.5,
        statusLabel: 'Good',
        headlineStat: '74.5% 4G Coverage · Bo–Bonthe Link',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'cov', label: '4G LTE Population Coverage', value: 74.5, unit: '%', delta: 1.5, target: 80 },
          { id: 'fib', label: 'Southern Fiber Backbone', value: 96.8, unit: '%', delta: 0.5, target: 98 },
          { id: 'spd', label: 'Median Broadband Speed', value: 29.4, unit: 'Mbps', delta: 2.1, target: 35 },
          { id: 'twr', label: 'Active Base Stations', value: 198, unit: 'sites', delta: 3, target: 210 },
        ],
      },
      energy: {
        regionId: 'southern',
        layerId: 'energy',
        primaryScore: 71.2,
        delta: 1.7,
        statusLabel: 'Good',
        headlineStat: 'CLSG 225kV Grid + 28 Solar Mini-Grids',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'grd', label: 'Bo–Kenema Grid Availability', value: 71.2, unit: '%', delta: 1.7, target: 75 },
          { id: 'ren', label: 'Rural Solar Mini-Grid Share', value: 78.5, unit: '%', delta: 2.3, target: 80 },
          { id: 'ld', label: 'Regional Active Load', value: 34.8, unit: 'MW', delta: 1.4, target: 40 },
          { id: 'vlt', label: 'CLSG Line Stability', value: 95.2, unit: '%', delta: 0.6, target: 96 },
        ],
      },
      agri_trade: {
        regionId: 'southern',
        layerId: 'agri_trade',
        primaryScore: 83.4,
        delta: 2.0,
        statusLabel: 'Optimal',
        headlineStat: 'Rice, Oil Palm & Rutile Corridor',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'trd', label: 'Agri-Trade Output Index', value: 83.4, unit: '%', delta: 2.0, target: 85 },
          { id: 'fsh', label: 'Torma Bum Rice Yield Index', value: 87.6, unit: '%', delta: 2.8, target: 85 },
          { id: 'mkt', label: 'Palm Oil & Gari Supply', value: 89.2, unit: '%', delta: 1.4, target: 88 },
          { id: 'exp', label: 'Weekly Regional Trade', value: 2150, unit: 'tonnes', delta: 95, target: 2200 },
        ],
      },
    },
    eastern: {
      healthcare: {
        regionId: 'eastern',
        layerId: 'healthcare',
        primaryScore: 73.6,
        delta: 1.6,
        statusLabel: 'Good',
        headlineStat: 'Kenema & Koidu Regional Hospitals',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'phu', label: 'Hospital & PHU Readiness', value: 73.6, unit: '%', delta: 1.6, target: 78 },
          { id: 'cold', label: 'Solar Vaccine Cold-Chain', value: 88.1, unit: '%', delta: 1.2, target: 90 },
          { id: 'mat', label: 'Skilled Maternal Coverage', value: 79.8, unit: '%', delta: 1.5, target: 82 },
          { id: 'amb', label: 'NEMS Ambulance Response', value: 28.2, unit: 'min', delta: -1.4, target: 22 },
        ],
      },
      telecom: {
        regionId: 'eastern',
        layerId: 'telecom',
        primaryScore: 69.8,
        delta: 1.9,
        statusLabel: 'Good',
        headlineStat: '69.8% 4G · Cross-Border Fiber Ring',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'cov', label: '4G LTE Population Coverage', value: 69.8, unit: '%', delta: 1.9, target: 75 },
          { id: 'fib', label: 'Kenema–Koidu–Kailahun Fiber', value: 94.6, unit: '%', delta: 0.7, target: 96 },
          { id: 'spd', label: 'Median Broadband Speed', value: 26.8, unit: 'Mbps', delta: 1.8, target: 30 },
          { id: 'twr', label: 'Active Base Stations', value: 184, unit: 'sites', delta: 5, target: 200 },
        ],
      },
      energy: {
        regionId: 'eastern',
        layerId: 'energy',
        primaryScore: 74.9,
        delta: 2.2,
        statusLabel: 'Good',
        headlineStat: 'CLSG Interconnection · 74.9% Uptime',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'grd', label: 'CLSG Eastern Grid Uptime', value: 74.9, unit: '%', delta: 2.2, target: 80 },
          { id: 'ren', label: 'Hydro & Mini-Grid Share', value: 76.2, unit: '%', delta: 1.9, target: 80 },
          { id: 'ld', label: 'Regional Active Load', value: 38.5, unit: 'MW', delta: 1.8, target: 42 },
          { id: 'vlt', label: 'Substation Voltage Stability', value: 94.8, unit: '%', delta: 0.5, target: 96 },
        ],
      },
      agri_trade: {
        regionId: 'eastern',
        layerId: 'agri_trade',
        primaryScore: 86.7,
        delta: 2.6,
        statusLabel: 'Optimal',
        headlineStat: '#1 National Cocoa & Coffee Exporter',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'trd', label: 'Cocoa & Coffee Export Index', value: 86.7, unit: '%', delta: 2.6, target: 88 },
          { id: 'fsh', label: 'Kailahun–Kenema Crop Yield', value: 88.9, unit: '%', delta: 2.1, target: 85 },
          { id: 'mkt', label: 'Cross-Border Market Volume', value: 84.5, unit: '%', delta: 1.7, target: 85 },
          { id: 'exp', label: 'Weekly Cocoa/Coffee Tonnage', value: 2840, unit: 'tonnes', delta: 120, target: 2800 },
        ],
      },
    },
    northern: {
      healthcare: {
        regionId: 'northern',
        layerId: 'healthcare',
        primaryScore: 66.4,
        delta: 1.5,
        statusLabel: 'Moderate',
        headlineStat: 'Makeni Regional Hub · 214 PHUs',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'phu', label: 'Hospital & PHU Readiness', value: 66.4, unit: '%', delta: 1.5, target: 75 },
          { id: 'cold', label: 'Solar Vaccine Cold-Chain', value: 86.5, unit: '%', delta: 1.4, target: 90 },
          { id: 'mat', label: 'Skilled Maternal Coverage', value: 74.2, unit: '%', delta: 1.8, target: 80 },
          { id: 'amb', label: 'NEMS Ambulance Response', value: 31.0, unit: 'min', delta: -1.5, target: 25 },
        ],
      },
      telecom: {
        regionId: 'northern',
        layerId: 'telecom',
        primaryScore: 64.2,
        delta: 1.7,
        statusLabel: 'Moderate',
        headlineStat: '64.2% 4G · Makeni–Kabala Fiber',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'cov', label: '4G LTE Population Coverage', value: 64.2, unit: '%', delta: 1.7, target: 70 },
          { id: 'fib', label: 'Northern Fiber Backbone', value: 93.1, unit: '%', delta: 0.8, target: 95 },
          { id: 'spd', label: 'Median Broadband Speed', value: 24.2, unit: 'Mbps', delta: 1.5, target: 30 },
          { id: 'twr', label: 'Active Base Stations', value: 162, unit: 'sites', delta: 4, target: 180 },
        ],
      },
      energy: {
        regionId: 'northern',
        layerId: 'energy',
        primaryScore: 81.8,
        delta: 1.9,
        statusLabel: 'Optimal',
        headlineStat: 'Bumbuna Hydro I (50 MW) + Solar Park',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'grd', label: 'Bumbuna–Makeni Grid Uptime', value: 81.8, unit: '%', delta: 1.9, target: 85 },
          { id: 'ren', label: 'Clean Hydro & Solar Share', value: 91.4, unit: '%', delta: 1.2, target: 90 },
          { id: 'ld', label: 'Bumbuna Hydro Generation', value: 46.2, unit: 'MW', delta: 1.6, target: 50 },
          { id: 'vlt', label: '161kV Transmission Health', value: 96.8, unit: '%', delta: 0.3, target: 97 },
        ],
      },
      agri_trade: {
        regionId: 'northern',
        layerId: 'agri_trade',
        primaryScore: 76.5,
        delta: 1.8,
        statusLabel: 'Good',
        headlineStat: 'Kabala Highland Vegetables & Livestock',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'trd', label: 'Agri-Livestock Trade Index', value: 76.5, unit: '%', delta: 1.8, target: 80 },
          { id: 'fsh', label: 'Boli-Land Rice & Vegetable Yield', value: 79.4, unit: '%', delta: 2.2, target: 80 },
          { id: 'mkt', label: 'Guinea Corridor Trade Flow', value: 74.8, unit: '%', delta: 1.3, target: 75 },
          { id: 'exp', label: 'Weekly Produce Volume', value: 1790, unit: 'tonnes', delta: 70, target: 1850 },
        ],
      },
    },
    'north-west': {
      healthcare: {
        regionId: 'north-west',
        layerId: 'healthcare',
        primaryScore: 63.8,
        delta: 1.7,
        statusLabel: 'Moderate',
        headlineStat: 'Port Loko & Kambia District Hospitals',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'phu', label: 'Hospital & PHU Readiness', value: 63.8, unit: '%', delta: 1.7, target: 72 },
          { id: 'cold', label: 'Solar Vaccine Cold-Chain', value: 85.2, unit: '%', delta: 1.6, target: 88 },
          { id: 'mat', label: 'Skilled Maternal Coverage', value: 72.6, unit: '%', delta: 2.0, target: 78 },
          { id: 'amb', label: 'NEMS Ambulance Response', value: 29.5, unit: 'min', delta: -1.6, target: 24 },
        ],
      },
      telecom: {
        regionId: 'north-west',
        layerId: 'telecom',
        primaryScore: 71.4,
        delta: 2.1,
        statusLabel: 'Good',
        headlineStat: 'Lungi–Port Loko–Kambia ECOWAN Fiber',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'cov', label: '4G LTE Population Coverage', value: 71.4, unit: '%', delta: 2.1, target: 75 },
          { id: 'fib', label: 'Cross-Border Guinea Fiber Link', value: 95.8, unit: '%', delta: 0.6, target: 96 },
          { id: 'spd', label: 'Median Broadband Speed', value: 28.1, unit: 'Mbps', delta: 1.9, target: 32 },
          { id: 'twr', label: 'Active Base Stations', value: 146, unit: 'sites', delta: 3, target: 160 },
        ],
      },
      energy: {
        regionId: 'north-west',
        layerId: 'energy',
        primaryScore: 62.5,
        delta: 1.8,
        statusLabel: 'Moderate',
        headlineStat: 'Lungi–Port Loko Grid + 22 Mini-Grids',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'grd', label: 'Regional Grid Availability', value: 62.5, unit: '%', delta: 1.8, target: 70 },
          { id: 'ren', label: 'Solar Hybrid Mini-Grid Share', value: 74.0, unit: '%', delta: 2.4, target: 78 },
          { id: 'ld', label: 'Regional Active Load', value: 27.6, unit: 'MW', delta: 1.2, target: 32 },
          { id: 'vlt', label: 'Feeder Line Stability', value: 91.5, unit: '%', delta: 0.7, target: 95 },
        ],
      },
      agri_trade: {
        regionId: 'north-west',
        layerId: 'agri_trade',
        primaryScore: 81.2,
        delta: 2.3,
        statusLabel: 'Optimal',
        headlineStat: 'Scarcies Swamp Rice & Gbalamuya Border',
        lastUpdatedIso: nowIso,
        subMetrics: [
          { id: 'trd', label: 'Gbalamuya Cross-Border Trade', value: 81.2, unit: '%', delta: 2.3, target: 85 },
          { id: 'fsh', label: 'Scarcies Basin Rice Output', value: 85.4, unit: '%', delta: 2.5, target: 85 },
          { id: 'mkt', label: 'Pepel Iron Ore & Port Flow', value: 82.8, unit: '%', delta: 1.9, target: 85 },
          { id: 'exp', label: 'Weekly Cross-Border Tonnage', value: 2320, unit: 'tonnes', delta: 110, target: 2400 },
        ],
      },
    },
  };
}

/**
 * Deterministically advances the telemetry store by one tick, perturbing scores
 * smoothly within [45, 98] and recomputing status tiers.
 */
export function simulateTelemetryTick(
  store: TelemetryStore,
  tickCount: number,
  timestampIso: string
): TelemetryStore {
  const next: TelemetryStore = JSON.parse(JSON.stringify(store));
  const regions: RegionId[] = ['western', 'southern', 'eastern', 'northern', 'north-west'];
  const layers: Exclude<DataLayerId, 'political'>[] = [
    'healthcare',
    'telecom',
    'energy',
    'agri_trade',
  ];

  regions.forEach((rId, rIdx) => {
    layers.forEach((lId, lIdx) => {
      const entry = next[rId][lId];
      entry.regionId = rId;
      const wave = Math.sin((tickCount + 1) * 0.85 + rIdx * 1.3 + lIdx * 0.9);
      const step = Number((wave * 0.7).toFixed(1));
      const updatedScore = Math.min(98.5, Math.max(48.0, Number((entry.primaryScore + step).toFixed(1))));
      const delta = Number((updatedScore - entry.primaryScore).toFixed(1));

      entry.primaryScore = updatedScore;
      entry.delta = delta === 0 ? 0.3 : delta;
      entry.lastUpdatedIso = timestampIso;

      const style = resolveChoroplethStyle(lId, updatedScore, '#ffffff');
      entry.statusLabel = style.tier;

      entry.subMetrics = entry.subMetrics.map((sm, sIdx) => {
        const subWave = Math.cos((tickCount + 1) * 0.7 + sIdx * 1.1 + rIdx);
        const factor = sm.unit === '%' ? 0.5 : sm.unit === 'tonnes' ? 15 : 0.4;
        const smDelta = Number((subWave * factor).toFixed(1));
        const nextVal =
          sm.unit === '%'
            ? Math.min(99.8, Math.max(40, Number((sm.value + smDelta).toFixed(1))))
            : Math.max(5, Number((sm.value + smDelta).toFixed(1)));
        return {
          ...sm,
          value: nextVal,
          delta: smDelta === 0 ? 0.2 : smDelta,
        };
      });
    });
  });

  return next;
}

export function formatMetricsToCsv(
  city: CityData,
  province: ProvinceData,
  activeLayer: DataLayerId,
  store: TelemetryStore
): string {
  const targetLayers: Exclude<DataLayerId, 'political'>[] =
    activeLayer === 'political'
      ? ['healthcare', 'telecom', 'energy', 'agri_trade']
      : [activeLayer];

  const rows: string[] = [
    'City,Region,GPS_Latitude,GPS_Longitude,Layer,Metric_Name,Value,Unit,Delta,Target,Status,Last_Updated',
  ];

  for (const lId of targetLayers) {
    const telemetry = store[city.regionId][lId];
    for (const sm of telemetry.subMetrics) {
      rows.push(
        [
          `"${city.name}"`,
          `"${province.name}"`,
          city.lat.toFixed(4),
          city.lng.toFixed(4),
          lId,
          `"${sm.label}"`,
          sm.value,
          `"${sm.unit}"`,
          sm.delta,
          sm.target,
          telemetry.statusLabel,
          telemetry.lastUpdatedIso,
        ].join(',')
      );
    }
  }

  return rows.join('\n');
}

export function formatMetricsToJson(
  city: CityData,
  province: ProvinceData,
  activeLayer: DataLayerId,
  store: TelemetryStore,
  fieldReports: FieldReportEntry[]
): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    city: {
      id: city.id,
      name: city.name,
      status: city.status,
      population: city.population,
      gps: { lat: city.lat, lng: city.lng },
      district: city.keyFacts.district,
    },
    province: {
      id: province.id,
      name: province.name,
      capital: province.capitalName,
      population: province.population,
    },
    activeLayer,
    regionalTelemetry: store[city.regionId],
    recentFieldReports: fieldReports.filter((r) => r.cityId === city.id || r.regionId === city.regionId),
  };

  return JSON.stringify(payload, null, 2);
}

export function buildWhatsAppFieldReportMessage(
  city: CityData,
  layerId: Exclude<DataLayerId, 'political'>,
  telemetry: RegionLayerTelemetry,
  statusLevel: 'Nominal' | 'Maintenance' | 'Priority Alert',
  note: string,
  reporter: string
): string {
  const layerDef = getLayerDefinition(layerId);
  const cleanNote = note.trim() || `Routine ${layerDef.label} telemetry verification in ${city.name}.`;
  const cleanReporter = reporter.trim() || 'Field Operations Team';

  const lines = [
    `*SIERRA LEONE REGIONAL FIELD REPORT*`,
    `📍 *Location:* ${city.name} (${city.keyFacts.district}, ${city.regionName})`,
    `🧭 *GPS:* ${city.lat.toFixed(4)}° N, ${Math.abs(city.lng).toFixed(4)}° W`,
    `📊 *Sector Layer:* ${layerDef.label} (${layerDef.primaryMetricLabel})`,
    `⚡ *Regional Score:* ${telemetry.primaryScore.toFixed(1)}% (${telemetry.statusLabel})`,
    `🚦 *Field Status:* ${statusLevel}`,
    `📝 *Observation:* ${cleanNote}`,
    `👤 *Reported by:* ${cleanReporter}`,
  ];

  return lines.join('\n');
}
