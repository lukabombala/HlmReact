import { BrowserRouter as Router, Route, Routes, Outlet } from "react-router-dom";
import HeaderNav from "./components/HeaderNav";
import MainPage from "./components/pages/MainPage";
import NewsSection from "./components/pages/NewsPagev2";
import Footer from "./components/pages/Footer";

function NotFound() {
  return (
    <div
      style={{marginTop: "3rem"}}>
      <h2>404 Not Found</h2>
      <p>Sorry, the page you are looking for does not exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <HeaderNav />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Outlet />}>
            <Route index element={<MainPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}