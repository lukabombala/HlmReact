import { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { app } from "../../firebaseConfig";
import { Table, Button, Form, Spinner } from "react-bootstrap";

export default function AdminMatchManager() {
  const [matches, setMatches] = useState([]);
  const [saving, setSaving] = useState({});
  const db = getFirestore(app);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), snap => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [db]);

  const handleScoreChange = (id, field, value) => {
    setMatches(matches =>
      matches.map(m => m.id === id ? { ...m, [field]: value } : m)
    );
  };

  const handleSave = async (match) => {
    setSaving(s => ({ ...s, [match.id]: true }));
    const { id, scoreA, scoreB, teamA_id, teamB_id, nextMatchId, teamA_name, teamB_name } = match;
    let winnerId = null;
    let winnerName = null;
    if (scoreA != null && scoreB != null && teamA_id && teamB_id) {
      if (scoreA > scoreB) {
        winnerId = teamA_id;
        winnerName = teamA_name;
      } else {
        winnerId = teamB_id;
        winnerName = teamB_name;
      }
    }
    await updateDoc(doc(db, "matches", id), { scoreA, scoreB, winnerId });
    // Progression logic: auto-advance winners to next phase
    if (nextMatchId && winnerId) {
      const nextRef = doc(db, "matches", nextMatchId);
      const nextSnap = await getDoc(nextRef);
      if (nextSnap.exists()) {
        const next = nextSnap.data();
        // Determine if teamA_id or teamB_id is empty, and fill in with winner
        let update = {};
        if (!next.teamA_id) {
          update.teamA_id = winnerId;
          update.teamA_name = winnerName;
        } else if (!next.teamB_id) {
          update.teamB_id = winnerId;
          update.teamB_name = winnerName;
        }
        if (Object.keys(update).length > 0) {
          await updateDoc(nextRef, update);
        }

        // Now, check if both teamA_id and teamB_id are set, and if so, ensure their names are set
        const afterUpdateSnap = await getDoc(nextRef);
        const afterUpdate = afterUpdateSnap.data();
        if (afterUpdate.teamA_id && afterUpdate.teamB_id) {
          // Both teams set, nothing more to do
        }
      }
    }
    setSaving(s => ({ ...s, [match.id]: false }));
  };

  if (!matches.length) return <Spinner animation="border" className="my-4" />;

  return (
    <div style={{ marginTop: 40, marginBottom: 40 }}>
      <h3>Panel admina: Zarządzanie meczami</h3>
      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Mecz</th><th>Faza</th><th>Zespół A</th><th>Zespół B</th><th>Wynik</th><th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {matches.map(match => (
            <tr key={match.id}>
              <td>{match.matchId}</td>
              <td>{match.phase}</td>
              <td>{match.teamA_name || <i>BYE</i>}</td>
              <td>{match.teamB_name || <i>BYE</i>}</td>
              <td>
                <Form.Control
                  type="number"
                  value={match.scoreA ?? ""}
                  onChange={e => handleScoreChange(match.id, "scoreA", e.target.value === "" ? null : Number(e.target.value))}
                  style={{ width: 60, display: "inline" }}
                  disabled={!match.teamA_id || !match.teamB_id}
                />
                {" : "}
                <Form.Control
                  type="number"
                  value={match.scoreB ?? ""}
                  onChange={e => handleScoreChange(match.id, "scoreB", e.target.value === "" ? null : Number(e.target.value))}
                  style={{ width: 60, display: "inline" }}
                  disabled={!match.teamA_id || !match.teamB_id}
                />
              </td>
              <td>
                <Button size="sm" onClick={() => handleSave(match)} disabled={saving[match.id] || !match.teamA_id || !match.teamB_id}>
                  {saving[match.id] ? <Spinner size="sm" animation="border" /> : "Zapisz"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
