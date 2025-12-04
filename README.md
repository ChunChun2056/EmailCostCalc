# EmailCostCalc

EmailCostCalc is a React + TypeScript calculator that estimates Amazon SES emailing costs (outbound, inbound, attachments, and dedicated IP add-ons). It is built with Vite and Tailwind, which makes it easy to run locally and now just as easy to deploy on Vercel.

## Prerequisites

- [Node.js 20+](https://nodejs.org/en/download) (Vercel also uses Node 20 by default)
- pnpm/npm (the project currently uses npm via the `package-lock.json`)
- [Vercel CLI](https://vercel.com/docs/cli) if you want to deploy from your machine

Install dependencies:

```bash
npm install
```

## Local development

```bash
npm run dev
```

This starts Vite with hot module reloading at `http://localhost:5173`. ESLint and TypeScript configs are already set up:

```bash
npm run lint
npm run build    # Type-checks via tsc -b and outputs to dist/
```

## Deploying to Vercel

The repo includes a `vercel.json` configured for a static build with SPA-style routing:

- `@vercel/static-build` runs `npm run vercel-build` (which simply delegates to `npm run build`).
- The build output is the Vite `dist/` directory.
- A catch-all route rewrites back to `index.html` so client-side routing keeps working on hard refreshes.

### Quick start (with Vercel CLI)

```bash
vercel login
vercel link        # select or create the Vercel project
vercel --prod      # first deployment
```

The CLI will detect `vercel.json`, call `npm run vercel-build`, and upload the generated `dist/` assets.

### Deploy from GitHub

1. Push this repository to GitHub (or another Git provider) and import it in the Vercel dashboard.
2. Framework preset: **Vite**.
3. Build command: `npm run vercel-build`
4. Output directory: `dist`
5. Trigger a production deployment from the Vercel dashboard.

That is all that is needed—no extra environment variables or serverless functions are required for this static calculator.
