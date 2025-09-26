import { getFirestore, collection, addDoc, Timestamp, doc, setDoc } from "firebase/firestore";
import { app } from "../firebaseConfig";

/**
 * Dodaje lub edytuje wpis w kolekcji Punktacja.
 * @param {Object} params
 * @param {boolean} [params.isEdit] - czy to edycja wpisu
 * @param {string} [params.entryId] - id wpisu do edycji (wymagane przy edycji)
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
  selectedScoutPerson,
  isEdit = false,
  entryId,
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

  // scoreTeam mapowanie
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

  // scoreScout mapowanie (jeśli wybrano harcerza)
  let scoreScout;
  if (selectedScoutPerson) {
    scoreScout = [
      {
        id: selectedScoutPerson.id,
        snapshot: {
          name: selectedScoutPerson.name || "",
          surname: selectedScoutPerson.surname || "",
          stopien: selectedScoutPerson.stopien || "",
          zastepowy: !!selectedScoutPerson.zastepowy
        }
      }
    ];
  }

  // Mapowanie pól
  const entry = {
    scoreCat,
    scoreTeam,
    scoreValue: Number(points),
    miesiac: month,
    scoreModifiedDate: Timestamp.now(),
    scoreModifiedBy: userEmail,
  };

  if (!isEdit) {
    entry.scoreAddDate = Timestamp.now();
  }
  if (notes) entry.scoreInfo = notes;
  if (scoreScout) entry.scoreScout = scoreScout;

  try {
    if (isEdit && entryId) {
      await setDoc(doc(db, "Punktacja", entryId), entry, { merge: true });
      console.log("Zaktualizowano wpis punktacji! ID:", entryId, entry);
      return entryId;
    } else {
      const docRef = await addDoc(collection(db, "Punktacja"), entry);
      console.log("Dodano wpis punktacji! ID:", docRef.id, entry);
      return docRef.id;
    }
  } catch (error) {
    console.error("Błąd dodawania/edycji wpisu punktacji:", error, entry);
    throw error;
  }
}