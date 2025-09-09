import * as admin from "firebase-admin";
// Zmień import z 'firebase-functions' na specyficzny trigger v2 dla Firestore
import {onDocumentWritten} from "firebase-functions/v2/firestore";

admin.initializeApp();

/**
 * Cloud Function, która agreguje sumy punktów dla drużyn w kolekcji 'Punktacja'
 * i zapisuje wyniki do kolekcji 'scoring_agg'.
 *
 * Ta funkcja jest uruchamiana za każdym razem,
 * gdy dokument w kolekcji 'Punktacja'
 * jest tworzony, aktualizowany lub usuwany.
 */
// Użyj triggera onDocumentWritten z V2 SDK
exports.aggregateScores = onDocumentWritten(
  "Punktacja/{docId}", // Tutaj nadal określasz ścieżkę dokumentu
  async (event) => { // W v2, `_change` i `_context`
  // są teraz w jednym obiekcie `event`
    const db = admin.firestore();

    try {
      // 1. Pobierz wszystkie dokumenty z kolekcji 'Punktacja'.
      // Robimy to za każdym razem, aby mieć pewność, że agregacja jest aktualna
      // po każdej zmianie (dodaniu, modyfikacji, usunięciu punktu).
      const snapshot = await db.collection("Punktacja").get();

      // 2. Zainicjuj obiekt do przechowywania
      // zagregowanych wyników dla każdej drużyny.
      const aggregatedScores: { [team: string]: number } = {};

      // 3. Przejdź przez każdy dokument i zsumuj wartości
      // 'score_value' dla każdej 'score_team'.
      snapshot.forEach((doc) => {
        // Pamiętaj o nawiasach wokół 'doc' dla ESLint
        const data = doc.data();
        const team = data.score_team;
        const score = data.score_value;

        // Sprawdź, czy dane są poprawne, aby uniknąć błędów
        if (typeof team === "string" && typeof score === "number") {
          if (aggregatedScores[team]) {
            aggregatedScores[team] += score;
          } else {
            aggregatedScores[team] = score;
          }
        }
      });

      // 4. Przygotuj operacje zapisu do kolekcji
      // 'scoring_agg' przy użyciu batcha,
      // co jest bardziej wydajne przy wielu operacjach.
      const batch = db.batch();

      // Pobierz aktualne dokumenty z scoring_agg,
      // aby móc usunąć te, które już nie istnieją w Punktacji
      const currentAggDocs = await db.collection("scoring_agg").get();

      // Oznacz do usunięcia dokumenty w 'scoring_agg',
      // dla których nie ma już danych w 'Punktacja'
      currentAggDocs.forEach((doc) => {
        // Pamiętaj o nawiasach wokół 'doc'
        if (!aggregatedScores[doc.id]) {
          // Jeśli ID dokumentu (nazwa drużyny)
          // nie ma w nowo zagregowanych wynikach
          batch.delete(doc.ref);
        }
      });

      // Ustaw/aktualizuj sumy dla każdej drużyny w 'scoring_agg'.
      for (const team in aggregatedScores) {
        if (Object.prototype.hasOwnProperty.call(aggregatedScores, team)) {
          const totalScore = aggregatedScores[team];
          // Użyj nazwy drużyny jako ID dokumentu
          // w 'scoring_agg' dla łatwiejszego dostępu.
          const teamRef = db.collection("scoring_agg").doc(team);
          batch.set(teamRef, {team: team, total_score: totalScore});
        }
      }

      // 5. Wykonaj wszystkie operacje zapisu
      // (aktualizacje i usunięcia) atomowo.
      await batch.commit();
      console.log("Scores aggregated and updated successfully in scoring_agg.");
    } catch (error) {
      console.error("Error aggregating scores:", error);
      // Ważne: Zwróć błąd, aby Cloud Functions
      // wiedziały, że coś poszło nie tak.
      throw new Error("Failed to aggregate scores");
    }
  }
);
