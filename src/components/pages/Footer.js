import { Heart, Trophy } from "lucide-react";
import { Container, Row, Col } from "react-bootstrap";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#0d7337" }} className="text-primary-foreground py-4">
      <Container>
        <Row className="justify-content-center">
          <Col xs="auto" className="text-center">
            <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
              <Trophy style={{ height: 24, width: 24 }} />
              <h3 className="fs-4 fw-semibold mb-0">Harcerska Liga Mistrzów</h3>
            </div>
            <p className="text-primary-foreground/80 mb-3">
              Organizowany przez Związek Harcerstwa Rzeczypospolitej
            </p>
            <div className="d-flex align-items-center justify-content-center gap-1 text-muted small">
              <span>Stworzone z</span>
              <Heart style={{ height: 16, width: 16, color: "#f87171" }} />
              <span>dla polskiego harcerstwa</span>
            </div>
            <div className="mt-3 text-primary-foreground small">
              © 2025 Wrocławski Hufiec Harcerzy "Starodrzew". Wszystkie prawa zastrzeżone.
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}