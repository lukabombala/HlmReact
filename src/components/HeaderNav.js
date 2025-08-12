import { useState } from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Newspaper,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function HeaderNav() {
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    { name: "Aktualności", icon: Calendar, to: "/" },
    { name: "Wyniki", icon: BarChart3, to: "/wyniki" },
    { name: "Zastępy", icon: Users, to: "/zastepy" },
    { name: "Faza pucharowa", icon: Trophy, to: "/fazapucharowa" },
    { name: "Regulamin", icon: Newspaper, to: "/regulamin" }
  ];

  const location = useLocation();

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
        <Navbar.Brand className="d-flex align-items-center gap-2">
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default HeaderNav;