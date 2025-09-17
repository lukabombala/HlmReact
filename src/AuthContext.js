import { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  getRedirectResult
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "./firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    getRedirectResult(auth)
      .catch(error => {
        if (error) setAuthError(error.message);
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Dodaj użytkownika do kolekcji "usersWeb" jeśli nie istnieje
      if (currentUser) {
        const userRef = doc(db, "usersWeb", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            provider: currentUser.providerData?.[0]?.providerId || null
          });
        }
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  // Obsługa logowania Google: popup na desktop, redirect na mobile
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, authError }}>
      {children}
      {authError && (
        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff3f3",
          color: "#d32f2f",
          padding: "1rem",
          textAlign: "center",
          zIndex: 9999,
          borderTop: "1px solid #f8d7da"
        }}>
          Błąd logowania: {authError}
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);