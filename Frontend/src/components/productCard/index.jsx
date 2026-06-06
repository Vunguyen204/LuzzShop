import "./style.scss";

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <h3>{product.product_name}</h3>
      <p>{product.description}</p>
      <p className="price">
        {Number(product.price).toLocaleString()} VNĐ
      </p>
    </div>
  );
}

export default ProductCard;