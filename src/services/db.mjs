import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 
import configData from "../main_config.json";

let db = false;

export const getDb = () => {
    if(!db){
        const firebaseConfig = {
            apiKey: configData.FIREBASE.apiKey,
            authDomain: configData.FIREBASE.authDomain,
            projectId: configData.FIREBASE.projectId,
            storageBucket: configData.FIREBASE.storageBucket,
            messagingSenderId: configData.FIREBASE.messagingSenderId,
            appId: configData.FIREBASE.appId
        }

        const app = initializeApp(firebaseConfig)

        db = getFirestore(app)
    }

    return db
}