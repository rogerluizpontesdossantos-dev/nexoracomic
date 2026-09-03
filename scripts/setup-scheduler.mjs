// setup-scheduler.mjs — configura a tarefa agendada do Windows Task Scheduler
// Executa a cada 4 horas usando scripts/auto-run.mjs
import { execSync } from 'node:child_process';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const PROJECT_ROOT = process.cwd();
const TASK_NAME = 'NexoraComic-GTA6-Radar';
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'auto-run.mjs');
const NODE_PATH = process.execPath;

function run(cmd) {
  console.log('> ' + cmd);
  return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8', timeout: 30000 });
}

function taskExists() {
  try {
    const out = run(`schtasks /query /tn "${TASK_NAME}" 2>&1`);
    return out.includes(TASK_NAME);
  } catch {
    return false;
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  NEXORACOMIC — CONFIGURAÇÃO DO AGENDADOR');
console.log('  Tarefa: ' + TASK_NAME);
console.log('  Projeto: ' + PROJECT_ROOT);
console.log('  Script: ' + SCRIPT_PATH);
console.log('  Node: ' + NODE_PATH);
console.log('═══════════════════════════════════════════════════════════\n');

if (!existsSync(SCRIPT_PATH)) {
  console.error('❌ Script não encontrado: ' + SCRIPT_PATH);
  process.exit(1);
}

if (taskExists()) {
  console.log('⚠ Tarefa "' + TASK_NAME + '" já existe. Nenhuma alteração feita.');
  console.log('  Para recriar: exclua manualmente com:');
  console.log('  schtasks /delete /tn "' + TASK_NAME + '" /f');
  process.exit(0);
}

try {
  // Usar schtasks com parâmetros diretos (evita problemas de encoding)
  const cmd = `schtasks /create /tn "${TASK_NAME}" /tr "\\"${NODE_PATH}\\" \\"${SCRIPT_PATH}\\"" /sc HOURLY /mo 4 /f /st 00:00`;
  
  run(cmd);
  
  console.log('\n✅ Tarefa criada com sucesso!');
  console.log('  Nome: ' + TASK_NAME);
  console.log('  Frequência: a cada 4 horas');
  console.log('  Para verificar: schtasks /query /tn "' + TASK_NAME + '"');
  console.log('  Para executar agora: schtasks /run /tn "' + TASK_NAME + '"');
  console.log('  Para excluir: schtasks /delete /tn "' + TASK_NAME + '" /f');
} catch (err) {
  console.error('\n❌ Erro ao criar tarefa:', err.message);
  if (err.stderr) console.error(err.stderr);
  process.exit(1);
}