import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { app } from "../firebaseConfig";

/**
 * Dodaje wpis do kolekcji Punktacja.
 * @param {Object} params
 * @param {Object} params.selectedCategory - obiekt wybranej kategorii (z modala)
 * @param {Object} params.selectedScoutTeam - obiekt wybranego zastępu (z modala)
 * @param {number} params.points - wartość punktacji (z modala)
 * @param {string} params.month - wybrany miesiąc w formacie "202509" (z modala)
 * @param {string} params.userEmail - adres email aktywnego użytkownika
 * @param {string} [params.notes] - uwagi do wpisu (z modala)
 * @param {Object} [params.selectedScoutPerson] - obiekt wybranego harcerza (z modala)
 */
export async function addPunktacjaEntry({
  selectedCategory,
  selectedScoutTeam,
  points,
  month,
  userEmail,
  notes,
}) {
  const db = getFirestore(app);

  // scoreCat mapowanie
  const scoreCat = [
    {
      id: selectedCategory.id,
      snapshot: {
        scoringKey: selectedCategory.scoringKey,
        scoringName: selectedCategory.scoringName,
        scoringDesc: selectedCategory.scoringDesc,
        scoringToggle: selectedCategory.scoringToggle,
      }
    }
  ];

  // scoreTeam z polem id i snapshot, w snapshot: blog, fullName, jednostka[0] z id i snapshot drużyny
  const scoreTeam = [
    {
      id: selectedScoutTeam.id,
      snapshot: {
        ...(selectedScoutTeam.blog && { blog: selectedScoutTeam.blog }),
        ...(selectedScoutTeam.fullName && { fullName: selectedScoutTeam.fullName }),
        jednostka: Array.isArray(selectedScoutTeam.jednostka) && selectedScoutTeam.jednostka[0]
          ? [
              {
                id: selectedScoutTeam.jednostka[0].id,
                snapshot: {
                  ...(selectedScoutTeam.jednostka[0].snapshot?.fullName && { fullName: selectedScoutTeam.jednostka[0].snapshot.fullName }),
                  ...(selectedScoutTeam.jednostka[0].snapshot?.leader && { leader: selectedScoutTeam.jednostka[0].snapshot.leader }),
                  ...(selectedScoutTeam.jednostka[0].snapshot?.shortName && { shortName: selectedScoutTeam.jednostka[0].snapshot.shortName }),
                }
              }
            ]
          : []
      }
    }
  ];

  // Mapowanie pól
  const entry = {
    scoreCat,
    scoreTeam,
    scoreValue: Number(points),
    miesiac: month,
    scoreAddDate: Timestamp.now(),
    scoreModifiedDate: Timestamp.now(),
    scoreModifiedBy: userEmail,
  };

  if (notes) entry.scoreInfo = notes;

  try {
    const docRef = await addDoc(collection(db, "Punktacja"), entry);
    console.log("Dodano wpis punktacji! ID:", docRef.id, entry);
    return docRef.id;
  } catch (error) {
    console.error("Błąd dodawania wpisu punktacji:", error, entry);
    throw error;
  }
}