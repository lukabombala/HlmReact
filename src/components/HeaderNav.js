import { useState, useEffect } from "react";
import { Container, Navbar, Nav, Button, Modal } from "react-bootstrap";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Newspaper,
  Shield,
  LogIn,
  LogOut
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { configAll } from "../services/configList.mjs";
import { useAuth } from "../AuthContext";

function HeaderNav() {
  const [expanded, setExpanded] = useState(false);
  const [showCup, setShowCup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const { user, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    configAll().then(configs => {
      const cupConfig = configs.find(c => c.id === "zzzzzzzzzzzzzzzzzzzy");
      setShowCup(!!(cupConfig && cupConfig.settingsToggle === true));
    });
  }, []);

  const navItems = [
    { name: "Aktualności", icon: Calendar, to: "/" },
    { name: "Wyniki", icon: BarChart3, to: "/wyniki" },
    { name: "Zastępy", icon: Users, to: "/zastepy" },
    ...(showCup ? [{ name: "Faza pucharowa", icon: Trophy, to: "/fazapucharowa" }] : []),
    { name: "Regulamin", icon: Newspaper, to: "/regulamin" }
  ];

  return (
    <Navbar
      variant="dark"
      expand="md"
      className="shadow-lg py-3"
      style={{ backgroundColor: "#0d7337" }}
      fixed="top"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <Navbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center gap-2"
          style={{ cursor: "pointer" }}
        >
          <Trophy size={32} className="me-2" />
          <span className="fs-4 fw-bold">Harcerska Liga Mistrzów</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Nav.Link
                  as={Link}
                  to={item.to}
                  key={item.name}
                  className={`d-flex align-items-center gap-2${isActive ? " active" : ""}`}
                  style={{
                    color: isActive ? "#fff" : "var(--bs-light)",
                    background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                    borderRadius: isActive ? "0.5rem" : undefined,
                    fontWeight: isActive ? 600 : 400,
                    transition: "background 0.2s"
                  }}
                  onClick={() => setExpanded(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon size={18} />
                  {item.name}
                </Nav.Link>
              );
            })}
            <div className="ms-3 d-flex align-items-center">
              {!user ? (
                <Button
                  variant="outline-light"
                  size="sm"
                  className="d-flex align-items-center gap-1"
                  style={{ fontWeight: 500 }}
                  onClick={() => setShowLogin(true)}
                >
                  <LogIn size={16} className="me-1" />
                  Zaloguj się
                </Button>
              ) : (
                <>
                  <Button
                    as={Link}
                    onClick={() => setExpanded(false)}
                    to="/panel"
                    variant="outline-light"
                    size="sm"
                    className="d-flex align-items-center gap-1 px-2"
                    style={{ fontWeight: 500 }}
                  >
                    <Shield size={16} className="me-1" />
                    Panel drużynowego
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="d-flex align-items-center gap-1 ms-2"
                    style={{ fontWeight: 500 }}
                    onClick={async () => {
                      await logout();
                      navigate("/");
                    }}
                  >
                    <LogOut size={16} className="me-1" />
                    Wyloguj się
                  </Button>
                </>
              )}
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
      {/* Modal logowania */}
      <Modal show={showLogin} onHide={() => setShowLogin(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title>Logowanie</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Button
          variant="success"
          className="w-100"
          onClick={async () => {
            try {
              await loginWithGoogle();
              setShowLogin(false);
              navigate("/panel");
            } catch (error) {
              // Obsłuż tylko, jeśli to nie jest zamknięcie popupu
              if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
                alert("Błąd logowania: " + error.message);
              }
              setShowLogin(false);
            }
          }}
        >
          Zaloguj się przez konto @zhr.pl
        </Button>
      </Modal.Body>
    </Modal>
    </Navbar>
  );
}

export default HeaderNav;