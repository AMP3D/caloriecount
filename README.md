# Calorie Counter

A lightweight PWA for tracking daily calorie intake. Runs on Android (installable via Chrome) and desktop browsers.
Gives you the ability to track calories via your own custom food database, free of ads and nonsense.

[Click here to access the app](https://amp3d.github.io/caloriecount)

## Tech Stack

- React + TypeScript (Vite)
- SCSS for styling
- @preact/signals-react for state
- Dexie.js (IndexedDB) for persistent storage
- vite-plugin-pwa for offline/installable support

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome. Use DevTools device mode for mobile layout.

## Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start dev server                |
| `npm run build`   | Type-check and production build |
| `npm run preview` | Preview production build        |
| `npm run format`  | Format code with Prettier       |
| `npm run lint`    | Lint with ESLint                |

## Install as PWA (Android)

1. Open the app URL in Chrome on Android
2. Tap the browser menu (⋮)
3. Select "Add to Home screen"
