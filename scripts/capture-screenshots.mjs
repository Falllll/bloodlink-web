#!/usr/bin/env node
// Capture the README screenshots from a running stack.
//
// This script does NOT start anything. The backend (localhost:8000, seeded) and
// `npm run dev` (localhost:3000) must already be up. See README "Screenshots".
//
//   BL_EMAIL=... BL_PASSWORD=... \
//   BL_ADMIN_EMAIL=... BL_ADMIN_PASSWORD=... node scripts/capture-screenshots.mjs
//
// Two accounts because the app routes by role (src/lib/auth/roles.ts): staff
// sent to /admin lands on /dashboard, admin sent to /dashboard lands on /admin.
//
// It refuses to write a screenshot of an empty page, or of a page that
// redirected somewhere else. A README screenshot whose job is to show data is
// worse than no screenshot at all when it is wrong: it looks finished and
// proves nothing.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const BASE_URL = process.env.BL_BASE_URL ?? 'http://localhost:3000';
// One signed-in browser context per account. `as` on a private shot picks one.
const ACCOUNTS = {
  staff: { email: process.env.BL_EMAIL, password: process.env.BL_PASSWORD, vars: 'BL_EMAIL / BL_PASSWORD' },
  admin: {
    email: process.env.BL_ADMIN_EMAIL,
    password: process.env.BL_ADMIN_PASSWORD,
    vars: 'BL_ADMIN_EMAIL / BL_ADMIN_PASSWORD',
  },
};
const OUT_DIR = path.resolve('docs/screenshots');
const LOCALE = process.env.BL_LOCALE ?? 'id';

// Viewport chosen so the admin tables are not horizontally cramped.
// deviceScaleFactor 2 because these are read by humans on retina displays.
const VIEWPORT = { width: 1440, height: 900 };
const SCALE = 2;

/**
 * Every shot declares how to tell "loaded with data" from "loaded and empty".
 *
 * - `needs`: a selector that must exist before we shoot.
 * - `minRows`: how many matches of `rowSelector` prove the page really has data.
 *   A page listed with minRows > 0 that renders fewer is a hard failure.
 *   `rowSelector` must match DATA rows only. Never a bare `li`: that matches
 *   navigation links, which is how a photo of /admin once passed as dashboard.
 * - `as`: which account (private shots only).
 * - `act`: optional interaction to run before shooting.
 */
const PUBLIC_SHOTS = [
  {
    name: 'landing',
    url: '/',
    fullPage: true,
    needs: 'main',
  },
  {
    name: 'landing-self-check',
    url: '/',
    needs: 'form',
    async act(page) {
      // Scroll the eligibility self-check into view and answer it, so the shot
      // shows a real verdict instead of a blank form.
      const section = page.locator('section', { has: page.locator('form') }).first();
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    },
  },
  {
    name: 'login',
    url: '/login',
    needs: '#email',
  },
];

const PRIVATE_SHOTS = [
  {
    name: 'dashboard',
    url: '/dashboard',
    as: 'staff',
    needs: 'main',
    minRows: 1,
    // Inventory table rows (inventory-table.tsx). The matching-status panel also
    // renders tables, but each sits inside a campaign <li> — excluded here so a
    // dashboard with no stock cannot pass on campaign rows.
    rowSelector: 'main table:not(li table) > tbody > tr',
  },
  {
    name: 'dashboard-map',
    url: '/dashboard/map',
    as: 'staff',
    // Leaflet needs its tiles painted before the shot is worth anything.
    needs: '.leaflet-container',
    async act(page) {
      await page.waitForSelector('.leaflet-tile-loaded', { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(1_500);
    },
  },
  {
    name: 'dashboard-conversations',
    url: '/dashboard/conversations',
    as: 'staff',
    needs: 'main',
  },
  { name: 'admin', url: '/admin', as: 'admin', needs: 'main' },
  // The four admin lists below each render their data as one table; a bare
  // `li` there would match only chart legends and donor flag sub-lists.
  {
    name: 'admin-donors',
    url: '/admin/donors',
    as: 'admin',
    needs: 'main',
    minRows: 1,
    rowSelector: 'main tbody tr',
  },
  {
    name: 'admin-facilities',
    url: '/admin/facilities',
    as: 'admin',
    needs: 'main',
    minRows: 1,
    rowSelector: 'main tbody tr',
  },
  {
    name: 'admin-reports',
    url: '/admin/reports',
    as: 'admin',
    needs: 'main',
    fullPage: true,
  },
  {
    name: 'admin-audit-logs',
    url: '/admin/audit-logs',
    as: 'admin',
    needs: 'main',
    minRows: 1,
    rowSelector: 'main tbody tr',
  },
  {
    name: 'admin-staff',
    url: '/admin/staff',
    as: 'admin',
    needs: 'main',
    minRows: 1,
    rowSelector: 'main tbody tr',
  },
];

const failures = [];
const written = [];

async function preflight() {
  const problems = [];
  for (const [role, account] of Object.entries(ACCOUNTS)) {
    if (!account.email || !account.password) {
      problems.push(
        `${account.vars} not set: every ${role} shot will be recorded as MISSING (FAIL).\n` +
          '  Credentials live in the Notion reference page, not in this repo.',
      );
    }
  }
  for (const [label, url] of [
    ['web dev server', `${BASE_URL}/login`],
    ['backend API', `${process.env.BL_API_PING ?? 'http://localhost:8000/api/v1/ping'}`],
  ]) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 500) problems.push(`${label} answered HTTP ${res.status} at ${url}`);
    } catch (err) {
      problems.push(`${label} is unreachable at ${url} (${err.code ?? err.message})`);
    }
  }
  return problems;
}

async function shoot(page, shot, group) {
  const target = `${BASE_URL}${shot.url}`;
  process.stdout.write(`  ${shot.name.padEnd(28)}`);

  const res = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  if (res && res.status() >= 400) {
    failures.push(`${shot.name}: HTTP ${res.status()} at ${shot.url}`);
    console.log(`HTTP ${res.status()}  SKIPPED`);
    return;
  }

  // ANY redirect is a failure, not just /login: the proxy sends a wrong-role
  // account to its own home, and that page would be filed under this name.
  const landed = new URL(page.url()).pathname;
  if (landed !== shot.url) {
    const why = landed.startsWith('/login')
      ? 'the session cookie was not accepted'
      : `the ${group === 'private' ? `${shot.as} account` : 'visitor'} is not allowed on ${shot.url}`;
    failures.push(`${shot.name}: REDIRECTED from ${shot.url} to ${landed} — ${why}`);
    console.log(`REDIRECTED to ${landed}  SKIPPED`);
    return;
  }

  if (shot.needs) {
    try {
      // `attached`, not the default `visible`: an element that is present but
      // still empty has zero height, and Playwright calls that invisible. With
      // the default we would report "selector never appeared" for a page whose
      // real problem is "rendered with no data" — the wrong diagnosis, and the
      // one case this script exists to catch. Presence here, emptiness below.
      await page.waitForSelector(shot.needs, { state: 'attached', timeout: 20_000 });
    } catch {
      failures.push(`${shot.name}: selector ${shot.needs} never appeared in the DOM`);
      console.log(`no ${shot.needs}  SKIPPED`);
      return;
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  if (shot.act) await shot.act(page);
  await page.waitForTimeout(500);

  let count = null;
  if (shot.minRows) {
    // Give slow data a chance to arrive before calling the page empty: counting
    // while the list still says "loading" would be the wrong diagnosis.
    await page.locator(shot.rowSelector).first().waitFor({ state: 'attached', timeout: 60_000 }).catch(() => {});
    count = await page.locator(shot.rowSelector).count();
    if (count < shot.minRows) {
      failures.push(
        `${shot.name}: found ${count} row(s), expected at least ${shot.minRows}. ` +
          'The page rendered but it is empty — re-run the seeder instead of shipping this shot.',
      );
      console.log(`${count} rows — EMPTY, SKIPPED`);
      return;
    }
  }

  const file = path.join(OUT_DIR, `${shot.name}.png`);
  await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
  const rows = count === null ? '' : ` (${count} rows)`;
  written.push(`${shot.name}.png${rows}`);
  console.log(`ok${rows}`);
}

async function signIn(context, account) {
  const page = await context.newPage();
  // `load`, not `domcontentloaded`: filling before React hydrates lets
  // hydration reset the controlled inputs, and the form posts empty (422).
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.fill('#email', account.email);
  await page.fill('#password', account.password);
  if ((await page.inputValue('#email')) !== account.email || !(await page.inputValue('#password'))) {
    console.error('  ! login fields were reset after filling');
  }
  // Record the API's error.code (never the message, never the credentials).
  page.on('response', async (res) => {
    if (!res.url().endsWith('/bff/auth/login') || res.ok()) return;
    const code = await res.json().then((b) => b?.error?.code).catch(() => undefined);
    console.error(`  ! sign-in answered HTTP ${res.status()} ${code ?? ''}`);
  });
  await Promise.all([
    // Generous: the dev API on Docker for Windows has answered login in >30s.
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 90_000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  const ok = !new URL(page.url()).pathname.startsWith('/login');
  await page.close();
  return ok;
}

async function main() {
  const problems = await preflight();
  for (const p of problems) console.error(`! ${p}`);
  if (problems.some((p) => p.includes('unreachable') || p.includes('HTTP 5'))) {
    console.error('\nNothing was captured. Bring the stack up first.');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SCALE,
    locale: LOCALE === 'id' ? 'id-ID' : LOCALE,
    colorScheme: 'light',
  });

  console.log(`\nPublic pages -> ${path.relative(process.cwd(), OUT_DIR)}`);
  const page = await context.newPage();
  for (const shot of PUBLIC_SHOTS) await shoot(page, shot, 'public');
  await page.close();

  await context.close();

  // Separate context per account so the two sessions' cookies never mix.
  for (const [role, account] of Object.entries(ACCOUNTS)) {
    const shots = PRIVATE_SHOTS.filter((shot) => shot.as === role);
    console.log(`\nPrivate pages as ${role}`);
    const missing = (reason) => {
      for (const shot of shots) {
        failures.push(`${shot.name}: MISSING — ${reason}`);
        console.log(`  ${shot.name.padEnd(28)}MISSING`);
      }
    };

    if (!account.email || !account.password) {
      missing(`${account.vars} not set`);
      continue;
    }

    const authedContext = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: SCALE,
      locale: LOCALE === 'id' ? 'id-ID' : LOCALE,
      colorScheme: 'light',
    });
    if (await signIn(authedContext, account)) {
      const authed = await authedContext.newPage();
      for (const shot of shots) await shoot(authed, shot, 'private');
      await authed.close();
    } else {
      missing(`sign-in failed — check ${account.vars} against the seeded accounts`);
    }
    await authedContext.close();
  }
  await browser.close();

  await writeFile(
    path.join(OUT_DIR, 'MANIFEST.txt'),
    [
      `captured: ${new Date().toISOString()}`,
      `base url: ${BASE_URL}`,
      `locale:   ${LOCALE}`,
      `viewport: ${VIEWPORT.width}x${VIEWPORT.height} @${SCALE}x`,
      '',
      ...written.map((f) => `ok   ${f}`),
      ...failures.map((f) => `FAIL ${f}`),
    ].join('\n') + '\n',
  );

  console.log(`\n${written.length} written, ${failures.length} failed.`);
  if (failures.length) {
    console.error('\nFailures:');
    for (const f of failures) console.error(`  - ${f}`);
    console.error('\nThe README references every name above. Fix the cause and re-run;');
    console.error('do not commit a README pointing at a screenshot that was never written.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
