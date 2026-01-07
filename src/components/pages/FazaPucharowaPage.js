import React, { useEffect, useState } from "react";
import "./FazaPucharowaPage.css";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { app } from "../../firebaseConfig";

function MatchCard({ teamA, teamB, scoreA, scoreB, highlight, arctusy, showOpis }) {
  return (
    <div className={`match-card${highlight ? ' highlight' : ''}${arctusy ? ' arctusy' : ''}`}> 
      <div className="match-top-row" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="team teamA" style={{ flex: 1, textAlign: 'right', paddingRight: 6 }}>
          <span className="nazwa">{teamA.nazwa}</span>
          <span className="druzyna">{teamA.druzyna}</span>
        </div>
        {teamB ? (
          <div className="team teamB" style={{ flex: 1, textAlign: 'left', paddingLeft: 6 }}>
            <span className="nazwa">{teamB.nazwa}</span>
            <span className="druzyna">{teamB.druzyna}</span>
          </div>
        ) : (
          <div className="wolny-los" style={{ flex: 1, textAlign: 'left', paddingLeft: 6 }}>wolny los</div>
        )}
      </div>
      <div className="match-bottom-row" style={{ width: '100%', textAlign: 'center', marginTop: 2 }}>
        {teamB ? (
          <span className="score">{scoreA} <span className="colon">:</span> {scoreB}</span>
        ) : null}
      </div>
      {teamA.opis && (showOpis !== false) && <span className="opis">{teamA.opis}</span>}
    </div>
  );
}




// Parametry układu
const CARD_HEIGHT = 40;
const CARD_WIDTH = 160;
const CARD_GAP_PHASE1 = 38; // Increased gap for phase 1
const CARD_GAP = 18;
const COL_GAP = 48;

// Pomocnicza funkcja do wyliczania pozycji kafelków
function getMatchY(roundIdx, matchIdx, roundLens, prevPositions = null) {
  if (roundIdx === 0) {
    // Phase 1: regular spacing
    return matchIdx * (CARD_HEIGHT + CARD_GAP_PHASE1);
  }
  // For later phases: center between previous two matches
  if (prevPositions && prevPositions.length >= matchIdx * 2 + 2) {
    const y1 = prevPositions[matchIdx * 2];
    const y2 = prevPositions[matchIdx * 2 + 1];
    return (y1 + y2) / 2;
  }
  // Fallback: regular spacing
  return matchIdx * (CARD_HEIGHT + CARD_GAP);
}

function BracketSVG({ rounds }) {
  if (!Array.isArray(rounds) || rounds.length < 2) return null;
  // Wylicz pozycje kafelków
  const positions = rounds.map((matches, roundIdx) =>
    Array.isArray(matches)
      ? matches.map((_, matchIdx) => ({
          x: roundIdx * (CARD_WIDTH + COL_GAP),
          y:
            Math.pow(2, roundIdx) * (CARD_HEIGHT + CARD_GAP) * matchIdx +
            Math.pow(2, roundIdx - 1) * (CARD_HEIGHT + CARD_GAP) - CARD_HEIGHT / 2
        }))
      : []
  );
  // Rysuj linie łączące
  const lines = [];
  for (let r = 0; r < rounds.length - 1; r++) {
    if (!positions[r] || !positions[r + 1] || positions[r].length < 2) continue;
    for (let m = 0; m < Math.floor(positions[r].length / 2); m++) {
      const prev1 = positions[r][m * 2];
      const prev2 = positions[r][m * 2 + 1];
      const next = positions[r + 1][m];
      if (!prev1 || !prev2 || !next) continue;
      // Poziome linie od kafelków do prawej
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
      // Pionowa linia łącząca
      lines.push({
        x1: prev1.x + CARD_WIDTH + 24,
        y1: prev1.y + CARD_HEIGHT / 2,
        x2: prev2.x + CARD_WIDTH + 24,
        y2: prev2.y + CARD_HEIGHT / 2
      });
      // Pozioma linia do kolejnego meczu
      lines.push({
        x1: prev1.x + CARD_WIDTH + 24,
        y1: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2,
        x2: next.x,
        y2: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2
      });
    }
  }
  // Wylicz rozmiar SVG
  let maxY = 0;
  positions.forEach(col => {
    if (col && col.length) {
      const last = col[col.length - 1];
      if (last && last.y > maxY) maxY = last.y;
    }
  });
  const svgWidth = rounds.length * (CARD_WIDTH + COL_GAP);
  const svgHeight = maxY + CARD_HEIGHT + CARD_GAP * 2;
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

  // Remove the outermost round (first column)
  // Shift all rounds left by one, so round 2 becomes round 1, etc.
  const roundsNoFirst = rounds.slice(1);
  // For each phase, split matches into left/right
  const leftRounds = [];
  const rightRounds = [];
  for (let i = 0; i < roundsNoFirst.length - 1; i++) {
    const r = roundsNoFirst[i] || [];
    leftRounds.push(r.slice(0, Math.ceil(r.length / 2)));
    rightRounds.push(r.slice(Math.ceil(r.length / 2)));
  }
  // Final match (center)
  const finalMatch = (roundsNoFirst[roundsNoFirst.length - 1] && roundsNoFirst[roundsNoFirst.length - 1][0]) || null;

  // Calculate positions for left, right, and center
  function getSymmetricPositions(roundsArr, side, totalCols) {
    let prevY = null;
    return roundsArr.map((matches, roundIdx) => {
      const positions = matches.map((_, matchIdx) => {
        const colIdx = side === 'left' ? roundIdx : totalCols - roundIdx - 1;
        const y = getMatchY(roundIdx, matchIdx, roundsArr.map(r => r.length), prevY);
        return {
          x: colIdx * (CARD_WIDTH + COL_GAP),
          y
        };
      });
      prevY = positions.map(pos => pos.y);
      return positions;
    });
  }
  const totalCols = leftRounds.length + rightRounds.length + 1;
  const leftPositions = getSymmetricPositions(leftRounds, 'left', totalCols);
  const rightPositions = getSymmetricPositions(rightRounds, 'right', totalCols);
  // Center position for final
  const centerCol = leftRounds.length;
  const finalY = (leftPositions[leftPositions.length - 1]?.[0]?.y ?? 0 + rightPositions[rightPositions.length - 1]?.[0]?.y ?? 0) / 2;
  const finalPos = {
    x: centerCol * (CARD_WIDTH + COL_GAP),
    y: finalY
  };

  // SVG line logic for symmetric bracket
  function SymmetricBracketSVG() {
    // Collect all positions and lines
    const lines = [];
    // Left side
    for (let r = 0; r < leftPositions.length - 1; r++) {
      if (!leftPositions[r] || !leftPositions[r + 1] || leftPositions[r].length < 2) continue;
      for (let m = 0; m < Math.floor(leftPositions[r].length / 2); m++) {
        const prev1 = leftPositions[r][m * 2];
        const prev2 = leftPositions[r][m * 2 + 1];
        const next = leftPositions[r + 1][m];
        if (!prev1 || !prev2 || !next) continue;
        // Horizontal lines
        lines.push({ x1: prev1.x + CARD_WIDTH, y1: prev1.y + CARD_HEIGHT / 2, x2: prev1.x + CARD_WIDTH + 14, y2: prev1.y + CARD_HEIGHT / 2 });
        lines.push({ x1: prev2.x + CARD_WIDTH, y1: prev2.y + CARD_HEIGHT / 2, x2: prev2.x + CARD_WIDTH + 14, y2: prev2.y + CARD_HEIGHT / 2 });
        // Vertical connector
        lines.push({ x1: prev1.x + CARD_WIDTH + 14, y1: prev1.y + CARD_HEIGHT / 2, x2: prev2.x + CARD_WIDTH + 14, y2: prev2.y + CARD_HEIGHT / 2 });
        // Horizontal to next match
        lines.push({ x1: prev1.x + CARD_WIDTH + 14, y1: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2, x2: next.x, y2: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2 });
      }
    }
    // Right side
    for (let r = 0; r < rightPositions.length - 1; r++) {
      if (!rightPositions[r] || !rightPositions[r + 1] || rightPositions[r].length < 2) continue;
      for (let m = 0; m < Math.floor(rightPositions[r].length / 2); m++) {
        const prev1 = rightPositions[r][m * 2];
        const prev2 = rightPositions[r][m * 2 + 1];
        const next = rightPositions[r + 1][m];
        if (!prev1 || !prev2 || !next) continue;
        // Horizontal lines (to left)
        lines.push({ x1: prev1.x, y1: prev1.y + CARD_HEIGHT / 2, x2: prev1.x - 14, y2: prev1.y + CARD_HEIGHT / 2 });
        lines.push({ x1: prev2.x, y1: prev2.y + CARD_HEIGHT / 2, x2: prev2.x - 14, y2: prev2.y + CARD_HEIGHT / 2 });
        // Vertical connector
        lines.push({ x1: prev1.x - 14, y1: prev1.y + CARD_HEIGHT / 2, x2: prev2.x - 14, y2: prev2.y + CARD_HEIGHT / 2 });
        // Horizontal to next match
        lines.push({ x1: prev1.x - 14, y1: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2, x2: next.x, y2: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2 });
      }
    }
    // Connect last left and right to final
    const leftLast = leftPositions[leftPositions.length - 1]?.[0];
    const rightLast = rightPositions[rightPositions.length - 1]?.[0];
    if (leftLast && finalPos) {
      lines.push({ x1: leftLast.x + CARD_WIDTH, y1: leftLast.y + CARD_HEIGHT / 2, x2: finalPos.x, y2: finalPos.y + CARD_HEIGHT / 2 });
    }
    if (rightLast && finalPos) {
      lines.push({ x1: rightLast.x, y1: rightLast.y + CARD_HEIGHT / 2, x2: finalPos.x + CARD_WIDTH, y2: finalPos.y + CARD_HEIGHT / 2 });
    }
    // SVG size
    let maxY = 0;
    [...leftPositions, ...rightPositions].forEach(col => {
      if (col && col.length) {
        const last = col[col.length - 1];
        if (last && last.y > maxY) maxY = last.y;
      }
    });
    if (finalPos.y > maxY) maxY = finalPos.y;
    const svgWidth = totalCols * (CARD_WIDTH + COL_GAP);
    const svgHeight = maxY + CARD_HEIGHT + CARD_GAP * 2;
    return (
      <svg className="bracket-svg" width={svgWidth} height={svgHeight} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 1 }}>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#4299e1" strokeWidth={4} />
        ))}
      </svg>
    );
  }

  // Responsive container size
  const containerWidth = Math.max(window.innerWidth, totalCols * (CARD_WIDTH + COL_GAP));
  const containerHeight = Math.max(window.innerHeight - 40, 600);

  return (
    <div className="faza-pucharowa-container" style={{ width: '100vw', height: '100vh', overflow: 'auto', margin: 0, paddingTop: '7rem', background: '#f8f9fa' }}>
      <h1 style={{ textAlign: 'center', margin: 0, padding: '16px 0 30px 0' }}>Faza pucharowa</h1>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>Ładowanie drabinki...</div>
      ) : error ? (
        <div style={{ padding: 40, color: "red", textAlign: "center" }}>{error}</div>
      ) : (!leftRounds.length && !rightRounds.length) ? (
        <div style={{ padding: 40, textAlign: "center" }}>Brak danych o drabince.</div>
      ) : (
        <div className="bracket-svg-container" style={{ position: 'relative', minWidth: containerWidth, minHeight: containerHeight, width: containerWidth, height: containerHeight, margin: '0 auto', overflow: 'auto', paddingTop: 32 }}>
          <SymmetricBracketSVG />
          {/* Left side */}
          {leftRounds.map((matches, roundIdx) => (
            <div className="bracket-col-svg" key={"left-"+roundIdx} style={{ position: 'absolute', left: roundIdx * (CARD_WIDTH + COL_GAP), top: 0, width: CARD_WIDTH, height: containerHeight }}>
              {/* Round labels: Runda 1, Runda 2, Ćwierćfinały, Półfinały */}
              {(() => {
                const roundLabels = ["Runda 1", "Runda 2", "Ćwierćfinały", "Półfinały"];
                if (roundIdx < roundLabels.length) {
                  return (
                    <div className="bracket-round-title" style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      textAlign: 'center',
                      zIndex: 3,
                      fontWeight: 700,
                      fontSize: 18,
                      color: '#2d3748',
                      background: 'rgba(255,255,255,0.85)'
                    }}>{roundLabels[roundIdx]}</div>
                  );
                }
                return null;
              })()}
              {matches.map((match, matchIdx) => (
                <div key={matchIdx} style={{ position: 'absolute', left: 0, top: leftPositions[roundIdx][matchIdx].y, width: CARD_WIDTH, zIndex: 2 }}>
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
          {/* Right side */}
          {rightRounds.map((matches, roundIdx) => (
            <div className="bracket-col-svg" key={"right-"+roundIdx} style={{ position: 'absolute', left: (totalCols - roundIdx - 1) * (CARD_WIDTH + COL_GAP), top: 0, width: CARD_WIDTH, height: containerHeight }}>
              {/* Round labels: Runda 1, Runda 2, Ćwierćfinały, Półfinały */}
              {(() => {
                const roundLabels = ["Runda 1", "Runda 2", "Ćwierćfinały", "Półfinały"];
                if (roundIdx < roundLabels.length) {
                  return (
                    <div className="bracket-round-title" style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: '100%',
                      textAlign: 'center',
                      zIndex: 3,
                      fontWeight: 700,
                      fontSize: 18,
                      color: '#2d3748',
                      background: 'rgba(255,255,255,0.85)'
                    }}>{roundLabels[roundIdx]}</div>
                  );
                }
                return null;
              })()}
              {matches.map((match, matchIdx) => (
                <div key={matchIdx} style={{ position: 'absolute', left: 0, top: rightPositions[roundIdx][matchIdx].y, width: CARD_WIDTH, zIndex: 2 }}>
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
          {/* Final match in center */}
          {finalMatch && (
            <div className="bracket-col-svg" key="center-final" style={{ position: 'absolute', left: centerCol * (CARD_WIDTH + COL_GAP), top: 0, width: CARD_WIDTH, height: containerHeight }}>
              <div className="bracket-round-title" style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                textAlign: 'center',
                zIndex: 3,
                fontWeight: 700,
                fontSize: 18,
                color: '#2d3748',
                background: 'rgba(255,255,255,0.85)'
              }}>Finał</div>
              <div style={{ position: 'absolute', left: 0, top: finalPos.y, width: CARD_WIDTH, zIndex: 2 }}>
                <MatchCard
                  teamA={{ nazwa: finalMatch.teamA_name || "-", druzyna: finalMatch.teamA_team || "", opis: finalMatch.teamA_opis }}
                  teamB={finalMatch.teamB_id ? { nazwa: finalMatch.teamB_name || "-", druzyna: finalMatch.teamB_team || "" } : null}
                  scoreA={finalMatch.scoreA}
                  scoreB={finalMatch.scoreB}
                  highlight={true}
                  arctusy={finalMatch.arctusy}
                  showOpis={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
