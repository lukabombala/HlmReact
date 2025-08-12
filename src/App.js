import { BrowserRouter as Router, Route, Routes, Outlet } from "react-router-dom";
import { Container } from "react-bootstrap";
import HeaderNav from "./components/HeaderNav";
import MainPage from "./components/pages/MainPage";
import NewsSection from "./components/pages/NewsPagev2";
import Footer from "./components/pages/Footer";
import ResultsTable from "./components/pages/ResultsPage";
import RegulationsPage from "./components/pages/RegulationsPage";

function NotFound() {
  return (
    <Container className="py-5" style={{ textAlign: "center", marginTop: "4rem" }}>
      <h2>404 Not Found</h2>
      <p>Sorry, the page you are looking for does not exist.</p>
    </Container>
  );
}

export default function App() {
  return (
    <Router>
      <HeaderNav />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<MainPage />} />
            <Route path="wyniki" element={<ResultsTable />} />
            <Route path="regulamin" element={<RegulationsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}