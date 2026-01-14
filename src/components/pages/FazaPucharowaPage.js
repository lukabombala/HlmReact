import React, { useEffect, useState } from "react";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import { jednostkiListAll } from "../../services/jednostkiList.mjs";
import "./FazaPucharowaPage.css";
import { getFirestore, collection, onSnapshot, query, orderBy, getDoc, doc } from "firebase/firestore";
import { app } from "../../firebaseConfig";

// Map unit id to color
const UNIT_COLORS = {
  '0zQ12o8ZqqvxLkyP3H9H': '#4fc3f7', // kompania - błękitny
  '0zQ12o8ZqqvxLkyP3H9I': '#43a047', // gawra - zielony
  '0zQ12o8ZqqvxLkyP3H9M': '#222',    // bukowina - czarny
  '0zQ12o8ZqqvxLkyP3H9L': '#1976d2', // wawer - niebieski/chabrowy
  '0zQ12o8ZqqvxLkyP3H9J': '#8b1c2c', // puszcza - bordowy
  '0zQ12o8ZqqvxLkyP3H9K': '#e53935', // parasol - czerwony
};

function MatchCard({ teamA, teamB, scoreA, scoreB, highlight, arctusy, showOpis, phase }) {
  function getColor(team) {
    if (!team || !team.unitId) return undefined;
    return UNIT_COLORS[team.unitId] || undefined;
  }
  return (
    <div className={`match-card${highlight ? ' highlight' : ''}${arctusy ? ' arctusy' : ''}`}> 
      <div className="match-top-row" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className="team teamA" style={{ flex: 1, textAlign: 'right' }}>
          <span className="nazwa" style={{ color: getColor(teamA) }}>{teamA && teamA.nazwa ? teamA.nazwa.toUpperCase() : <span style={{ color: '#bbb' }}>–</span>}</span>
        </div>
        {teamB ? (
          <div className="team teamB" style={{ flex: 1, textAlign: 'left' }}>
            <span className="nazwa" style={{ color: getColor(teamB) }}>{teamB.nazwa ? teamB.nazwa.toUpperCase() : ""}</span>
          </div>
        ) : (
          phase === 1 ? (
            <div className="wolny-los" style={{ flex: 1, textAlign: 'left' }}>wolny los</div>
          ) : (
            <div className="team teamB" style={{ flex: 1, textAlign: 'left' }}><span style={{ color: '#bbb' }}>–</span></div>
          )
        )}
      </div>
      <div className="match-bottom-row" style={{ width: '100%', textAlign: 'center', marginTop: 2 }}>
        {teamB ? (
          <span className="score">{scoreA} <span className="colon">:</span> {scoreB}</span>
        ) : null}
      </div>
      {teamA && teamA.opis && (showOpis !== false) && <span className="opis">{teamA.opis}</span>}
    </div>
  );
}




// Parametry układu
const CARD_HEIGHT = 40;
const CARD_WIDTH = 220;
const CARD_GAP_PHASE1 = 38;
const CARD_GAP = 18;
const COL_GAP = 18; // Slightly increased gap for better phase separation

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
    // --- FETCH CURRENT PHASE ---
    const [currentPhase, setCurrentPhase] = useState('Runda 1');
    useEffect(() => {
      const db = getFirestore(app);
      getDoc(doc(db, "config", "currentPhase")).then(snap => {
        if (snap.exists()) {
          setCurrentPhase(snap.data().phase || 'Runda 1');
        }
      });
    }, []);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zastepy, setZastepy] = useState([]);
  const [jednostki, setJednostki] = useState([]);

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
    // Fetch zastepy and jednostki
    zastepyListAll().then(setZastepy);
    jednostkiListAll().then(setJednostki);
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
  // --- BYE/empty slot logic ---
  // Helper: get winner from a match (if known)
  function getWinner(match) {
    if (!match) return null;
    if (match.scoreA != null && match.scoreB != null && match.teamA_id && match.teamB_id) {
      if (match.scoreA > match.scoreB) return { id: match.teamA_id, nazwa: match.teamA_name, druzyna: match.teamA_team };
      if (match.scoreB > match.scoreA) return { id: match.teamB_id, nazwa: match.teamB_name, druzyna: match.teamB_team };
    }
    // BYE in phase 1
    if (Number(match.phase) === 1 && match.teamA_id && !match.teamB_id) {
      return { id: match.teamA_id, nazwa: match.teamA_name, druzyna: match.teamA_team };
    }
    if (Number(match.phase) === 1 && !match.teamA_id && match.teamB_id) {
      return { id: match.teamB_id, nazwa: match.teamB_name, druzyna: match.teamB_team };
    }
    return null;
  }

  // Helper: map teamId to unit name and full unit name
  const teamIdToUnit = {};
  zastepy.forEach(z => {
    if (z.id && z.jednostka && z.jednostka[0] && z.jednostka[0].id) {
      const unit = jednostki.find(j => j.id === z.jednostka[0].id);
      teamIdToUnit[z.id] = {
        shortName: unit?.shortName || "",
        fullName: unit?.name || ""
      };
    }
  });

  // Gather all patrol names in the bracket (phase 1)
  const patrolNameCounts = {};
  (roundsNoFirst[0] || []).forEach(match => {
    if (match.teamA_name) {
      patrolNameCounts[match.teamA_name] = (patrolNameCounts[match.teamA_name] || 0) + 1;
    }
    if (match.teamB_name) {
      patrolNameCounts[match.teamB_name] = (patrolNameCounts[match.teamB_name] || 0) + 1;
    }
  });


  // Build rounds with correct team slots for each match
  const leftRounds = [];
  const rightRounds = [];
  let prevLeftWinners = null;
  let prevRightWinners = null;
  for (let i = 0; i < roundsNoFirst.length - 1; i++) {
    const r = roundsNoFirst[i] || [];
    // left
    const left = [];
    for (let j = 0; j < Math.ceil(r.length / 2); j++) {
      const match = r[j];
      let teamA = null, teamB = null;
      // Always check for duplicate patrol names in every phase
      // Phase 1: ensure bye logic is correct
      if (i === 0) {
        if (match.teamA_id && !match.teamB_id) {
          // Only teamA present, teamB is empty (bye)
          let nazwa = match.teamA_name || "";
          if (patrolNameCounts[nazwa] > 1) {
            const unit = teamIdToUnit[match.teamA_id];
            let teamNumber = '';
            if (unit?.shortName) {
              const match = unit.shortName.match(/^(\d+)/);
              if (match) teamNumber = match[1];
            }
            if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
          }
          // Add unitId for color
          let unitId = null;
          const z = zastepy.find(z => z.id === match.teamA_id);
          if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
          teamA = { nazwa, opis: match.teamA_opis, unitId };
          teamB = null;
        } else if (!match.teamA_id && match.teamB_id) {
          // Only teamB present, assign to teamA, teamB is empty (bye)
          let nazwa = match.teamB_name || "";
          if (patrolNameCounts[nazwa] > 1) {
            const unit = teamIdToUnit[match.teamB_id];
            let teamNumber = '';
            if (unit?.shortName) {
              const match = unit.shortName.match(/^(\d+)/);
              if (match) teamNumber = match[1];
            }
            if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
          }
          let unitId = null;
          const z = zastepy.find(z => z.id === match.teamB_id);
          if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
          teamA = { nazwa, opis: match.teamB_opis, unitId };
          teamB = null;
        } else {
          // Both teams present or both missing
          if (match.teamA_id) {
            let nazwa = match.teamA_name || "";
            if (patrolNameCounts[nazwa] > 1) {
              const unit = teamIdToUnit[match.teamA_id];
              let teamNumber = '';
              if (unit?.shortName) {
                const match = unit.shortName.match(/^(\d+)/);
                if (match) teamNumber = match[1];
              }
              if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
            }
            let unitId = null;
            const z = zastepy.find(z => z.id === match.teamA_id);
            if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
            teamA = { nazwa, opis: match.teamA_opis, unitId };
          }
          if (match.teamB_id) {
            let nazwa = match.teamB_name || "";
            if (patrolNameCounts[nazwa] > 1) {
              const unit = teamIdToUnit[match.teamB_id];
              let teamNumber = '';
              if (unit?.shortName) {
                const match = unit.shortName.match(/^(\d+)/);
                if (match) teamNumber = match[1];
              }
              if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
            }
            let unitId = null;
            const z = zastepy.find(z => z.id === match.teamB_id);
            if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
            teamB = { nazwa, unitId };
          }
        }
      } else {
        // ...existing code for later phases...
        if (match.teamA_id) {
          let nazwa = match.teamA_name || "";
          if (patrolNameCounts[nazwa] > 1) {
            const unit = teamIdToUnit[match.teamA_id];
            let teamNumber = '';
            if (unit?.shortName) {
              const match = unit.shortName.match(/^(\d+)/);
              if (match) teamNumber = match[1];
            }
            if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
          }
          let unitId = null;
          const z = zastepy.find(z => z.id === match.teamA_id);
          if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
          teamA = { nazwa, opis: match.teamA_opis, unitId };
        }
        if (match.teamB_id) {
          let nazwa = match.teamB_name || "";
          if (patrolNameCounts[nazwa] > 1) {
            const unit = teamIdToUnit[match.teamB_id];
            let teamNumber = '';
            if (unit?.shortName) {
              const match = unit.shortName.match(/^(\d+)/);
              if (match) teamNumber = match[1];
            }
            if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
          }
          let unitId = null;
          const z = zastepy.find(z => z.id === match.teamB_id);
          if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
          teamB = { nazwa, unitId };
        }
      }
      // For later phases, only show teamA/teamB if match.teamA_id/match.teamB_id are set
      if (i > 0 && prevLeftWinners) {
        let teamAName = "", teamBName = "";
        let unitIdA = null, unitIdB = null;
        if (match.teamA_id) {
          const prev1 = prevLeftWinners[j * 2] || null;
          teamAName = prev1 && prev1.nazwa ? prev1.nazwa : "";
          if (patrolNameCounts[teamAName.split(' - ')[0]] > 1 && prev1 && prev1.id) {
            const unit = teamIdToUnit[prev1.id];
            let teamNumber = '';
            if (unit?.shortName) {
              const m = unit.shortName.match(/^(\d+)/);
              if (m) teamNumber = m[1];
            }
            if (teamNumber && !teamAName.includes(' - ' + teamNumber)) teamAName = teamAName.split(' - ')[0] + ' - ' + teamNumber;
          }
          unitIdA = prev1 && prev1.id ? (zastepy.find(z => z.id === prev1.id)?.jednostka?.[0]?.id) : null;
          teamA = { nazwa: teamAName, unitId: unitIdA };
        }
        if (match.teamB_id) {
          const prev2 = prevLeftWinners[j * 2 + 1] || null;
          teamBName = prev2 && prev2.nazwa ? prev2.nazwa : "";
          if (patrolNameCounts[teamBName.split(' - ')[0]] > 1 && prev2 && prev2.id) {
            const unit = teamIdToUnit[prev2.id];
            let teamNumber = '';
            if (unit?.shortName) {
              const m = unit.shortName.match(/^(\d+)/);
              if (m) teamNumber = m[1];
            }
            if (teamNumber && !teamBName.includes(' - ' + teamNumber)) teamBName = teamBName.split(' - ')[0] + ' - ' + teamNumber;
          }
          unitIdB = prev2 && prev2.id ? (zastepy.find(z => z.id === prev2.id)?.jednostka?.[0]?.id) : null;
          teamB = { nazwa: teamBName, unitId: unitIdB };
        }
      }
      left.push({ ...match, teamA, teamB });
    }
    leftRounds.push(left);
    // right
    const right = [];
    for (let j = Math.ceil(r.length / 2); j < r.length; j++) {
      const match = r[j];
      let teamA = null, teamB = null;
      if (i === 0) {
        if (match.teamA_id) {
          let nazwa = match.teamA_name || "";
          if (patrolNameCounts[nazwa] > 1) {
            const unit = teamIdToUnit[match.teamA_id];
            let teamNumber = '';
            if (unit?.shortName) {
              const match = unit.shortName.match(/^(\d+)/);
              if (match) teamNumber = match[1];
            }
            if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
          }
          let unitId = null;
          const z = zastepy.find(z => z.id === match.teamA_id);
          if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
          teamA = { nazwa, opis: match.teamA_opis, unitId };
        }
        if (match.teamB_id) {
          let nazwa = match.teamB_name || "";
          if (patrolNameCounts[nazwa] > 1) {
            const unit = teamIdToUnit[match.teamB_id];
            let teamNumber = '';
            if (unit?.shortName) {
              const match = unit.shortName.match(/^(\d+)/);
              if (match) teamNumber = match[1];
            }
            if (teamNumber && !nazwa.includes(' - ' + teamNumber)) nazwa = nazwa.split(' - ')[0] + ' - ' + teamNumber;
          }
          let unitId = null;
          const z = zastepy.find(z => z.id === match.teamB_id);
          if (z && z.jednostka && z.jednostka[0]) unitId = z.jednostka[0].id;
          teamB = { nazwa, unitId };
        }
      } else if (prevRightWinners) {
        const prev1 = prevRightWinners[(j - Math.ceil(r.length / 2)) * 2] || null;
        const prev2 = prevRightWinners[(j - Math.ceil(r.length / 2)) * 2 + 1] || null;
        let teamAName = prev1 && prev1.nazwa ? prev1.nazwa : "";
        let teamBName = prev2 && prev2.nazwa ? prev2.nazwa : "";
        if (patrolNameCounts[teamAName.split(' - ')[0]] > 1 && prev1 && prev1.id) {
          const unit = teamIdToUnit[prev1.id];
          let teamNumber = '';
          if (unit?.shortName) {
            const match = unit.shortName.match(/^(\d+)/);
            if (match) teamNumber = match[1];
          }
          if (teamNumber && !teamAName.includes(' - ' + teamNumber)) teamAName = teamAName.split(' - ')[0] + ' - ' + teamNumber;
        }
        if (patrolNameCounts[teamBName.split(' - ')[0]] > 1 && prev2 && prev2.id) {
          const unit = teamIdToUnit[prev2.id];
          let teamNumber = '';
          if (unit?.shortName) {
            const match = unit.shortName.match(/^(\d+)/);
            if (match) teamNumber = match[1];
          }
          if (teamNumber && !teamBName.includes(' - ' + teamNumber)) teamBName = teamBName.split(' - ')[0] + ' - ' + teamNumber;
        }
        let unitIdA = prev1 && prev1.id ? (zastepy.find(z => z.id === prev1.id)?.jednostka?.[0]?.id) : null;
        let unitIdB = prev2 && prev2.id ? (zastepy.find(z => z.id === prev2.id)?.jednostka?.[0]?.id) : null;
        teamA = prev1 ? { nazwa: teamAName, unitId: unitIdA } : null;
        teamB = prev2 ? { nazwa: teamBName, unitId: unitIdB } : null;
      }
      right.push({ ...match, teamA, teamB });
    }
    rightRounds.push(right);
    // Prepare winners for next round
    prevLeftWinners = left.map(getWinner);
    prevRightWinners = right.map(getWinner);
  }
  // Final match (center)
  let finalMatch = null;
  if (roundsNoFirst[roundsNoFirst.length - 1] && roundsNoFirst[roundsNoFirst.length - 1][0]) {
    const match = roundsNoFirst[roundsNoFirst.length - 1][0];
    let teamA = prevLeftWinners && prevLeftWinners[0] ? prevLeftWinners[0] : null;
    let teamB = prevRightWinners && prevRightWinners[0] ? prevRightWinners[0] : null;
    let teamAName = teamA && teamA.nazwa ? teamA.nazwa : "";
    let teamBName = teamB && teamB.nazwa ? teamB.nazwa : "";
    if (patrolNameCounts[teamAName.split(' - ')[0]] > 1 && teamA && teamA.id) {
      const unit = teamIdToUnit[teamA.id];
      const teamName = unit?.fullName;
      if (teamName && !teamAName.includes(' - ' + teamName)) teamAName = teamAName.split(' - ')[0] + ' - ' + teamName;
    }
    if (patrolNameCounts[teamBName.split(' - ')[0]] > 1 && teamB && teamB.id) {
      const unit = teamIdToUnit[teamB.id];
      const teamName = unit?.fullName;
      if (teamName && !teamBName.includes(' - ' + teamName)) teamBName = teamBName.split(' - ')[0] + ' - ' + teamName;
    }
    let unitIdA = teamA && teamA.id ? (zastepy.find(z => z.id === teamA.id)?.jednostka?.[0]?.id) : null;
    let unitIdB = teamB && teamB.id ? (zastepy.find(z => z.id === teamB.id)?.jednostka?.[0]?.id) : null;
    finalMatch = { ...match, teamA: teamA ? { nazwa: teamAName, unitId: unitIdA } : null, teamB: teamB ? { nazwa: teamBName, unitId: unitIdB } : null };
  }

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
  // Remove final column: only left and right rounds
  const totalCols = leftRounds.length + rightRounds.length;
  const leftPositions = getSymmetricPositions(leftRounds, 'left', totalCols);
  const rightPositions = getSymmetricPositions(rightRounds, 'right', totalCols);

  // Dodaj margines na górze drabinki, przesuwając wszystkie pozycje w dół
  // Move semifinals up by reducing the margin for the last round
  const BRACKET_TOP_MARGIN = 38;
  const SEMIFINAL_UP_SHIFT = 40; // px to move semifinals up
  function shiftPositions(positions, side) {
    // For semifinals, shift X outward by 16px (0.5cm) for each side
    const SEMIFINAL_X_SHIFT = 16;
    return positions.map((col, roundIdx, arr) => {
      if (roundIdx === arr.length - 1 && col.length === 1) {
        return col.map(pos => ({
          ...pos,
          y: pos.y + BRACKET_TOP_MARGIN - SEMIFINAL_UP_SHIFT,
          x: side === 'left' ? pos.x - SEMIFINAL_X_SHIFT : side === 'right' ? pos.x + SEMIFINAL_X_SHIFT : pos.x
        }));
      }
      return col.map(pos => ({ ...pos, y: pos.y + BRACKET_TOP_MARGIN }));
    });
  }
  const leftPositionsShifted = shiftPositions(leftPositions, 'left');
  const rightPositionsShifted = shiftPositions(rightPositions, 'right');

  // SVG line logic for symmetric bracket, with final connectors
  function SymmetricBracketSVG({ leftPositions, rightPositions, finalPos }) {
    // Collect all positions and lines
    const lines = [];
    const OUT_LINE = 6;
    // Left side
    for (let r = 0; r < leftPositions.length - 1; r++) {
      if (!leftPositions[r] || !leftPositions[r + 1] || leftPositions[r].length < 2) continue;
      for (let m = 0; m < Math.floor(leftPositions[r].length / 2); m++) {
        const prev1 = leftPositions[r][m * 2];
        const prev2 = leftPositions[r][m * 2 + 1];
        const next = leftPositions[r + 1][m];
        if (!prev1 || !prev2 || !next) continue;
        // For semifinals, draw a right-angle connector: horizontal to align with semifinal Y, then vertical
        if (r === leftPositions.length - 2 && leftPositions[r + 1].length === 1) {
          // This is the last connector to semifinal (which is shifted up)
          // Make the horizontal segment longer for clarity
          const HORIZ_EXTEND = 32; // px, increase for longer horizontal segment
          const semifinalX = next.x;
          const semifinalY = next.y + CARD_HEIGHT / 2;
          // From prev1
          lines.push({ x1: prev1.x + CARD_WIDTH, y1: prev1.y + CARD_HEIGHT / 2, x2: semifinalX - HORIZ_EXTEND, y2: prev1.y + CARD_HEIGHT / 2 });
          lines.push({ x1: semifinalX - HORIZ_EXTEND, y1: prev1.y + CARD_HEIGHT / 2, x2: semifinalX - HORIZ_EXTEND, y2: semifinalY });
          lines.push({ x1: semifinalX - HORIZ_EXTEND, y1: semifinalY, x2: semifinalX, y2: semifinalY });
          // From prev2
          lines.push({ x1: prev2.x + CARD_WIDTH, y1: prev2.y + CARD_HEIGHT / 2, x2: semifinalX - HORIZ_EXTEND, y2: prev2.y + CARD_HEIGHT / 2 });
          lines.push({ x1: semifinalX - HORIZ_EXTEND, y1: prev2.y + CARD_HEIGHT / 2, x2: semifinalX - HORIZ_EXTEND, y2: semifinalY });
          lines.push({ x1: semifinalX - HORIZ_EXTEND, y1: semifinalY, x2: semifinalX, y2: semifinalY });
        } else {
          // Horizontal lines (shorter outward)
          lines.push({ x1: prev1.x + CARD_WIDTH, y1: prev1.y + CARD_HEIGHT / 2, x2: prev1.x + CARD_WIDTH + OUT_LINE, y2: prev1.y + CARD_HEIGHT / 2 });
          lines.push({ x1: prev2.x + CARD_WIDTH, y1: prev2.y + CARD_HEIGHT / 2, x2: prev2.x + CARD_WIDTH + OUT_LINE, y2: prev2.y + CARD_HEIGHT / 2 });
          // Vertical connector
          lines.push({ x1: prev1.x + CARD_WIDTH + OUT_LINE, y1: prev1.y + CARD_HEIGHT / 2, x2: prev2.x + CARD_WIDTH + OUT_LINE, y2: prev2.y + CARD_HEIGHT / 2 });
          // Horizontal to next match (adjusted Y)
          lines.push({ x1: prev1.x + CARD_WIDTH + OUT_LINE, y1: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2, x2: next.x, y2: next.y + CARD_HEIGHT / 2 });
        }
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
        // For semifinals, draw a right-angle connector: horizontal to align with semifinal Y, then vertical
        if (r === rightPositions.length - 2 && rightPositions[r + 1].length === 1) {
          // This is the last connector to semifinal (which is shifted up)
          // Make the horizontal segment longer for clarity
          const HORIZ_EXTEND = 32; // px, increase for longer horizontal segment
          const semifinalX = next.x + CARD_WIDTH;
          const semifinalY = next.y + CARD_HEIGHT / 2;
          // From prev1
          lines.push({ x1: prev1.x, y1: prev1.y + CARD_HEIGHT / 2, x2: semifinalX + HORIZ_EXTEND, y2: prev1.y + CARD_HEIGHT / 2 });
          lines.push({ x1: semifinalX + HORIZ_EXTEND, y1: prev1.y + CARD_HEIGHT / 2, x2: semifinalX + HORIZ_EXTEND, y2: semifinalY });
          lines.push({ x1: semifinalX + HORIZ_EXTEND, y1: semifinalY, x2: semifinalX, y2: semifinalY });
          // From prev2
          lines.push({ x1: prev2.x, y1: prev2.y + CARD_HEIGHT / 2, x2: semifinalX + HORIZ_EXTEND, y2: prev2.y + CARD_HEIGHT / 2 });
          lines.push({ x1: semifinalX + HORIZ_EXTEND, y1: prev2.y + CARD_HEIGHT / 2, x2: semifinalX + HORIZ_EXTEND, y2: semifinalY });
          lines.push({ x1: semifinalX + HORIZ_EXTEND, y1: semifinalY, x2: semifinalX, y2: semifinalY });
        } else {
          // Horizontal lines (shorter outward)
          lines.push({ x1: prev1.x, y1: prev1.y + CARD_HEIGHT / 2, x2: prev1.x - OUT_LINE, y2: prev1.y + CARD_HEIGHT / 2 });
          lines.push({ x1: prev2.x, y1: prev2.y + CARD_HEIGHT / 2, x2: prev2.x - OUT_LINE, y2: prev2.y + CARD_HEIGHT / 2 });
          // Vertical connector
          lines.push({ x1: prev1.x - OUT_LINE, y1: prev1.y + CARD_HEIGHT / 2, x2: prev2.x - OUT_LINE, y2: prev2.y + CARD_HEIGHT / 2 });
          // Horizontal to next match (adjusted Y)
          lines.push({ x1: prev1.x - OUT_LINE, y1: (prev1.y + prev2.y) / 2 + CARD_HEIGHT / 2, x2: next.x, y2: next.y + CARD_HEIGHT / 2 });
        }
      }
    }
    // Lines from semifinals to final (adjusted for up-shift)
    if (finalPos && leftPositions[leftPositions.length - 1]?.[0] && rightPositions[rightPositions.length - 1]?.[0]) {
      const leftSemi = leftPositions[leftPositions.length - 1][0];
      const rightSemi = rightPositions[rightPositions.length - 1][0];
      // Optionally, add a small vertical segment down from the bottom of the semifinal card, then diagonal to the final
      const SEMIFINAL_CONNECTOR = 18; // px vertical segment below semifinal before diagonal
      // Left semifinal
      lines.push({
        x1: leftSemi.x + CARD_WIDTH / 2,
        y1: leftSemi.y + CARD_HEIGHT,
        x2: leftSemi.x + CARD_WIDTH / 2,
        y2: leftSemi.y + CARD_HEIGHT + SEMIFINAL_CONNECTOR
      });
      // Right semifinal
      lines.push({
        x1: rightSemi.x + CARD_WIDTH / 2,
        y1: rightSemi.y + CARD_HEIGHT,
        x2: rightSemi.x + CARD_WIDTH / 2,
        y2: rightSemi.y + CARD_HEIGHT + SEMIFINAL_CONNECTOR
      });
      // Diagonal from left vertical to final (shift end y by +20)
      lines.push({
        x1: leftSemi.x + CARD_WIDTH / 2,
        y1: leftSemi.y + CARD_HEIGHT + SEMIFINAL_CONNECTOR,
        x2: finalPos.x + CARD_WIDTH / 2,
        y2: finalPos.y + 20
      });
      // Diagonal from right vertical to final (shift end y by +20)
      lines.push({
        x1: rightSemi.x + CARD_WIDTH / 2,
        y1: rightSemi.y + CARD_HEIGHT + SEMIFINAL_CONNECTOR,
        x2: finalPos.x + CARD_WIDTH / 2,
        y2: finalPos.y + 20
      });
    }
    // SVG size
    let maxY = 0;
    [...leftPositions, ...rightPositions].forEach(col => {
      if (col && col.length) {
        const last = col[col.length - 1];
        if (last && last.y > maxY) maxY = last.y;
      }
    });
    if (finalPos && finalPos.y + CARD_HEIGHT > maxY) maxY = finalPos.y + CARD_HEIGHT;
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

  // Calculate final card position: below semifinals, centered
  let finalPos = null;
  if (leftPositionsShifted.length && rightPositionsShifted.length) {
    const leftSemi = leftPositionsShifted[leftPositionsShifted.length - 1]?.[0];
    const rightSemi = rightPositionsShifted[rightPositionsShifted.length - 1]?.[0];
    if (leftSemi && rightSemi) {
      // Center final card between the inner edges of the two semifinals
      const semiY = Math.max(leftSemi.y, rightSemi.y);
      const finalY = semiY + CARD_HEIGHT + 40; // 40px gap below semifinals
      // Find the right edge of the left semifinal and the left edge of the right semifinal
      const leftEdge = leftSemi.x + CARD_WIDTH;
      const rightEdge = rightSemi.x;
      const midEdge = (leftEdge + rightEdge) / 2;
      const finalX = midEdge - CARD_WIDTH / 2;
      finalPos = { x: finalX, y: finalY };
    }
  }
  // Oblicz rzeczywistą wysokość drabinki (największe y + wysokość kafelka + margines) po przesunięciu
  let maxY = 0;
  [...leftPositionsShifted, ...rightPositionsShifted].forEach(col => {
    if (col && col.length) {
      const last = col[col.length - 1];
      if (last && last.y > maxY) maxY = last.y;
    }
  });
  if (finalPos && finalPos.y + CARD_HEIGHT > maxY) maxY = finalPos.y + CARD_HEIGHT;
  const containerWidth = Math.max(window.innerWidth, totalCols * (CARD_WIDTH + COL_GAP));
  const containerHeight = maxY + CARD_HEIGHT + CARD_GAP * 2;

  return (
    <div className="faza-pucharowa-container" style={{ width: '100vw', overflow: 'auto', margin: 0, paddingTop: '7rem', background: '#f8f9fa' }}>
  
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 24px auto',
        background: '#e3f2fd',
        border: '2.5px solid #4299e1',
        borderRadius: 12,
        padding: '18px 28px',
        fontSize: 18,
        color: '#1a365d',
        boxShadow: '0 2px 12px #4299e122',
        lineHeight: 1.6
      }}>
        <b>Witamy w fazie pucharowej HLM sezonu 2025/2026!</b><br/>
        W tym roku obowiązują następujące zasady:<br/>
        <ul style={{margin: '10px 0 10px 24px', fontSize: 16}}>
          <li>Zmagania pucharowe odbędą się w 5 rundach.</li>
          <li>{roundsNoFirst[0] ? roundsNoFirst[0].filter(m => (m.teamA_id && !m.teamB_id) || (!m.teamA_id && m.teamB_id)).length : 0} najlepszych zastępów otrzymuje "wolny los" i nie musi walczyć w 1 rundzie (według punktacji ze stycznia 2026).</li>
          <li>Każda runda trwa jeden miesiac, na koniec miesiąca zastęp który zdobędzie więcej punktów przechodzi do kolejnej rundy.</li>
          <li>Więcej informacji w <b><a href="/regulamin" target="_blank" rel="noopener noreferrer">regulaminie Fazy Pucharowej</a></b></li>
        </ul>
        Życzymy powodzenia wszystkim zastęp i niech zwycięży najlepszy!
      </div>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>Ładowanie drabinki...</div>
      ) : error ? (
        <div style={{ padding: 40, color: "red", textAlign: "center" }}>{error}</div>
      ) : (!leftRounds.length && !rightRounds.length) ? (
        <div style={{ padding: 40, textAlign: "center" }}>Brak danych o drabince.</div>
      ) : (
        <div className="bracket-svg-container" style={{ position: 'relative', minWidth: containerWidth, width: containerWidth, height: containerHeight, margin: '0 auto', overflow: 'auto', paddingTop: 32 }}>
          <SymmetricBracketSVG leftPositions={leftPositionsShifted} rightPositions={rightPositionsShifted} finalPos={finalPos} />
          {/* Left side */}
          {leftRounds.map((matches, roundIdx) => (
            <div className="bracket-col-svg" key={"left-"+roundIdx} style={{ position: 'absolute', left: roundIdx * (CARD_WIDTH + COL_GAP), top: 0, width: CARD_WIDTH, height: containerHeight }}>
              {matches.map((match, matchIdx) => {
                const roundLabels = ["Runda 1", "Runda 2", "Ćwierćfinały", "Półfinały"];
                // For semifinals, shift left by 16px
                const SEMIFINAL_X_SHIFT = 16;
                const isSemifinal = roundIdx === leftPositionsShifted.length - 1 && matches.length === 1;
                const cardLeft = isSemifinal ? -SEMIFINAL_X_SHIFT : 0;
                return (
                  <div key={matchIdx} style={{ position: 'absolute', left: cardLeft, top: leftPositionsShifted[roundIdx][matchIdx].y, width: CARD_WIDTH, zIndex: 2 }}>
                    {matchIdx === 0 && roundIdx < roundLabels.length && (
                      <div
                        className={
                          'bracket-round-title' +
                          (roundLabels[roundIdx] === currentPhase ? ' bracket-round-title-current' : '')
                        }
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: -32,
                          width: '100%',
                          fontWeight: 700,
                          fontSize: 18,
                          textAlign: 'center',
                          pointerEvents: 'none',
                          zIndex: 3
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <span>{roundLabels[roundIdx]}</span>
                        </span>
                      </div>
                    )}
                    <MatchCard
                      teamA={match.teamA}
                      teamB={match.teamB}
                      scoreA={match.scoreA}
                      scoreB={match.scoreB}
                      highlight={match.final}
                      arctusy={match.arctusy}
                      showOpis={roundIdx === 0}
                      phase={roundIdx + 1}
                    />
                  </div>
                );
              })}
            </div>
          ))}
          {/* Right side */}
          {rightRounds.map((matches, roundIdx) => (
            <div className="bracket-col-svg" key={"right-"+roundIdx} style={{ position: 'absolute', left: (totalCols - roundIdx - 1) * (CARD_WIDTH + COL_GAP), top: 0, width: CARD_WIDTH, height: containerHeight }}>
              {matches.map((match, matchIdx) => {
                const roundLabels = ["Runda 1", "Runda 2", "Ćwierćfinały", "Półfinały"];
                // For semifinals, shift right by 16px
                const SEMIFINAL_X_SHIFT = 16;
                const isSemifinal = roundIdx === rightPositionsShifted.length - 1 && matches.length === 1;
                const cardLeft = isSemifinal ? SEMIFINAL_X_SHIFT : 0;
                return (
                  <div key={matchIdx} style={{ position: 'absolute', left: cardLeft, top: rightPositionsShifted[roundIdx][matchIdx].y, width: CARD_WIDTH, zIndex: 2 }}>
                    {matchIdx === 0 && roundIdx < roundLabels.length && (
                      <div
                        className={
                          'bracket-round-title' +
                          (roundLabels[roundIdx] === currentPhase ? ' bracket-round-title-current' : '')
                        }
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: -32,
                          width: '100%',
                          fontWeight: 700,
                          fontSize: 18,
                          textAlign: 'center',
                          pointerEvents: 'none',
                          zIndex: 3
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <span>{roundLabels[roundIdx]}</span>
                        </span>
                      </div>
                    )}
                    <MatchCard
                      teamA={match.teamA}
                      teamB={match.teamB}
                      scoreA={match.scoreA}
                      scoreB={match.scoreB}
                      highlight={match.final}
                      arctusy={match.arctusy}
                      showOpis={roundIdx === 0}
                      phase={roundIdx + 1}
                    />
                  </div>
                );
              })}
            </div>
          ))}
          {/* Final match card below semifinals, centered */}
          {finalMatch && finalPos && (
            <div
              className="bracket-col-svg"
              key="center-final"
              style={{
                position: 'absolute',
                left: finalPos.x - 58,
                top: finalPos.y + 40,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                zIndex: 3,
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ width: CARD_WIDTH }}>
                <MatchCard
                  teamA={finalMatch.teamA}
                  teamB={finalMatch.teamB}
                  scoreA={finalMatch.scoreA}
                  scoreB={finalMatch.scoreB}
                  highlight={true}
                  arctusy={finalMatch.arctusy}
                  showOpis={false}
                  phase={leftRounds.length + 1}
                />
                <div style={{
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: 18,
                  color: '#0d7337',
                  letterSpacing: 1,
                  textShadow: '0 2px 8px #fff, 0 1px 0 #4299e1',
                  background: 'rgba(255,255,255,0.92)',
                  padding: '0.2em 0 0.3em 0',
                  borderRadius: 10,
                  marginTop: 8
                }}>Finał</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
