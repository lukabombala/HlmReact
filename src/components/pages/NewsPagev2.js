import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Button, Badge, Row, Col, Container, Pagination, Form, Collapse, Spinner } from "react-bootstrap";
import { Calendar, User, ChevronLeft, ChevronRight, Filter, ChevronUp, ChevronDown, SortAsc, SortDesc } from "lucide-react";

import { newsListAll } from '../../services/newsList.mjs';

export default function NewsSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allNews, setNews] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filtry
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [newsPerPage, setNewsPerPage] = useState(4);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = najnowsze, "asc" = najstarsze

  // Responsive helper
  // const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  const fetchData = async () => {
    setLoading(true);
    const res = await newsListAll();
    setNews([...res]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Wyciągnij unikalne kategorie i autorów
  const categoryOptions = Array.from(new Set(allNews.map(n => n.category).filter(Boolean)));
  const authorOptions = Array.from(new Set(allNews.map(n => n.author).filter(Boolean)));

  // Filtrowanie
  let filteredNews = allNews.filter(news => {
    let ok = true;
    if (filterCategory && filterCategory !== "ALL") ok = ok && news.category === filterCategory;
    if (filterAuthor && filterAuthor !== "ALL") ok = ok && news.author === filterAuthor;
    if (filterDateFrom) {
      const pubDate = news.publicationTime?.seconds ? new Date(news.publicationTime.seconds * 1000) : null;
      if (pubDate) ok = ok && pubDate >= new Date(filterDateFrom);
    }
    if (filterDateTo) {
      const pubDate = news.publicationTime?.seconds ? new Date(news.publicationTime.seconds * 1000) : null;
      if (pubDate) ok = ok && pubDate <= new Date(filterDateTo);
    }
    return ok;
  });

  // Sortowanie
  filteredNews = filteredNews.sort((a, b) => {
    const aDate = a.publicationTime?.seconds || 0;
    const bDate = b.publicationTime?.seconds || 0;
    return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
  });

  // Paginacja
  const totalPages = Math.max(1, Math.ceil(filteredNews.length / newsPerPage));
  const currentNews = filteredNews.slice(currentPage * newsPerPage, (currentPage + 1) * newsPerPage);

  // Reset paginacji przy zmianie filtrów
  useEffect(() => {
    setCurrentPage(0);
  }, [filterCategory, filterAuthor, filterDateFrom, filterDateTo, newsPerPage, sortOrder]);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const goToPage = (page) => setCurrentPage(page);

  const formatDate = (dateObj) => {
    if (!dateObj) return "";
    if (typeof dateObj === "object" && typeof dateObj.seconds === "number") {
      const date = new Date(dateObj.seconds * 1000);
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }
    return "";
  };

  function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }

  function handleResetFilters() {
    setFilterCategory("");
    setFilterAuthor("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSortOrder("desc");
  }

  return (
    <section id="news" className="py-5" style={{ background: "#f8f9fa" }}>
      <Container>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">Aktualności</h2>
        </div>
        <Card className="mb-4">
          <Card.Header className="d-flex align-items-center gap-2">
            <Filter size={20} className="me-2" />
            <span className="fw-semibold">Filtry aktualności</span>
            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-auto"
              onClick={() => setShowFilters((v) => !v)}
              aria-controls="filters-collapse"
              aria-expanded={showFilters}
            >
              <Filter size={16} className="me-1" />
              {showFilters ? "Ukryj filtry" : "Pokaż filtry"}
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </Card.Header>
          <Collapse in={showFilters}>
            <div id="filters-collapse">
              <Card.Body>
                <Row className="g-3 mb-3">
                  <Col md={3}>
                    <Form.Label>Kategoria</Form.Label>
                    <Form.Select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <option value="">Wszystkie</option>
                      {categoryOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label>Autor</Form.Label>
                    <Form.Select
                      value={filterAuthor}
                      onChange={e => setFilterAuthor(e.target.value)}
                    >
                      <option value="">Wszyscy</option>
                      {authorOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label>Data od</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterDateFrom}
                      onChange={e => setFilterDateFrom(e.target.value)}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label>Data do</Form.Label>
                    <Form.Control
                      type="date"
                      value={filterDateTo}
                      onChange={e => setFilterDateTo(e.target.value)}
                    />
                  </Col>
                </Row>
                <Row className="g-3 mb-3">
                  <Col md={3}>
                    <Form.Label>Postów na stronę</Form.Label>
                    <Form.Select
                      value={newsPerPage}
                      onChange={e => setNewsPerPage(Number(e.target.value))}
                    >
                      {[2, 4, 8, 12, 20].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={3}>
                    <Form.Label>Sortowanie</Form.Label>
                    <Form.Select
                      value={sortOrder}
                      onChange={e => setSortOrder(e.target.value)}
                    >
                      <option value="desc">Od najnowszych <SortDesc size={16} /></option>
                      <option value="asc">Od najstarszych <SortAsc size={16} /></option>
                    </Form.Select>
                  </Col>
                  <Col md={6} className="d-flex align-items-end justify-content-end gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={handleResetFilters}>
                      Resetuj filtry
                    </Button>
                    <div className="text-muted ms-2">
                      Wyświetlono {currentNews.length} z {filteredNews.length} postów
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </div>
          </Collapse>
        </Card>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <div className="mt-2 text-muted">Ładowanie aktualności...</div>
          </div>
        ) : (
          <>
            <Row xs={1} md={2} className="g-4 mb-4">
              {currentNews.map((news) => (
                <Col key={news.id}>
                  <Card className="h-100 shadow-sm" style={{ display: "flex", flexDirection: "column" }}>
                    <Link to={`/aktualnosci/${news.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16/9" }}>
                        <Card.Img
                          src={news.image?.[0]?.downloadURL || "https://via.placeholder.com/600x400?text=Brak+zdjęcia"}
                          alt={news.title}
                          style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        />
                        <Badge bg="primary" style={{ position: "absolute", top: 16, left: 16 }}>
                          {news.category}
                        </Badge>
                      </div>
                      <Card.Body style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", minHeight: 0 }}>
                        <Card.Title className="mb-2" style={{ fontSize: "1.2rem", minHeight: 45, fontWeight: 600 }}>
                          {news.title}
                        </Card.Title>
                        <Card.Text className="mb-3 text-muted" style={{ minHeight: 115, maxHeight: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {stripHtml(news.content).slice(0, 200)}...
                        </Card.Text>
                        <div
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 16,
                            padding: "0 1rem"
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "0.95em" }}>
                            <span className="d-flex align-items-center gap-1">
                              <User size={16} className="me-1" />
                              {news.author}
                            </span>
                            <span className="d-flex align-items-center gap-1">
                              <Calendar size={16} className="me-1" />
                              {formatDate(news.publicationTime)}
                            </span>
                          </div>
                        </div>
                      </Card.Body>
                    </Link>
                  </Card>
                </Col>
              ))}
            </Row>
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                  className="d-flex align-items-center"
                >
                  <ChevronLeft size={18} className="me-1" />
                  Nowsze
                </Button>
                <Pagination className="mb-0">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item
                      key={i}
                      active={currentPage === i}
                      onClick={() => goToPage(i)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                </Pagination>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages - 1}
                  className="d-flex align-items-center"
                >
                  Starsze
                  <ChevronRight size={18} className="ms-1" />
                </Button>
              </div>
            )}
            <div className="text-muted text-center mt-3">
              Wyświetlono {currentNews.length} z {filteredNews.length} postów
            </div>
          </>
        )}
      </Container>
    </section>
  );
}