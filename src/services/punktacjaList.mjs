import { getDocs, collection } from "firebase/firestore";
import { getDb } from "./db.mjs";

const collection_name = "Punktacja";

export const punktacjaListAll = async () => {
  const db = getDb();
  const doc_refs = await getDocs(collection(db, collection_name));
  const res = [];

  doc_refs.forEach(doc => {
    res.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return res;
};