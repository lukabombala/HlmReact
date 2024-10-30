import React, { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';

import MainPage from './pages/MainPage.js';
import NewsPage from './pages/NewsPage.js';

function MenuBar() {
    
    const [activeView, setActiveView] = useState('main');

    return (

        <div>
            <Container>
            <Navbar expand="lg" className="bg-body-tertiary" style={{display: 'flex'}}>
            <Container>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link onClick={() => setActiveView('main')}>Strona Glowna</Nav.Link>
                    <Nav.Link onClick={() => setActiveView('news')}>aktualnosci</Nav.Link>
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