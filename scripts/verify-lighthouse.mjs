#!/usr/bin/env node
/**
 * Lighthouse gate: builds the site, serves the production build, runs Lighthouse
 * (mobile + desktop) and exits 1 unless EVERY category scores 100 and the
 * `errors-in-console`, `inspector-issues` and `deprecations` audits pass.
 *
 *   node scripts/verify-lighthouse.mjs                # build + mobile + desktop
 *   node scripts/verify-lighthouse.mjs --skip-build   # reuse ./dist
 *   PORT=4000 FORM_FACTORS=mobile node scripts/verify-lighthouse.mjs
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const URL = `http://localhost:${PORT}/`;
const LIGHTHOUSE = `lighthouse@${process.env.LIGHTHOUSE_VERSION || '13.5.0'}`;
const FORM_FACTORS = (process.env.FORM_FACTORS || 'mobile,desktop').split(',').map(s => s.trim()).filter(Boolean);
const MUST_PASS = ['errors-in-console', 'inspector-issues', 'deprecations'];
const skipBuild = process.argv.includes('--skip-build');
const isWindows = process.platform === 'win32';

function run(command) {
  const result = spawnSync(command, { shell: true, stdio: 'inherit' });
  return result.status ?? 1;
}

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return false;
}

function startServer() {
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  server.stdout.on('data', d => (log += d));
  server.stderr.on('data', d => (log += d));
  return { server, log: () => log };
}

function audit(formFactor, outDir) {
  const out = join(outDir, `lighthouse-${formFactor}.json`);
  const chromeFlags = '--headless=new --no-sandbox';
  const preset = formFactor === 'desktop' ? ' --preset=desktop' : '';
  const q = isWindows ? '"' : "'";
  const cmd = `npx --yes ${LIGHTHOUSE} ${URL} --output=json --output-path=${q}${out}${q} --quiet${preset} --chrome-flags=${q}${chromeFlags}${q}`;
  console.log(`\n▶ Lighthouse (${formFactor})`);
  if (run(cmd) !== 0) throw new Error(`Lighthouse (${formFactor}) exited with an error`);
  return JSON.parse(readFileSync(out, 'utf8'));
}

function evaluate(report, formFactor) {
  const failures = [];
  console.log(`\n  ${formFactor.toUpperCase()} — Lighthouse ${report.lighthouseVersion}`);
  for (const [id, category] of Object.entries(report.categories)) {
    const score = category.score;
    const shown = score === null ? 'n/a' : Math.round(score * 100);
    console.log(`  ${score === 1 ? '✔' : '✘'} ${category.title.padEnd(20)} ${shown}`);
    if (score !== 1) {
      failures.push(`${formFactor}: ${category.title} = ${shown}`);
      for (const ref of category.auditRefs) {
        const a = report.audits[ref.id];
        if (ref.weight > 0 && a && a.score !== null && a.score < 1) {
          failures.push(`    ↳ ${ref.id}: ${a.score}${a.displayValue ? ` (${a.displayValue})` : ''}`);
        }
      }
    }
  }
  for (const id of MUST_PASS) {
    const a = report.audits[id];
    const ok = a && (a.score === 1 || a.scoreDisplayMode === 'notApplicable');
    console.log(`  ${ok ? '✔' : '✘'} audit ${id}`);
    if (!ok) {
      failures.push(`${formFactor}: audit ${id} failed`);
      for (const item of a?.details?.items ?? []) failures.push(`    ↳ ${JSON.stringify(item).slice(0, 300)}`);
    }
  }
  const m = id => report.audits[id]?.displayValue ?? '?';
  console.log(`  metrics: FCP ${m('first-contentful-paint')} · LCP ${m('largest-contentful-paint')} · TBT ${m('total-blocking-time')} · CLS ${m('cumulative-layout-shift')} · SI ${m('speed-index')}`);
  return failures;
}

async function main() {
  if (!skipBuild) {
    console.log('▶ npm run build');
    if (run('npm run build') !== 0) {
      console.error('✘ Build failed');
      process.exit(1);
    }
  }

  const { server, log } = startServer();
  const stop = () => {
    if (!server.killed) server.kill();
  };
  process.on('exit', stop);
  process.on('SIGINT', () => process.exit(130));

  if (!(await waitForServer(URL))) {
    console.error(`✘ Preview server did not start on ${URL}\n${log()}`);
    process.exit(1);
  }
  console.log(`▶ Serving production build at ${URL}`);

  const outDir = mkdtempSync(join(tmpdir(), 'ggsk-lighthouse-'));
  const failures = [];
  try {
    for (const formFactor of FORM_FACTORS) {
      failures.push(...evaluate(audit(formFactor, outDir), formFactor));
    }
  } catch (err) {
    failures.push(String(err instanceof Error ? err.message : err));
  } finally {
    stop();
  }

  console.log(`\n  Reports: ${outDir}`);
  if (failures.length) {
    console.error(`\n✘ Lighthouse gate FAILED\n${failures.join('\n')}`);
    process.exit(1);
  }
  console.log('\n✔ Lighthouse gate passed: every category 100, no console errors, no issues, no deprecations.');
}

main();
