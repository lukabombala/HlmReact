import { useState } from "react";
import { Button, Modal, Spinner, Alert } from "react-bootstrap";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";
import { app } from "../../firebaseConfig";
import { generateTournament } from "../../utils/generateTournament";

export default function BracketAdminPanel({ onBracketCreated }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

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

      const teams = await fetchTeamsWithPoints();
      if (!teams.length) throw new Error("Brak drużyn z punktacją.");
      const matches = generateTournament(teams);
      await Promise.all(matches.map(match =>
        setDoc(doc(collection(db, "matches"), match.matchId), match)
      ));
      setInfo("Nowa drabinka została utworzona na podstawie aktualnej punktacji zastępów.");
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
          <Button variant="danger" onClick={handleCreateBracket} disabled={loading}>
            Utwórz drabinkę
          </Button>
        </Modal.Footer>
      </Modal>
      {info && <Alert variant="success" className="mt-3">{info}</Alert>}
    </div>
  );
}
