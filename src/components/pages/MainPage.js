import JednostkiList from "../views/JednostkiList.js";
import NewsSection from "./NewsPagev2.js";
import MainBanner from "./MainBanner.js";

function MainPage() {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8f9fa" 
        }}
      >
        <MainBanner />
        <NewsSection />
      </div>
    )
}

export default MainPage