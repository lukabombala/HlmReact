import React, { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';

import "./MenuBar.css";

import MainPage from './pages/MainPage.js';
import NewsPage from './pages/NewsPage.js';

function MenuBar() {
    
    const [activeView, setActiveView] = useState('main');

    return (

        <div>
            <Container>
            <Navbar expand="md"
                    fixed="top" 
                    className="animate-navbar nav-theme justify-content-between"
                    variant="dark" 
                    style={{display: 'flex'}}>
            <Container>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link onClick={() => setActiveView('main')}>Strona Glowna</Nav.Link>
                    <Nav.Link onClick={() => setActiveView('news')}>Aktualnosci</Nav.Link>
                    <Nav.Link onClick={() => setActiveView('news')}>Regulamin</Nav.Link>
                    <Nav.Link onClick={() => setActiveView('news')}>Archiwum</Nav.Link>
                </Nav>
                </Navbar.Collapse>
                </Container>
            </Navbar>
            </Container>

            <Container className='container-fluid' style={{display: 'flex'}}>

                        <div>   
                            {activeView === 'main' && <MainPage/>}
                            {activeView === 'news' && <NewsPage/>}
                        </div>

            </Container>
        </div>
    )
}

export default MenuBar