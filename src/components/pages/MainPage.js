import JednostkiList from "../views/JednostkiList.js";
import NewsSection from "./NewsPagev2.js";
import MainBanner from "./MainBanner.js";

function MainPage() {
    return (
      <div
      style={{marginTop: "3rem"}}>
        <MainBanner />
        <NewsSection />
      </div>
    )
  }
  
  export default MainPage