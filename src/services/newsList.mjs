import { getDocs, collection } from "firebase/firestore"; 
import { getDb } from "./db.mjs"

const collection_name = "aktualnosci"

export const newsListAll = async () => {
    const doc_refs = await getDocs(collection(getDb(), collection_name))

    const res = []

    doc_refs.forEach(news => {
        res.push({
            id: news.id, 
            ...news.data()
        })
    })

    return res
}