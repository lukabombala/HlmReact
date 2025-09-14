import { BrowserRouter as Router, Route, Routes, Outlet } from "react-router-dom";
import { useState } from "react";
import HeaderNav from "./components/HeaderNav";
import MainPage from "./components/pages/MainPage";
import NewsSection from "./components/pages/NewsPagev2";
import Footer from "./components/pages/Footer";
import ResultsTable from "./components/pages/ResultsPage";
import RegulationsPage from "./components/pages/RegulationsPage";
import NewsDetailPage from "./components/pages/NewsDetailPage";
import TeamsPage from  "./components/pages/TeamsPage";
import ZastepDetailPage from "./components/pages/ZastepDetailPage";
import PanelPage from "./components/pages/PanelPage";

function NotFound() {
  return (
    <div style={{ padding: "4rem", textAlign: "center" , marginTop: "4rem",}}>
      <h2>404 - Nie znaleziono strony</h2>
      <p>Podana strona nie istnieje.</p>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <Router>
      <HeaderNav isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<MainPage />} />
            <Route path="wyniki" element={<ResultsTable />} />
            <Route path="regulamin" element={<RegulationsPage />} />
            <Route path="aktualnosci/:id" element={<NewsDetailPage />} />
            <Route path="zastepy" element={<TeamsPage />} />
            <Route path="zastepy/:id" element={<ZastepDetailPage />} />
            <Route path="*" element={<NotFound />} />
            <Route
            path="/panel"
            element={
              isLoggedIn ? <PanelPage /> : <NotFound />
            }
          />
          </Route>
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}