import { useEffect, useState } from 'react';
import { playCountdown, playFight } from '../game/sound.js';

const STEPS = ['3', '2', '1', 'FIGHT!'];
// ms offset at which each step appears
const TIMINGS = [0, 750, 1500, 2250, 3100];

export default function CountdownScreen({ round, onDone, muted }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handles = [];

    STEPS.forEach((val, i) => {
      handles.push(
        setTimeout(() => {
          setStep(i);
          if (!muted) {
            if (val !== 'FIGHT!') playCountdown(Number(val));
            else playFight();
          }
        }, TIMINGS[i])
      );
    });

    // Fire onDone after the last step has been visible briefly
    handles.push(setTimeout(onDone, TIMINGS[4]));

    return () => handles.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // intentionally runs once per mount (each countdown is a fresh mount)

  const current = STEPS[step];
  const isFight = current === 'FIGHT!';

  return (
    <div className="countdown-overlay">
      <div className="countdown-round-badge">Round {round}</div>
      {/* key forces CSS animation to re-trigger on each step change */}
      <div
        key={step}
        className={`countdown-num${isFight ? ' countdown-fight' : ''}`}
        aria-live="assertive"
      >
        {current}
      </div>
    </div>
  );
}
