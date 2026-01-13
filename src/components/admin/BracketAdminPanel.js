import { useState } from "react";
import "./BracketAdminPanel.css";
import { Button, Modal, Spinner, Alert } from "react-bootstrap";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";
import { app } from "../../firebaseConfig";
import { generateTournament } from "../../utils/generateTournament";

export default function BracketAdminPanel({ onBracketCreated }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualMatches, setManualMatches] = useState([]);
  const [manualError, setManualError] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [mode, setMode] = useState("auto");
  const [teams, setTeams] = useState([]);

  // Aggregate team points on the fly (like ResultsPage)
  async function fetchTeamsWithPoints() {
    const punktacje = await punktacjaListAll();
    const scoresByZastep = {};
    punktacje.forEach((entry) => {
      if (
        entry.scoreTeam &&
        Array.isArray(entry.scoreTeam) &&
        entry.scoreTeam[0] &&
        entry.scoreTeam[0].id
      ) {
        const zastepId = entry.scoreTeam[0].id;
        if (!scoresByZastep[zastepId]) {
          scoresByZastep[zastepId] = {
            teamId: zastepId,
            name: entry.scoreTeam[0].snapshot.fullName,
            team: entry.scoreTeam[0].snapshot.jednostka?.[0]?.snapshot.shortName || "",
            points: 0
          };
        }
        scoresByZastep[zastepId].points += entry.scoreValue;
      }
    });
    // Return as array, sorted by points desc
    return Object.values(scoresByZastep).sort((a, b) => b.points - a.points);
  }

  // Helper to summarize bracket
  function summarizeBracket(matches, teams) {
    const phases = {};
    const byes = {};
    matches.forEach(m => {
      if (!phases[m.phase]) phases[m.phase] = 0;
      phases[m.phase]++;
      // Bye: only one team in match
      if ((m.teamA_id && !m.teamB_id) || (!m.teamA_id && m.teamB_id)) {
        if (!byes[m.phase]) byes[m.phase] = [];
        if (m.teamA_id && !m.teamB_id) {
          byes[m.phase].push({ id: m.teamA_id, name: m.teamA_name });
        } else if (!m.teamA_id && m.teamB_id) {
          byes[m.phase].push({ id: m.teamB_id, name: m.teamB_name });
        }
      }
    });
    return { phases, byes };
  }

  async function handleShowSummary() {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const t = await fetchTeamsWithPoints();
      setTeams(t);
      if (!t.length) throw new Error("Brak drużyn z punktacją.");
      const matches = generateTournament(t);
      const sum = summarizeBracket(matches, t);
      setSummary({ matches, ...sum });
      setShowSummary(true);
    } catch (e) {
      setError(e.message || "Błąd podczas generowania podsumowania.");
    }
    setLoading(false);
    setShowConfirm(false);
  }

  function getPhase1Matches(matches) {
    return matches.filter(m => Number(m.phase) === 1);
  }

  function handleManualStart() {
    // Generate phase 1 matches using the same seeding and bye logic as generateTournament
    const slots = 32;
    const seedingOrder = [
      1, 32, 16, 17, 9, 24, 8, 25,
      5, 28, 12, 21, 13, 20, 4, 29,
      3, 30, 14, 19, 11, 22, 6, 27,
      7, 26, 10, 23, 15, 18, 2, 31
    ];
    // Sort teams by points descending (as in generator)
    const sorted = [...teams].sort((a, b) => b.points - a.points);
    const bracket = Array(slots).fill(null);
    for (let i = 0; i < Math.min(sorted.length, seedingOrder.length); i++) {
      bracket[seedingOrder[i] - 1] = sorted[i];
    }
    const manual = [];
    for (let i = 0; i < slots; i += 2) {
      const teamA = bracket[i];
      const teamB = bracket[i + 1];
      const idx = i / 2;
      if (teamA && !teamB) {
        manual.push({
          matchId: `1_${idx + 1}`,
          teamA_id: teamA.teamId,
          teamB_id: "",
          locked: true
        });
      } else if (!teamA && teamB) {
        manual.push({
          matchId: `1_${idx + 1}`,
          teamA_id: teamB.teamId,
          teamB_id: "",
          locked: true
        });
      } else {
        manual.push({
          matchId: `1_${idx + 1}`,
          teamA_id: "",
          teamB_id: "",
          locked: false
        });
      }
    }
    setManualMatches(manual);
    setShowManual(true);
    setManualError("");
  }

  function handleManualChange(idx, side, value) {
    setManualMatches(matches => matches.map((m, i) => i === idx ? { ...m, [side]: value } : m));
  }

  function validateManual() {
    // Each team must appear only once, all teams must be used
    const used = {};
    for (const m of manualMatches) {
      if (m.teamA_id) {
        if (used[m.teamA_id]) return `Zastęp ${getTeamName(m.teamA_id)} wybrany więcej niż raz.`;
        used[m.teamA_id] = true;
      }
      if (m.teamB_id) {
        if (used[m.teamB_id]) return `Zastęp ${getTeamName(m.teamB_id)} wybrany więcej niż raz.`;
        used[m.teamB_id] = true;
      }
    }
    const allIds = teams.map(t => t.teamId);
    for (const id of allIds) {
      if (!used[id]) return `Zastęp ${getTeamName(id)} nie został przypisany do żadnego meczu.`;
    }
    return null;
  }

  function getTeamName(id) {
    const t = teams.find(t => t.teamId === id);
    return t ? t.name : id;
  }

  async function handleCreateBracket() {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const db = getFirestore(app);
      const matchesCol = collection(db, "matches");
      // Delete ALL matches before creating new ones (batched)
      const prev = await getDocs(matchesCol);
      if (prev.size > 0) {
        const batchSize = 500;
        let docs = prev.docs;
        while (docs.length > 0) {
          const batch = docs.slice(0, batchSize);
          await Promise.all(batch.map(d => deleteDoc(d.ref)));
          docs = docs.slice(batchSize);
        }
      }

      let usedTeams = teams;
      let matches = summary?.matches;
      if (mode === "auto") {
        // auto: use generated matches
        matches = generateTournament(teams);
      } else {
        // manual: use manualMatches for phase 1, then fill rest as in generator
        const phase1 = getPhase1Matches(summary.matches).map((m, i) => {
          const sel = manualMatches[i];
          if (sel.locked) {
            return {
              ...m,
              teamA_id: sel.teamA_id || null,
              teamB_id: null,
              teamA_name: teams.find(t => t.teamId === sel.teamA_id)?.name || null,
              teamB_name: null
            };
          } else {
            const teamA = teams.find(t => t.teamId === sel.teamA_id);
            const teamB = teams.find(t => t.teamId === sel.teamB_id);
            return {
              ...m,
              teamA_id: teamA?.teamId || null,
              teamB_id: teamB?.teamId || null,
              teamA_name: teamA?.name || null,
              teamB_name: teamB?.name || null
            };
          }
        });
        // Now, generate the rest of the bracket as in generator, but use phase1 as base
        let allMatches = [...phase1];
        let prevPhaseMatches = [...phase1];
        let phase = 2;
        let matchesInPhase = Math.floor(prevPhaseMatches.length / 2);
        let prevWinners = prevPhaseMatches.map(m => {
          if (m.teamA_id && !m.teamB_id) {
            return { id: m.teamA_id, name: m.teamA_name };
          } else if (!m.teamA_id && m.teamB_id) {
            return { id: m.teamB_id, name: m.teamB_name };
          }
          return null;
        });
        const matchId = (phase, idx) => `${phase}_${idx + 1}`;
        while (matchesInPhase >= 1) {
          for (let i = 0; i < matchesInPhase; i++) {
            let teamA_id = null, teamA_name = null, teamB_id = null, teamB_name = null;
            if (phase === 2) {
              const prev1 = prevWinners[i * 2];
              const prev2 = prevWinners[i * 2 + 1];
              if (prev1 && !prev2) {
                teamA_id = prev1.id;
                teamA_name = prev1.name;
              } else if (!prev1 && prev2) {
                teamA_id = prev2.id;
                teamA_name = prev2.name;
              }
            }
            const match = {
              matchId: matchId(phase, i),
              phase,
              matchOrder: i,
              teamA_id,
              teamB_id,
              teamA_name,
              teamB_name,
              scoreA: null,
              scoreB: null,
              winnerId: null,
              nextMatchId: matchesInPhase > 1 ? matchId(phase + 1, Math.floor(i / 2)) : null
            };
            allMatches.push(match);
          }
          matchesInPhase = Math.floor(matchesInPhase / 2);
          phase++;
          prevWinners = Array(matchesInPhase).fill(null);
        }
        matches = allMatches;
      }
      await Promise.all(matches.map(match =>
        setDoc(doc(collection(db, "matches"), match.matchId), match)
      ));
      setInfo("Nowa drabinka została utworzona na podstawie aktualnej punktacji zastępów.");
      setShowSummary(false);
      if (onBracketCreated) onBracketCreated();
    } catch (e) {
      setError(e.message || "Błąd podczas tworzenia drabinki.");
    }
    setLoading(false);
    setShowConfirm(false);
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <Button variant="danger" onClick={() => { setShowConfirm(true); setLoading(false); setError(""); setInfo(""); }} disabled={loading}>
        Utwórz nową drabinkę (na podstawie aktualnej punktacji)
      </Button>
      <Modal show={showConfirm} onHide={() => { setShowConfirm(false); setLoading(false); setError(""); }}>
        <Modal.Header closeButton>
          <Modal.Title>Potwierdzenie</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Jeśli istnieje stara drabinka, zostanie usunięta. Nowa drabinka zostanie utworzona na podstawie aktualnej punktacji zastępów.</p>
          <p>Czy na pewno chcesz kontynuować?</p>
          {loading && <Spinner animation="border" />}
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button variant="danger" onClick={handleShowSummary} disabled={loading}>
            Dalej
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Summary Modal */}
      <Modal show={showSummary} onHide={() => setShowSummary(false)} dialogClassName="manual-modal-wide">
        <Modal.Header closeButton>
          <Modal.Title>Podsumowanie generowania drabinki</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {summary && !showManual && (
            <div>
              <p>Liczba faz: <b>{Object.keys(summary.phases).length}</b></p>
              <p>Liczba meczów: <b>{Object.values(summary.phases).reduce((a,b)=>a+b,0)}</b></p>
              {summary.byes[1] && summary.byes[1].length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <b>Faza 1:</b> {summary.byes[1].length} bye<br />
                  {summary.byes[1].map(b => <span key={b.id} style={{ fontSize: '0.95em', color: '#555' }}>• {b.name}<br /></span>)}
                </div>
              )}
              <hr />
              <div>
                <b>Wybierz sposób przydziału drużyn do meczów fazy 1:</b><br />
                <label style={{ marginRight: 16 }}>
                  <input type="radio" name="mode" value="auto" checked={mode === "auto"} onChange={()=>setMode("auto")}/> Automatycznie (wg punktacji)
                </label>
                <label>
                  <input type="radio" name="mode" value="manual" checked={mode === "manual"} onChange={()=>setMode("manual")}/> Ręcznie (wybierz drużyny do meczów fazy 1)
                </label>
              </div>
            </div>
          )}
          {showManual && (
            <div>
              <h5>Ręczny przydział drużyn do meczów fazy 1</h5>
              <p>Każdy zastęp może być wybrany tylko raz. Wszystkie muszą być przypisane.</p>
              {manualError && <Alert variant="danger">{manualError}</Alert>}
              <table className="table table-bordered">
                <thead><tr><th>Mecz</th><th>Zespół A</th><th>Zespół B</th></tr></thead>
                <tbody>
                  {manualMatches.map((m, i) => (
                    <tr key={m.matchId}>
                      <td>{m.matchId}</td>
                      <td>
                        {m.locked ? (
                          <input type="text" value={getTeamName(m.teamA_id)} disabled style={{ background: '#eee', width: '100%' }} />
                        ) : (
                          <select value={m.teamA_id} onChange={e => handleManualChange(i, "teamA_id", e.target.value)}>
                            <option value="">–</option>
                            {teams.map(t => (
                              <option key={t.teamId} value={t.teamId} disabled={manualMatches.some((mm, idx) => idx !== i && (mm.teamA_id === t.teamId || mm.teamB_id === t.teamId))}>
                                {t.name} - {t.team}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        {m.locked ? (
                          <input type="text" value="BYE" disabled style={{ background: '#eee', width: '100%' }} />
                        ) : (
                          <select value={m.teamB_id} onChange={e => handleManualChange(i, "teamB_id", e.target.value)}>
                            <option value="">–</option>
                            {teams.map(t => (
                              <option key={t.teamId} value={t.teamId} disabled={manualMatches.some((mm, idx) => idx !== i && (mm.teamA_id === t.teamId || mm.teamB_id === t.teamId))}>
                                {t.name} - {t.team}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {loading && <Spinner animation="border" />}
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          {!showManual && <>
            <Button variant="secondary" onClick={() => setShowSummary(false)} disabled={loading}>Anuluj</Button>
            <Button variant="danger" onClick={mode === "manual" ? handleManualStart : handleCreateBracket} disabled={loading || !summary}>
              {mode === "manual" ? "Dalej (przydziel drużyny)" : "Generuj drabinkę"}
            </Button>
          </>}
          {showManual && <>
            <Button variant="secondary" onClick={() => { setShowManual(false); setManualError(""); }} disabled={loading}>Wstecz</Button>
            <Button variant="danger" onClick={() => {
              const err = validateManual();
              if (err) { setManualError(err); return; }
              setShowManual(false); handleCreateBracket();
            }} disabled={loading}>Zatwierdź i generuj drabinkę</Button>
          </>}
        </Modal.Footer>
      </Modal>

      {info && <Alert variant="success" className="mt-3">{info}</Alert>}
    </div>
  );
}
