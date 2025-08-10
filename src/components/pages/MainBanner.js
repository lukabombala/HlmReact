import { Card, Row, Col, Container } from "react-bootstrap";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";

export default function HeroSection() {
  return (
    <section id="home" className="py-5" style={{
      background: "linear-gradient(135deg, rgba(13,115,55,0.05) 0%, rgba(0,123,255,0.10) 100%)"
    }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2.5rem", color: "#0d7337" }}>
            Harcerska Liga Mistrzów
          </h2>
          <p className="fs-4 text-muted mx-auto" style={{ maxWidth: 600 }}>
            Elitarna liga najlepszych drużyn harcerskich w Polsce. Najwyższy poziom 
            sportowej rywalizacji, mistrzostwo i prestiż czekają na zwycięzców.
          </p>
        </div>
        <Row xs={1} md={2} lg={4} className="g-4 mb-4">
          <Col>
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="p-4">
                <Calendar size={48} style={{ color: "#0d7337" }} className="mb-3" />
                <h3 className="fw-semibold mb-2">Sezon 2025</h3>
                <p className="text-muted">Marzec - Czerwiec 2025</p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="p-4">
                <MapPin size={48} style={{ color: "#0d7337" }} className="mb-3" />
                <h3 className="fw-semibold mb-2">Lokalizacja</h3>
                <p className="text-muted">Centrum Sportowe "Orlęta"</p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="p-4">
                <Users size={48} style={{ color: "#0d7337" }} className="mb-3" />
                <h3 className="fw-semibold mb-2">Uczestniczące drużyny</h3>
                <p className="text-muted">7 drużyn, 26 zastępów</p>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card className="text-center h-100 shadow-sm">
              <Card.Body className="p-4">
                <Trophy size={48} style={{ color: "#0d7337" }} className="mb-3" />
                <h3 className="fw-semibold mb-2">Nagrody</h3>
                <p className="text-muted">Puchary i medale</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
}