import { Card, Row, Col, Container } from "react-bootstrap";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="home" className="py-4">
      <Container style={{ paddingTop: "7rem" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2" style={{ fontSize: "2rem", color: "#0d7337" }}>
            Harcerska Liga Mistrzów
          </h2>
          <h4 className="fw-semibold mb-2" style={{ fontSize: "1.15rem", color: "#0d7337" }}>
            Śródroczna rywalizacja zastępów we Wrocławskim Hufcu Harcerzy "Starodrzew"
          </h4>
          <p className="fs-5 text-muted mx-auto" style={{ maxWidth: 500 }}>
            Sezon 2025 zaczyna się już niedługo.
          </p>
        </div>
        <Row xs={2} md={4} className="g-3 mb-2">
          <Col>
            <Card className="text-center h-100 shadow-sm" style={{ minHeight: 100, maxHeight: 200 }}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center" style={{ height: "100%" }}>
                <Calendar size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Sezon 2025</h3>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>Październik 2025 - Czerwiec 2026</p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="text-center h-100 shadow-sm" style={{ minHeight: 100, maxHeight: 200 }}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center" style={{ height: "100%" }}>
                <MapPin size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Lokalizacja</h3>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>Wrocław</p><br /><p></p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="text-center h-100 shadow-sm" style={{ minHeight: 100, maxHeight: 200 }}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center" style={{ height: "100%" }}>
                <Users size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Uczestniczące zastępy</h3>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>Zgłoś się już dziś!</p><br /><p></p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="text-center h-100 shadow-sm" style={{ minHeight: 100, maxHeight: 200 }}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center" style={{ height: "100%" }}>
                <Trophy size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Wielki finał</h3>
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
                  Sezon kończymy wyjazdem, na którym wyłania się ostatecznych zwycięzców.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}