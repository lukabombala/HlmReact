import { initializeApp } from "firebase/app";
import mainConfig from "./main_config.json";

const firebaseConfig = mainConfig.FIREBASE;

export const app = initializeApp(firebaseConfig);