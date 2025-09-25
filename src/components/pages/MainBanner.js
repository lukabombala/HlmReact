import { Card, Row, Col, Container } from "react-bootstrap";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { jednostkiListAll } from '../../services/jednostkiList.mjs';
import { zastepyListAll } from '../../services/zastepyList.mjs';

const TITLE_HEIGHT = 36; // px

export default function HeroSection() {
  const [teamsCount, setTeamsCount] = useState(0);
  const [troopsCount, setTroopsCount] = useState(0);
  const [cardHeight, setCardHeight] = useState(null);
  const finalRef = useRef(null);

  useEffect(() => {
    async function fetchStats() {
      const teams = await jednostkiListAll();
      const troops = await zastepyListAll();
      setTeamsCount(teams.length);
      setTroopsCount(troops.length);
    }
    fetchStats();
  }, []);

  // Ustal wysokość na podstawie karty "Wielki finał"
  useEffect(() => {
    if (finalRef.current) {
      setCardHeight(finalRef.current.offsetHeight);
    }
  }, [finalRef.current, troopsCount, teamsCount]);

  const cardStyle = cardHeight ? { minHeight: cardHeight, height: cardHeight } : {};

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
          <Col className="h-100">
            <Card className="text-center h-100 shadow-sm" style={cardStyle}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center h-100" style={{ height: "100%" }}>
                <Calendar size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <div
                  style={{
                    minHeight: TITLE_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Obecny sezon</h3>
                </div>
                <div style={{ flexGrow: 1 }} />
                <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>Październik 2025 - Czerwiec 2026</p>
              </Card.Body>
            </Card>
          </Col>
          <Col className="h-100">
            <Card className="text-center h-100 shadow-sm" style={cardStyle}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center h-100" style={{ height: "100%" }}>
                <MapPin size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <div
                  style={{
                    minHeight: TITLE_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Lokalizacja</h3>
                </div>
                <div style={{ flexGrow: 1 }} />
                <p className="text-muted mb-0" style={{ paddingBottom: "1.5rem",fontSize: "0.95rem" }}>Wrocław i okolice</p>
              </Card.Body>
            </Card>
          </Col>
          <Col className="h-100">
            <Card className="text-center h-100 shadow-sm" style={cardStyle}>
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center h-100" style={{ height: "100%" }}>
                <Users size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <div
                  style={{
                    minHeight: TITLE_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Uczestnicy</h3>
                </div>
                <div style={{ flexGrow: 1 }} />
                <p className="text-muted mb-0" style={{ paddingBottom: "1.5rem", fontSize: "0.95rem" }}>
                  {troopsCount} zastępów z {teamsCount} drużyn harcerskich
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col className="h-100">
            <Card ref={finalRef} className="text-center h-100 shadow-sm">
              <Card.Body className="p-2 d-flex flex-column justify-content-between align-items-center h-100" style={{ height: "100%" }}>
                <Trophy size={28} style={{ color: "#0d7337" }} className="mb-1" />
                <div
                  style={{
                    minHeight: TITLE_HEIGHT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <h3 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>Wielki finał</h3>
                </div>
                <div style={{ flexGrow: 1 }} />
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