import { useEffect, useState } from "react";
import { Card, Row, Col, Table, Badge, Container, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Trophy, Medal, Award } from "lucide-react";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";

export default function ResultsTable() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState([]);
  const fetchData = async () => {
      setLoading(true);
  
      const res = await punktacjaListAll();
      setRes(res);
      setLoading(false);
  }

  useEffect(() => {
      fetchData();
    }, []);

  useEffect(() => {
    punktacjaListAll().then((data) => {
      // Grupowanie punktów po zastępie (scoreTeam.id)
      const scoresByZastep = {};
      data.forEach((entry) => {
        if (
          entry.scoreTeam &&
          Array.isArray(entry.scoreTeam) &&
          entry.scoreTeam[0] &&
          entry.scoreTeam[0].id
        ) {
          const zastepId = entry.scoreTeam[0].id;
          if (!scoresByZastep[zastepId]) {
            scoresByZastep[zastepId] = {
              id: zastepId,
              name: entry.scoreTeam[0].snapshot.fullName,
              team: entry.scoreTeam[0].snapshot.jednostka?.[0]?.snapshot.shortName || "",
              points: 0
            };
          }
          scoresByZastep[zastepId].points += entry.scoreValue;
        }
      });

      // Zamiana na tablicę i sortowanie malejąco po punktach
      const resultsArr = Object.values(scoresByZastep)
        .sort((a, b) => b.points - a.points)
        .map((z, idx, arr) => ({
          ...z,
          position: idx + 1,
          gap: idx === 0 ? 0 : arr[0].points - z.points
        }));

      setResults(resultsArr);
      setLoading(false);
    });
  }, []);

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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <section id="results" className="py-5" style={{
          marginTop: "5rem",
          minHeight: "80vh",
          background: "#f8f9fa" 
        }}>
      <Container>

        {console.log(res)}
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2rem" }}>Aktualna punktacja</h2>
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
                  {/* Desktop layout */}
                  <div className="d-none d-md-flex justify-content-between align-items-center mb-2">
                    <div className="text-start" style={{ flex: 1 }}>
                      <div className="fw-bold" style={{ fontSize: "1.1rem" }}>{team.name}</div>
                      <div className="text-muted small">{team.team}</div>
                    </div>
                    <Badge bg="primary" className="px-3 py-2 ms-2" style={{ fontSize: "1.1rem" }}>
                      {team.points} pkt
                    </Badge>
                    <div className="ms-2">
                      {team.position === 1 && <Trophy size={28} style={{ color: "#eab308" }} />}
                      {team.position === 2 && <Medal size={28} style={{ color: "#a3a3a3" }} />}
                      {team.position === 3 && <Award size={28} style={{ color: "#f59e42" }} />}
                    </div>
                  </div>
                  {/* Mobile layout */}
                  <div className="d-flex d-md-none justify-content-center align-items-center mb-2" style={{ gap: "1.5rem" }}>
                    <div>
                      <div className="fw-bold" style={{ fontSize: "1rem" }}>{team.name}</div>
                      <div className="text-muted small">{team.team}</div>
                    </div>
                    <Badge bg="primary" className="px-2 py-1" style={{ fontSize: "1rem" }}>
                      {team.points} pkt
                    </Badge>
                    <div>
                      {team.position === 1 && <Trophy size={22} style={{ color: "#eab308" }} />}
                      {team.position === 2 && <Medal size={22} style={{ color: "#a3a3a3" }} />}
                      {team.position === 3 && <Award size={22} style={{ color: "#f59e42" }} />}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="mb-4">
          <Card.Header className="d-flex align-items-center gap-2">
            <Trophy size={20} className="me-2" />
            <span className="fw-semibold">Tabela punktacji - sezon 2025/2026</span>
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
                    <tr
                      key={team.position}
                      style={getRowStyle(team.position)}
                      className="cursor-pointer"
                      onClick={() => window.location.href = `/zastepy/${team.id}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getPositionIcon(team.position)}
                          <span>{team.position}</span>
                        </div>
                      </td>
                      <td className="fw-medium">
                        <Link
                          to={`/zastepy/${team.id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                          onClick={e => e.stopPropagation()}
                        >
                          {team.name}
                        </Link>
                      </td>
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
          </Card.Body>
        </Card>
      </Container>
    </section>
  );
}