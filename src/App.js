import { BrowserRouter as Router, Route, Routes, Outlet} from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import { useState, useRef , useEffect} from "react";

import HeaderNav from "./components/HeaderNav";
import MainPage from "./components/pages/MainPage";
import Footer from "./components/pages/Footer";
import ResultsTable from "./components/pages/ResultsPage";
import RegulationsPage from "./components/pages/RegulationsPage";
import NewsDetailPage from "./components/pages/NewsDetailPage";
import TeamsPage from  "./components/pages/TeamsPage";
import ZastepDetailPage from "./components/pages/ZastepDetailPage";
import PanelPage from "./components/pages/PanelPage";
import ArchivePage from "./components/pages/ArchivePage";



function NotFound() {
  return (
    <div style={{ padding: "4rem", textAlign: "center" , marginTop: "4rem",}}>
      <h2>404 - Nie znaleziono strony</h2>
      <p>Podana strona nie istnieje.</p>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [wasRedirected, setWasRedirected] = useState(false);
  const prevUserRef = useRef(null);

  useEffect(() => {
    // Przekieruj tylko raz po zmianie user z null na obiekt (czyli po zalogowaniu)
    if (
      !loading &&
      user &&
      location.pathname === "/" &&
      prevUserRef.current === null &&
      !wasRedirected
    ) {
      setWasRedirected(true);
      navigate("/panel");
    }
    // Resetuj flagę, gdy user się wyloguje
    if (!user) {
      setWasRedirected(false);
    }
    prevUserRef.current = user;
  }, [user, loading, location, wasRedirected, navigate]);

  return (
    <>
      <HeaderNav />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<MainPage />} />
            <Route path="wyniki" element={<ResultsTable />} />
            <Route path="regulamin" element={<RegulationsPage />} />
            <Route path="aktualnosci/:id" element={<NewsDetailPage />} />
            <Route path="zastepy" element={<TeamsPage />} />
            <Route path="zastepy/:id" element={<ZastepDetailPage />} />
            <Route path="archiwum" element={<ArchivePage />} />
            <Route
              path="panel"
              element={
                <ProtectedRoute>
                  <PanelPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(function (registration) {
          console.log("Service Worker zarejestrowany:", registration);
        })
        .catch(function (err) {
          console.error("Błąd rejestracji Service Workera:", err);
        });
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}