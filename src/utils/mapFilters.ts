import { CITIES, CityData, PROVINCES, ProvinceData, RegionId } from '../data/sierraLeoneData';

export function getCityById(id: string): CityData {
  return CITIES.find((c) => c.id === id) || CITIES[0];
}

export function getProvinceById(id: RegionId): ProvinceData {
  return PROVINCES.find((p) => p.id === id) || PROVINCES[0];
}

export function filterCities(
  cities: CityData[],
  searchQuery: string,
  regionFilter: RegionId | null,
  showAllCities: boolean
): CityData[] {
  const q = searchQuery.trim().toLowerCase();

  return cities.filter((city) => {
    if (regionFilter && city.regionId !== regionFilter) {
      return false;
    }

    if (q.length > 0) {
      const matchesName = city.name.toLowerCase().includes(q);
      const matchesRegion = city.regionName.toLowerCase().includes(q);
      const matchesDistrict = city.keyFacts.district.toLowerCase().includes(q);
      const matchesKnownFor = city.knownFor.toLowerCase().includes(q);
      return matchesName || matchesRegion || matchesDistrict || matchesKnownFor;
    }

    if (!showAllCities && !regionFilter) {
      return city.isMajor;
    }

    return true;
  }).sort((a, b) => {
    if (!q) return 0;
    const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : a.name.toLowerCase().includes(q) ? 1 : 2;
    const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : b.name.toLowerCase().includes(q) ? 1 : 2;
    return aStarts - bStarts;
  });
}

export function filterProvinces(provinces: ProvinceData[], searchQuery: string): ProvinceData[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return provinces;
  return provinces.filter(
    (prov) =>
      prov.name.toLowerCase().includes(q) ||
      prov.capitalName.toLowerCase().includes(q) ||
      prov.districts.some((d) => d.toLowerCase().includes(q))
  );
}

export function getSiblingCities(city: CityData): CityData[] {
  if (city.siblingCityIds && city.siblingCityIds.length > 0) {
    const resolved = city.siblingCityIds
      .map((id) => CITIES.find((c) => c.id === id))
      .filter((c): c is CityData => Boolean(c) && c.id !== city.id);
    if (resolved.length > 0) {
      return resolved.slice(0, 5);
    }
  }
  return CITIES.filter((c) => c.regionId === city.regionId && c.id !== city.id).slice(0, 5);
}

export function clampZoom(zoom: number, min = 0.85, max = 2.5): number {
  return Math.min(max, Math.max(min, Number(zoom.toFixed(2))));
}

export function findNearestCityAtPoint(
  mapX: number,
  mapY: number,
  maxRadius = 24
): CityData | null {
  let best: CityData | null = null;
  let bestDist = maxRadius;

  for (const city of CITIES) {
    const dx = city.mapX - mapX;
    const dy = city.mapY - mapY;
    const dist = Math.hypot(dx, dy);
    if (dist <= bestDist) {
      bestDist = dist;
      best = city;
    }
  }

  return best;
}
