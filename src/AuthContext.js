import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  getRedirectResult
} from "firebase/auth";
import { app } from "./firebaseConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const auth = getAuth(app);

  useEffect(() => {
    getRedirectResult(auth)
      .catch(error => {
        if (error) setAuthError(error.message);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);
  
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