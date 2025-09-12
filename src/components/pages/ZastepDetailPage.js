import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Container, Spinner, Badge, Button, Table, Image } from "react-bootstrap";
import { Users, ChevronLeft, ExternalLink, UserCheck } from "lucide-react";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import logoPlaceholder from "../../images/logo_placeholder.png";

const PLACEHOLDER_LOGO = logoPlaceholder;

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
    <Container className="py-5" style={{ maxWidth: 700, marginTop: "6rem", background: "#f8f9fa" }}>
      <Button as={Link} to="/zastepy" variant="outline-primary" className="mb-4">
        <ChevronLeft size={18} className="me-1" />
        Powrót do listy zastępów
      </Button>
      <Card className="shadow">
        <Card.Body>
        <div className="d-flex align-items-center gap-4 mb-3">
            <Image
            src={typeof zastep.logo === "string" && zastep.logo.trim() ? zastep.logo : logoPlaceholder}
            roundedCircle
            width={120}
            height={120}
            alt="Logo zastępu"
            style={{ objectFit: "cover", background: "#f8f9fa" }}
            />
            <div>
                {console.log(zastep)}
            <h2 className="fw-bold mb-1">{zastep.fullName}</h2>
            {zastep.jednostka && zastep.jednostka[0]?.snapshot.shortName && (
                <div className="mb-2 text-muted" style={{ fontSize: "1.1rem" }}>
                Drużyna: <span className="fw-semibold">{zastep.jednostka[0].snapshot.shortName}</span>
                </div>
            )}
            <div>
                <Badge bg="secondary" className="me-2">
                {zastep.harcerze.length} harcerzy
                </Badge>
                {zastep.blog && (
                <a
                    href={zastep.blog}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ms-2"
                    style={{ textDecoration: "none" }}
                >
                    <Badge bg="success">
                    Blog zastępu <ExternalLink size={14} className="ms-1 mb-1" />
                    </Badge>
                </a>
                )}
            </div>
            </div>
        </div>
          <h5 className="mt-4 mb-3">Lista harcerzy:</h5>
          <Table bordered hover>
            <tbody>
                {zastep.harcerze.length > 0 ? (
                // Najpierw zastępowy, potem reszta
                [
                    ...zastep.harcerze
                    .filter((h) => h.zastepowy),
                    ...zastep.harcerze
                    .filter((h) => !h.zastepowy)
                ].map((h) => (
                    <tr key={h.id}>
                    <td>
                        {h.stopien && (
                        <Badge bg="light" text="dark" className="me-2">
                            {h.stopien}
                        </Badge>
                        )}
                        {h.name} {h.surname}
                        {h.zastepowy && (
                        <span title="Zastępowy" className="ms-2 align-middle">
                            <UserCheck size={18} style={{ color: "#0d7337", verticalAlign: "middle" }} />
                            <span className="ms-1" style={{ color: "#0d7337", fontWeight: 500, fontSize: "0.95em" }}>
                            zastępowy
                            </span>
                        </span>
                        )}
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td className="text-muted text-center">Brak harcerzy w tym zastępie.</td>
                </tr>
                )}
            </tbody>
            </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}