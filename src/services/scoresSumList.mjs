import { getDocs, collection } from "firebase/firestore"; 
import { getDb } from "./db.mjs"

const collection_name = "scoring_agg"

export const scoresSumAll = async () => {
    const doc_refs = await getDocs(collection(getDb(), collection_name))

    let res = []

    doc_refs.forEach(score => {
        res.push({
            id: score.id, 
            ...score.data()
        })
    })

    return res
}