#!/usr/bin/env node
// check-scheduler.mjs — verifica execução perdida do Windows Task Scheduler.
// O radar deveria rodar às 00:00, 04:00, 08:00, 12:00, 16:00 e 20:00.
// Para cada janela já vencida sem log correspondente, registra MISSED_RUN.
// Uso: node scripts/check-scheduler.mjs
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const LOG_DIR = path.join(ROOT, '.automation', 'logs');
const SLOTS = [0, 4, 8, 12, 16, 20];
const WINDOW_H = 4;           // uma execução deve constar dentro da sua janela de 4 h
const GRACE_MIN = 30;         // tolerância extra após o fim da janela

function slotStart(date, hour) {
  const d = new Date(date); d.setHours(hour, 0, 0, 0); return d;
}

function parseLogTime(name) {
  // run-YYYY-MM-DDTHH-MM-SS-...Z.json
  const m = name.match(/^run-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d+)Z\.json$/);
  if (!m) return null;
  const iso = `${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`;
  const t = new Date(iso);
  return isNaN(t.getTime()) ? null : t;
}

function main() {
  const now = new Date();
  const logs = existsSync(LOG_DIR) ? readdirSync(LOG_DIR) : [];
  const times = logs.map(parseLogTime).filter(Boolean).filter((t) => t <= now);

  console.log('=== CHECK SCHEDULER (janelas: ' + SLOTS.join(', ') + 'h) ===');
  console.log('Agora: ' + now.toISOString());
  console.log('Logs encontrados: ' + times.length + '\n');

  // Considera as últimas 24h para achar janelas vencidas.
  const missed = [];
  for (let d = 0; d < 24; d += 4) {
    const day = new Date(now); day.setDate(day.getDate() - Math.floor(d / 24));
    for (const h of SLOTS) {
      const start = slotStart(day, h);
      if (start > now) continue;
      const end = new Date(start); end.setHours(end.getHours() + WINDOW_H + (GRACE_MIN / 60));
      if (end > now) continue; // janela ainda não terminou
      const has = times.some((t) => t >= start && t < end);
      if (!has) missed.push({ slot: start });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const m of missed) {
    const k = m.slot.toISOString();
    if (!seen.has(k)) { seen.add(k); unique.push(m); }
  }

  if (unique.length === 0) {
    console.log('OK — nenhuma execução perdida nas janelas vencidas.');
  } else {
    for (const m of unique) {
      console.log('MISSED_RUN  ' + m.slot.toISOString() + '  (execução esperada não encontrada nos logs)');
    }
    console.log('\n' + unique.length + ' execução(ões) perdida(s) nas últimas 24h.');
    console.log('Atenção: não gera artigo automaticamente por causa disso; apenas registrado.');
  }
  process.exit(unique.length > 0 ? 3 : 0);
}

main();