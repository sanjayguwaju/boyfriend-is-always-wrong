# 🥊 Boyfriend Is Always Wrong

> A silly 3D couples boxing game — she punches, he always apologizes.

Built with **React 18**, **Vite 5**, and **Three.js** (full WebGL 3D ring, animated fighters, particle effects, and sound).

---

## ✨ Features

- 🎮 **3D boxing ring** with two animated fighters rendered in WebGL
- 👊 **Tap / click / spacebar** to punch
- 💬 **Sorry bubble** — boyfriend always apologizes with a random line
- 😭 **KO system** — patience bar fills up, then it's game over
- 💥 **Combo multiplier** — fast punches deal more damage
- 📸 **Photo upload** — replace the emoji faces with real photos (stored in localStorage)
- 🌙 **Dark mode** — respects `prefers-color-scheme`
- 📱 **Mobile-first** — vibration feedback, touch controls, safe-area support
- ♿ **Accessible** — `focus-visible` outlines, `prefers-reduced-motion` support

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start the dev server  →  http://localhost:5173
npm run dev

# Build for production  →  dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## 📁 Project Structure

```
boyfriend-is-always-wrong/
├── index.html                  # Entry HTML (SEO + OG meta tags)
├── vite.config.js              # Build config (chunking, target, sourcemaps)
├── netlify.toml                # Netlify deploy config (SPA redirect, headers, caching)
└── src/
    ├── main.jsx                # React root mount
    ├── App.jsx                 # Game state, punch logic, KO flow, sorry bubble
    ├── styles.css              # Global styles + responsive layout + dark mode
    ├── components/
    │   ├── Stats.jsx           # Punches / combo / sorries / best score display
    │   ├── PatienceBar.jsx     # HP bar (fills → KO)
    │   ├── Stage.jsx           # 3D canvas container + overlay tags + POW effects
    │   ├── Setup.jsx           # Name inputs + photo upload UI
    │   └── WinModal.jsx        # KO victory screen
    ├── game/
    │   ├── createGame.js       # Three.js ring, fighters, animation loop, particles
    │   ├── faces.js            # Canvas face textures (emoji default + photo upload)
    │   └── sound.js            # Web Audio API beeps
    ├── data/
    │   └── lines.js            # Boyfriend's sorry lines + KO line + POW words
    └── utils/
        └── photos.js           # Photo crop, localStorage persistence, best-score storage
```

---

## 🌐 Deploy to Netlify

### Option A — Git-based (recommended, auto-deploys on push)

1. Push this repo to GitHub.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
3. Connect your GitHub repo — Netlify auto-detects `netlify.toml` and fills in:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy** — done. Every push to `main` triggers a new deploy.

### Option B — Manual drag-and-drop

```bash
npm run build
# Drag the dist/ folder onto https://app.netlify.com/drop
```

### What `netlify.toml` configures

| Setting | Value | Why |
|---|---|---|
| Build command | `npm run build` | Runs Vite |
| Publish dir | `dist` | Vite output |
| Node version | 20 | LTS |
| SPA redirect | `/* → /index.html` | Prevents 404 on page refresh |
| Security headers | `X-Frame-Options`, CSP, etc. | Hardening |
| `/assets/*` cache | `max-age=31536000, immutable` | Hashed files cached forever |
| `/index.html` cache | `no-cache` | New deploys land immediately |

---

## 🎨 Customization

### Change names
Edit the default names in [`src/App.jsx`](src/App.jsx):
```js
const [names, setNames] = useState({ g: 'Shreeja', b: 'Sanjay' });
```
Or just type in the **Names & photos** panel inside the game — changes apply live.

### Add / edit sorry lines
Open [`src/data/lines.js`](src/data/lines.js) and add to `SORRY_LINES`:
```js
'Sorry {g}, you were right as always! 👑',
```
`{g}` is replaced at runtime with the girl's name.

### Upload real photos
Click **Names & photos** in the game → upload a photo for each fighter.  
Photos are cropped to a 256×256 circle and saved in `localStorage` — they survive page reloads.

---

## 🏗️ Tech Stack

| Tech | Version | Role |
|---|---|---|
| [React](https://react.dev) | 18.3 | UI & game state |
| [Vite](https://vitejs.dev) | 5.4 | Dev server + bundler |
| [Three.js](https://threejs.org) | 0.152 | 3D rendering |
| Web Audio API | — | Sound effects |
| localStorage | — | Photo + high-score persistence |

---

## 📦 Bundle Sizes (production, gzipped)

| Chunk | Gzipped |
|---|---|
| `three.js` (3D engine) | ~110 kB |
| `react.js` (React + React-DOM) | ~45 kB |
| `index.js` (app code) | ~7 kB |
| `index.css` | ~2 kB |

Three.js and React are split into their own cached chunks — re-deploying app code doesn't bust the browser cache for the large 3D library.

---

## 📜 License

Personal / fun project. Do whatever you want with it. 💖
