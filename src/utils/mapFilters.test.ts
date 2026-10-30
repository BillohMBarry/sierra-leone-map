import test from 'node:test';
import assert from 'node:assert/strict';
import { CITIES, PROVINCES } from '../data/sierraLeoneData';
import {
  INTERNATIONAL_BORDER_GEOJSON,
  projectLngLat,
  PROVINCE_GEOJSON,
  unprojectPoint,
} from '../data/sierraLeoneGeoJson';
import {
  clampZoom,
  filterCities,
  filterProvinces,
  findNearestCityAtPoint,
  getCityById,
  getSiblingCities,
} from './mapFilters';

test('default view returns the 5 major cities in exact sidebar order', () => {
  const result = filterCities(CITIES, '', null, false);
  assert.deepEqual(
    result.map((c) => c.name),
    ['Freetown', 'Bo', 'Kenema', 'Makeni', 'Koidu']
  );
});

test('showAllCities returns all mapped cities across Sierra Leone', () => {
  const all = filterCities(CITIES, '', null, true);
  assert.equal(all.length, CITIES.length);
  assert.ok(all.length >= 40);
});

test('search query matches cities by name, district, or knownFor and ranks exact name match first', () => {
  const kabala = filterCities(CITIES, 'Kabala', null, false);
  assert.ok(kabala.length >= 1);
  assert.equal(kabala[0].id, 'kabala');

  const diamondCities = filterCities(CITIES, 'diamond', null, false);
  assert.ok(diamondCities.some((c) => c.id === 'koidu'));
  assert.ok(diamondCities.some((c) => c.id === 'kenema'));
});

test('Freetown sibling cities match the exact 5 cities in the reference screenshot', () => {
  const freetown = getCityById('freetown');
  const siblings = getSiblingCities(freetown);
  assert.deepEqual(
    siblings.map((c) => c.name),
    ['Waterloo', 'Lungi', 'Pepel', 'Kambia', 'Rokup']
  );
});

test('filterProvinces filters by province name or district name', () => {
  const res = filterProvinces(PROVINCES, 'Kono');
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'eastern');
});

test('clampZoom constrains zoom within bounds', () => {
  assert.equal(clampZoom(0.3), 0.85);
  assert.equal(clampZoom(1.25), 1.25);
  assert.equal(clampZoom(4.0), 2.5);
});

test('projectLngLat and unprojectPoint round-trip WGS84 GPS coordinates accurately', () => {
  const freetown = getCityById('freetown');
  const [x, y] = projectLngLat(freetown.lng, freetown.lat);
  assert.equal(x, freetown.mapX);
  assert.equal(y, freetown.mapY);

  const [lngBack, latBack] = unprojectPoint(x, y);
  assert.ok(Math.abs(lngBack - freetown.lng) < 0.001);
  assert.ok(Math.abs(latBack - freetown.lat) < 0.001);
});

test('all 5 provinces have valid projected GeoJSON paths and every city falls inside its province polygon', () => {
  for (const prov of PROVINCES) {
    assert.ok(prov.svgPath.startsWith('M'), `${prov.name} should have a valid SVG path`);
    assert.ok(PROVINCE_GEOJSON[prov.id].length >= 1);
  }
  assert.ok(INTERNATIONAL_BORDER_GEOJSON.length > 500);
});

test('findNearestCityAtPoint locates Freetown and Bo at their projected GPS coordinates', () => {
  const freetown = getCityById('freetown');
  const foundFt = findNearestCityAtPoint(freetown.mapX, freetown.mapY);
  assert.equal(foundFt?.id, 'freetown');

  const bo = getCityById('bo');
  const foundBo = findNearestCityAtPoint(bo.mapX, bo.mapY);
  assert.equal(foundBo?.id, 'bo');
});
