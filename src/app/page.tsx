"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [stars, setStars] = useState<{ top: string, left: string, delay: string }[]>([]);
  const [equalizerBars, setEqualizerBars] = useState<{ delay: string; height: string }[]>([]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [keystrokes, setKeystrokes] = useState<string[]>([]);


  useEffect(() => {
    // Generate static stars on client only to avoid hydration mismatch
    const newStars = Array.from({ length: 200 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
    }));
    setStars(newStars);

    // Generate equalizer bars randomly on client
    const newBars = Array.from({ length: 20 }).map(() => ({
      delay: `${Math.random() * 1.5}s`,
      height: `${20 + Math.random() * 50}%`
    }));
    setEqualizerBars(newBars);

    // Secret Cheat Code Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeystrokes((prev) => {
        const newKeys = [...prev, e.key].slice(-5); // Keep last 5 keys
        if (newKeys.join("").toLowerCase() === "admin") {
          setIsAdminVisible(true);
        }
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="center-screen">
      {/* Night Sky Background */}
      <div className="night-sky">
        <div className="moon"></div>
        {stars.map((s, i) => (
          <div
            key={i}
            className="star"
            style={{
              top: s.top,
              left: s.left,
              width: Math.random() > 0.5 ? '2px' : '3px',
              height: Math.random() > 0.5 ? '2px' : '3px',
              animationDelay: s.delay
            }}
          ></div>
        ))}
      </div>

      {/* Equalizer Bars */}
      <div className="equalizer-container">
        {equalizerBars.map((bar, i) => (
          <div
            key={i}
            className="eq-bar"
            style={{
              animationDelay: bar.delay,
              height: bar.height
            }}
          ></div>
        ))}
      </div>

      {/* XP Bars */}
      {/* <div className="xp-ui top-left">
        <div className="xp-label">PLAYER 1</div>
        <div className="xp-bar">
          <div className="xp-fill p1"></div>
        </div>
      </div>
      <div className="xp-ui p2-stacked">
        <div className="xp-label">PLAYER 2</div>
        <div className="xp-bar">
          <div className="xp-fill p2"></div>
        </div>
      </div> */}

      {/* Main Menu Area */}
      {!isGameStarted ? (
        <>
          <h1 className="retro-main-title">CODE RASH</h1>
          <div className="press-start-container" onClick={() => setIsGameStarted(true)}>
            <div className="arcade-header">THE ULTIMATE CODING ARENA</div>
            <div className="press-btn-box">
              <span className="blink-arrow">▶</span> PRESS START <span className="blink-arrow">◀</span>
            </div>
            <div className="insert-coin blink-text">INSERT COIN</div>
            {/* <div className="arcade-footer">CREDITS 00 • FREE PLAY</div> */}
          </div>
        </>
      ) : (
        <div style={{ position: 'relative', zIndex: 20 }}>
          {/* Default View: Contestant Card */}
          {!isAdminVisible ? (
            <div className="contestant-card-container" style={{ animation: "fadeIn 0.5s" }}>
              <div className="scanline-overlay"></div>
              <div className="card-content">
                <div className="pixel-alien">👾</div>
                <h1 className="contestant-title">CONTESTANT</h1>
                <p className="contestant-desc">Join the arena. Solve problems. Win glory.</p>

                <Link href="/login?role=user" style={{ width: '100%' }}>
                  <button className="player-ready-btn">1 PLAYER READY</button>
                </Link>

                <button className="nes-btn is-error" onClick={() => setIsGameStarted(false)} style={{ marginTop: "1rem", fontSize: "0.6rem", padding: "5px 10px", width: "auto" }}>EXIT</button>
              </div>
            </div>
          ) : (
            /* Secret View: Admin/Evaluator Login */
            <div className="nes-container is-rounded" style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.9)", backdropFilter: "blur(4px)", animation: "fadeIn 0.5s", borderColor: "#fbd000" }}>
              <h1 style={{ color: "#fbd000", textShadow: "4px 4px #e52521", fontSize: "2rem", marginBottom: "1.5rem", fontFamily: "'Press Start 2P', cursive" }}>
                SECRET MENU
              </h1>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <Link href="/login?role=user">
                  <button className="nes-btn is-primary" style={{ width: "280px" }}>USER START</button>
                </Link>
                <Link href="/login?role=evaluator">
                  <button className="nes-btn is-warning" style={{ width: "280px" }}>EVALUATOR LOGIN</button>
                </Link>
                <Link href="/login?role=admin">
                  <button className="nes-btn is-error" style={{ width: "280px" }}>ADMIN ZONE</button>
                </Link>
                <button className="nes-btn" onClick={() => setIsAdminVisible(false)} style={{ marginTop: "1rem" }}>CLOSE SECRET</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mario Hurdle Race Bottom Animation */}
      <div className="race-track">
        {/* Hurdles stationed at 30%, 60%, 90% */}
        <div className="pipe" style={{ left: "30%" }}></div>
        <div className="pipe" style={{ left: "60%" }}></div>
        <div className="pipe" style={{ left: "90%" }}></div>

        {/* Floating Blocks for jumping interaction */}
        <div className="block" style={{ left: "15%" }}></div>
        <div className="block" style={{ left: "45%" }}></div>
        <div className="block" style={{ left: "75%" }}></div>

        <div className="ground"></div>

        {/* Mario Runner */}
        <div className="mario-runner">
          <div className="mario-body">
            {/* Image background used in CSS */}

          </div>
        </div>
      </div>
    </main>
  );
}
