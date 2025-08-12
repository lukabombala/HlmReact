import { useState, useEffect} from "react";
import { Link } from "react-router-dom";
import { Card, Button, Badge, Row, Col, Container, Pagination } from "react-bootstrap";
import { Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";

import { newsListAll} from '../../services/newsList.mjs'

export default function NewsSection() {
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allNews, setNews] = useState([])

  const fetchData = async () => {
      setLoading(true)

      const res = await newsListAll()

      setNews([...res])
      setLoading(false)
  }

  useEffect(() => {
      fetchData()
  }, [])

  const newsPerPage = 4;
  const totalPages = Math.ceil(allNews.length / newsPerPage);
  const currentNews = allNews.slice(currentPage * newsPerPage, (currentPage + 1) * newsPerPage);

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 0));
  const goToPage = (page) => setCurrentPage(page);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <section id="news" className="py-5" style={{ background: "#f8f9fa" }}>
      <Container>
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-2">Aktualności</h2>
          <p className="text-muted">
            Najnowsze wiadomości z Harcerskiej Ligi Mistrzów
          </p>
        </div>
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
            <div dangerouslySetInnerHTML={{
              __html: news.content && news.content.length > 215
                ? news.content.slice(0, 215) + "..."
                : news.content
            }} />
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
      </Container>
    </section>
  );
}