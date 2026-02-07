"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="center-screen">
      <div className="clouds-bg">
        {/* Static clouds for now, can animate later */}
        <div className="cloud" style={{ top: "10%", left: "10%" }}></div>
        <div className="cloud" style={{ top: "20%", left: "70%" }}></div>
        <div className="cloud" style={{ top: "50%", left: "40%" }}></div>
      </div>

      <div className="nes-container is-rounded" style={{ textAlign: "center", backgroundColor: "rgba(0,0,0,0.8)" }}>
        <h1 style={{ color: "#fbd000", textShadow: "4px 4px #e52521", fontSize: "3rem", marginBottom: "2rem" }}>
          CODE RASH
        </h1>

        <p style={{ marginBottom: "2rem" }}>Select your Player Mode:</p>

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
    </main>
  );
}
