import { Card, Row, Col, Container, Badge } from "react-bootstrap";
import { Users, Trophy, Camera, Star, Calendar, Globe, Award, Settings } from "lucide-react";

export default function RegulationsPage() {
  return (
    <Container className="py-5" style={{
          marginTop: "4rem",
          minHeight: "100vh",
          background: "#f8f9fa" 
        }}>
      <div className="mx-auto" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="fw-bold mb-3" style={{ fontSize: "2.5rem", color: "#0d7337" }}>
            Regulamin Harcerskiej Ligi Mistrzów
          </h1>
          <p className="fs-4 text-muted">1 Wrocławski Hufiec Harcerzy "Starodrzew"</p>
        </div>

        {/* Podstawowe informacje */}
        <Card className="mb-4">
          <Card.Header className="d-flex align-items-center gap-2">
            <Settings size={20} />
            <span className="fw-semibold">Podstawowe zasady</span>
          </Card.Header>
          <Card.Body>
            <p>
              Podstawą do przyznania punktów jest <strong>raport złożony drużynowemu</strong> bezpośrednio po zbiórce 
              lub wykonaniu zadania. W przypadku kategorii, które można udokumentować potwierdzeniem, 
              jest relacja z przebiegu zamieszczona na stronie internetowej zastępu.
            </p>
            <p>
              <strong>Drużynowy przekazuje punktację zastępów maksymalnie do ostatniego dnia miesiąca.</strong>
            </p>
            <div className="bg-light p-3 rounded mb-3">
              <h5 className="fw-semibold mb-2">Komenda HLM</h5>
              <p>Wszystkie kwestie sporne rozstrzygane są przez komendę HLM:</p>
              <p className="fw-medium">pwd. Lucjan Rawiak - komendant</p>
            </div>
            <p className="small text-muted">
              Obecnie rywalizacja toczy się między zastępami w Hufcu.
            </p>
          </Card.Body>
        </Card>

        {/* System punktacji */}
        <div className="mb-5">
          <h2 className="fw-bold text-center mb-4" style={{ fontSize: "1.7rem" }}>System punktacji</h2>

          {/* Obecność na zbiórce */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Users size={20} />
              <span className="fw-semibold">Obecność na zbiórce</span>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3 mb-3">
                <Badge bg="primary" className="fs-6 px-3 py-2">1 pkt / harcerz</Badge>
                <span className="text-muted">(maksymalnie 7 pkt)*</span>
              </div>
              <ul className="mb-2">
                <li><strong>Warunek:</strong> Harcerz musi być umundurowany</li>
                <li><strong>Potwierdzenie:</strong> Zdjęcie ze zbiórki wysłane tego samego dnia do drużynowego</li>
              </ul>
              <div className="small text-muted">* zastępy mogą być liczniejsze niż 7 osób</div>
            </Card.Body>
          </Card>

          {/* Obrzędowość zastępu */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Camera size={20} />
              <span className="fw-semibold">Obrzędowość zastępu</span>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col xs={6} md={4} className="d-flex justify-content-between align-items-center">
                  <span>Proporzec</span>
                  <Badge bg="secondary">1 pkt / zbiórka</Badge>
                </Col>
                <Col xs={6} md={4} className="d-flex justify-content-between align-items-center">
                  <span>Oznaczenie na mundurze</span>
                  <Badge bg="secondary">1 pkt / zbiórka</Badge>
                </Col>
                <Col xs={12} md={4} className="d-flex justify-content-between align-items-center mt-2 mt-md-0">
                  <span>Dodatkowa obrzędowość</span>
                  <Badge bg="secondary">1 pkt / zbiórka</Badge>
                </Col>
              </Row>
              <hr />
              <ul>
                <li><strong>Potwierdzenie proporzec i oznaczenie:</strong> zdjęcie</li>
                <li><strong>Potwierdzenie dodatkowa obrzędowość:</strong> ustalone z komendą HLM</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Sprawności */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Star size={20} />
              <span className="fw-semibold">Sprawności</span>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Jednogwiazdkowa</Badge>
                  <div className="fs-4 fw-bold">2 pkt</div>
                </Col>
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Dwugwiazdkowa</Badge>
                  <div className="fs-4 fw-bold">3 pkt</div>
                </Col>
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Trzygwiazdkowa</Badge>
                  <div className="fs-4 fw-bold">4 pkt</div>
                </Col>
              </Row>
              <ul>
                <li><strong>Warunek:</strong> Sprawność musi być adekwatna do wieku i stopnia harcerza</li>
                <li><strong>Potwierdzenie:</strong> Rozkaz drużynowego</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Obecność na zbiórce ZZ */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Users size={20} />
              <span className="fw-semibold">Obecność na zbiórce ZZ</span>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3 mb-3">
                <Badge bg="primary" className="fs-6 px-3 py-2">5 pkt</Badge>
                <span className="text-muted">za obecność zastępowego</span>
              </div>
              <ul>
                <li><strong>Ograniczenie:</strong> Przyznawane maksymalnie raz w miesiącu</li>
                <li><strong>Potwierdzenie:</strong> Raport drużynowego</li>
              </ul>
              <div className="small text-muted">Spotkania ZZ mogą oczywiście odbywać się częściej</div>
            </Card.Body>
          </Card>

          {/* Wyjazdy, biwaki */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Calendar size={20} />
              <span className="fw-semibold">Wyjazdy i biwaki</span>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Wyjazd zastępu</Badge>
                  <div className="fw-bold">3 pkt / harcerz</div>
                  <div className="small text-muted">Max. 21 pkt</div>
                </Col>
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Zimowisko</Badge>
                  <div className="fw-bold">7 pkt / harcerz</div>
                  <div className="small text-muted">Max. 49 pkt</div>
                </Col>
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Obóz</Badge>
                  <div className="fw-bold">7 pkt / harcerz</div>
                  <div className="small text-muted">Max. 49 pkt</div>
                </Col>
              </Row>
              <ul>
                <li>Zatwierdzony u drużynowego plan biwaku realizujący indywidualną pracę harcerzy</li>
                <li>Biwak z noclegiem</li>
                <li>Maksymalnie jeden w miesiącu</li>
                <li>Zimowisko musi trwać minimum 3 pełne doby</li>
              </ul>
              <div><strong>Potwierdzenie:</strong> Przesłana przez drużynowego karta zgłoszeniowa biwaku zatwierdzona w Okręgu</div>
              <div className="small text-muted mt-2">
                Harcerze, którzy wyjechali z obozu/zimowiska w trakcie na własne życzenie nie zdobywają punktów
              </div>
            </Card.Body>
          </Card>

          {/* Harc miesiąca */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Trophy size={20} />
              <span className="fw-semibold">Harc miesiąca</span>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3 mb-3">
                <Badge bg="primary" className="fs-6 px-3 py-2">10 pkt / harc</Badge>
              </div>
              <p>
                Komenda HLM na początku każdego miesiąca będzie publikowała harc do wykonania. 
                Zastęp otrzymuje punkty, jeśli go wykona i udokumentuje.
              </p>
              <div><strong>Potwierdzenie:</strong> Zdjęcie i opis w sieci</div>
            </Card.Body>
          </Card>

          {/* Zastęp w sieci */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Globe size={20} />
              <span className="fw-semibold">Zastęp w sieci</span>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center gap-3 mb-3">
                <Badge bg="secondary">2 pkt / wpis i zdjęcie</Badge>
                <Badge bg="secondary">3 pkt bonusowe za 4 wpisy w miesiącu</Badge>
              </div>
              <ul>
                <li><strong>Maksymalnie do zdobycia:</strong> 11 punktów</li>
                <li><strong>Ograniczenie:</strong> Nie będą punktowane dwa wpisy z jednego tygodnia</li>
              </ul>
            </Card.Body>
          </Card>

          {/* Stopnie */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Award size={20} />
              <span className="fw-semibold">Stopnie harcerskie</span>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Młodzik</Badge>
                  <div className="fs-4 fw-bold">20 pkt</div>
                </Col>
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Wywiadowca</Badge>
                  <div className="fs-4 fw-bold">25 pkt</div>
                </Col>
                <Col className="text-center p-3 bg-light rounded">
                  <Badge bg="secondary" className="mb-2">Ćwik</Badge>
                  <div className="fs-4 fw-bold">30 pkt</div>
                </Col>
              </Row>
              <div><strong>Potwierdzenie:</strong> Rozkaz drużynowego</div>
            </Card.Body>
          </Card>

          {/* Wydarzenia dodatkowe */}
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center gap-2">
              <Calendar size={20} />
              <span className="fw-semibold">Wydarzenia dodatkowe</span>
            </Card.Header>
            <Card.Body>
              <div className="fw-medium mb-2">
                WSZELKIE SPOTKANIA ŚRÓDROCZNE HUFCA BĘDĄ PUNKTOWANE DODATKOWO:
              </div>
              <ul>
                <li>Zbiórka hufca</li>
                <li>Zbiórka ZZ-tów hufca</li>
                <li>Zbiórki specjalne</li>
              </ul>
              <div className="bg-warning bg-opacity-25 border border-warning p-3 rounded my-3">
                <div className="fw-medium text-warning">Ważne!</div>
                <div className="text-warning">
                  Aby punktacja była wiążąca, organizatorzy wydarzenia najpóźniej 
                  <strong> 3 tygodnie przed wydarzeniem</strong> muszą podać konkretne punkty do zdobycia.
                </div>
              </div>
              <p>Punktowana będzie zarówno obecność, jak i np. zwycięstwo w grze w trakcie wydarzenia.</p>
              <div><strong>Potwierdzenie:</strong> Rozkaz drużynowego</div>
            </Card.Body>
          </Card>
        </div>

        {/* Footer regulaminu */}
        <div className="mt-5 text-center">
          <p className="text-muted">
            Regulamin obowiązuje od rozpoczęcia sezonu 2025 Harcerskiej Ligi Mistrzów
          </p>
        </div>
      </div>
    </Container>
  );
}