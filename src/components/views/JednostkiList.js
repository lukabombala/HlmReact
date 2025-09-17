import { useState, useEffect } from 'react'
import { jednostkiListAll} from '../../services/jednostkiList.mjs'
import JednostkiListItem from './JednostkiListItem.js'

function JednostkiList() {
    const [loading, setLoading] = useState(false)
    const [jednostki, setJednostki] = useState([])

    const fetchData = async () => {
        setLoading(true)

        const res = await jednostkiListAll()

        setJednostki([...res])
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <section>
            <header>
                <h2>Jednostki</h2>
            </header>

            { loading && 
                <p>ladowanie...</p>
            }

            <ul>
            {jednostki.length > 0 && jednostki.map(jednostka => (
                <JednostkiListItem jednostka={jednostka}/>
            ))}
            </ul>
        </section>
    )
}

export default JednostkiList