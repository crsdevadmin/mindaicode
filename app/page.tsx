"use client";

import { useEffect, useRef, useState } from "react";

type BarState = "idle" | "compare" | "sorted";

const STARTING_VALUES = [72, 38, 86, 24, 58, 46, 68, 32];

export default function Home() {
  const [values, setValues] = useState(STARTING_VALUES);
  const [active, setActive] = useState<[number, number] | null>([2, 3]);
  const [sortedFrom, setSortedFrom] = useState(STARTING_VALUES.length);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(55);
  const [comparisons, setComparisons] = useState(1);
  const [swaps, setSwaps] = useState(0);
  const cursor = useRef({ pass: 0, index: 0 });

  const resetCursor = () => {
    cursor.current = { pass: 0, index: 0 };
    setSortedFrom(values.length);
    setComparisons(0);
    setSwaps(0);
    setActive([0, 1]);
  };

  const shuffle = () => {
    const next = Array.from({ length: 8 }, () => 20 + Math.floor(Math.random() * 70));
    setValues(next);
    setPlaying(false);
    cursor.current = { pass: 0, index: 0 };
    setSortedFrom(next.length);
    setComparisons(0);
    setSwaps(0);
    setActive([0, 1]);
  };

  const step = () => {
    const { pass, index } = cursor.current;
    const end = values.length - 1 - pass;

    if (pass >= values.length - 1) {
      setPlaying(false);
      setActive(null);
      setSortedFrom(0);
      return;
    }

    const next = [...values];
    setActive([index, index + 1]);
    setComparisons((count) => count + 1);

    if (next[index] > next[index + 1]) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      setValues(next);
      setSwaps((count) => count + 1);
    }

    if (index + 1 >= end) {
      cursor.current = { pass: pass + 1, index: 0 };
      setSortedFrom(end);
    } else {
      cursor.current = { pass, index: index + 1 };
    }
  };

  useEffect(() => {
    if (!playing) return;
    const delay = 850 - speed * 7;
    const timer = window.setInterval(step, Math.max(120, delay));
    return () => window.clearInterval(timer);
  });

  const togglePlay = () => {
    if (sortedFrom === 0) resetCursor();
    setPlaying((value) => !value);
  };

  return (
    <main>
      <nav className="nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="MindAICode home">
          <span className="brand-mark">M</span>
          <span>MindAI<span>Code</span></span>
        </a>
        <div className="nav-links">
          <a href="#learn">Learn</a>
          <a className="active" href="#visualizer">Visualize</a>
          <a href="#practice">Practice</a>
          <a href="#progress">Progress</a>
        </div>
        <button className="profile" aria-label="Open student profile">JS</button>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>●</span> SORTING ALGORITHMS / 01</div>
          <h1>Bubble Sort,<br /><em>made visible.</em></h1>
          <p>Watch values compare, swap, and float into place—one satisfying step at a time.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#visualizer">Start visualizing <span>↓</span></a>
            <span className="lesson-time">◷ &nbsp; 8 min lesson</span>
          </div>
        </div>
        <div className="bubble-stage" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <div className="number-ball ball-one">8</div>
          <div className="number-ball ball-two">3</div>
          <div className="number-ball ball-three">5</div>
          <div className="swap-note">SWAP!</div>
          <div className="motion-line motion-one" />
          <div className="motion-line motion-two" />
        </div>
      </section>

      <section className="lesson-shell" id="visualizer">
        <div className="lesson-heading">
          <div>
            <span className="section-kicker">TRY IT YOURSELF</span>
            <h2>See the bubbles rise.</h2>
          </div>
          <p>Each pass moves the largest unsorted value to the right—just like a bubble floating to the surface.</p>
        </div>

        <div className="lab">
          <div className="lab-toolbar">
            <span className="window-dot coral" />
            <span className="window-dot gold" />
            <span className="window-dot green" />
            <span className="lab-title">BUBBLE_SORT.EXE</span>
            <span className="status"><i /> LIVE</span>
          </div>

          <div className="lab-body">
            <aside className="explanation">
              <span className="step-label">CURRENT STEP</span>
              <div className="step-number">02</div>
              <h3>Compare neighbors</h3>
              <p>Is the left value larger than the right? If yes, they swap places.</p>
              <div className="compare-card">
                <span>{active ? values[active[0]] : "✓"}</span>
                <b>{active ? ">" : "DONE"}</b>
                <span>{active ? values[active[1]] : "✓"}</span>
              </div>
              <div className="complexity">
                <div><span>TIME</span><strong>O(n²)</strong></div>
                <div><span>SPACE</span><strong>O(1)</strong></div>
              </div>
            </aside>

            <div className="visualizer">
              <div className="visualizer-top">
                <div><span className="tiny-label">PASS</span><strong>{Math.min(cursor.current.pass + 1, 8)} / 8</strong></div>
                <div className="stats">
                  <span>{comparisons} comparisons</span>
                  <span>{swaps} swaps</span>
                </div>
              </div>

              <div className="chart" role="img" aria-label={`Bubble sort values: ${values.join(", ")}`}>
                <div className="grid-line line-a" />
                <div className="grid-line line-b" />
                <div className="grid-line line-c" />
                {values.map((value, index) => {
                  let state: BarState = "idle";
                  if (index >= sortedFrom) state = "sorted";
                  if (active?.includes(index)) state = "compare";
                  return (
                    <div className={`bar-wrap ${state}`} key={`${index}-${value}`}>
                      <span className="bar-value">{value}</span>
                      <div className="bar" style={{ height: `${value * 2.15}px` }}>
                        {state === "sorted" && <span className="check">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="controls">
                <button className="icon-button" onClick={shuffle} aria-label="Shuffle values">↻</button>
                <button className="play-button" onClick={togglePlay}>
                  <span>{playing ? "Ⅱ" : "▶"}</span> {playing ? "Pause" : "Play"}
                </button>
                <button className="icon-button" onClick={step} aria-label="Move one step forward">▶|</button>
                <label className="speed-control">
                  <span>Slow</span>
                  <input
                    aria-label="Animation speed"
                    type="range"
                    min="10"
                    max="100"
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  />
                  <span>Fast</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="learn-strip" id="learn">
        <p>THE IDEA IN ONE LINE</p>
        <h2>Compare. Swap. Repeat.</h2>
        <div className="idea-steps">
          <div><span>1</span><strong>Compare</strong><small>Look at two neighbors</small></div>
          <div className="arrow">→</div>
          <div><span>2</span><strong>Swap</strong><small>Move the larger right</small></div>
          <div className="arrow">→</div>
          <div><span>3</span><strong>Repeat</strong><small>Until all are sorted</small></div>
        </div>
      </section>

      <footer id="practice">
        <div className="brand footer-brand"><span className="brand-mark">M</span><span>MindAI<span>Code</span></span></div>
        <p>Learn it. See it. Own it.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
