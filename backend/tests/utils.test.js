const test = require('node:test');
const assert = require('node:assert/strict');
const { validateCepFormat } = require('../src/utils/cep');
const { isValidCpf, maskCpf } = require('../src/utils/cpf');
const { haversineKm } = require('../src/utils/geo');
const { storeStatus, estimatedReadyAt } = require('../src/utils/hours');

test('CEP: formatos válidos', () => {
  assert.deepEqual(validateCepFormat('93010-000'), { valid: true, digits: '93010000', formatted: '93010-000' });
  assert.equal(validateCepFormat('93010000').formatted, '93010-000');
  assert.equal(validateCepFormat('  90110-000 ').valid, true);
});

test('CEP: formatos inválidos', () => {
  for (const bad of ['', '   ', '1234', '123456789', '9301-0000', 'abcde-fgh', '93010-00a', '00000-000', '11111111', '99999-999']) {
    assert.equal(validateCepFormat(bad).valid, false, `deveria rejeitar "${bad}"`);
  }
  assert.equal(validateCepFormat('').code, 'CEP_OBRIGATORIO');
  assert.equal(validateCepFormat('123').code, 'CEP_INVALIDO');
  assert.equal(validateCepFormat(null).valid, false);
});

test('CPF: válido, inválido e máscara', () => {
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('52998224725'), true);
  assert.equal(isValidCpf('529.982.247-24'), false);
  assert.equal(isValidCpf('111.111.111-11'), false);
  assert.equal(isValidCpf('123'), false);
  assert.equal(maskCpf('52998224725'), '***.982.247-**');
  assert.equal(maskCpf('123'), '');
});

test('geo: haversine Porto Alegre ↔ São Leopoldo ≈ 27–30 km', () => {
  const d = haversineKm(-30.0487, -51.2299, -29.7603, -51.1489);
  assert.ok(d > 25 && d < 35, `distância ${d}`);
  assert.equal(haversineKm(-30, -51, -30, -51), 0);
});

// Brasil = UTC-3 sem horário de verão: 13:00Z = 10:00 em Brasília
const HOURS = { 0: ['14:00', '20:00'], 1: ['10:00', '22:00'], 2: ['10:00', '22:00'], 3: ['10:00', '22:00'], 4: ['10:00', '22:00'], 5: ['10:00', '22:00'], 6: ['10:00', '22:00'] };

test('horário: aberta, fechando, fechada hoje/amanhã', () => {
  // quarta 2026-11-18 15:00 local (18:00Z)
  assert.deepEqual(storeStatus(HOURS, new Date('2026-11-18T18:00:00Z')), { openNow: true, closesInMinutes: 420, text: 'Aberta · fecha às 22h' });
  assert.equal(storeStatus(HOURS, new Date('2026-11-19T00:30:00Z')).text, 'Fecha em 30 min'); // quarta 21:30 local
  // quarta 23:00 local (02:00Z de quinta) → abre amanhã às 10h
  assert.equal(storeStatus(HOURS, new Date('2026-11-19T02:00:00Z')).text, 'Fechada · abre amanhã às 10h');
  // quarta 07:00 local → abre hoje às 10h
  assert.equal(storeStatus(HOURS, new Date('2026-11-18T10:00:00Z')).text, 'Fechada · abre hoje às 10h');
  // domingo 2026-11-15 10:00 local → domingo abre às 14h
  assert.equal(storeStatus(HOURS, new Date('2026-11-15T13:00:00Z')).text, 'Fechada · abre hoje às 14h');
});

test('horário: sábado à noite → próxima abertura domingo; domingo à noite → segunda', () => {
  assert.equal(storeStatus(HOURS, new Date('2026-11-22T01:00:00Z')).text, 'Fechada · abre amanhã às 14h'); // sáb 22:00… = dom 01:00Z → sáb 22:00 local
  assert.equal(storeStatus(HOURS, new Date('2026-11-16T01:00:00Z')).text, 'Fechada · abre amanhã às 10h'); // domingo 22:00 local → segunda 10h
});

test('horário: previsão de pronto (aberta com folga, perto do fechamento e fechada)', () => {
  const opts = { prepMinutes: 60, utcOffsetMinutes: -180 };
  // quarta 15:00 local → +1h
  assert.equal(estimatedReadyAt(HOURS, new Date('2026-11-18T18:00:00Z'), opts).toISOString(), '2026-11-18T19:00:00.000Z');
  // quarta 21:30 local (sem 1h de folga até 22h) → quinta 10h + 1h = 11:00 local = 14:00Z
  assert.equal(estimatedReadyAt(HOURS, new Date('2026-11-19T00:30:00Z'), opts).toISOString(), '2026-11-19T14:00:00.000Z');
  // quarta 07:00 local → hoje 10h + 1h = 11:00 local = 14:00Z
  assert.equal(estimatedReadyAt(HOURS, new Date('2026-11-18T10:00:00Z'), opts).toISOString(), '2026-11-18T14:00:00.000Z');
});
