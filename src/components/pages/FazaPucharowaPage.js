import React, { useEffect, useState } from "react";
import "./FazaPucharowaPage.css";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { app } from "../../firebaseConfig";

function MatchCard({ teamA, teamB, scoreA, scoreB, highlight, arctusy, showOpis }) {
  return (
    <div className={`match-card${highlight ? ' highlight' : ''}${arctusy ? ' arctusy' : ''}`}>
      <div className="team teamA">
        <span className="nazwa">{teamA.nazwa}</span>
        <span className="druzyna">{teamA.druzyna}</span>
        {teamA.opis && (showOpis !== false) && <span className="opis">{teamA.opis}</span>}
      </div>
      {teamB ? (
        <>
          <div className="score">{scoreA} <span className="colon">:</span> {scoreB}</div>
          <div className="team teamB">
            <span className="nazwa">{teamB.nazwa}</span>
            <span className="druzyna">{teamB.druzyna}</span>
          </div>
        </>
      ) : (
        <div className="wolny-los">wolny los</div>
      )}
    </div>
  );
}




// Parametry układu
const CARD_HEIGHT = 80;
const CARD_WIDTH = 340;
const CARD_GAP = 32;
const COL_GAP = 80;

// Pomocnicza funkcja do wyliczania pozycji kafelków
function getMatchY(roundIdx, matchIdx, roundLens) {
  // Standardowe pozycjonowanie (bez Arctusów)
  return (
    Math.pow(2, roundIdx) * (CARD_HEIGHT + CARD_GAP) * matchIdx +
    Math.pow(2, roundIdx - 1) * (CARD_HEIGHT + CARD_GAP) - CARD_HEIGHT / 2
  );
}

function BracketSVG({ rounds }) {
  if (!rounds.length) return null;
  const roundLens = rounds.map(r => r.length);
  // Wylicz pozycje kafelków
  const positions = rounds.map((matches, roundIdx) =>
    matches.map((_, matchIdx) => ({
      x: roundIdx * (CARD_WIDTH + COL_GAP),
      y: getMatchY(roundIdx, matchIdx, roundLens)
    }))
  );
  if (!positions.length || !positions[0] || !positions[0][0]) return null;
  // Rysuj linie łączące
  const lines = [];
  for (let r = 0; r < rounds.length - 1; r++) {
    if (!positions[r] || !positions[r + 1]) continue;
    for (let m = 0; m < rounds[r + 1].length; m++) {
      const prev1 = positions[r][m * 2];
      const prev2 = positions[r][m * 2 + 1];
      const next = positions[r + 1][m];
      if (!prev1 || !prev2 || !next) continue;
      lines.push({
        x1: prev1.x + CARD_WIDTH,
        y1: prev1.y + CARD_HEIGHT / 2,
        x2: prev1.x + CARD_WIDTH + 24,
        y2: prev1.y + CARD_HEIGHT / 2
      });
      lines.push({
        x1: prev2.x + CARD_WIDTH,
        y1: prev2.y + CARD_HEIGHT / 2,
        x2: prev2.x + CARD_WIDTH + 24,
        y2: prev2.y + CARD_HEIGHT / 2
      });
      lines.push({
        x1: prev1.x + CARD_WIDTH + 24,
        y1: prev1.y + CARD_HEIGHT / 2,
        x2: prev2.x + CARD_WIDTH + 24,
        y2: prev2.y + CARD_HEIGHT / 2
      });
      lines.push({
        x1: prev1.x + CARD_WIDTH + 24,
        y1: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2,
        x2: next.x,
        y2: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2
      });
    }
  }
  const svgWidth = rounds.length * (CARD_WIDTH + COL_GAP);
  const svgHeight = positions[0].length * (CARD_HEIGHT + CARD_GAP) * 2;
  return (
    <svg className="bracket-svg" width={svgWidth} height={svgHeight} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 1 }}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#4299e1" strokeWidth={4} />
      ))}
    </svg>
  );
}


export default function FazaPucharowaPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const db = getFirestore(app);
    const q = query(collection(db, "matches"), orderBy("phase"));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatches(docs);
      setLoading(false);
    }, err => {
      setError("Błąd ładowania drabinki: " + err.message);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Group matches by phase (round)
  const rounds = [];
  matches.forEach(match => {
    const phase = match.phase || 0;
    if (!rounds[phase]) rounds[phase] = [];
    rounds[phase].push(match);
  });

  // Sort matches within each round by matchOrder (if present), else by matchId
  rounds.forEach(r => r.sort((a, b) => {
    if (a.matchOrder != null && b.matchOrder != null) return a.matchOrder - b.matchOrder;
    if (a.matchOrder != null) return -1;
    if (b.matchOrder != null) return 1;
    // fallback: sort by matchId string
    return (a.matchId || "").localeCompare(b.matchId || "");
  }));

  const roundLens = rounds.map(r => r.length);
  const positions = rounds.map((matches, roundIdx) =>
    matches.map((_, matchIdx) => ({
      x: roundIdx * (CARD_WIDTH + COL_GAP),
      y: getMatchY(roundIdx, matchIdx, roundLens)
    }))
  );
  // Responsive: use almost full viewport, allow scroll if needed
  const containerWidth = Math.max(window.innerWidth, rounds.length * (CARD_WIDTH + COL_GAP));
  const containerHeight = Math.max(window.innerHeight - 40, positions[0]?.length ? positions[0].length * (CARD_HEIGHT + CARD_GAP) * 2 + 100 : 600);

  return (
    <div className="faza-pucharowa-container" style={{ width: '100vw', height: '100vh', overflow: 'auto', margin: 0, paddingTop: '1rem', background: '#f8f9fa' }}>
      <h1 style={{ textAlign: 'center', margin: 0, padding: '16px 0 8px 0' }}>Faza pucharowa</h1>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>Ładowanie drabinki...</div>
      ) : error ? (
        <div style={{ padding: 40, color: "red", textAlign: "center" }}>{error}</div>
      ) : !rounds.length ? (
        <div style={{ padding: 40, textAlign: "center" }}>Brak danych o drabince.</div>
      ) : (
        <div className="bracket-svg-container" style={{ position: 'relative', minWidth: containerWidth, minHeight: containerHeight, width: containerWidth, height: containerHeight, margin: '0 auto', overflow: 'auto', paddingTop: 32 }}>
          <BracketSVG rounds={rounds} />
          {rounds.map((matches, roundIdx) => (
            <div className="bracket-col-svg" key={roundIdx} style={{ position: 'absolute', left: roundIdx * (CARD_WIDTH + COL_GAP), top: 0, width: CARD_WIDTH, height: containerHeight }}>
              {/* Place round label above the first match card */}
              <div className="bracket-round-title" style={{
                position: 'absolute',
                left: 0,
                top: positions[roundIdx]?.[0]?.y ? Math.max(positions[roundIdx][0].y - 40, 0) : 0,
                width: '100%',
                textAlign: 'center',
                zIndex: 3,
                fontWeight: 700,
                fontSize: 18,
                color: '#2d3748',
                background: 'rgba(255,255,255,0.85)'
              }}>{
                roundIdx === 0 ? '1. runda' :
                roundIdx === 1 ? 'Ćwierćfinały' :
                roundIdx === 2 ? 'Półfinały' :
                'Finały'
              }</div>
              {matches.map((match, matchIdx) => (
                <div key={matchIdx} style={{ position: 'absolute', left: 0, top: positions[roundIdx][matchIdx].y, width: CARD_WIDTH, zIndex: 2 }}>
                  <MatchCard
                    teamA={{ nazwa: match.teamA_name || "-", druzyna: match.teamA_team || "", opis: match.teamA_opis }}
                    teamB={match.teamB_id ? { nazwa: match.teamB_name || "-", druzyna: match.teamB_team || "" } : null}
                    scoreA={match.scoreA}
                    scoreB={match.scoreB}
                    highlight={match.final}
                    arctusy={match.arctusy}
                    showOpis={roundIdx === 0}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
