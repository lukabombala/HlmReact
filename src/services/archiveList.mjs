import { getDocs, collection } from "firebase/firestore"; 
import { getDb } from "./db.mjs"

const collection_name = "archiwum"

export const archiveListAll = async () => {
    const doc_refs = await getDocs(collection(getDb(), collection_name))

    let res = []

    doc_refs.forEach(archive => {
        res.push({
            id: archive.id, 
            ...archive.data()
        })
    })

    return res
}