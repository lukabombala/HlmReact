import React, { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { Col, Row } from 'react-bootstrap';

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

export default MenuBar