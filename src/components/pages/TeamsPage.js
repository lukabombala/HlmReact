import { Card, Badge, Container, Row, Col } from "react-bootstrap";
import { Users, MapPin, Star, Trophy } from "lucide-react";
import { useState, useEffect } from 'react'

import { jednostkiListAll} from '../../services/jednostkiList.mjs'
import { zastepyListAll} from '../../services/zastepyList.mjs'


export default function TeamsSection() {
  
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([])
  const [troops, setTroops] = useState([])

  const fetchData = async () => {
      setLoading(true)

      const res = await jednostkiListAll()
      setTeams([...res])

      const res2 = await zastepyListAll()
      setTroops([...res2])
      setLoading(false)
  }

  useEffect(() => {
      fetchData()
  }, [])

  return (
    <section id="teams" className="py-5 bg-light">
      {console.log(troops)}
      <Container style={{
          marginTop: "6rem",
          background: "#f8f9fa"
        }}>
        <div className="text-center mb-5">
          <h2 className="fw-bold">Drużyny uczestniczące</h2>
          <p className="text-muted">
            Poznaj wszystkie drużyny harcerskie biorące udział w turnieju
          </p>
        </div>

        <Row className="gy-4">
          {teams.map((team) => (
            <Col key={team.id} md={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  <Row className="align-items-center justify-content-between">
                    <Col md={8}>
                      <h5 className="mb-2">{team.fullName}</h5>
                      <div className="d-flex flex-wrap gap-3 text-muted small">
                        <div className="d-flex align-items-center gap-1">
                          <MapPin size={16} />
                          {team.city}
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Users size={16} />
                          {team.totalMembers} harcerzy
                        </div>
                        <Badge bg="secondary">Założona {team.founded}</Badge>
                      </div>
                    </Col>
                    <Col md={4} className="text-md-end mt-3 mt-md-0">
                      <div className="d-flex align-items-center justify-content-md-end gap-2">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                          {team.leader.split(" ")[1]?.[0]}{team.leader.split(" ")[2]?.[0]}
                        </div>
                        <div>
                          <div className="small fw-medium">Drużynowy</div>
                          <div className="small text-muted">{team.leader}</div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Header>

                <Card.Body>
                <h6 className="fw-semibold mb-3">Zastępy w drużynie:</h6>
                <Row className="gy-3">
                  {troops
                    .filter((troop) => troop.jednostka[0].id === team.id)
                    .map((troop, index) => (
                      <Col key={index} sm={6} lg={4}>
                        <div className="border rounded p-3 bg-white h-100">
                          <h6 className="fw-medium mb-2">{troop.fullName}</h6>
                          <div className="d-flex align-items-center gap-1 small">
                            <Users size={14} />
                            <span>{troop.harcerze.length} harcerzy</span>
                          </div>
                        </div>
                      </Col>
                    ))}
                </Row>
              </Card.Body>

              </Card>
            </Col>
          ))}
        </Row>

        <div className="mt-5 text-center bg-light rounded p-4">
          <h4 className="fw-semibold mb-3">Statystyki turnieju</h4>
          <Row className="gy-3">
            <Col md={4}>
              <p className="fs-3 fw-bold text-primary">7</p>
              <p className="small text-muted">Drużyn uczestniczących</p>
            </Col>
            <Col md={4}>
              <p className="fs-3 fw-bold text-primary">26</p>
              <p className="small text-muted">Zastępów w turnieju</p>
            </Col>
            <Col md={4}>
              <p className="fs-3 fw-bold text-primary">188</p>
              <p className="small text-muted">Harcerzy i harcerek</p>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
}
