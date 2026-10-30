import test from 'node:test';
import assert from 'node:assert/strict';
import { getCityById, getProvinceById } from './mapFilters';
import {
  buildWhatsAppFieldReportMessage,
  createInitialTelemetryStore,
  DATA_LAYERS,
  formatMetricsToCsv,
  formatMetricsToJson,
  resolveChoroplethStyle,
  simulateTelemetryTick,
} from './telemetryEngine';

test('DATA_LAYERS defines all 5 required layers in exact order', () => {
  assert.deepEqual(
    DATA_LAYERS.map((l) => l.id),
    ['political', 'healthcare', 'telecom', 'energy', 'agri_trade']
  );
});

test('resolveChoroplethStyle returns political color for political layer and tier colors for metric layers', () => {
  const pol = resolveChoroplethStyle('political', 88, '#5ba4eb');
  assert.equal(pol.fillColor, '#5ba4eb');

  const optHealth = resolveChoroplethStyle('healthcare', 88.4, '#5ba4eb');
  assert.equal(optHealth.tier, 'Optimal');
  assert.equal(optHealth.fillColor, '#10b981');

  const modEnergy = resolveChoroplethStyle('energy', 62.5, '#bbe4a4');
  assert.equal(modEnergy.tier, 'Moderate');
});

test('simulateTelemetryTick updates scores and timestamps deterministically across all 5 regions', () => {
  const initial = createInitialTelemetryStore();
  const next = simulateTelemetryTick(initial, 1, '2026-10-29T13:25:00Z');

  assert.equal(next.western.healthcare.lastUpdatedIso, '2026-10-29T13:25:00Z');
  assert.notEqual(next.western.healthcare.primaryScore, initial.western.healthcare.primaryScore);
  assert.ok(next.eastern.agri_trade.primaryScore >= 48 && next.eastern.agri_trade.primaryScore <= 98.5);
});

test('formatMetricsToCsv and formatMetricsToJson serialize valid regional telemetry', () => {
  const store = createInitialTelemetryStore();
  const freetown = getCityById('freetown');
  const western = getProvinceById('western');

  const csv = formatMetricsToCsv(freetown, western, 'healthcare', store);
  const lines = csv.split('\n');
  assert.equal(lines.length, 5); // 1 header + 4 subMetrics
  assert.ok(lines[0].includes('City,Region,GPS_Latitude'));
  assert.ok(lines[1].includes('"Freetown"'));

  const jsonStr = formatMetricsToJson(freetown, western, 'telecom', store, []);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.city.id, 'freetown');
  assert.equal(parsed.activeLayer, 'telecom');
  assert.ok(parsed.regionalTelemetry.telecom.primaryScore > 80);
});

test('buildWhatsAppFieldReportMessage formats GPS, sector, score, and observation note', () => {
  const store = createInitialTelemetryStore();
  const bo = getCityById('bo');
  const msg = buildWhatsAppFieldReportMessage(
    bo,
    'energy',
    store.southern.energy,
    'Nominal',
    'CLSG 225kV substation operating at 99% voltage stability.',
    'Engr. Kamara'
  );

  assert.ok(msg.includes('SIERRA LEONE REGIONAL FIELD REPORT'));
  assert.ok(msg.includes('Bo (Bo District, Southern Province)'));
  assert.ok(msg.includes('CLSG 225kV substation'));
  assert.ok(msg.includes('Engr. Kamara'));
});
