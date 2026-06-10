import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./style.scss";

function CategorySection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <section className="category-section">
      <div className="container">
        <h2>Danh mục nổi bật</h2>

        <div className="category-grid">
          {categories.map((item) => (
            <Link
              key={item.category_id}
              to={`/category/${item.slug}`}
              className="category-card"
            >
              <div className="category-content">
                <h3>{item.category_name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;