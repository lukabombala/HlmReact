import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, Container, Spinner, Badge, Button, Table, Image, Row, Col, Form } from "react-bootstrap";
import { Users, ChevronLeft, ExternalLink, UserCheck } from "lucide-react";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";
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
import { useRef } from "react";
import { Modal } from "react-bootstrap";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pagination } from "react-bootstrap";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const PLACEHOLDER_LOGO = logoPlaceholder;

function getMonthLabelFromKey(key) {
  if (!key || key.length !== 6) return "brak";
  const year = key.slice(0, 4);
  const m = parseInt(key.slice(4, 6), 10) - 1;
  const labels = [
    "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
    "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"
  ];
  return `${labels[m]} ${year}`;
}

export default function ZastepDetailPage() {
  const { id } = useParams();
  const [zastep, setZastep] = useState(null);
  const [loading, setLoading] = useState(true);

  // Punktacja
  const [scoreData, setScoreData] = useState([]);
  const [scoreLoading, setScoreLoading] = useState(true);
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [catOptions, setCatOptions] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [showCatDesc, setShowCatDesc] = useState(false);
  const [catDescHtml, setCatDescHtml] = useState("");
  const [catDescTitle, setCatDescTitle] = useState("");
  const [scoreValueFilter, setScoreValueFilter] = useState("");
    // Stan do paginacji
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    zastepyListAll().then((all) => {
      const found = all.find((z) => z.id === id);
      setZastep(found);
      setLoading(false);
    });
  }, [id]);

    useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedCat, scoreValueFilter, rowsPerPage]);

    // Wylicz paginację
  const totalRows = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    punktacjaListAll().then((all) => {
      const filtered = all.filter(
        (rec) => rec.scoreTeam && rec.scoreTeam[0]?.id === id
      );
      setScoreData(filtered);

      // Miesiące
      const monthsSet = new Set(filtered.map((rec) => rec.miesiac));
      const monthsArr = Array.from(monthsSet)
        .filter(Boolean)
        .map((key) => ({
            key,
            label: getMonthLabelFromKey(key)
        }))
        .filter(m => m && typeof m.key === "string")
        .sort((a, b) => a.key.localeCompare(b.key));
      setMonthOptions(monthsArr);

      // Kategorie
      const catsSet = new Map();
      filtered.forEach(rec => {
        const catId = rec.scoreCat?.[0]?.id;
        const catName = rec.scoreCat?.[0]?.snapshot?.scoringName;
        if (catId && catName) catsSet.set(catId, catName);
      });
      const catsArr = Array.from(catsSet.entries()).map(([id, name]) => ({ id, name }));
      setCatOptions(catsArr);

      // Domyślne filtry
      if (monthsArr.length > 0) setSelectedMonth(""); // "" = wszystkie
      if (catsArr.length > 0) setSelectedCat(""); // "" = wszystkie

      setScoreLoading(false);
    });
  }, [id]);

    useEffect(() => {
        let records = scoreData;
        if (selectedMonth) records = records.filter(r => r.miesiac === selectedMonth);
        if (selectedCat) records = records.filter(r => r.scoreCat?.[0]?.id === selectedCat);
        if (scoreValueFilter !== "") {
        const val = Number(scoreValueFilter);
        if (!isNaN(val)) records = records.filter(r => r.scoreValue === val);
        }
        setFilteredRecords(records);
    }, [scoreData, selectedMonth, selectedCat, scoreValueFilter]);

  // Kategorie jako wiersze, miesiące jako kolumny
  const catList = catOptions.length
    ? catOptions
    : (() => {
        const catsSet = new Map();
        scoreData.forEach(rec => {
          const catId = rec.scoreCat?.[0]?.id;
          const catName = rec.scoreCat?.[0]?.snapshot?.scoringName;
          if (catId && catName) catsSet.set(catId, catName);
        });
        return Array.from(catsSet.entries()).map(([id, name]) => ({ id, name }));
      })();

    const monthList = monthOptions.length
    ? monthOptions
    : (() => {
        const monthsSet = new Set(scoreData.map((rec) => rec.miesiac));
        return Array.from(monthsSet)
            .filter(Boolean)
            .map((key) => ({
            key,
            label: getMonthLabelFromKey(key)
            }))
            .filter(m => m && typeof m.key === "string")
            .sort((a, b) => a.key.localeCompare(b.key));
        })();

  // Suma punktów dla [kategoria][miesiąc]
  const pointsTable = catList.map(cat => ({
    catId: cat.id,
    catName: cat.name,
    points: monthList.map(month => {
      return scoreData
        .filter(rec =>
          rec.scoreCat?.[0]?.id === cat.id &&
          rec.miesiac === month.key
        )
        .reduce((sum, rec) => sum + rec.scoreValue, 0);
    }),
    total: scoreData
      .filter(rec => rec.scoreCat?.[0]?.id === cat.id)
      .reduce((sum, rec) => sum + rec.scoreValue, 0)
  }));

  // Dane do wykresu
  const months = monthOptions.map(opt => opt.label);
  const pointsByMonth = monthOptions.map(opt =>
    scoreData
      .filter(rec => rec.miesiac === opt.key)
      .reduce((sum, rec) => sum + rec.scoreValue, 0)
  );
  const totalPoints = pointsByMonth.reduce((a, b) => a + b, 0);

  const barData = {
    labels: months,
    datasets: [
      {
        label: "Punkty w miesiącu",
        data: pointsByMonth,
        backgroundColor: "#0d7337",
        borderRadius: 6,
        maxBarThickness: 32,
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 14 },
          offset: -6,
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
        align: 'end',
        color: '#222',
        font: { weight: 'bold', size: 14 },
        offset: -8,
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

    function formatDate(dateStr) {
    if (!dateStr) return "";
    if (typeof dateStr === "string") {
        return dateStr.split(" ")[0];
    }
    // Jeśli to np. obiekt Date lub Timestamp z Firestore
    if (dateStr instanceof Date) {
        return dateStr.toISOString().slice(0, 10);
    }
    if (typeof dateStr === "object" && typeof dateStr.seconds === "number") {
        // Firestore Timestamp
        const d = new Date(dateStr.seconds * 1000);
        return d.toISOString().slice(0, 10);
    }
    return "";
    }

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
              <h4 className="fw-bold mb-3">Przebieg punktacji w sezonie</h4>
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
      {/* Tabela sum punktów wg kategorii i miesięcy */}
      <Row className="mt-4">
        <Col xs={12}>
          <Card className="shadow mb-4">
            <Card.Body>
              <h4 className="fw-bold mb-3">Tabela punktacji według kategorii</h4>
              {scoreLoading ? (
                <Spinner animation="border" />
              ) : pointsTable.length === 0 ? (
                <div className="text-muted">Brak punktacji dla tego zastępu.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <Table
                    bordered
                    hover
                    responsive
                    className="align-middle"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: 0,
                      fontSize: "1.05rem",
                      border: "2px solid #dee2e6", // Dodane obramowanie zewnętrzne
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th className="text-center align-middle" style={{ background: "#f3f4f6", fontWeight: 600, letterSpacing: "0.03em" }}>Kategoria</th>
                        {monthList.map(m => (
                          <th
                            key={m.key}
                            className="text-center align-middle"
                            style={{ background: "#f3f4f6", fontWeight: 600, letterSpacing: "0.03em" }}
                          >
                            {m.label}
                          </th>
                        ))}
                        <th className="text-center align-middle" style={{ background: "#f3f4f6", fontWeight: 600, letterSpacing: "0.03em" }}>Suma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pointsTable.map(row => (
                        <tr key={row.catId}>
                          <td className="text-center align-middle fw-semibold" style={{ background: "#f8fafc" }}>{row.catName}</td>
                          {row.points.map((pt, idx) => (
                            <td key={idx} className="text-center align-middle" style={{ background: "#fff" }}>{pt}</td>
                          ))}
                          <td className="fw-bold text-center align-middle" style={{ background: "#f8fafc" }}>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Lista rekordów punktacji z filtrami */}
<Row>
        <Col xs={12}>
          <Card className="shadow">
            <Card.Body>
              <h4 className="fw-bold mb-3">Lista wpisów punktacji</h4>
              <div
                className="mb-3"
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: "0.75rem 1rem",
                  fontSize: "0.97rem",
                  color: "#495057",
                  maxWidth: 480
                }}
              >
                <span style={{ color: "#0d6efd", fontWeight: 600 }}>Wskazówka:</span> Kliknij na nazwę kategorii, aby zobaczyć jej opis.
              </div>
              <Form className="mb-3 d-flex flex-wrap gap-3 align-items-end">
                <Form.Group>
                  <Form.Label>Miesiąc:</Form.Label>
                  <Form.Select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    style={{ minWidth: 180 }}
                  >
                    <option value="">Wszystkie</option>
                    {monthOptions.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Kategoria:</Form.Label>
                  <Form.Select
                    value={selectedCat}
                    onChange={e => setSelectedCat(e.target.value)}
                    style={{ minWidth: 180 }}
                  >
                    <option value="">Wszystkie</option>
                    {catOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Punkty:</Form.Label>
                  <Form.Select
                    value={scoreValueFilter}
                    onChange={e => setScoreValueFilter(e.target.value)}
                    style={{ minWidth: 120 }}
                  >
                    <option value="">Wszystkie</option>
                    {[...new Set(scoreData.map(r => r.scoreValue))]
                      .filter(v => v !== undefined && v !== null)
                      .sort((a, b) => a - b)
                      .map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Wierszy na stronę:</Form.Label>
                  <Form.Select
                    value={rowsPerPage}
                    onChange={e => setRowsPerPage(Number(e.target.value))}
                    style={{ minWidth: 120 }}
                  >
                    {[10, 20, 50, 100].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Form>
              {scoreLoading ? (
                <Spinner animation="border" />
              ) : filteredRecords.length === 0 ? (
                <div className="text-muted">Brak rekordów punktacji dla wybranych filtrów.</div>
              ) : (
                <>
            <Table bordered hover responsive>
            <thead>
                <tr>
                <th style={{ minWidth: 120, width: 120 }}>Data dodania</th>
                <th style={{ minWidth: 110, width: 110 }}>Miesiąc</th>
                <th style={{ minWidth: 160, width: 160 }}>Kategoria</th>
                <th style={{ minWidth: 80, width: 80 }}>Punkty</th>
                <th style={{ minWidth: 180, width: 180 }}>Uwagi</th>
                </tr>
            </thead>
            <tbody>
                {paginatedRecords.map((rec, idx) => (
                <tr key={rec.id || idx}>
                    <td style={{ minWidth: 120, width: 120 }}>{formatDate(rec.scoreAddDate)}</td>
                    <td style={{ minWidth: 110, width: 110 }}>{getMonthLabelFromKey(rec.miesiac)}</td>
                    <td style={{ minWidth: 160, width: 160 }}>
                    <span
                        style={{
                        color: "#0d6efd",
                        cursor: rec.scoreCat?.[0]?.snapshot?.scoringDesc ? "pointer" : "default",
                        textDecoration: rec.scoreCat?.[0]?.snapshot?.scoringDesc ? "underline dotted" : "none"
                        }}
                        onClick={() => {
                        if (rec.scoreCat?.[0]?.snapshot?.scoringDesc) {
                            setCatDescTitle(rec.scoreCat[0].snapshot.scoringName || "Opis kategorii");
                            setCatDescHtml(rec.scoreCat[0].snapshot.scoringDesc);
                            setShowCatDesc(true);
                        }
                        }}
                    >
                        {rec.scoreCat?.[0]?.snapshot?.scoringName || "Brak kategorii"}
                    </span>
                    </td>
                    <td style={{ minWidth: 80, width: 80 }}>{rec.scoreValue}</td>
                    <td style={{ minWidth: 180, width: 180 }}>
                    {rec.scoreInfo
                        ? (
                            <span
                            dangerouslySetInnerHTML={{
                                __html: rec.scoreInfo
                            }}
                            />
                        )
                        : <span className="text-muted">brak</span>}
                    </td>
                </tr>
                ))}
            </tbody>
            </Table>
                  {/* Paginacja */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                        <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <Pagination.Item
                            key={i + 1}
                            active={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
              {/* Modal z opisem kategorii */}
              <Modal show={showCatDesc} onHide={() => setShowCatDesc(false)} centered>
                <Modal.Header closeButton>
                  <Modal.Title>{catDescTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div dangerouslySetInnerHTML={{ __html: catDescHtml }} />
                </Modal.Body>
              </Modal>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}