# Bestow - Nx + Yarn v3 + Playwright

This repo uses Yarn 3 (Berry) with Nx and a Playwright E2E project.

## Prerequisites
- Node.js 18+
- Yarn 3 (set via `packageManager` in `package.json`)

## Install
```bash
yarn install
```

## Run E2E tests
```bash
yarn e2e
```
Runs Playwright using `apps/browserstack-e2e/playwright.config.ts`.

The test opens `https://www.browserstack.com` and asserts the title contains "BrowserStack".

## Structure
- `apps/browserstack-e2e`
  - `playwright.config.ts`
  - `tests/browserstack.spec.ts`
