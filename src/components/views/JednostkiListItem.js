function JednostkiListItem(props) {
    const jednostka = props.jednostka

    return (
        <li key={jednostka.id}>
            <h3>{jednostka.fullName}</h3>
        </li>
    )
}

export default JednostkiListItem