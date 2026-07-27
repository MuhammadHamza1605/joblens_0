"use client";

import { useEffect, useState } from "react";

interface QA {
  question: string;
  guidance: string;
}

interface Result {
  fitSummary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  gapsToAddress: string[];
  interviewQuestions: QA[];
}

interface HistoryItem {
  id: string;
  jobDescription: string;
  background: string;
  result: Result;
  createdAt: number;
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [background, setBackground] = useState("");

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("joblens-history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore corrupted history
    }
  }, []);

  function saveToHistory(item: HistoryItem) {
    const next = [item, ...history].slice(0, 8);
    setHistory(next);
    try {
      localStorage.setItem("joblens-history", JSON.stringify(next));
    } catch {
      // storage may be unavailable, non-fatal
    }
  }

  async function handleAnalyze() {
    setError("");
    setCopied(false);

    if (jobDescription.trim().length < 30) {
      setError("Please paste a fuller job description (at least a few sentences).");
      return;
    }
    if (background.trim().length < 20) {
      setError("Please describe your background in a bit more detail.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, background }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
      saveToHistory({
        id: crypto.randomUUID(),
        jobDescription,
        background,
        result: data,
        createdAt: Date.now(),
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function resultToText(r: Result): string {
    return [
      "FIT SUMMARY",
      r.fitSummary,
      "",
      "MATCHED KEYWORDS",
      r.matchedKeywords.map((k) => `- ${k}`).join("\n"),
      "",
      "KEYWORDS TO ADDRESS",
      r.missingKeywords.map((k) => `- ${k}`).join("\n"),
      "",
      "GAPS TO ADDRESS",
      r.gapsToAddress.map((g) => `- ${g}`).join("\n"),
      "",
      "LIKELY INTERVIEW QUESTIONS",
      r.interviewQuestions.map((q, i) => `${i + 1}. ${q.question}\n   Guidance: ${q.guidance}`).join("\n\n"),
    ].join("\n");
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(resultToText(result)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([resultToText(result)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "joblens-prep.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadFromHistory(item: HistoryItem) {
    setJobDescription(item.jobDescription);
    setBackground(item.background);
    setResult(item.result);
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          Job<span>Lens</span>
        </div>
      </header>
      <p className="tagline">
        Paste a job description and describe your background in plain language. JobLens tells you how
        well you actually match, which exact keywords to use in your resume, honest gaps to work on,
        and interview questions this specific role is likely to ask.
      </p>

      <div className="grid">
        {/* LEFT: FORM */}
        <div className="card">
          <h2>Job & background</h2>
          <p className="hint">More detail in your background gives a more accurate, useful result.</p>

          <label htmlFor="jd">Job description</label>
          <textarea
            id="jd"
            className="jd"
            placeholder="Paste the full job posting here — responsibilities, requirements, everything."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <label htmlFor="bg">Your background</label>
          <textarea
            id="bg"
            className="bg"
            placeholder="e.g. Final-year CS student, built 3 web apps with React and Node, one internship doing backend work in Python, comfortable with SQL, no professional experience with cloud/AWS yet."
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />

          <button className="primary" onClick={handleAnalyze} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Analyzing..." : "Analyze fit & prep"}
          </button>

          {error && <div className="error">{error}</div>}

          {history.length > 0 && (
            <div className="history">
              <h3>Recent analyses (saved on this device)</h3>
              {history.map((h) => (
                <div key={h.id} className="history-item" onClick={() => loadFromHistory(h)}>
                  <div className="snippet">{h.jobDescription}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: OUTPUT */}
        <div className="card">
          <h2>Your prep package</h2>
          <p className="hint">Everything here is grounded only in what you told JobLens about yourself.</p>

          {!result && (
            <div className="placeholder-note">
              Your fit summary, resume keywords, and interview questions will appear here once you fill
              in the form and click "Analyze fit & prep."
            </div>
          )}

          {result && (
            <>
              <div className="section">
                <h3>Fit summary</h3>
                <div className="fit-summary">{result.fitSummary}</div>
              </div>

              <div className="section">
                <h3>Keywords you match</h3>
                <div className="tag-list">
                  {result.matchedKeywords.map((k, i) => (
                    <span key={i} className="tag matched">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>Keywords to address</h3>
                <div className="tag-list">
                  {result.missingKeywords.map((k, i) => (
                    <span key={i} className="tag missing">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>How to close the gaps</h3>
                <ul className="plain">
                  {result.gapsToAddress.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>

              <div className="section">
                <h3>Likely interview questions</h3>
                {result.interviewQuestions.map((qa, i) => (
                  <div key={i} className="qa-item">
                    <div className="q">
                      {i + 1}. {qa.question}
                    </div>
                    <div className="g">{qa.guidance}</div>
                  </div>
                ))}
              </div>

              <div className="output-actions">
                <button onClick={handleCopy}>{copied ? "Copied!" : "Copy to clipboard"}</button>
                <button onClick={handleDownload}>Download .txt</button>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="foot">
        JobLens grounds every suggestion only in what you tell it — it never invents experience on your
        behalf. Your analyses are saved only on this device.
      </footer>
    </div>
  );
}
