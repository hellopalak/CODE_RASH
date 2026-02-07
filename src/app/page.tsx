"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [stars, setStars] = useState<{ top: string, left: string, delay: string }[]>([]);

  useEffect(() => {
    // Generate static stars on client only to avoid hydration mismatch
    const newStars = Array.from({ length: 50 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
    }));
    setStars(newStars);
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

      {/* Main Menu */}
      <div className="nes-container is-rounded" style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}>
        <h1 style={{ color: "#fbd000", textShadow: "4px 4px #e52521", fontSize: "3rem", marginBottom: "2rem", fontFamily: "'Press Start 2P', cursive" }}>
          CODE RASH
        </h1>

        <p style={{ marginBottom: "2rem", color: "#fff", textShadow: "2px 2px #000" }}>Select your Player Mode:</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Link href="/login?role=user">
            <button className="nes-btn is-primary" style={{ width: "250px" }}>
              USER START
            </button>
          </Link>

          <Link href="/login?role=evaluator">
            <button className="nes-btn is-warning" style={{ width: "250px" }}>
              EVALUATOR LOGIN
            </button>
          </Link>

          <Link href="/login?role=admin">
            <button className="nes-btn is-error" style={{ width: "250px" }}>
              ADMIN ZONE
            </button>
          </Link>
        </div>
      </div>

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
