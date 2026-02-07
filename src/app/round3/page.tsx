"use client";

import { useState } from "react";
import AntiCheatGuard from "@/components/AntiCheatGuard";
import Editor from "@monaco-editor/react";

export default function Round3Page() {
    const [code, setCode] = useState("<h1>Hello World</h1>\n<style>\n  body { background: #333; color: white; }\n</style>");

    const handleEditorChange = (value: string | undefined) => {
        setCode(value || "");
    };

    return (
        <AntiCheatGuard>
            <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
                {/* Header */}
                <div style={{ height: "60px", background: "#000", display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "4px solid #fff" }}>
                    <h2 style={{ color: "#fbd000", fontSize: "1rem" }}>Round 3: Development - Clone the Target</h2>
                    <div style={{ marginLeft: "auto" }}>
                        <button className="nes-btn is-success is-small">SUBMIT</button>
                    </div>
                </div>

                {/* Workspace */}
                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    {/* Editor */}
                    <div style={{ flex: 1, borderRight: "4px solid #fff" }}>
                        <Editor
                            height="100%"
                            defaultLanguage="html"
                            defaultValue={code}
                            theme="vs-dark"
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                            }}
                        />
                    </div>

                    {/* Preview */}
                    <div style={{ flex: 1, background: "#fff" }}>
                        <iframe
                            title="preview"
                            srcDoc={code}
                            style={{ width: "100%", height: "100%", border: "none" }}
                            sandbox="allow-scripts"
                        />
                    </div>
                </div>
            </div>
        </AntiCheatGuard>
    );
}
