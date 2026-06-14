function ProductFilter({
  categories,
  brands,
  selectedCategories,
  setSelectedCategories,
  selectedBrands,
  setSelectedBrands,
  selectedPrices,
  setSelectedPrices,
  selectedDiscounts,
  setSelectedDiscounts,
  setSortType,
  showDiscountFilter = false,
}) {
  const discountRanges = [
    { value: "under20", label: "Dưới 20%" },
    { value: "20to40", label: "20% - 40%" },
    { value: "40to60", label: "40% - 60%" },
    { value: "above60", label: "Trên 60%" },
  ];

  const handleCheckboxChange = (value, selectedList, setSelectedList) => {
    if (selectedList.includes(value)) {
      setSelectedList(selectedList.filter((item) => item !== value));
    } else {
      setSelectedList([...selectedList, value]);
    }
  };

  const getPriceLabel = (price) => {
    switch (price) {
      case "under500":
        return "Giá dưới 500.000đ";
      case "500to1m":
        return "500.000đ - 1 triệu";
      case "1to2m":
        return "1 - 2 triệu";
      case "2to3m":
        return "2 - 3 triệu";
      case "above3m":
        return "Giá trên 3 triệu";
      default:
        return "";
    }
  };

  const getDiscountLabel = (discountValue) => {
    const discount = discountRanges.find(
      (item) => item.value === discountValue,
    );

    return discount ? discount.label : "";
  };

  return (
    <aside className="filter-sidebar">
      <div className="filter-box">
        {(selectedPrices.length > 0 ||
          selectedBrands.length > 0 ||
          selectedCategories.length > 0 ||
          selectedDiscounts.length > 0) && (
          <div className="selected-filters">
            <div className="selected-filters__header">
              <h3>Bạn chọn</h3>

              <button
                className="reset-filter"
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedBrands([]);
                  setSelectedPrices([]);
                  setSelectedDiscounts([]);
                  setSortType("default");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>

            <div className="selected-tags">
              {selectedDiscounts.map((discount) => (
                <span
                  key={discount}
                  className="filter-tag"
                  onClick={() =>
                    setSelectedDiscounts(
                      selectedDiscounts.filter((item) => item !== discount),
                    )
                  }
                >
                  × {getDiscountLabel(discount)}
                </span>
              ))}

              {selectedPrices.map((price) => (
                <span
                  key={price}
                  className="filter-tag"
                  onClick={() =>
                    setSelectedPrices(
                      selectedPrices.filter((item) => item !== price),
                    )
                  }
                >
                  × {getPriceLabel(price)}
                </span>
              ))}

              {selectedBrands.map((brandId) => {
                const brand = brands.find(
                  (b) => Number(b.brand_id) === Number(brandId),
                );

                return (
                  <span
                    key={brandId}
                    className="filter-tag"
                    onClick={() =>
                      setSelectedBrands(
                        selectedBrands.filter((id) => id !== brandId),
                      )
                    }
                  >
                    × {brand?.brand_name}
                  </span>
                );
              })}

              {selectedCategories.map((categoryId) => {
                const category = categories.find(
                  (c) => Number(c.category_id) === Number(categoryId),
                );

                return (
                  <span
                    key={categoryId}
                    className="filter-tag"
                    onClick={() =>
                      setSelectedCategories(
                        selectedCategories.filter((id) => id !== categoryId),
                      )
                    }
                  >
                    × {category?.category_name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <h3>DANH MỤC</h3>

        {categories.map((category) => (
          <label key={category.category_id}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(
                Number(category.category_id),
              )}
              onChange={() =>
                handleCheckboxChange(
                  Number(category.category_id),
                  selectedCategories,
                  setSelectedCategories,
                )
              }
            />
            {category.category_name}
          </label>
        ))}
      </div>

      {showDiscountFilter && (
        <div className="filter-box">
          <h3>MỨC GIẢM GIÁ</h3>

          {discountRanges.map((discount) => (
            <label key={discount.value}>
              <input
                type="checkbox"
                checked={selectedDiscounts.includes(discount.value)}
                onChange={() =>
                  handleCheckboxChange(
                    discount.value,
                    selectedDiscounts,
                    setSelectedDiscounts,
                  )
                }
              />
              {discount.label}
            </label>
          ))}
        </div>
      )}

      <div className="filter-box">
        <h3>CHỌN MỨC GIÁ</h3>

        {[
          ["under500", "Giá dưới 500.000đ"],
          ["500to1m", "500.000đ - 1 triệu"],
          ["1to2m", "1 - 2 triệu"],
          ["2to3m", "2 - 3 triệu"],
          ["above3m", "Giá trên 3 triệu"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={selectedPrices.includes(value)}
              onChange={() =>
                handleCheckboxChange(value, selectedPrices, setSelectedPrices)
              }
            />
            {label}
          </label>
        ))}
      </div>

      <div className="filter-box">
        <h3>THƯƠNG HIỆU</h3>

        {brands.map((brand) => (
          <label key={brand.brand_id}>
            <input
              type="checkbox"
              checked={selectedBrands.includes(Number(brand.brand_id))}
              onChange={() =>
                handleCheckboxChange(
                  Number(brand.brand_id),
                  selectedBrands,
                  setSelectedBrands,
                )
              }
            />
            {brand.brand_name}
          </label>
        ))}
      </div>
    </aside>
  );
}

export default ProductFilter;
