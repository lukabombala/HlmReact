import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import { Row } from 'react-bootstrap';

function NewsListItem(props) {
    const news = props.news

    return (
        <Row>
            <Container key={news.id}>
                <h3>{news.title}</h3>
                
            </Container>   
        </Row>
    )
}

export default NewsListItem