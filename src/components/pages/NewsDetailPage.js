import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Container, Card, Badge, Spinner, Button } from "react-bootstrap";
import { Calendar, User, ChevronLeft } from "lucide-react";
import { newsListAll } from "../../services/newsList.mjs";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsListAll().then((all) => {
      const found = all.find((n) => n.id === id);
      setNews(found);
      setLoading(false);
    });
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (!news) {
    return (
      <Container className="py-5 text-center">
        <h2>Nie znaleziono aktualności</h2>
        <Button as={Link} to="/" variant="primary" className="mt-3">
          <ChevronLeft size={18} className="me-1" />
          Powrót do aktualności
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-5" style={{ maxWidth: 800 }}>
      <Button as={Link} to="/" variant="outline-primary" className="mb-4">
        <ChevronLeft size={18} className="me-1" />
        Powrót do aktualności
      </Button>
      <Card className="shadow">
        <div style={{ width: "100%", height: 320, overflow: "hidden", position: "relative" }}>
          <Card.Img
            src={news.image?.[0]?.downloadURL || "https://via.placeholder.com/800x400?text=Brak+zdjęcia"}
            alt={news.title}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
          {news.category && (
            <Badge bg="primary" style={{ position: "absolute", top: 16, left: 16 }}>
              {news.category}
            </Badge>
          )}
        </div>
        <Card.Body>
          <Card.Title className="mb-3" style={{ fontSize: "2rem", fontWeight: 700 }}>
            {news.title}
          </Card.Title>
          <div className="d-flex justify-content-between align-items-center text-muted mb-4" style={{ fontSize: "1em" }}>
            <span className="d-flex align-items-center gap-1">
              <User size={18} className="me-1" />
              {news.author}
            </span>
            <span className="d-flex align-items-center gap-1">
              <Calendar size={18} className="me-1" />
              {formatDate(news.publicationTime)}
            </span>
          </div>
          <div style={{ fontSize: "1.1rem" }}>
            {/* Jeśli content jest HTML-em */}
            {news.content
              ? <div dangerouslySetInnerHTML={{ __html: news.content }} />
              : <div className="text-muted">Brak treści</div>
            }
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}