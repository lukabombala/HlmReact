import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Card, Container, Spinner, Badge, Button, Table, Image, Row, Col, Form, Collapse, Alert, Pagination } from "react-bootstrap";
import { Users, ChevronLeft, ExternalLink, UserCheck, Trophy, FileText, Info, ChevronDown, ChevronUp, Filter } from "lucide-react";
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
import { Modal } from "react-bootstrap";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";

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
  const [scoreValueFilter, setScoreValueFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCatDesc, setShowCatDesc] = useState(false);
  const [catDescHtml, setCatDescHtml] = useState("");
  const [catDescTitle, setCatDescTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Responsive helpers
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
  const isDesktopWide = typeof window !== "undefined" ? window.innerWidth >= 992 : false;

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

      setScoreLoading(false);
    });
  }, [id]);

  // Filtry i paginacja (dokładnie jak w PanelPage)
  const filteredRecords = useMemo(() => {
    let records = scoreData;
    if (selectedMonth) records = records.filter(r => r.miesiac === selectedMonth);
    if (selectedCat) records = records.filter(r => r.scoreCat?.[0]?.id === selectedCat);
    if (scoreValueFilter !== "") {
      const val = Number(scoreValueFilter);
      if (!isNaN(val)) records = records.filter(r => r.scoreValue === val);
    }
    return records;
  }, [scoreData, selectedMonth, selectedCat, scoreValueFilter]);

  const totalRows = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
    if (dateStr instanceof Date) {
      return dateStr.toISOString().slice(0, 10);
    }
    if (typeof dateStr === "object" && typeof dateStr.seconds === "number") {
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
            <Card.Header className="d-flex align-items-center gap-2">
              <Trophy size={20} className="me-2" />
              <span className="fw-semibold">Przebieg punktacji w sezonie</span>
            </Card.Header>
            <Card.Body>
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
            <Card.Header className="d-flex align-items-center gap-2">
              <Info size={20} className="me-2" />
              <span className="fw-semibold">Tabela punktacji według kategorii</span>
            </Card.Header>
            <Card.Body>
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
                      border: "2px solid #dee2e6",
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
      {/* Lista rekordów punktacji z filtrami i kartami jak w PanelPage */}
      <Row>
        <Col xs={12}>
          <Card className="shadow">
            <Card.Header className="d-flex align-items-center gap-2">
              <FileText size={20} className="me-2" />
              <span className="fw-semibold">Lista wpisów punktacji</span>
              <Button
                variant="outline-secondary"
                size="sm"
                className="ms-auto d-md-none"
                onClick={() => setShowFilters((v) => !v)}
              >
                <Filter size={16} className="me-1" />
                {showFilters ? "Ukryj filtry" : "Pokaż filtry"}
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </Card.Header>
            <Card.Body>
              <Collapse in={showFilters || !isMobile}>
                <div>
                  <Row className="g-3 mb-3">
                    <Col md={3}>
                      <Form.Label>Kategoria</Form.Label>
                      <Form.Select
                        value={selectedCat}
                        onChange={e => setSelectedCat(e.target.value)}
                      >
                        <option value="">Wszystkie</option>
                        {catOptions.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Label>Miesiąc</Form.Label>
                      <Form.Select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                      >
                        <option value="">Wszystkie</option>
                        {monthOptions.map(opt => (
                          <option key={opt.key} value={opt.key}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Label>Punkty</Form.Label>
                      <Form.Select
                        value={scoreValueFilter}
                        onChange={e => setScoreValueFilter(e.target.value)}
                      >
                        <option value="">Wszystkie</option>
                        {[...new Set(scoreData.map(r => r.scoreValue))]
                          .filter(v => v !== undefined && v !== null)
                          .sort((a, b) => a - b)
                          .map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Label>Wierszy na stronę</Form.Label>
                      <Form.Select
                        value={rowsPerPage}
                        onChange={e => setRowsPerPage(Number(e.target.value))}
                      >
                        {[10, 20, 50, 100].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>
                  <div className="text-muted ms-2 mb-2">
                    Wyświetlono {paginatedRecords.length} z {totalRows} wpisów
                  </div>
                </div>
              </Collapse>
              {scoreLoading ? (
                <Spinner animation="border" />
              ) : paginatedRecords.length === 0 ? (
                <div className="text-muted py-5 text-center">Brak wpisów punktacji dla wybranych filtrów.</div>
              ) : (
                <>
                  <div className={isDesktopWide ? "row gx-3 gy-3" : "space-y-3"}>
                    {paginatedRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className={isDesktopWide ? "col-md-6" : ""}
                        style={isDesktopWide ? { display: "flex" } : {}}
                      >
                        <div className="bg-light rounded-lg border p-4 w-100" style={isDesktopWide ? { minHeight: 0 } : {}}>
                          <div className="d-flex align-items-start justify-content-between gap-4">
                            {/* Lewa część - główne informacje */}
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-3 mb-2">
                                <div>
                                  <Trophy size={20} />
                                </div>
                                <div>
                                  <h4 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>
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
                                  </h4>
                                </div>
                              </div>
                              {/* Data, miesiąc */}
                              <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 text-xs text-muted mb-2">
                                <div>
                                  {formatDate(rec.scoreAddDate)} • {getMonthLabelFromKey(rec.miesiac)}
                                </div>
                              </div>
                              {/* Uwagi */}
                              <div className="mt-2 text-muted" style={{ fontSize: "0.97em" }}>
                                {rec.scoreInfo
                                  ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: rec.scoreInfo
                                      }}
                                    />
                                  )
                                  : <span className="text-muted">brak uwag</span>}
                              </div>
                            </div>
                            {/* Środek - punkty */}
                            <div className="text-center flex-shrink-0 px-2">
                              <div className="fs-2 fw-bold text-primary">
                                {rec.scoreValue}
                              </div>
                              <div className="text-xs text-muted">
                                pkt
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  {/* Modal z opisem kategorii */}
                  <Modal show={showCatDesc} onHide={() => setShowCatDesc(false)} centered>
                    <Modal.Header closeButton>
                      <Modal.Title>{catDescTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div dangerouslySetInnerHTML={{ __html: catDescHtml }} />
                    </Modal.Body>
                  </Modal>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}