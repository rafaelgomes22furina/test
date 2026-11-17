/**
 * [MUDANÇA · LOJAS REAIS] Horário de funcionamento calculado a partir do relógio REAL.
 * No protótipo o texto era fixo ("Aberta · fecha às 22h"). Agora cada loja tem uma grade
 * semanal e o status ("Aberta", "Fecha em 30 min", "Fechada · abre amanhã às 10h") é calculado
 * no momento da consulta, no fuso de Brasília.
 *
 * hours = { 0:[abre,fecha], 1:[...], ... 6:[...] }  (0 = domingo; null = fechada o dia todo)
 * Cada horário é "HH:MM".
 */
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const SHORT_TO_DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fmtH = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
};

/** Componentes de data/hora de `now` no fuso informado (Intl, sem depender do fuso do servidor). */
function localParts(now, timeZone = 'America/Sao_Paulo') {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
  return {
    dow: SHORT_TO_DOW[p.weekday],
    minutes: Number(p.hour) * 60 + Number(p.minute),
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
  };
}

/** Próxima abertura a partir de agora → { dayOffset, dow, openMin } */
function nextOpening(hours, loc) {
  const today = hours[loc.dow];
  if (today && loc.minutes < toMin(today[0])) return { dayOffset: 0, dow: loc.dow, openMin: toMin(today[0]) };
  for (let d = 1; d <= 7; d++) {
    const dow = (loc.dow + d) % 7;
    if (hours[dow]) return { dayOffset: d, dow, openMin: toMin(hours[dow][0]) };
  }
  return null;
}

function storeStatus(hours, now = new Date(), timeZone) {
  const loc = localParts(now, timeZone);
  const today = hours[loc.dow];
  if (today && loc.minutes >= toMin(today[0]) && loc.minutes < toMin(today[1])) {
    const left = toMin(today[1]) - loc.minutes;
    return {
      openNow: true,
      closesInMinutes: left,
      text: left <= 60 ? `Fecha em ${left} min` : `Aberta · fecha às ${fmtH(toMin(today[1]))}`,
    };
  }
  const nx = nextOpening(hours, loc);
  if (!nx) return { openNow: false, text: 'Fechada' };
  const when = nx.dayOffset === 0 ? 'hoje' : nx.dayOffset === 1 ? 'amanhã' : DAY_NAMES[nx.dow];
  return { openNow: false, text: `Fechada · abre ${when} às ${fmtH(nx.openMin)}` };
}

/**
 * Previsão de "pronto para retirada": agora + preparo se a loja estiver aberta com folga;
 * senão, a próxima abertura + preparo.
 */
function estimatedReadyAt(hours, now, { prepMinutes = 60, utcOffsetMinutes = -180, timeZone } = {}) {
  const loc = localParts(now, timeZone);
  const today = hours[loc.dow];
  const prepMs = prepMinutes * 60000;
  if (today && loc.minutes >= toMin(today[0]) && loc.minutes + prepMinutes <= toMin(today[1])) {
    return new Date(now.getTime() + prepMs);
  }
  const nx = nextOpening(hours, loc);
  if (!nx) return null;
  // meia-noite local do dia alvo → UTC, depois soma abertura + preparo
  const localMidnightUtc = Date.UTC(loc.year, loc.month - 1, loc.day + nx.dayOffset) - utcOffsetMinutes * 60000;
  return new Date(localMidnightUtc + (nx.openMin + prepMinutes) * 60000);
}

module.exports = { storeStatus, estimatedReadyAt, localParts, toMin, fmtH };
