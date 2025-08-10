import { Card, Row, Col, Table, Badge, Container } from "react-bootstrap";
import { Trophy, Medal, Award } from "lucide-react";

export default function ResultsTable() {
  const results = [
    { position: 1, name: "Zastęp Orłów", team: '1. DH "Orlęta" Warszawa', points: 21, gap: 0 },
    { position: 2, name: "Zastęp Żubrów", team: '2. DH "Żubry" Gdańsk', points: 18, gap: 3 },
    { position: 3, name: "Zastęp Bobrów", team: '5. DH "Bobry" Poznań', points: 15, gap: 6 },
    { position: 4, name: "Zastęp Szarych Wilków", team: '3. DH "Wilki" Kraków', points: 12, gap: 9 },
    { position: 5, name: "Zastęp Bocianów", team: '4. DH "Ptaki" Olsztyn', points: 9, gap: 12 },
    { position: 6, name: "Zastęp Rysi", team: '7. DH "Rysie" Wrocław', points: 6, gap: 15 },
    { position: 7, name: "Zastęp Lwów", team: '6. DH "Lwy" Katowice', points: 6, gap: 15 },
    { position: 8, name: "Zastęp Sokołów", team: '1. DH "Orlęta" Warszawa', points: 5, gap: 16 },
    { position: 9, name: "Zastęp Bizonów", team: '2. DH "Żubry" Gdańsk', points: 4, gap: 17 },
    { position: 10, name: "Zastęp Wydry", team: '5. DH "Bobry" Poznań', points: 4, gap: 17 },
    { position: 11, name: "Zastęp Leśnych Wilków", team: '3. DH "Wilki" Kraków', points: 3, gap: 18 },
    { position: 12, name: "Zastęp Żurawi", team: '4. DH "Ptaki" Olsztyn', points: 3, gap: 18 },
    { position: 13, name: "Zastęp Pum", team: '7. DH "Rysie" Wrocław', points: 2, gap: 19 },
    { position: 14, name: "Zastęp Tygrysów", team: '6. DH "Lwy" Katowice', points: 2, gap: 19 },
    { position: 15, name: "Zastęp Panter", team: '6. DH "Lwy" Katowice', points: 1, gap: 20 },
    { position: 16, name: "Zastęp Gepardów", team: '6. DH "Lwy" Katowice', points: 0, gap: 21 },
  ];

  const topThree = results.slice(0, 3);

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy size={16} style={{ color: "#eab308" }} />;
      case 2:
        return <Medal size={16} style={{ color: "#a3a3a3" }} />;
      case 3:
        return <Award size={16} style={{ color: "#f59e42" }} />;
      default:
        return null;
    }
  };

  const getRowStyle = (position) => {
    switch (position) {
      case 1:
        return { background: "#fefce8" };
      case 2:
        return { background: "#f3f4f6" };
      case 3:
        return { background: "#fef3c7" };
      default:
        return {};
    }
  };

  const getPodiumCardStyle = (position) => {
    switch (position) {
      case 1:
        return { background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)", borderColor: "#fde047" };
      case 2:
        return { background: "linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)", borderColor: "#a3a3a3" };
      case 3:
        return { background: "linear-gradient(135deg, #fef3c7 0%, #fdba74 100%)", borderColor: "#f59e42" };
      default:
        return {};
    }
  };

  return (
    <section id="results" className="py-5" style={{
          marginTop: "4rem",
          minHeight: "80vh",
          background: "#f8f9fa" 
        }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2rem" }}>Aktualna punktacja</h2>
          <p className="text-muted">
            Tabela wyników wszystkich zastępów w Harcerskiej Lidze Mistrzów
          </p>
        </div>

        {/* Podium - Top 3 */}
        <Row xs={1} md={3} className="g-4 mb-4">
          {topThree.map((team) => (
            <Col key={team.position}>
              <Card
                className="text-center border-2 h-100"
                style={getPodiumCardStyle(team.position)}
              >
                <Card.Body>
                  <div className="mb-3">
                    {team.position === 1 && <Trophy size={48} style={{ color: "#eab308" }} />}
                    {team.position === 2 && <Medal size={48} style={{ color: "#a3a3a3" }} />}
                    {team.position === 3 && <Award size={48} style={{ color: "#f59e42" }} />}
                  </div>
                  <h3 className="fw-bold mb-1">{team.name}</h3>
                  <p className="text-muted small mb-3">{team.team}</p>
                  <div className="d-flex justify-content-center align-items-center gap-3">
                    <Badge bg="primary" className="px-3 py-1">{team.points} pkt</Badge>
                    <span className="fs-5 fw-bold text-primary">#{team.position}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="mb-4">
          <Card.Header className="d-flex align-items-center gap-2">
            <Trophy size={20} className="me-2" />
            <span className="fw-semibold">Tabela ligowa - sezon 2025</span>
          </Card.Header>
          <Card.Body>
            <div style={{ overflowX: "auto" }}>
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Miejsce</th>
                    <th>Zastęp</th>
                    <th>Drużyna</th>
                    <th className="text-center">Punkty</th>
                    <th className="text-center">Strata</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((team) => (
                    <tr key={team.position} style={getRowStyle(team.position)}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getPositionIcon(team.position)}
                          <span>{team.position}</span>
                        </div>
                      </td>
                      <td className="fw-medium">{team.name}</td>
                      <td className="text-muted small">{team.team}</td>
                      <td className="text-center">
                        <Badge bg="primary">{team.points}</Badge>
                      </td>
                      <td className="text-center text-muted">
                        {team.gap === 0 ? "-" : `-${team.gap}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="mt-4 small text-muted">
              <div className="d-flex flex-wrap gap-4">
                <span className="d-flex align-items-center gap-1">
                  <Trophy size={14} style={{ color: "#eab308" }} />
                  Lider
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Medal size={14} style={{ color: "#a3a3a3" }} />
                  2. miejsce
                </span>
                <span className="d-flex align-items-center gap-1">
                  <Award size={14} style={{ color: "#f59e42" }} />
                  3. miejsce
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
}