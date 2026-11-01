# PixelAlchemy — Creative Digital Playground

PixelAlchemy is a browser-based creative app for making generative patterns, freehand paintings, and interactive 3D scenes. It is built with React and Vite and stores saved artwork in browser Local Storage.

## Features

- **Pattern Studio:** Create Bloom, Spiral, Waves, and Particles artwork, customize palettes, and download PNG images.
- **Painting Studio:** Draw with a brush, pencil, or eraser; choose colors and brush sizes; undo, redo, and save paintings.
- **3D Art Studio:** Build scenes with cubes, spheres, cylinders, cones, toruses, pyramids, hearts, stars, and custom geometric shapes. Adjust materials, colors, rotation, object position and size, camera zoom, lighting, and shadows. Export or import a scene as JSON and download a PNG snapshot.
- **Gallery:** Save and revisit Pattern, Painting, and 3D Art creations. Gallery entries are stored in your browser.
- **Frontend only:** No backend service or database is required.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A modern browser with WebGL enabled for the 3D Art Studio

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Available commands

```bash
npm run dev      # Start the development server
npm run lint     # Run ESLint
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run deploy   # Build and publish dist/ to the gh-pages branch
```

## Deploy to GitHub Pages

The Vite base path is configured for this repository at `/PixelAlchemy/`. To deploy, make sure your GitHub account is authorized in Git Credential Manager, then run:

```bash
npm run deploy
```

In the repository's GitHub settings, open **Pages** and select the `gh-pages` branch with the `/ (root)` folder as the publishing source if GitHub Pages is not already enabled. The site URL is `https://hemalatha102.github.io/PixelAlchemy/`.

## Saving artwork

Use **Save to Gallery** in a studio to store a creation in Local Storage in the current browser. Clearing browser site data removes these saved creations. Use the 3D Studio's JSON export to back up and later import a 3D scene.

## Project structure

```text
src/
  components/
    ArtCanvas.jsx
    PaintingCanvas.jsx
    ThreeDArtStudio.jsx
    ThreeDArtStudio.css
  utils/
    artGenerators.js
  App.jsx
  App.css
  index.css
  main.jsx
```

## Technologies

React, JavaScript, Vite, Three.js, HTML Canvas API, CSS, and browser Local Storage.
