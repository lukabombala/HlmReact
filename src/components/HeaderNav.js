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
  LogOut,
  Box,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { configAll } from "../services/configList.mjs";
import { useAuth } from "../AuthContext";
import fbLogo from "../images/facebook_logo.png";
import ytLogo from "../images/youtube_logov2.png";

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
    { name: "Archiwum", icon: Box, to: "/archiwum" },
    { name: "Regulamin", icon: Newspaper, to: "/regulamin" }
  ];

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Navbar
      variant="dark"
      expand="md"
      className="shadow-lg py-3"
      style={{
        backgroundColor: "#0d7337",
        minWidth: "340px",
        maxWidth: "100vw",
        width: "100%",
        paddingLeft: isMobile ? "0.7rem" : "2.5rem",
        paddingRight: isMobile ? "0.7rem" : "2.5rem"
      }}
      fixed="top"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container fluid style={{ maxWidth: "1600px" }}>
        <Navbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center gap-2"
          style={{
            cursor: "pointer",
            fontSize: isMobile ? "1rem" : "2rem",
            whiteSpace: isMobile ? "nowrap" : undefined,
          }}
        >
          <Trophy size={isMobile ? 22 : 32} className="me-2" />
          <span className="fw-bold">
            Harcerska Liga Mistrzów
          </span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-center gap-2">
          {isMobile ? (
            <div
              className="w-100 d-flex flex-column align-items-center justify-content-center"
              style={{ minHeight: "100%", width: "100%" }}
            >
              <div
                style={{
                  width: 145,
                  maxWidth: "90vw",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  return (
                    <Nav.Link
                      as={Link}
                      to={item.to}
                      key={item.name}
                      className={`d-flex align-items-center py-1 px-2${isActive ? " active" : ""}`}
                      style={{
                        color: isActive ? "#fff" : "var(--bs-light)",
                        background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                        borderRadius: isActive ? "0.5rem" : undefined,
                        fontWeight: isActive ? 600 : 400,
                        fontSize: 15,
                        minHeight: 38,
                        height: 38,
                        textAlign: "left",
                        whiteSpace: "nowrap",
                        width: "100%",
                        margin: "0 auto",
                        justifyContent: "flex-start",
                        gap: 10,
                      }}
                      onClick={() => setExpanded(false)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          minWidth: 36,
                          width: 36,
                          height: 36,
                        }}
                      >
                        <item.icon size={22} />
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          lineHeight: "1.2",
                          display: "inline-block",
                        }}
                      >
                        {item.name}
                      </span>
                    </Nav.Link>
                  );
                })}
              </div>
            </div>
          ) : (
            navItems.map((item) => {
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
            })
          )}
            <div className="ms-3 d-flex align-items-center flex-column flex-md-row w-100 w-md-auto">
              {/* Przyciski logowania/panel/wyloguj */}
              <div className="d-flex align-items-center">
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
                      title="Wyloguj się"
                      className="d-flex align-items-center gap-1 ms-2"
                      style={{ fontWeight: 500 }}
                      onClick={async () => {
                        await logout();
                        navigate("/");
                      }}
                    >
                      <LogOut size={16} className="me-1" />
                      {user.email}
                    </Button>
                  </>
                )}
              </div>
              {/* Ikony social osobno na mobile */}
              {isMobile ? (
                <div className="w-100 d-flex justify-content-center mt-2 gap-2">
                  <a
                    href="https://www.facebook.com/starodrzew?locale=pl_PL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "0.5rem",
                      width: 38,
                      height: 38,
                      transition: "background 0.2s"
                    }}
                    title="Facebook"
                  >
                    <img
                      src={fbLogo}
                      alt="Facebook"
                      style={{
                        width: 24,
                        height: 24,
                        display: "block"
                      }}
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/@harcerskaligamistrzow1340/featured"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "0.5rem",
                      width: 38,
                      height: 38,
                      transition: "background 0.2s"
                    }}
                    title="YouTube"
                  >
                    <img
                      src={ytLogo}
                      alt="YouTube"
                      style={{
                        width: 24,
                        height: 24,
                        display: "block"
                      }}
                    />
                  </a>
                </div>
              ) : (
                <>
                  <a
                    href="https://www.facebook.com/starodrzew?locale=pl_PL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-3 d-flex align-items-center justify-content-center"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "0.5rem",
                      width: 42,
                      height: 42,
                      transition: "background 0.2s"
                    }}
                    title="Facebook"
                  >
                    <img
                      src={fbLogo}
                      alt="Facebook"
                      style={{
                        width: 28,
                        height: 28,
                        display: "block"
                      }}
                    />
                  </a>
                  <a
                    href="https://www.youtube.com/@harcerskaligamistrzow1340/featured"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2 d-flex align-items-center justify-content-center"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "0.5rem",
                      width: 42,
                      height: 42,
                      transition: "background 0.2s"
                    }}
                    title="YouTube"
                  >
                    <img
                      src={ytLogo}
                      alt="YouTube"
                      style={{
                        width: 28,
                        height: 28,
                        display: "block"
                      }}
                    />
                  </a>
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
                if (
                  error.code !== "auth/popup-closed-by-user" &&
                  error.code !== "auth/cancelled-popup-request"
                ) {
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