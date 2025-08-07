import React from 'react';
import { useState, useEffect } from 'react'
import { newsListAll} from '../../services/newsList.mjs'
import NewsListItem from '../NewsListItem';
import { Col } from 'react-bootstrap';

function NewsPage() {
  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState([])

  const fetchData = async () => {
      setLoading(true)

      const res = await newsListAll()

      setNews([...res])
      setLoading(false)
  }

  useEffect(() => {
      fetchData()
  }, [])

  return (
      <div style={{marginTop: "7rem"}}>
          <header>
              <h2>Aktualnosci</h2>
          </header>

          { loading && 
              <p>ladowanie...</p>
          }

          <Col>
          {news.length > 0 && news.map(news => (
              <NewsListItem news={news}/>
          ))}
          </Col>
      </div>
  )
}

  
export default NewsPage;