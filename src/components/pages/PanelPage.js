import { useState, useMemo, useEffect } from "react";
import {
  Card, Button, Form, Row, Col, Table, Badge, Modal, Container, Collapse, Alert, Spinner, Pagination,
} from "react-bootstrap";
import { Trophy, Users, Plus, Filter, ChevronDown, ChevronUp, FileText, AlertTriangle, Edit2, Edit, Trash2 } from "lucide-react";
import { jednostkiListAll } from "../../services/jednostkiList.mjs";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";

// Sidebar navigation items
const NAV = [
  { key: "team", label: "Moja drużyna", icon: <Users size={18} className="me-2" /> },
  { key: "history", label: "Historia wpisów", icon: <FileText size={18} className="me-2" /> },
  { key: "report", label: "Zgłoś błąd", icon: <AlertTriangle size={18} className="me-2" /> },
];

// Pomocnicza funkcja do formatu miesiąca
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

export default function PanelPage() {
  const [tab, setTab] = useState("team");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addScoutId, setAddScoutId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRequest, setEditRequest] = useState("");
  const [editSent, setEditSent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Firestore data
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [zastepy, setZastepy] = useState([]);
  const [zastepyLoading, setZastepyLoading] = useState(true);
  const [punktacje, setPunktacje] = useState([]);
  const [punktacjeLoading, setPunktacjeLoading] = useState(true);

  // Wybrana drużyna (id)
  const [selectedTeam, setSelectedTeam] = useState("");

  // Historia wpisów - filtry
  const [historyMonth, setHistoryMonth] = useState([]);
  const [historyCat, setHistoryCat] = useState([]);
  const [historyScout, setHistoryScout] = useState([]);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(20);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");

  // Modal z opisem kategorii
  const [showCatDesc, setShowCatDesc] = useState(false);
  const [catDescHtml, setCatDescHtml] = useState("");
  const [catDescTitle, setCatDescTitle] = useState("");

  // Modale edycji/usuwania wpisu
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editEntryData, setEditEntryData] = useState(null);
  const [editEntrySuccess, setEditEntrySuccess] = useState(false);

  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false);
  const [deleteEntryData, setDeleteEntryData] = useState(null);
  const [deleteEntrySuccess, setDeleteEntrySuccess] = useState(false);

  // Pobierz drużyny z Firestore
  useEffect(() => {
    setTeamsLoading(true);
    jednostkiListAll().then((data) => {
      setTeams(data);
      setTeamsLoading(false);
    });
  }, []);

  // Pobierz zastępy z Firestore
  useEffect(() => {
    setZastepyLoading(true);
    zastepyListAll().then((data) => {
      setZastepy(data);
      setZastepyLoading(false);
    });
  }, []);

  // Pobierz punktacje z Firestore
  useEffect(() => {
    setPunktacjeLoading(true);
    punktacjaListAll().then((data) => {
      setPunktacje(data);
      setPunktacjeLoading(false);
    });
  }, []);

  function handleOpenEditModal() {
    setEditRequest("");
    setEditSent(false);
    setShowEditModal(true);
  }

  function handleEditSubmit(e) {
  e.preventDefault();
  setEditSent(true);
  }

  function handleOpenAddModal(scoutId) {
  setAddScoutId(scoutId);
  setShowAddModal(true);
  }

  // Wybrane dane drużyny
  const selectedTeamData = useMemo(
    () => teams.find((t) => t.id === selectedTeam),
    [teams, selectedTeam]
  );

  // Zastępy tej drużyny
  const teamZastepy = useMemo(
    () => zastepy.filter((z) => z.jednostka && z.jednostka[0]?.id === selectedTeam),
    [zastepy, selectedTeam]
  );

  // Liczba harcerzy w drużynie (suma harcerzy w zastępach)
  const scoutsCount = useMemo(
    () => teamZastepy.reduce((sum, z) => sum + (Array.isArray(z.harcerze) ? z.harcerze.length : 0), 0),
    [teamZastepy]
  );

  // Punktacja tej drużyny (suma punktów wszystkich zastępów tej drużyny)
  const teamPunktacje = useMemo(
    () => punktacje.filter(
      (p) => p.scoreTeam && p.scoreTeam[0]?.id && teamZastepy.some(z => z.id === p.scoreTeam[0].id)
    ),
    [punktacje, teamZastepy]
  );

  // Suma punktów
  const totalPoints = useMemo(
    () => teamPunktacje.reduce((sum, p) => sum + (p.scoreValue || 0), 0),
    [teamPunktacje]
  );

  // Liczba wpisów punktacji
  const totalActivities = teamPunktacje.length;

  // Zastępy z sumą punktów i wpisów
  const teamScouts = useMemo(() => {
    return teamZastepy.map(z => {
      const zPunktacje = punktacje.filter(
        (p) => p.scoreTeam && p.scoreTeam[0]?.id === z.id
      );
      return {
        id: z.id,
        name: z.fullName || z.name || "Zastęp",
        points: zPunktacje.reduce((sum, p) => sum + (p.scoreValue || 0), 0),
        activities: zPunktacje.length,
        last: zPunktacje.length > 0
          ? zPunktacje
              .map(p => p.scoreAddDate)
              .filter(Boolean)
              .sort()
              .reverse()[0]
          : null,
      };
    });
  }, [teamZastepy, punktacje]);

  // Kategorie z punktacji tej drużyny
  const historyCatOptions = useMemo(() => {
    const catsSet = new Map();
    teamPunktacje.forEach(rec => {
      const catId = rec.scoreCat?.[0]?.id;
      const catName = rec.scoreCat?.[0]?.snapshot?.scoringName;
      if (catId && catName) catsSet.set(catId, catName);
    });
    return Array.from(catsSet.entries()).map(([id, name]) => ({ id, name }));
  }, [teamPunktacje]);

  // Miesiące z punktacji tej drużyny
  const historyMonthOptions = useMemo(() => {
    const monthsSet = new Set(teamPunktacje.map((rec) => rec.miesiac));
    return Array.from(monthsSet)
      .filter(Boolean)
      .map((key) => ({
        key,
        label: getMonthLabelFromKey(key)
      }))
      .filter(m => m && typeof m.key === "string")
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [teamPunktacje]);

  // Zastępy do filtracji
  const historyScoutOptions = useMemo(() =>
    teamScouts.map(z => ({ id: z.id, name: z.name })),
    [teamScouts]
  );

  // Filtrowane rekordy historii
  const filteredHistoryRecords = useMemo(() => {
    let records = teamPunktacje;
    if (historyScout.length > 0 && !historyScout.includes("ALL"))
      records = records.filter(r => historyScout.includes(r.scoreTeam?.[0]?.id));
    if (historyCat.length > 0 && !historyCat.includes("ALL"))
      records = records.filter(r => historyCat.includes(r.scoreCat?.[0]?.id));
    if (historyMonth.length > 0 && !historyMonth.includes("ALL"))
      records = records.filter(r => historyMonth.includes(r.miesiac));
    if (historyDateFrom) {
      const from = new Date(historyDateFrom);
      records = records.filter(r => {
        const d = r.scoreAddDate
          ? (typeof r.scoreAddDate === "object" && r.scoreAddDate.seconds
              ? new Date(r.scoreAddDate.seconds * 1000)
              : new Date(r.scoreAddDate))
          : null;
        return d && d >= from;
      });
    }
    if (historyDateTo) {
      const to = new Date(historyDateTo);
      records = records.filter(r => {
        const d = r.scoreAddDate
          ? (typeof r.scoreAddDate === "object" && r.scoreAddDate.seconds
              ? new Date(r.scoreAddDate.seconds * 1000)
              : new Date(r.scoreAddDate))
          : null;
        return d && d <= to;
      });
    }
    return records;
  }, [teamPunktacje, historyScout, historyCat, historyMonth, historyDateFrom, historyDateTo]);

  // Paginacja historii
  const totalHistoryRows = filteredHistoryRecords.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryRows / historyRowsPerPage));
  const paginatedHistoryRecords = filteredHistoryRecords.slice(
    (historyCurrentPage - 1) * historyRowsPerPage,
    historyCurrentPage * historyRowsPerPage
  );

  // Reset paginacji przy zmianie filtrów
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyScout, historyCat, historyMonth, historyRowsPerPage, historyDateFrom, historyDateTo]);

  // Multi-select helpers
  function handleMultiSelectChange(setter, values, allValue) {
    const arr = Array.from(values, option => option.value);
    if (arr.includes(allValue)) {
      setter([allValue]);
    } else {
      setter(arr);
    }
  }

  function handleResetFilters() {
    setHistoryScout([]);
    setHistoryCat([]);
    setHistoryMonth([]);
    setHistoryDateFrom("");
    setHistoryDateTo("");
  }

  // Format daty
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

  // Modal: Edycja wpisu
  function openEditEntryModal(entry) {
    setEditEntryData(entry);
    setEditEntrySuccess(false);
    setShowEditEntryModal(true);
  }
  function closeEditEntryModal() {
    setShowEditEntryModal(false);
    setEditEntryData(null);
    setEditEntrySuccess(false);
  }
  function handleEditEntrySubmit(e) {
    e.preventDefault();
    setEditEntrySuccess(true);
    // Tu można dodać obsługę zapisu do bazy
  }

  // Modal: Usuwanie wpisu
  function openDeleteEntryModal(entry) {
    setDeleteEntryData(entry);
    setDeleteEntrySuccess(false);
    setShowDeleteEntryModal(true);
  }
  function closeDeleteEntryModal() {
    setShowDeleteEntryModal(false);
    setDeleteEntryData(null);
    setDeleteEntrySuccess(false);
  }
  function handleDeleteEntryConfirm() {
    setDeleteEntrySuccess(true);
    // Tu można dodać obsługę usuwania z bazy
  }

  // Responsive: show sidebar on md+, top nav on sm-
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Sidebar for desktop */}
      <aside
        className="d-none d-md-block"
        style={{
          width: 230,
          background: "#fff",
          borderRight: "1px solid #e5e7eb",
          padding: "2.5rem 0 2.5rem 0",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div className="d-flex flex-column align-items-stretch h-100">
          <div className="px-4 mb-4">
            <div className="fw-bold fs-5 mb-2" style={{ letterSpacing: 1 }}>Panel</div>
          </div>
          <nav className="flex-grow-1">
            {NAV.map((item) => (
              <Button
                key={item.key}
                variant={tab === item.key ? "primary" : "light"}
                className="w-100 text-start mb-2 d-flex align-items-center"
                style={{
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  background: tab === item.key ? "#e0e7ff" : "transparent",
                  color: tab === item.key ? "#1e293b" : "#374151",
                  boxShadow: tab === item.key ? "0 1px 4px #0001" : "none",
                }}
                onClick={() => setTab(item.key)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Top nav for mobile */}
      <nav
        className="d-flex d-md-none justify-content-around align-items-center"
        style={{
          position: "fixed",
          top: 76,
          left: 0,
          right: 0,
          height: 54,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          zIndex: 100,
        }}
      >
        {NAV.map((item) => (
          <Button
            key={item.key}
            variant={tab === item.key ? "primary" : "light"}
            className="d-flex flex-column align-items-center justify-content-center px-2 py-1"
            style={{
              border: "none",
              borderRadius: 0,
              fontWeight: 500,
              background: tab === item.key ? "#e0e7ff" : "transparent",
              color: tab === item.key ? "#1e293b" : "#374151",
              boxShadow: "none",
              flex: 1,
              height: "100%",
            }}
            onClick={() => setTab(item.key)}
          >
            {item.icon}
            <span style={{ fontSize: 12 }}>{item.label}</span>
          </Button>
        ))}
      </nav>

      {/* Main content */}
      <Container
        fluid
        style={{
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 2rem",
          flex: 1,
          marginTop: isMobile ? 145 : "6rem",
        }}
      >
        <div style={{ maxWidth: "100%", margin: "0 auto", marginBottom: "3rem" }}>
          {tab === "team" && (
            <>
              <div className="mb-4">
                <h1 className="fw-bold mb-2" style={{ fontSize: "2rem" }}>Panel Drużynowego</h1>
                <div className="text-muted mb-3">
                  Zarządzaj punktacją zastępów w Twojej drużynie.
                </div>
              </div>

              {/* Wybór drużyny */}
              <Card className="mb-4">
                <Card.Header className="d-flex align-items-center gap-2">
                  <Users size={20} className="me-2" />
                  <span className="fw-semibold">Wybierz drużynę</span>
                </Card.Header>
                <Card.Body>
                  {teamsLoading ? (
                    <Spinner animation="border" />
                  ) : (
                    <Form.Select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      style={{ maxWidth: 400 }}
                    >
                      <option value="">Wybierz drużynę do zarządzania</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.shortName || team.name || team.nazwa || "Drużyna"}
                        </option>
                      ))}
                    </Form.Select>
                  )}
                </Card.Body>
              </Card>

              {selectedTeam && (
                <>
                  {/* Statystyki drużyny */}
                  <Card className="mb-4">
                    <Card.Header className="d-flex align-items-center justify-content-between">
                      <span className="fw-semibold">
                        Moja drużyna: {selectedTeamData?.shortName || selectedTeamData?.name || selectedTeamData?.nazwa}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleOpenEditModal}
                        className="d-flex align-items-center"
                      >
                        <Edit2 size={16} className="me-1" />
                        Edycja drużyny
                      </Button>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={3} className="text-center mb-3 mb-md-0">
                          <div className="fs-2 fw-bold text-primary">{teamScouts.length}</div>
                          <div className="text-muted small">Zastępów</div>
                        </Col>
                        <Col md={3} className="text-center mb-3 mb-md-0">
                          <div className="fs-2 fw-bold text-primary">{scoutsCount}</div>
                          <div className="text-muted small">Liczba harcerzy</div>
                        </Col>
                        <Col md={3} className="text-center mb-3 mb-md-0">
                          <div className="fs-2 fw-bold text-primary">{totalPoints}</div>
                          <div className="text-muted small">Łączne punkty</div>
                        </Col>
                        <Col md={3} className="text-center">
                          <div className="fs-2 fw-bold text-primary">{totalActivities}</div>
                          <div className="text-muted small">Działań ogółem</div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Modal edycji drużyny */}
                  <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                    <Modal.Header closeButton>
                      <Modal.Title>Prośba o edycję danych drużyny</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {editSent ? (
                        <Alert variant="success" className="mb-0">
                          Prośba o edycję została wysłana do administratora.
                        </Alert>
                      ) : (
                        <Form onSubmit={handleEditSubmit}>
                          <Alert variant="info">
                            Zmiany w danych drużyny może wprowadzić tylko administrator strony.<br />
                            Opisz poniżej, jakie dane chcesz zmienić.
                          </Alert>
                          <Form.Group className="mb-3">
                            <Form.Label>Opis zmian</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              required
                              value={editRequest}
                              onChange={e => setEditRequest(e.target.value)}
                              placeholder="Opisz, jakie dane drużyny wymagają zmiany..."
                            />
                          </Form.Group>
                          <Button type="submit" variant="primary" className="w-100">
                            Wyślij prośbę
                          </Button>
                        </Form>
                      )}
                    </Modal.Body>
                  </Modal>

                  {/* Lista zastępów */}
                  <Card className="mb-4">
                    <Card.Header className="d-flex align-items-center gap-2">
                      <Trophy size={20} className="me-2" />
                      <span className="fw-semibold">Moje zastępy</span>
                    </Card.Header>
                    <Card.Body>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Zastęp</th>
                            <th className="text-center">Punkty</th>
                            <th className="text-center">Liczba wpisów</th>
                            <th className="text-center">Data ostatniego wpisu</th>
                            <th className="text-center">Akcje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamScouts.map((scout) => (
                            <tr key={scout.id}>
                              <td className="fw-medium">{scout.name}</td>
                              <td className="text-center">
                                <Badge bg="primary">{scout.points}</Badge>
                              </td>
                              <td className="text-center">{scout.activities}</td>
                              <td className="text-center text-muted small">
                                {scout.last ? new Date(scout.last).toLocaleDateString("pl-PL") : "Brak wpisów"}
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleOpenAddModal(scout.id)}
                                >
                                  <Plus size={16} className="me-1" />
                                  Dodaj punkty
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>

                  {/* Modal dodawania punktów */}
                  <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                    <Modal.Header closeButton>
                      <Modal.Title>Dodaj punkty zastępowi</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Zastęp</Form.Label>
                          <Form.Select value={addScoutId || ""} disabled>
                            <option>Wybierz zastęp</option>
                            {teamScouts.map((scout) => (
                              <option key={scout.id} value={scout.id}>{scout.name}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Kategoria</Form.Label>
                          <Form.Select>
                            <option>Wybierz kategorię</option>
                            <option>Sprawność harcerska</option>
                            <option>Gra terenowa</option>
                            <option>Konkurs/zawody</option>
                            <option>Organizacja działania</option>
                            <option>Służba harcerska</option>
                            <option>Inne działania</option>
                          </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Opis działania</Form.Label>
                          <Form.Control as="textarea" rows={2} />
                        </Form.Group>
                        <Row>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label>Punkty (1-10)</Form.Label>
                              <Form.Control type="number" min={1} max={10} />
                            </Form.Group>
                          </Col>
                          <Col>
                            <Form.Group className="mb-3">
                              <Form.Label>Data</Form.Label>
                              <Form.Control type="date" />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Form.Group className="mb-3">
                          <Form.Label>Klasyfikacja miesięczna</Form.Label>
                          <Form.Control type="month" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Uwagi (opcjonalne)</Form.Label>
                          <Form.Control as="textarea" rows={2} />
                        </Form.Group>
                        <Button variant="primary" className="w-100" disabled>
                          Dodaj punkty
                        </Button>
                      </Form>
                    </Modal.Body>
                  </Modal>
                </>
              )}
            </>
          )}

          {tab === "history" && (
            <Card>
              <Card.Header className="d-flex align-items-center gap-2">
                <FileText size={20} className="me-2" />
                <span className="fw-semibold">Historia wpisów punktacji</span>
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
                        <Form.Label>Zastęp</Form.Label>
                        <Form.Select
                          value={historyScout.length === 0 ? "ALL" : historyScout[0]}
                          onChange={e => {
                            const val = e.target.value;
                            setHistoryScout(val === "ALL" ? [] : [val]);
                          }}
                        >
                          <option value="ALL">Wszystkie</option>
                          {historyScoutOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label>Kategoria</Form.Label>
                        <Form.Select
                          value={historyCat.length === 0 ? "ALL" : historyCat[0]}
                          onChange={e => {
                            const val = e.target.value;
                            setHistoryCat(val === "ALL" ? [] : [val]);
                          }}
                        >
                          <option value="ALL">Wszystkie</option>
                          {historyCatOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.name}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label>Miesiąc</Form.Label>
                        <Form.Select
                          value={historyMonth.length === 0 ? "ALL" : historyMonth[0]}
                          onChange={e => {
                            const val = e.target.value;
                            setHistoryMonth(val === "ALL" ? [] : [val]);
                          }}
                        >
                          <option value="ALL">Wszystkie</option>
                          {historyMonthOptions.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3} className="d-flex align-items-end">
                        <Button variant="outline-secondary" size="sm" className="w-100" onClick={handleResetFilters}>
                          Resetuj filtry
                        </Button>
                      </Col>
                    </Row>
                    <Row className="g-3 mb-3">
                      <Col md={3}>
                        <Form.Label>Data od</Form.Label>
                        <Form.Control
                          type="date"
                          value={historyDateFrom}
                          onChange={e => setHistoryDateFrom(e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label>Data do</Form.Label>
                        <Form.Control
                          type="date"
                          value={historyDateTo}
                          onChange={e => setHistoryDateTo(e.target.value)}
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label>Wierszy na stronę</Form.Label>
                        <Form.Select
                          value={historyRowsPerPage}
                          onChange={e => setHistoryRowsPerPage(Number(e.target.value))}
                        >
                          {[10, 20, 50, 100].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3} className="d-flex align-items-end justify-content-end">
                        <div className="text-muted ms-2">
                          Wyświetlono {paginatedHistoryRecords.length} z {totalHistoryRows} wpisów
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Collapse>
                {punktacjeLoading ? (
                  <Spinner animation="border" />
                ) : paginatedHistoryRecords.length === 0 ? (
                  <div className="text-muted py-5 text-center">Brak wpisów punktacji dla wybranych filtrów.</div>
                ) : (
                  <>
                    <Table bordered hover responsive>
                      <thead>
                        <tr>
                          <th style={{ minWidth: 120, width: 120 }}>Data dodania</th>
                          <th style={{ minWidth: 110, width: 110 }}>Miesiąc</th>
                          <th style={{ minWidth: 160, width: 160 }}>Kategoria</th>
                          <th style={{ minWidth: 120, width: 120 }}>Zastęp</th>
                          <th style={{ minWidth: 80, width: 80 }}>Punkty</th>
                          <th style={{ minWidth: 180, width: 180 }}>Uwagi</th>
                          <th style={{ minWidth: 120, width: 120 }}>Akcje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHistoryRecords.map((rec, idx) => (
                          <tr key={rec.id || idx}>
                            <td>{formatDate(rec.scoreAddDate)}</td>
                            <td>{getMonthLabelFromKey(rec.miesiac)}</td>
                            <td>
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
                            <td>
                              {teamScouts.find(z => z.id === rec.scoreTeam?.[0]?.id)?.name || "?"}
                            </td>
                            <td>{rec.scoreValue}</td>
                            <td>
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
                            <td className="text-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-2"
                                title="Edytuj"
                                onClick={() => openEditEntryModal(rec)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                title="Usuń"
                                onClick={() => openDeleteEntryModal(rec)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    {/* Paginacja */}
                    {totalHistoryPages > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <Pagination>
                          <Pagination.First onClick={() => setHistoryCurrentPage(1)} disabled={historyCurrentPage === 1} />
                          <Pagination.Prev onClick={() => setHistoryCurrentPage(p => Math.max(1, p - 1))} disabled={historyCurrentPage === 1} />
                          {Array.from({ length: totalHistoryPages }).map((_, i) => (
                            <Pagination.Item
                              key={i + 1}
                              active={historyCurrentPage === i + 1}
                              onClick={() => setHistoryCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </Pagination.Item>
                          ))}
                          <Pagination.Next onClick={() => setHistoryCurrentPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyCurrentPage === totalHistoryPages} />
                          <Pagination.Last onClick={() => setHistoryCurrentPage(totalHistoryPages)} disabled={historyCurrentPage === totalHistoryPages} />
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
                    {/* Modal edycji wpisu */}
                    <Modal show={showEditEntryModal} onHide={closeEditEntryModal} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Edytuj wpis punktacji</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        {editEntrySuccess ? (
                          <Alert variant="success" className="mb-0">
                            Zmiany zostały zapisane.
                          </Alert>
                        ) : editEntryData && (
                          <Form onSubmit={handleEditEntrySubmit}>
                            <Form.Group className="mb-3">
                              <Form.Label>Zastęp</Form.Label>
                              <Form.Select value={editEntryData.scoreTeam?.[0]?.id || ""} disabled>
                                {teamScouts.map((scout) => (
                                  <option key={scout.id} value={scout.id}>{scout.name}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Kategoria</Form.Label>
                              <Form.Select value={editEntryData.scoreCat?.[0]?.id || ""} disabled>
                                {historyCatOptions.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Opis działania</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                defaultValue={editEntryData.scoreInfo || ""}
                              />
                            </Form.Group>
                            <Row>
                              <Col>
                                <Form.Group className="mb-3">
                                  <Form.Label>Punkty (1-10)</Form.Label>
                                  <Form.Control
                                    type="number"
                                    min={1}
                                    max={10}
                                    defaultValue={editEntryData.scoreValue}
                                  />
                                </Form.Group>
                              </Col>
                              <Col>
                                <Form.Group className="mb-3">
                                  <Form.Label>Data</Form.Label>
                                  <Form.Control
                                    type="date"
                                    defaultValue={formatDate(editEntryData.scoreAddDate)}
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Form.Group className="mb-3">
                              <Form.Label>Klasyfikacja miesięczna</Form.Label>
                              <Form.Control
                                type="month"
                                defaultValue={
                                  editEntryData.miesiac
                                    ? `${editEntryData.miesiac.slice(0, 4)}-${editEntryData.miesiac.slice(4, 6)}`
                                    : ""
                                }
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Uwagi (opcjonalne)</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                defaultValue={editEntryData.uwagi || ""}
                              />
                            </Form.Group>
                            <Button type="submit" variant="primary" className="w-100">
                              Zapisz zmiany
                            </Button>
                          </Form>
                        )}
                      </Modal.Body>
                    </Modal>
                    {/* Modal usuwania wpisu */}
                    <Modal show={showDeleteEntryModal} onHide={closeDeleteEntryModal} centered>
                      <Modal.Header closeButton>
                        <Modal.Title>Usuń wpis punktacji</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        {deleteEntrySuccess ? (
                          <Alert variant="success" className="mb-0">
                            Wpis został usunięty.
                          </Alert>
                        ) : deleteEntryData && (
                          <>
                            <Alert variant="danger">
                              Czy na pewno chcesz usunąć ten wpis punktacji?
                            </Alert>
                            <div className="mb-2">
                              <b>Zastęp:</b> {teamScouts.find(z => z.id === deleteEntryData.scoreTeam?.[0]?.id)?.name || "?"}<br />
                              <b>Kategoria:</b> {deleteEntryData.scoreCat?.[0]?.snapshot?.scoringName || "Brak"}<br />
                              <b>Punkty:</b> {deleteEntryData.scoreValue}<br />
                              <b>Data:</b> {formatDate(deleteEntryData.scoreAddDate)}<br />
                              <b>Miesiąc:</b> {getMonthLabelFromKey(deleteEntryData.miesiac)}
                            </div>
                            <Button variant="danger" className="w-100" onClick={handleDeleteEntryConfirm}>
                              Potwierdź usunięcie
                            </Button>
                          </>
                        )}
                      </Modal.Body>
                    </Modal>
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          {tab === "report" && (
            <Card>
              <Card.Header className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} className="me-2" />
                <span className="fw-semibold">Zgłoś błąd</span>
              </Card.Header>
              <Card.Body>
                <div className="text-center text-muted py-5">
                  <div>Formularz zgłaszania błędów będzie dostępny wkrótce.</div>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
}