import { useEffect, useState } from "react";
import { Card, Row, Col, Table, Badge, Container, Spinner, Form } from "react-bootstrap";
import { Trophy, Medal, Award } from "lucide-react";
import { archiveListAll } from "../../services/archiveList.mjs"; // pobieranie danych z archiwum

export default function ArchivePage() {
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [seasonOptions, setSeasonOptions] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await archiveListAll();
      setArchive(res);
      setLoading(false);

      // Wyciągnij unikalne sezony
      const seasons = Array.from(new Set(res.map(r => r.sezon)));
      // Sortowanie: najpierw po roku malejąco, potem te bez liczby na końcu
      const sortedSeasons = seasons.sort((a, b) => {
        const yearA = parseInt(a.slice(-4));
        const yearB = parseInt(b.slice(-4));
        const isNumA = !isNaN(yearA);
        const isNumB = !isNaN(yearB);
        if (isNumA && isNumB) return yearB - yearA;
        if (isNumA) return -1;
        if (isNumB) return 1;
        return 0;
      });
      setSeasonOptions(sortedSeasons);
      if (sortedSeasons.length && !selectedSeason) setSelectedSeason(sortedSeasons[0]);
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Filtrowanie po sezonie 
  const filtered = archive.filter(r => r.sezon === selectedSeason);

  // Grupowanie i ranking
  const results = filtered
    .sort((a, b) => b.punkty - a.punkty)
    .map((z, idx, arr) => ({
      ...z,
      position: idx + 1,
      gap: idx === 0 ? 0 : arr[0].punkty - z.punkty
    }));

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
    <section id="archive" className="py-5" style={{
      marginTop: "5rem",
      minHeight: "80vh",
      background: "#f8f9fa"
    }}>
      <Container>
        <div className="text-center mb-5">
          <h2 className="fw-bold mb-3" style={{ fontSize: "2rem" }}>Archiwum wyników</h2>
        </div>
        <Card className="mb-4">
          <Card.Body>
            <Form>
              <Form.Group>
                <Form.Label>Wybierz sezon</Form.Label>
                <Form.Select
                  value={selectedSeason}
                  onChange={e => setSelectedSeason(e.target.value)}
                  style={{ maxWidth: 320 }}
                >
                  {seasonOptions.map(season => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Card.Body>
        </Card>
        {loading ? (
          <Container className="py-5 text-center">
            <Spinner animation="border" />
          </Container>
        ) : (
          <>
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
                          <div className="fw-bold" style={{ fontSize: "1.1rem" }}>{team.zastep}</div>
                          <div className="text-muted small">{team.druzyna}</div>
                        </div>
                        <Badge bg="primary" className="px-3 py-2 ms-2" style={{ fontSize: "1.1rem" }}>
                          {team.punkty} pkt
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
                          <div className="fw-bold" style={{ fontSize: "1rem" }}>{team.zastep}</div>
                          <div className="text-muted small">{team.druzyna}</div>
                        </div>
                        <Badge bg="primary" className="px-2 py-1" style={{ fontSize: "1rem" }}>
                          {team.punkty} pkt
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
                <span className="fw-semibold">Tabela punktacji - sezon {selectedSeason}</span>
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
                        >
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              {getPositionIcon(team.position)}
                              <span>{team.position}</span>
                            </div>
                          </td>
                          <td className="fw-medium">{team.zastep}</td>
                          <td className="text-muted small">{team.druzyna}</td>
                          <td className="text-center">
                            <Badge bg="primary">{team.punkty}</Badge>
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
          </>
        )}
      </Container>
    </section>
  );
}