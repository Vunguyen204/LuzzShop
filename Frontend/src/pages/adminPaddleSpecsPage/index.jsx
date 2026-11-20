import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminButton from "../../components/adminButton";
import { createPaddleSpec, getApiError, listPaddleSpecs } from "../../api/paddleSpecApi";
import {
  CONFIDENCE_LABELS, VERIFICATION_STATUS_LABELS,
  radarStatusLabel, statusLabel,
} from "../../config/paddleSpecs";
import "./style.scss";

const imageUrl = (path) => path ? `http://localhost:5000${path}` : "/images/no-image.png";

const AdminPaddleSpecsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [creatingId, setCreatingId] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError("");
    try { setItems(await listPaddleSpecs()); }
    catch (requestError) { setError(getApiError(requestError, "Không thể tải danh sách thông số vợt.")); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => items.filter((item) => {
    const current = item.verification_status || "NONE";
    return item.product_name.toLowerCase().includes(search.trim().toLowerCase()) && (status === "ALL" || current === status);
  }), [items, search, status]);

  const openItem = async (item) => {
    if (item.paddle_spec_id) return navigate(`/admin/paddle-specs/${item.product_id}`);
    setCreatingId(item.product_id);
    setError("");
    try {
      await createPaddleSpec(item.product_id);
      navigate(`/admin/paddle-specs/${item.product_id}`);
    } catch (requestError) {
      setError(getApiError(requestError, "Không thể tạo hồ sơ thông số vợt."));
    } finally { setCreatingId(null); }
  };

  const verifiedCount = items.filter((item) => item.quality?.technical_verified).length;
  const eligibleCount = items.filter((item) => item.quality?.recommendation_eligible).length;
  const readyCount = items.filter((item) => item.quality?.finder_ready).length;

  return (
    <section className="admin-paddles">
      <header className="admin-paddles__header"><div><h2>Thông số vợt</h2><p>Quản lý dữ liệu kỹ thuật có kiểm chứng. Radar là đánh giá bổ sung và không bắt buộc để tham gia tư vấn.</p></div></header>

      <div className="admin-paddles__stats">
        <article><span>Tổng sản phẩm vợt</span><strong>{items.length}</strong></article>
        <article><span>Chưa có hồ sơ</span><strong>{items.filter((item) => !item.paddle_spec_id).length}</strong></article>
        <article><span>Đã xác minh kỹ thuật</span><strong>{verifiedCount}</strong></article>
        <article><span>Đủ điều kiện tư vấn</span><strong>{eligibleCount}</strong></article>
        <article className="admin-paddles__ready"><span>Finder sẵn sàng</span><strong>{readyCount}</strong></article>
      </div>

      <div className="admin-paddles__toolbar">
        <label><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><span className="admin-visually-hidden">Tìm theo tên sản phẩm</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm..." /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái thông số">
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(VERIFICATION_STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
        <AdminButton variant="ghost" icon="fa-rotate-left" onClick={() => { setSearch(""); setStatus("ALL"); }}>Xóa bộ lọc</AdminButton>
      </div>

      {error && <div className="admin-paddles__alert" role="alert"><span>{error}</span><AdminButton size="sm" variant="secondary" icon="fa-rotate-right" onClick={load}>Thử lại</AdminButton></div>}

      <div className="admin-paddles__table-wrap">
        {loading ? <div className="admin-paddles__state" role="status"><i className="fa-solid fa-spinner fa-spin" /> Đang tải dữ liệu...</div> : filtered.length === 0 ? (
          <div className="admin-paddles__state"><i className="fa-regular fa-folder-open" /><h3>Không có sản phẩm phù hợp</h3><p>Thay đổi từ khóa hoặc bộ lọc trạng thái.</p></div>
        ) : <table className="admin-paddles__table">
          <thead><tr><th>Sản phẩm</th><th>Trạng thái kỹ thuật</th><th>Độ đầy đủ</th><th>Độ phủ bằng chứng</th><th>Tư vấn</th><th>Radar</th><th>Finder</th><th>Thao tác</th></tr></thead>
          <tbody>{filtered.map((item) => {
            const state = item.verification_status || "NONE";
            const quality = item.quality || {};
            const completeness = Number(quality.technical_completeness ?? quality.completeness ?? item.data_completeness ?? 0);
            const evidence = Number(quality.technical_evidence_coverage ?? 0);
            return <tr key={item.product_id}>
              <td><div className="admin-paddles__product"><img src={imageUrl(item.image_url)} alt="" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} /><div><strong>{item.product_name}</strong><span>{item.brand_name || "Chưa có thương hiệu"} · {item.sku || `#${item.product_id}`}</span><small>{Number(item.price).toLocaleString("vi-VN")}đ · Tồn {Number(item.total_stock || 0)}</small></div></div></td>
              <td><span className={`paddle-status paddle-status--${state.toLowerCase()}`}>{statusLabel(state)}</span></td>
              <td><div className="paddle-progress"><div><span style={{ width: `${Math.min(completeness, 100)}%` }} /></div><strong>{completeness.toFixed(0)}%</strong></div></td>
              <td><div className="paddle-progress paddle-progress--evidence"><div><span style={{ width: `${Math.min(evidence, 100)}%` }} /></div><strong>{evidence.toFixed(0)}%</strong></div></td>
              <td><span className={`paddle-ready ${quality.recommendation_eligible ? "is-ready" : ""}`}><i className={`fa-solid ${quality.recommendation_eligible ? "fa-circle-check" : "fa-circle-minus"}`} /> {quality.recommendation_eligible ? "Đủ điều kiện" : "Chưa đủ"}</span></td>
              <td><span className={`paddle-radar-state ${quality.radar_ready ? "is-ready" : ""}`}>{radarStatusLabel(quality.radar_status)}<small>{Number(quality.radar_coverage || 0).toFixed(0)}% · {CONFIDENCE_LABELS[quality.radar_confidence] || "Chưa có dữ liệu"}</small></span></td>
              <td><span className={`paddle-ready ${quality.finder_ready ? "is-ready" : ""}`}><i className={`fa-solid ${quality.finder_ready ? "fa-circle-check" : "fa-circle-minus"}`} /> {quality.finder_ready ? "Sẵn sàng" : "Chưa sẵn sàng"}</span></td>
              <td><AdminButton size="sm" variant={item.paddle_spec_id ? "secondary" : "primary"} icon={item.paddle_spec_id ? "fa-pen-to-square" : "fa-plus"} loading={creatingId === item.product_id} onClick={() => openItem(item)}>{item.paddle_spec_id ? "Mở hồ sơ" : "Tạo hồ sơ"}</AdminButton></td>
            </tr>;
          })}</tbody>
        </table>}
      </div>
    </section>
  );
};

export default AdminPaddleSpecsPage;
