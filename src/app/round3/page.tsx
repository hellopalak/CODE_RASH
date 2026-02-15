"use client";

import { useState } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import { useRouter } from "next/navigation";
import { useContest } from "@/context/ContestContext";

// Advanced Tech Quiz: AI, Cloud, Cybersec, History, Hardware
const TECH_QUESTIONS = [
    { id: 1, text: "Which AI model is developed by OpenAI?", options: ["Llama", "Gemini", "GPT-4", "Claude"], answer: 2 },
    { id: 2, text: "What does AWS stand for?", options: ["Amazon Web Services", "Apple Web System", "Advanced Web Solutions", "Automated Web Server"], answer: 0 },
    { id: 3, text: "Which protocol is use for secure browsing?", options: ["HTTP", "FTP", "SSH", "HTTPS"], answer: 3 },
    { id: 4, text: "The 'brain' of the computer is:", options: ["RAM", "GPU", "CPU", "Motherboard"], answer: 2 },
    { id: 5, text: "Who is considered the father of the computer?", options: ["Alan Turing", "Charles Babbage", "Steve Jobs", "Bill Gates"], answer: 1 },
    { id: 6, text: "Which is a NoSQL database?", options: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"], answer: 2 },
    { id: 7, text: "What is the primary function of an OS?", options: ["Compile code", "Manage resources", "Design websites", "Protect from viruses"], answer: 1 },
    { id: 8, text: "First computer programmer?", options: ["Ada Lovelace", "Grace Hopper", "Margaret Hamilton", "Katherine Johnson"], answer: 0 },
    { id: 9, text: "What year was the World Wide Web invented?", options: ["1983", "1989", "1995", "2000"], answer: 1 },
    { id: 10, text: "Which cloud provider belongs to Google?", options: ["Azure", "AWS", "DigitalOcean", "GCP"], answer: 3 },
    { id: 11, text: "What does 'Phishing' refer to?", options: ["Fishing game", "Identity Theft Scam", "Network Testing", "Database Optimization"], answer: 1 },
    { id: 12, text: "Which is a containerization tool?", options: ["Kubernetes", "Docker", "Ansible", "Jenkins"], answer: 1 },
    { id: 13, text: "What is 'Blockchain' primarily known for?", options: ["Centralized Storage", "Decentralized Ledger", "Cloud Computing", "AI Processing"], answer: 1 },
    { id: 14, text: "Which allows running multiple OS on one machine?", options: ["Virtualization", "Compilation", "Interpretation", "Segmentation"], answer: 0 },
    { id: 15, text: "What port does HTTP commonly use?", options: ["21", "22", "80", "443"], answer: 2 },
    { id: 16, text: "Who co-founded Microsoft?", options: ["Steve Wozniak", "Paul Allen", "Larry Page", "Elon Musk"], answer: 1 },
    { id: 17, text: "Which is a statically typed language?", options: ["Python", "JavaScript", "Java", "Ruby"], answer: 2 },
    { id: 18, text: "What does 'IoT' stand for?", options: ["Internet of Tokens", "Internet of Things", "Input of Technology", "Integrator of Tools"], answer: 1 },
    { id: 19, text: "Which company owns GitHub?", options: ["Google", "Facebook", "Microsoft", "Amazon"], answer: 2 },
    { id: 20, text: "What is the complexity of accessing an array index?", options: ["O(n)", "O(1)", "O(log n)", "O(n^2)"], answer: 1 },
];

export default function Round3Page() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const router = useRouter();
    const { currentTimeout, unlockNextRound, currentRoundId } = useContest();

    const handleNextQuestion = (selectedOptionIndex: number | null) => {
        // Track Score
        if (selectedOptionIndex === TECH_QUESTIONS[currentQuestion].answer) {
            setScore(s => s + 5);
        }

        if (currentQuestion < TECH_QUESTIONS.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            // Finished
            alert(`Round 3 Complete! Score: ${score + (selectedOptionIndex === TECH_QUESTIONS[currentQuestion].answer ? 5 : 0)}/100`);
            unlockNextRound();
        }
    };

    const question = TECH_QUESTIONS[currentQuestion];

    if (currentRoundId !== 3) {
        return <div className="nes-container is-dark"><p>Round locked or passed.</p></div>;
    }

    return (
        <AntiCheatGuard allowCopyPaste={true}>
            {/* allowCopyPaste might be needed for specific asset Qs, but here it's just quiz. Keeping true as requested previously for R3. */}
            <div className="container" style={{ marginTop: "50px", maxWidth: "800px" }}>

                {/* Header Info */}
                <div className="nes-container is-dark is-rounded" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <span style={{ color: "#209cee" }}>ROUND 3</span>
                        <br />
                        <span style={{ fontSize: "0.8rem", color: "#888" }}>Tech Trivia & History</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <span style={{ display: "block", color: currentTimeout < 60 ? "red" : "#fff" }}>
                            ⏱ {Math.floor(currentTimeout / 60)}:{(currentTimeout % 60).toString().padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "cyan" }}>Q: {currentQuestion + 1}/{TECH_QUESTIONS.length}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: "20px", height: "10px", background: "#333", border: "2px solid #fff" }}>
                    <div style={{
                        width: `${((currentQuestion) / TECH_QUESTIONS.length) * 100}%`,
                        height: "100%",
                        background: "#209cee",
                        transition: "width 0.3s ease"
                    }} />
                </div>

                {/* Question Card */}
                <div className="nes-container with-title is-centered is-dark" style={{ minHeight: "300px" }}>
                    <p className="title">Question {currentQuestion + 1}</p>

                    <div style={{ marginBottom: "30px", fontSize: "1.2rem", lineHeight: "1.5" }}>
                        {question.text}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        {question.options.map((opt, idx) => (
                            <button
                                key={idx}
                                className="nes-btn"
                                onClick={() => handleNextQuestion(idx)}
                                style={{ minHeight: "60px" }}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Asset Tip from previous requests */}
                <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.7rem", color: "#666" }}>
                    <p>💡 Tip: Use your tech knowledge. No Google allowed!</p>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
