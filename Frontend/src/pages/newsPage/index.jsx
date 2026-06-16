import { memo } from "react";
import "./style.scss";
import Breadcrumb from "../../components/Breadcrumb";

const newsList = [
  {
    id: 1,
    title: "Pickleball là gì? Vì sao môn thể thao này ngày càng phổ biến?",
    desc: "Tìm hiểu về Pickleball, luật chơi cơ bản và lý do môn thể thao này được nhiều người yêu thích.",
    image: "/images/news/news-1.png",
    date: "16/06/2026",
  },
  {
    id: 2,
    title: "Cách chọn vợt Pickleball phù hợp cho người mới bắt đầu",
    desc: "Gợi ý cách chọn vợt theo trọng lượng, chất liệu, độ dày và phong cách chơi.",
    image: "/images/news/news-2.png",
    date: "16/06/2026",
  },
  {
    id: 3,
    title: "Top phụ kiện cần có khi chơi Pickleball",
    desc: "Những phụ kiện cần thiết giúp bạn chơi Pickleball thoải mái và hiệu quả hơn.",
    image: "/images/news/news-3.png",
    date: "16/06/2026",
  },
];

const NewsPage = () => {
  return (
    <div className="news-page">
      <Breadcrumb />
      <div className="container">
        <h2>Tin tức</h2>

        <div className="news-grid">
          {newsList.map((item) => (
            <div className="news-card" key={item.id}>
              <img src={item.image} alt={item.title} />

              <div className="news-card__content">
                <span>{item.date}</span>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <button>Xem thêm</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(NewsPage);
