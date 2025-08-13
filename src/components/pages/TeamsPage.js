import { Card, Badge, Container, Row, Col } from "react-bootstrap";
import { Users, MapPin, Star, Trophy } from "lucide-react";

export default function TeamsSection() {
   const druzyny = [ { id: 1, name: "1. Warszawska Drużyna Harcerska \"Orlęta\"", city: "Warszawa", druzynowy: "hm. Andrzej Kowalski", zastepy: [ { name: "Zastęp Orłów", specialty: "Turystyka górska", members: 8 }, { name: "Zastęp Sokołów", specialty: "Ratownictwo", members: 7 }, { name: "Zastęp Jastrzębi", specialty: "Technika harcerska", members: 9 }, { name: "Zastęp Kondorów", specialty: "Survival", members: 6 } ], founded: "1918", achievements: ["Mistrz Polski 2023", "Finalista 2022"], totalMembers: 30 }, { id: 2, name: "3. Krakowska Drużyna Harcerska \"Wilki\"", city: "Kraków", druzynowy: "hm. Katarzyna Nowak", zastepy: [ { name: "Zastęp Szarych Wilków", specialty: "Pionierstwo", members: 8 }, { name: "Zastęp Leśnych Wilków", specialty: "Sztuka obozowa", members: 7 }, { name: "Zastęp Białych Wilków", specialty: "Krajoznawstwo", members: 6 } ], founded: "1920", achievements: ["Wicemistrz 2023"], totalMembers: 21 }, { id: 3, name: "2. Gdańska Drużyna Harcerska \"Żubry\"", city: "Gdańsk", druzynowy: "hm. Piotr Wiśniewski", zastepy: [ { name: "Zastęp Żubrów", specialty: "Żeglarstwo", members: 9 }, { name: "Zastęp Bizonów", specialty: "Ratownictwo wodne", members: 8 }, { name: "Zastęp Turów", specialty: "Nurkowanie", members: 7 }, { name: "Zastęp Łosi", specialty: "Ekologia morska", members: 6 } ], founded: "1919", achievements: ["3. miejsce 2023", "Finalista 2021"], totalMembers: 30 }, { id: 4, name: "5. Poznańska Drużyna Harcerska \"Bobry\"", city: "Poznań", druzynowy: "hm. Anna Zielińska", zastepy: [ { name: "Zastęp Bobrów", specialty: "Budownictwo wodne", members: 8 }, { name: "Zastęp Wydry", specialty: "Sporty wodne", members: 7 }, { name: "Zastęp Piżmaków", specialty: "Hydrologia", members: 6 } ], founded: "1921", achievements: ["Finalista 2023"], totalMembers: 21 }, { id: 5, name: "7. Wrocławska Drużyna Harcerska \"Rysie\"", city: "Wrocław", druzynowy: "hm. Michał Kowalczyk", zastepy: [ { name: "Zastęp Rysi", specialty: "Wspinaczka", members: 9 }, { name: "Zastęp Pum", specialty: "Alpinizm", members: 8 }, { name: "Zastęp Kotów Dzikich", specialty: "Speleologia", members: 7 }, { name: "Zastęp Leopardów", specialty: "Via ferrata", members: 6 } ], founded: "1922", achievements: ["4. miejsce 2023"], totalMembers: 30 }, { id: 6, name: "4. Olsztyńska Drużyna Harcerska \"Ptaki\"", city: "Olsztyn", druzynowy: "hm. Joanna Lewandowska", zastepy: [ { name: "Zastęp Bocianów", specialty: "Ornitologia", members: 8 }, { name: "Zastęp Żurawi", specialty: "Fotografia przyrody", members: 7 }, { name: "Zastęp Czapli", specialty: "Ochrona środowiska", members: 6 } ], founded: "1923", achievements: ["Debiutant roku 2023"], totalMembers: 21 }, { id: 7, name: "6. Katowiska Drużyna Harcerska \"Lwy\"", city: "Katowice", druzynowy: "hm. Robert Jankowski", zastepy: [ { name: "Zastęp Lwów", specialty: "Górnictwo", members: 9 }, { name: "Zastęp Tygrysów", specialty: "Metalurgia", members: 8 }, { name: "Zastęp Panter", specialty: "Przemysł", members: 7 }, { name: "Zastęp Gepardów", specialty: "Technika", members: 6 }, { name: "Zastęp Pumy", specialty: "Mechanika", members: 5 } ], founded: "1924", achievements: ["Uczestnik wszystkich edycji"], totalMembers: 35 } ];

  return (
    <section id="teams" className="py-5 bg-light">
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
          {druzyny.map((druzyna) => (
            <Col key={druzyna.id} md={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-light">
                  <Row className="align-items-center justify-content-between">
                    <Col md={8}>
                      <h5 className="mb-2">{druzyna.name}</h5>
                      <div className="d-flex flex-wrap gap-3 text-muted small">
                        <div className="d-flex align-items-center gap-1">
                          <MapPin size={16} />
                          {druzyna.city}
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Users size={16} />
                          {druzyna.totalMembers} członków
                        </div>
                        <Badge bg="secondary">Założona {druzyna.founded}</Badge>
                      </div>
                    </Col>
                    <Col md={4} className="text-md-end mt-3 mt-md-0">
                      <div className="d-flex align-items-center justify-content-md-end gap-2">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                          {druzyna.druzynowy.split(" ")[1]?.[0]}{druzyna.druzynowy.split(" ")[2]?.[0]}
                        </div>
                        <div>
                          <div className="small fw-medium">Drużynowy</div>
                          <div className="small text-muted">{druzyna.druzynowy}</div>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {druzyna.achievements.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-3 align-items-center">
                      <Trophy size={16} className="text-warning" />
                      {druzyna.achievements.map((achievement, index) => (
                        <Badge key={index} bg="info" className="text-white d-flex align-items-center gap-1">
                          <Star size={12} />
                          {achievement}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card.Header>

                <Card.Body>
                  <h6 className="fw-semibold mb-3">Zastępy w drużynie:</h6>
                  <Row className="gy-3">
                    {druzyna.zastepy.map((zastep, index) => (
                      <Col key={index} sm={6} lg={4}>
                        <div className="border rounded p-3 bg-white h-100">
                          <h6 className="fw-medium mb-2">{zastep.name}</h6>
                          <p className="small text-muted mb-2">{zastep.specialty}</p>
                          <div className="d-flex align-items-center gap-1 small">
                            <Users size={14} />
                            <span>{zastep.members} członków</span>
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
