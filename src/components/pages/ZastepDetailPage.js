import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Container, Spinner, Badge, Button, Table, Image, Row, Col } from "react-bootstrap";
import { Users, ChevronLeft, ExternalLink, UserCheck } from "lucide-react";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import logoPlaceholder from "../../images/logo_placeholder.png";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const PLACEHOLDER_LOGO = logoPlaceholder;

const months = [
  "wrz 2025", "paź 2025", "lis 2025", "gru 2025",
  "sty 2026", "lut 2026", "mar 2026", "kwi 2026",
  "maj 2026", "cze 2026"
];
const examplePoints = [12, 18, 15, 10, 20, 17, 14, 19, 16, 21];

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

  const totalPoints = examplePoints.reduce((a, b) => a + b, 0);

    const barData = {
    labels: months,
    datasets: [
        {
        label: "Punkty w miesiącu",
        data: examplePoints,
        backgroundColor: "#0d7337",
        borderRadius: 6,
        maxBarThickness: 32,
        datalabels: {
            anchor: 'end',
            align: 'end', // <-- etykieta nad słupkiem
            color: '#222',
            font: { weight: 'bold', size: 14 },
            offset: -6, // lekko nad słupkiem
        }
        },
    ],
    };

    const barOptions = {
    responsive: true,
    plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { enabled: true },
        datalabels: {
        display: true,
        anchor: 'end',
        align: 'end', // <-- etykieta nad słupkiem
        color: '#222',
        font: { weight: 'bold', size: 14 },
        offset: -8, // lekko nad słupkiem
        formatter: (value) => value
        }
    },
    scales: {
        x: {
        grid: { display: false },
        ticks: { font: { size: 13 } }
        },
        y: {
        beginAtZero: true,
        grid: { color: "#e9ecef" },
        ticks: { stepSize: 5, font: { size: 13 } }
        }
    }
    };

  return (
    <Container className="py-5" style={{ maxWidth: 1200, marginTop: "3rem", background: "#f8f9fa" }}>
      <Button as={Link} to="/zastepy" variant="outline-primary" className="mb-4">
        <ChevronLeft size={18} className="me-1" />
        Powrót do listy zastępów
      </Button>
      <Row>
        <Col xs={12} md={6} className="mb-4 mb-md-0">
          <Card className="shadow h-100">
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
                  <h2 className="fw-bold mb-1">{zastep.fullName}</h2>
                  {zastep.jednostka && zastep.jednostka[0]?.snapshot.shortName && (
                    <div className="mb-2 text-muted" style={{ fontSize: "1.1rem" }}>
                      Drużyna: <span className="fw-semibold">{zastep.jednostka[0].snapshot.shortName}</span>
                    </div>
                  )}
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <Badge bg="secondary">
                      {zastep.harcerze.length} harcerzy
                    </Badge>
                    {zastep.blog && (
                      <a
                        href={zastep.blog}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none" }}
                      >
                        <Badge bg="success" className="d-inline-flex align-items-center">
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
                    [
                      ...zastep.harcerze.filter((h) => h.zastepowy),
                      ...zastep.harcerze.filter((h) => !h.zastepowy)
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
        </Col>
        <Col xs={12} md={6}>
          <Card className="shadow h-100">
            <Card.Body>
              <h4 className="fw-bold mb-3">Punktacja</h4>
              <div className="mb-4">
                <Bar data={barData} options={barOptions} height={260} />
              </div>
              <div className="fw-bold text-end" style={{ fontSize: "1.15rem" }}>
                Suma punktów: {totalPoints}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}