import { getDocs, collection, doc } from "firebase/firestore"; 
import { getDb } from "./db.mjs";

const collection_name = "zastepy";

export const zastepyListAll = async () => {
  const db = getDb();
  const doc_refs = await getDocs(collection(db, collection_name));

  const res = [];

  for (const zastep of doc_refs.docs) {
    const zastepData = {
      id: zastep.id,
      ...zastep.data(),
      harcerze: [] // tu będą dane z subkolekcji
    };

    // Pobieranie subkolekcji "jedname" dla danego zastępu
    const harcerzeSnapshot = await getDocs(collection(db, collection_name, zastep.id, "jedname"));

    harcerzeSnapshot.forEach(harcerzDoc => {
      zastepData.harcerze.push({
        id: harcerzDoc.id,
        ...harcerzDoc.data()
      });
    });

    res.push(zastepData);
  }

  return res;
};
