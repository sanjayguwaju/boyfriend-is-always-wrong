import { useCallback, useEffect, useRef, useState } from 'react';
import Stats from './components/Stats.jsx';
import PatienceBar from './components/PatienceBar.jsx';
import Stage from './components/Stage.jsx';
import Setup from './components/Setup.jsx';
import WinModal from './components/WinModal.jsx';
import { createGame } from './game/createGame.js';
import { beep } from './game/sound.js';
import { SORRY_LINES, KO_LINE, POW_WORDS } from './data/lines.js';
import { importPhoto, loadSavedPhoto, readBest, saveBest } from './utils/photos.js';

const INIT = { punches: 0, combo: 0, sorries: 0, hp: 0, round: 0, locked: false };

export default function App() {
  const containerRef = useRef(null);
  const gTagRef = useRef(null);
  const bTagRef = useRef(null);
  const bubbleRef = useRef(null);
  const gameRef = useRef(null);

  const [s, setS] = useState(INIT);
  const sRef = useRef(s);
  const [best, setBest] = useState(readBest);
  const [names, setNames] = useState({ g: 'Shreeja', b: 'Sanjay' });
  const [bubble, setBubble] = useState({ text: '', on: false });
  const [pows, setPows] = useState([]);
  const [winText, setWinText] = useState('');

  const namesRef = useRef(names);
  namesRef.current = names;
  const bestRef = useRef(best);
  bestRef.current = best;
  const lastPunch = useRef(0);
  const powId = useRef(0);
  const bubbleTimer = useRef(0);
  const impactRef = useRef(() => {});

  const upd = useCallback((fn) => {
    sRef.current = fn(sRef.current);
    setS(sRef.current);
  }, []);

  const girlName = names.g.trim() || 'Shreeja';
  const boyName = names.b.trim() || 'Sanjay';

  const showBubble = (text) => {
    setBubble({ text, on: true });
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble((b) => ({ ...b, on: false })), 1000);
  };

  const knockout = () => {
    upd((p) => ({ ...p, locked: true }));
    gameRef.current?.setKO(true);
    const used = sRef.current.punches - sRef.current.round;
    if (bestRef.current === 0 || used < bestRef.current) {
      setBest(used);
      saveBest(used);
    }
    setTimeout(() => {
      setWinText(
        `${girlName} wins by KO in ${used} punches! ${boyName} said sorry ${used} times and counting. 💐`
      );
    }, 900);
  };

  // Called by the engine at the moment the glove lands.
  impactRef.current = (pos) => {
    beep(180 + Math.random() * 60, 0.14);
    try {
      navigator.vibrate?.(40);
    } catch {
      /* not supported */
    }
    const id = ++powId.current;
    setPows((p) => [
      ...p,
      { id, x: pos.x, y: pos.y, text: POW_WORDS[Math.floor(Math.random() * POW_WORDS.length)] },
    ]);
    setTimeout(() => setPows((p) => p.filter((x) => x.id !== id)), 700);

    const ko = sRef.current.hp >= 100;
    setTimeout(() => {
      const line = ko ? KO_LINE : SORRY_LINES[Math.floor(Math.random() * SORRY_LINES.length)];
      showBubble(line.replace(/\{g\}/g, girlName));
      beep(520, 0.08);
    }, 150);
    if (ko) knockout();
  };

  // Create the 3D game once.
  useEffect(() => {
    const game = createGame(
      containerRef.current,
      { gTag: gTagRef.current, bTag: bTagRef.current, bubble: bubbleRef.current },
      { onImpact: (pos) => impactRef.current(pos) }
    );
    gameRef.current = game;
    ['g', 'b'].forEach((kind) =>
      loadSavedPhoto(kind).then((img) => img && game.setPhoto(kind, img))
    );
    return () => {
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  const punch = useCallback(() => {
    const game = gameRef.current;
    const cur = sRef.current;
    if (!game || cur.locked || !game.canPunch()) return;
    game.punch();
    beep(140, 0.1);
    const now = Date.now();
    const combo = now - lastPunch.current < 1000 ? cur.combo + 1 : 1;
    lastPunch.current = now;
    const hp = Math.min(100, cur.hp + 3 + Math.min(combo, 6));
    upd((p) => ({ ...p, punches: p.punches + 1, sorries: p.sorries + 1, combo, hp }));
    game.setMood(hp / 100);
  }, [upd]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        punch();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [punch]);

  const nextRound = () => {
    upd((p) => ({ ...p, hp: 0, combo: 0, locked: false, round: p.punches }));
    gameRef.current?.setKO(false);
    gameRef.current?.setMood(0);
    setWinText('');
    setBubble((b) => ({ ...b, on: false }));
  };

  const onPhoto = async (kind, file) => {
    if (!file) return;
    const img = await importPhoto(file, kind);
    gameRef.current?.setPhoto(kind, img);
  };

  return (
    <>
      <div className="app">
        <h1>🥊 Boyfriend Is Always Wrong</h1>
        <p className="sub">Tap the ring to punch. He always apologizes.</p>
        <Stats punches={s.punches} combo={s.combo} sorries={s.sorries} best={best} />
        <PatienceBar name={boyName} hp={s.hp} />
        <Stage
          containerRef={containerRef}
          gTagRef={gTagRef}
          bTagRef={bTagRef}
          bubbleRef={bubbleRef}
          girlName={girlName}
          boyName={boyName}
          bubble={bubble}
          pows={pows}
          onPunch={punch}
        />
        <button
          className="punch"
          onPointerDown={(e) => {
            e.preventDefault();
            punch();
          }}
        >
          👊 PUNCH!
        </button>
        <Setup
          girlName={names.g}
          boyName={names.b}
          onGirlName={(v) => setNames((n) => ({ ...n, g: v }))}
          onBoyName={(v) => setNames((n) => ({ ...n, b: v }))}
          onPhoto={onPhoto}
        />
      </div>
      <WinModal text={winText} onAgain={nextRound} />
    </>
  );
}
