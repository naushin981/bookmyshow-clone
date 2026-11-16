# Reel Rush frontend

This folder contains the standalone Angular frontend. For the full-stack local setup, see the [project README](../README.md).

## Run

```bash
npm install
npm start
```

The Angular development server runs at `http://localhost:4200` and proxies `/api` to the backend at `http://localhost:3000`. Start the backend separately from `../backend` with `npm install` and `npm start`, or use `npm run dev` from the project root to start both services together.

## Build and test

```bash
npm run build
npm test
```
