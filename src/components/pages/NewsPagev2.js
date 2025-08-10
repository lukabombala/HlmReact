import { useState } from "react";
import { Card, Button, Badge, Row, Col, Container, Pagination } from "react-bootstrap";
import { Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";

export default function NewsSection() {
  const [currentPage, setCurrentPage] = useState(0);

  const allNews = [
    {
      id: 1,
      title: '1. Warszawska DH "Orlęta" obejmuje prowadzenie w lidze',
      excerpt: "Po spektakularnym zwycięstwie 4:1 nad 5. Poznańską DH \"Bobry\", drużyna z Warszawy umacnia swoją pozycję lidera Harcerskiej Ligi Mistrzów. Wszystkie zastępy pokazały doskonałą formę...",
      author: "Łukasz Kowalski",
      date: "2025-01-15",
      imageUrl: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=600&h=400&fit=crop",
      category: "Wyniki"
    },
    {
      id: 2,
      title: "Nowe zasady fair play w Harcerskiej Lidze Mistrzów",
      excerpt: "Komitet organizacyjny ogłosił wprowadzenie nowych zasad promujących fair play i wartości harcerskie. Zmiany mają na celu wzmocnienie ducha sportowej rywalizacji...",
      author: "Anna Nowak",
      date: "2025-01-12",
      imageUrl: "https://images.unsplash.com/photo-1594736797933-d0f06ba2fe65?w=600&h=400&fit=crop",
      category: "Regulamin"
    },
    {
      id: 3,
      title: '4. Olsztyńska DH "Ptaki" - comeback sezonu',
      excerpt: "Po trudnym początku sezonu, drużyna z Olsztyna pokazuje spektakularną formę. Seria trzech zwycięstw z rzędu wyniosła ich do fazy pucharowej turnieju...",
      author: "Michał Zieliński",
      date: "2025-01-10",
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
      category: "Analiza"
    },
    {
      id: 4,
      title: "Harcerska Liga Mistrzów przyciąga uwagę mediów",
      excerpt: "Coraz więcej stacji telewizyjnych i portali internetowych relacjonuje rozgrywki naszej ligi. To dowód na rosnącą popularność harcerskiego sportu w Polsce...",
      author: "Katarzyna Wiśniewska",
      date: "2025-01-08",
      imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&h=400&fit=crop",
      category: "Media"
    },
    {
      id: 5,
      title: '6. Katowicka DH "Lwy" z nowym drużynowym',
      excerpt: '6. Katowicka DH "Lwy" ogłosiła zmianę na stanowisku drużynowego. Nowy opiekun, hm. Robert Jankowski, ma pomóc drużynie w przygotowaniach do kolejnego sezonu...',
      author: "Piotr Jankowski",
      date: "2025-01-05",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
      category: "Transfery"
    },
    {
      id: 6,
      title: "Finał ligi odbędzie się w Warszawie",
      excerpt: "Komitet organizacyjny potwierdził, że wielki finał Harcerskiej Ligi Mistrzów odbędzie się na Stadionie Narodowym w Warszawie. To historyczny moment dla naszej ligi...",
      author: "Robert Malinowski",
      date: "2025-01-03",
      imageUrl: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&h=400&fit=crop",
      category: "Organizacja"
    },
    {
      id: 7,
      title: '2. Gdańska DH "Żubry" zdobywa brązowy medal',
      excerpt: '2. Gdańska DH "Żubry" po zaciętym meczu o 3. miejsce pokonała 4. Olsztyńską DH "Ptaki" 3:1. To pierwszy medal dla drużyny z Gdańska w historii turnieju...',
      author: "Tomasz Kowalczyk",
      date: "2025-01-01",
      imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&h=400&fit=crop",
      category: "Wyniki"
    },
    {
      id: 8,
      title: "Młodzi talenty w Harcerskiej Lidze",
      excerpt: "W tej edycji ligi po raz pierwszy mogą występować zawodnicy, którzy nie ukończyli jeszcze 16 lat. Młodzi harcerze pokazują niesamowity poziom...",
      author: "Agnieszka Lewandowska",
      date: "2024-12-28",
      imageUrl: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600&h=400&fit=crop",
      category: "Młodzież"
    }
  ];

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
              <Card className="h-100 shadow-sm">
                <div style={{ position: "relative", overflow: "hidden", aspectRatio: "16/9" }}>
                  <Card.Img
                    src={news.imageUrl}
                    alt={news.title}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                  <Badge bg="primary" style={{ position: "absolute", top: 16, left: 16 }}>
                    {news.category}
                  </Badge>
                </div>
                <Card.Body>
                  <Card.Title className="mb-2" style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                    {news.title}
                  </Card.Title>
                  <Card.Text className="mb-3 text-muted" style={{ minHeight: 60 }}>
                    {news.excerpt}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: "0.95em" }}>
                    <span className="d-flex align-items-center gap-1">
                      <User size={16} className="me-1" />
                      {news.author}
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <Calendar size={16} className="me-1" />
                      {formatDate(news.date)}
                    </span>
                  </div>
                </Card.Body>
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