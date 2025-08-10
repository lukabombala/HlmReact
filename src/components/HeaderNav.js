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
  const navItems = [
    { name: "Strona główna", icon: Trophy, to: "/" },
    { name: "Aktualne wyniki", icon: BarChart3, to: "/wyniki" },
    { name: "Zastępy", icon: Users, to: "/zastepy" },
    { name: "Faza pucharowa", icon: Calendar, to: "/fazapucharowa" },
  ];

  const location = useLocation();

  return (
    <Navbar
      variant="dark"
      expand="md"
      className="shadow-lg py-3"
      style={{ backgroundColor: "#0d7337" }}
      fixed="top"
    >
      <Container>
        <Navbar.Brand className="d-flex align-items-center gap-2">
          <Trophy size={32} className="me-2" />
          <span className="fs-4 fw-bold">Harcerska Liga Mistrzów</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="ms-auto align-items-center gap-2">
            {navItems.map((item) => (
              <Nav.Link
                as={Link}
                to={item.to}
                key={item.name}
                className={`d-flex align-items-center gap-2${location.pathname === item.to ? " active" : ""}`}
                style={{ color: "var(--bs-light)" }}
              >
                <item.icon size={18} />
                {item.name}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default HeaderNav;