import React, { useState } from 'react';

import { Button, Container, Navbar, Nav } from "react-bootstrap";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Newspaper,
} from "lucide-react";

import {
	BrowserRouter as Router,
	Route,
	Link,
	Routes,
	Outlet,
} from "react-router-dom";


import "./MenuBar.css";

import MainPage from './pages/MainPage.js';
import NewsPage from './pages/NewsPage.js';
import Footer from './pages/Footer.js';
import NewsSection from './pages/NewsPagev2.js';

function MenuBar() {
    

    function NotFound() {
        return (
            <div>
                <h2>404 Not Found</h2>
                <p>Sorry, the page you are looking for does not exist.</p>
            </div>
        );
    }

    return (

        <div>
            <Container>
            <Router>
                <Navbar expand="md"
                        fixed="top" 
                        className="animate-navbar nav-theme justify-content-between"
                        variant="dark" 
                        style={{display: 'flex'}}>
                <Container>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">

                    <Nav.Link as={Link} to="/" exact>Strona glowna</Nav.Link>
                    <Nav.Link as={Link} to="/aktualnosci">Aktualnosci</Nav.Link>
                    <Nav.Link as={Link} to="/regulamin">Regulamin</Nav.Link>
                    <Nav.Link as={Link} to="/archiwum">Archiwum</Nav.Link>

                    </Nav>
                    </Navbar.Collapse>
                    </Container>
                </Navbar>
                
                <div className="container mt-4">
                    
                    <Routes>
                        <Route path="/" element={<Outlet />}>
                            <Route index element={<MainPage />} />
                            <Route path="/aktualnosci" element={<NewsSection />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                    </Routes>
                   
                </div>
            </Router>
            </Container>

            <Footer />
        </div>
    )
}

export default function Header() {
  const navItems = [
    { name: "Strona główna", icon: Trophy, href: "#home" },
    { name: "Aktualne wyniki", icon: BarChart3, href: "#results" },
    { name: "Aktualności", icon: Newspaper, href: "#news" },
    { name: "Zastępy", icon: Users, href: "#teams" },
    { name: "Faza pucharowa", icon: Calendar, href: "#bracket" },
  ];

  function NotFound() {
        return (
            <div>
                <h2>404 Not Found</h2>
                <p>Sorry, the page you are looking for does not exist.</p>
            </div>
        );
    }
    
  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="md"
      className="shadow-lg py-3"
      style={{ backgroundColor: "#0d7337" }}
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
                key={item.name}
                href={item.href}
                className="d-flex align-items-center gap-2"
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