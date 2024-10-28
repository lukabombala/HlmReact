import { Button } from "react-bootstrap";
import MenuBar from '../views/JednostkiList.js'
import JednostkiList from "../views/JednostkiList.js";

function MainPage() {
    return (
      <div>
        <h1>Strona Glowna</h1>
          <JednostkiList/>
      </div>
    )
  }
  
  export default MainPage