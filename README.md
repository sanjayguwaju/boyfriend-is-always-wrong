# 🥊 Boyfriend Is Always Wrong

The couple boxing game. React + Vite + Three.js. Shreeja punches, Sanjay says sorry. Every time.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview  # test the production build
```

## Deploy to Netlify

- **Git:** push to GitHub, then "Add new site → Import from Git". `netlify.toml` already sets
  build command `npm run build` and publish folder `dist`.
- **Manual:** run `npm run build`, then drag the `dist` folder onto https://app.netlify.com/drop

## Project layout

```
src/
  App.jsx                 game state, punch logic, sorry bubble, KO flow
  components/             Stats, PatienceBar, Stage, Setup, WinModal
  game/createGame.js      Three.js ring, fighters, animation loop
  game/faces.js           face textures (emoji default, photo upload)
  game/sound.js           beeps
  data/lines.js           Sanjay's sorry lines (add yours here)
  utils/photos.js         photo crop + localStorage
  styles.css
```

## Customize

- Add or edit sorry lines in `src/data/lines.js` (`{g}` becomes Shreeja's name).
- Default names are set in `src/App.jsx` (`useState({ g: 'Shreeja', b: 'Sanjay' })`).
- Real faces: open "Names & photos" in the game and upload a photo for each.
  Photos stay in the browser (localStorage).
