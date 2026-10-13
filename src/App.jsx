import { useCallback, useEffect, useRef, useState } from 'react';
import Stats from './components/Stats.jsx';
import PatienceBar from './components/PatienceBar.jsx';
import Stage from './components/Stage.jsx';
import Header from './components/Header.jsx';
import ComboAnnouncer from './components/ComboAnnouncer.jsx';
import Loader from './components/Loader.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import CountdownScreen from './screens/CountdownScreen.jsx';
import KOScreen from './screens/KOScreen.jsx';
import { createGame } from './game/createGame.js';
import {
  playPunch,
  playImpact,
  playKO,
  playCombo,
  setMuted as setSoundMuted,
} from './game/sound.js';
import { SORRY_LINES, KO_LINE, POW_WORDS } from './data/lines.js';
import { importPhoto, loadSavedPhoto, readBest, saveBest } from './utils/photos.js';
import { PHASES } from './game/phases.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const INIT = { punches: 0, combo: 0, sorries: 0, hp: 0, round: 0 };

function readMuted() {
  try { return localStorage.getItem('bjaw_muted') === 'true'; } catch { return false; }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // DOM refs for the Three.js overlay tags
  const containerRef = useRef(null);
  const gTagRef      = useRef(null);
  const bTagRef      = useRef(null);
  const bubbleRef    = useRef(null);
  const gameRef      = useRef(null);

  // ── Phase / game state ──────────────────────────────────────────────────────
  const [phase, setPhase]       = useState(PHASES.LOBBY);
  const phaseRef                = useRef(phase);
  phaseRef.current              = phase;

  const [s, setS]               = useState(INIT);
  const sRef                    = useRef(s);
  const [best, setBest]         = useState(readBest);
  const bestRef                 = useRef(best);
  bestRef.current               = best;

  const [names, setNames]       = useState({ g: 'Shreeja', b: 'Sanjay' });
  const namesRef                = useRef(names);
  namesRef.current              = names;

  const [bubble, setBubble]     = useState({ text: '', on: false });
  const [pows, setPows]         = useState([]);

  // ── Round / HUD state ───────────────────────────────────────────────────────
  const [roundNum, setRoundNum]     = useState(1);
  const [elapsedMs, setElapsedMs]   = useState(0);
  const [peakCombo, setPeakCombo]   = useState(0);
  const [isNewBest, setIsNewBest]   = useState(false);
  const [gameReady, setGameReady]   = useState(false);

  // ── Sound ───────────────────────────────────────────────────────────────────
  const [muted, setMutedState] = useState(readMuted);
  const handleMuteToggle = useCallback(() => {
    setMutedState((m) => {
      const next = !m;
      setSoundMuted(next);
      try { localStorage.setItem('bjaw_muted', String(next)); } catch {}
      return next;
    });
  }, []);
  // Sync sound module on first render
  useEffect(() => { setSoundMuted(readMuted()); }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  const elapsedRef  = useRef(0);
  const timerRef    = useRef(null);

  const startTimer = useCallback(() => {
    elapsedRef.current = 0;
    setElapsedMs(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 100;
      setElapsedMs(elapsedRef.current);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Misc refs ───────────────────────────────────────────────────────────────
  const lastPunch   = useRef(0);
  const powId       = useRef(0);
  const bubbleTimer = useRef(null);
  const impactRef   = useRef(() => {});

  // ── State updater (keeps sRef in sync) ──────────────────────────────────────
  const upd = useCallback((fn) => {
    sRef.current = fn(sRef.current);
    setS(sRef.current);
  }, []);

  // ── Derived names ────────────────────────────────────────────────────────────
  const girlName = names.g.trim() || 'Shreeja';
  const boyName  = names.b.trim() || 'Sanjay';

  // ── Bubble helper ────────────────────────────────────────────────────────────
  const showBubble = (text) => {
    setBubble({ text, on: true });
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(
      () => setBubble((b) => ({ ...b, on: false })),
      1000
    );
  };

  // ── KO ───────────────────────────────────────────────────────────────────────
  const knockout = useCallback(() => {
    stopTimer();
    gameRef.current?.setKO(true);
    const used = sRef.current.punches - sRef.current.round;
    let newBest = false;
    if (bestRef.current === 0 || used < bestRef.current) {
      setBest(used);
      saveBest(used);
      newBest = true;
    }
    setIsNewBest(newBest);
    playKO();
    setTimeout(() => setPhase(PHASES.KO), 2000);
  }, [stopTimer]);

  // ── Impact callback (called by Three.js engine) ──────────────────────────────
  impactRef.current = (pos) => {
    playPunch();
    try { navigator.vibrate?.(40); } catch { /* not supported */ }

    const id = ++powId.current;
    setPows((p) => [
      ...p,
      { id, x: pos.x, y: pos.y, text: POW_WORDS[Math.floor(Math.random() * POW_WORDS.length)] },
    ]);
    setTimeout(() => setPows((p) => p.filter((x) => x.id !== id)), 700);

    const ko = sRef.current.hp >= 100;
    setTimeout(() => {
      const line = ko
        ? KO_LINE
        : SORRY_LINES[Math.floor(Math.random() * SORRY_LINES.length)];
      showBubble(line.replace(/\{g\}/g, girlName));
      playImpact();
    }, 150);

    if (ko) knockout();
  };

  // ── Create the Three.js game once on mount ───────────────────────────────────
  useEffect(() => {
    const game = createGame(
      containerRef.current,
      { gTag: gTagRef.current, bTag: bTagRef.current, bubble: bubbleRef.current },
      {
        onImpact: (pos) => impactRef.current(pos),
        onReady:  ()    => setGameReady(true),
      }
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

  // ── Punch ────────────────────────────────────────────────────────────────────
  const punch = useCallback(() => {
    const game = gameRef.current;
    const cur  = sRef.current;
    if (!game || phaseRef.current !== PHASES.PLAYING || !game.canPunch()) return;

    game.punch();
    const now   = Date.now();
    const combo = now - lastPunch.current < 1000 ? cur.combo + 1 : 1;
    lastPunch.current = now;
    const hp = Math.min(100, cur.hp + 3 + Math.min(combo, 6));

    upd((p) => ({ ...p, punches: p.punches + 1, sorries: p.sorries + 1, combo, hp }));
    setPeakCombo((prev) => Math.max(prev, combo));
    if (combo >= 3) playCombo(combo);
    game.setMood(hp / 100);
  }, [upd]);

  // Space-bar shortcut
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

  // ── Phase transitions ─────────────────────────────────────────────────────────
  // Start timer when countdown finishes and play phase begins
  useEffect(() => {
    if (phase === PHASES.PLAYING) startTimer();
  }, [phase, startTimer]);

  const startGame = useCallback(() => {
    setPhase(PHASES.COUNTDOWN);
  }, []);

  const onCountdownDone = useCallback(() => {
    setPhase(PHASES.PLAYING);
  }, []);

  const nextRound = useCallback(() => {
    upd((p) => ({ ...p, hp: 0, combo: 0, round: p.punches }));
    setPeakCombo(0);
    setIsNewBest(false);
    setRoundNum((n) => n + 1);
    gameRef.current?.setKO(false);
    gameRef.current?.setMood(0);
    setBubble((b) => ({ ...b, on: false }));
    setElapsedMs(0);
    elapsedRef.current = 0;
    setPhase(PHASES.COUNTDOWN);
  }, [upd]);

  const goToMenu = useCallback(() => {
    upd(() => ({ ...INIT }));
    setPeakCombo(0);
    setIsNewBest(false);
    setRoundNum(1);
    gameRef.current?.setKO(false);
    gameRef.current?.setMood(0);
    setBubble((b) => ({ ...b, on: false }));
    stopTimer();
    setElapsedMs(0);
    elapsedRef.current = 0;
    setPhase(PHASES.LOBBY);
  }, [upd, stopTimer]);

  // ── Photo upload ──────────────────────────────────────────────────────────────
  const onPhoto = async (kind, file) => {
    if (!file) return;
    const img = await importPhoto(file, kind);
    gameRef.current?.setPhoto(kind, img);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const isPlaying = phase === PHASES.PLAYING;

  return (
    <>
      {/* ── Game view: always mounted so Three.js loads during lobby ── */}
      <div className="app">
        {/* HUD — only during active play */}
        {isPlaying && (
          <Header
            round={roundNum}
            elapsedMs={elapsedMs}
            muted={muted}
            onMuteToggle={handleMuteToggle}
          />
        )}
        {isPlaying && <Stats punches={s.punches} combo={s.combo} sorries={s.sorries} best={best} />}
        {isPlaying && <PatienceBar name={boyName} hp={s.hp} />}
        {/* key forces re-animation on each new combo value */}
        {isPlaying && <ComboAnnouncer key={s.combo} combo={s.combo} />}

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

        {isPlaying && (
          <button
            className="punch"
            onPointerDown={(e) => { e.preventDefault(); punch(); }}
          >
            👊 PUNCH!
          </button>
        )}
      </div>

      {/* ── Full-screen overlays ── */}
      {phase === PHASES.LOBBY && (
        <LobbyScreen
          girlName={names.g}
          boyName={names.b}
          onGirlName={(v) => setNames((n) => ({ ...n, g: v }))}
          onBoyName={(v)  => setNames((n) => ({ ...n, b: v }))}
          onPhoto={onPhoto}
          best={best}
          onStart={startGame}
          gameReady={gameReady}
        />
      )}

      {phase === PHASES.COUNTDOWN && (
        <CountdownScreen
          round={roundNum}
          onDone={onCountdownDone}
          muted={muted}
        />
      )}

      {phase === PHASES.KO && (
        <KOScreen
          girlName={girlName}
          boyName={boyName}
          round={roundNum}
          punches={s.punches - s.round}
          elapsedMs={elapsedMs}
          peakCombo={peakCombo}
          best={best}
          isNewBest={isNewBest}
          onNextRound={nextRound}
          onMenu={goToMenu}
        />
      )}

      {/* Loader: shown until Three.js fires onReady (only visible if not in lobby) */}
      {!gameReady && phase !== PHASES.LOBBY && <Loader />}
    </>
  );
}
