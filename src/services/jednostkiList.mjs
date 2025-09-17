import { getDocs, collection } from "firebase/firestore"; 
import { getDb } from "./db.mjs"

const collection_name = "jednostki"

export const jednostkiListAll = async () => {
    const doc_refs = await getDocs(collection(getDb(), collection_name))

    const res = []

    doc_refs.forEach(jednostka => {
        res.push({
            id: jednostka.id, 
            ...jednostka.data()
        })
    })

    return res
}