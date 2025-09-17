import { getDocs, collection } from "firebase/firestore"; 
import { getDb } from "./db.mjs"

const collection_name = "aktualnosci"

export const newsListAll = async () => {
    const doc_refs = await getDocs(collection(getDb(), collection_name))

    let res = []

    doc_refs.forEach(news => {
        res.push({
            id: news.id, 
            ...news.data()
        })
    })

    // Filtrowanie po published === true
    res = res.filter(item => item.published === true);

    // Sortowanie po publicationTime.seconds malejąco (od najnowszego)
    res = res.sort((a, b) => {
        const aSec = a.publicationTime?.seconds || 0;
        const bSec = b.publicationTime?.seconds || 0;
        return bSec - aSec;
    });

    return res
}