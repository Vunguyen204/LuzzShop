import Header from "../../components/Header";
import Banner from "../../components/banner";
// import CategorySection from "../../components/categorySection";
import ProductSection from "../../components/productSection";
import Footer from "../../components/footer";

function HomePage() {
  return (
    <>
      <Header />
      <Banner />
      {/* <CategorySection /> */}
      <ProductSection />
      <Footer />
    </>
  );
}

export default HomePage;