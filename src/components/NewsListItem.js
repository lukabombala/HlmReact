function NewsListItem(props) {
    const news = props.news

    return (
        <li key={news.id}>
            <h3>{news.title}</h3>
        </li>
    )
}

export default NewsListItem