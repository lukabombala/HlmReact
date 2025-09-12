import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Container, Spinner, Badge, Button } from "react-bootstrap";
import { Users, ChevronLeft } from "lucide-react";
import { zastepyListAll } from "../../services/zastepyList.mjs";

export default function ZastepDetailPage() {
  const { id } = useParams();
  const [zastep, setZastep] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    zastepyListAll().then((all) => {
      const found = all.find((z) => z.id === id);
      setZastep(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: "6rem", background: "#f8f9fa" }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!zastep) {
    return (
      <Container className="py-5 text-center" style={{ marginTop: "6rem", background: "#f8f9fa" }}> 
        <h2>Nie znaleziono zastępu</h2>
        <Button as={Link} to="/zastepy" variant="primary" className="mt-3">
          <ChevronLeft size={18} className="me-1" />
          Powrót do listy zastępów
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: 700 , marginTop: "6rem", background: "#f8f9fa"}}>
      <Button as={Link} to="/zastepy" variant="outline-primary" className="mb-4">
        <ChevronLeft size={18} className="me-1" />
        Powrót do listy zastępów
      </Button>
      <Card className="shadow">
        <Card.Body>
          <h2 className="fw-bold mb-3">{zastep.fullName}</h2>
          <div className="mb-3">
            <Badge bg="secondary" className="me-2">
              {zastep.harcerze.length} harcerzy
            </Badge>
            {zastep.specjalnosc && (
              <Badge bg="info" className="me-2">
                {zastep.specjalnosc}
              </Badge>
            )}
          </div>
          <h5 className="mt-4 mb-3">Lista harcerzy:</h5>
          {zastep.harcerze.length > 0 ? (
            <ul>
              {zastep.harcerze.map((h) => (
                <li key={h.id}>
                  {h.stopien ? <Badge bg="light" className="ms-2 text-dark">{h.stopien}</Badge> : null} {h.name} {h.surname}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted">Brak harcerzy w tym zastępie.</div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}