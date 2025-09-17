import { getDocs, collection } from "firebase/firestore"; 
import { getDb } from "./db.mjs"

const collection_name = "config"

export const configAll = async () => {
    const doc_refs = await getDocs(collection(getDb(), collection_name))

    let res = []

    doc_refs.forEach(config => {
        res.push({
            id: config.id, 
            ...config.data()
        })
    })

    return res
}