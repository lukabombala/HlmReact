import React, { useState } from 'react';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';

import MainPage from './pages/MainPage.js';

function MenuBar() {
    
    const [activeView, setActiveView] = useState('main');

    return (

        <div>
            
            <Navbar expand="lg" className="bg-body-tertiary" style={{display: 'flex'}}>
            <Container>
                <Navbar.Brand href="#home">Harcerska Liga Mistrzow</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link onClick={() => setActiveView('main')}>Strona Glowna</Nav.Link>
                </Nav>
                </Navbar.Collapse>
                </Container>
            </Navbar>
            

            <Container className='container-fluid' style={{display: 'flex'}}>

                        <div>   
                            {activeView === 'main' && <MainPage/>}
                        </div>

            </Container>
            
        </div>
    )
}

export default MenuBar