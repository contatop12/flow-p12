"use strict";

/**
 * Workers Builds (Git) corre `npm clean-install` e depois o comando de deploy
 * (por defeito `npx wrangler deploy`). O OpenNext exige `opennextjs-cloudflare build`
 * antes — este script corre só em CI da Cloudflare (WORKERS_CI=1) para gerar `.open-next`.
 *
 * Preferível: no painel, Deploy = `npm run deploy` ou Build = `npm run cf:build`.
 * @see https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
 */
const { execSync } = require("node:child_process");
const path = require("node:path");

const cwd = process.cwd();
const looksLikeCfBuildImage =
  cwd.startsWith("/opt/buildhome") || cwd.includes("/buildhome/");
const onWorkersBuilds =
  process.env.WORKERS_CI === "1" ||
  process.env.WORKERS_CI === "true" ||
  (process.env.CI === "true" && looksLikeCfBuildImage);

if (!onWorkersBuilds) {
  process.exit(0);
}

const root = path.join(__dirname, "..");
console.log("[flow-p12] WORKERS_CI=1: a correr OpenNext build…");
execSync("npm run cf:build", { stdio: "inherit", cwd: root, env: process.env });
