import { Heart, Trophy } from "lucide-react";
import { Container, Row, Col } from "react-bootstrap";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0d7337",
        color: "var(--bs-light)",
        width: "100%",
      }}
      className="text-primary-foreground py-4"
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs="auto" className="text-center">
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
              <Trophy style={{ color: "var(--bs-light)", height: 24, width: 24 }} />
              <h3 className="fs-4 fw-semibold mb-0" style={{ color: "var(--bs-light)" }}>Harcerska Liga Mistrzów</h3>
            </div>
            <p className="mb-3" style={{ color: "var(--bs-light)" }}>
              Związek Harcerstwa Rzeczypospolitej
            </p>
            <div className="mt-3 small" style={{ color: "var(--bs-light)" }}>
              © 2025 Wrocławski Hufiec Harcerzy "Starodrzew". Wszystkie prawa zastrzeżone.
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}