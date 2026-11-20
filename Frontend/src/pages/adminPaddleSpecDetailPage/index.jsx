import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminButton from "../../components/adminButton";
import PaddleRadarChart from "../../components/paddleRadarChart";
import {
  addPaddleSource, confirmPaddleSpec, deletePaddleSource, getApiError, getPaddleSpec,
  reviewPaddleSource, reviewPaddleSpec, submitPaddleSpec, updatePaddleScores,
  updatePaddleSource, updatePaddleTechnical,
} from "../../api/paddleSpecApi";
import {
  BAND_LABELS, BREAKDOWN_LABELS, CONFIDENCE_LABELS, EMPTY_VALUE_LABEL, METHOD_LABELS,
  RADAR_AXES, RADAR_SCORE_OPTIONS, SCORE_TO_BAND, SHAPE_LABELS,
  SOURCE_TYPE_LABELS, TECHNICAL_FIELD_KEYS, TECHNICAL_FIELDS, TECHNICAL_GROUPS,
  buildRadarPayload, createEmptyScores, createEmptyTechnical,
  fieldLabel, isTechnicalSource, missingLabel, radarStatusLabel, sourceStatusLabel,
  statusLabel, validateRadarScores,
} from "../../config/paddleSpecs";
import "./style.scss";

const emptySource = () => ({
  source_type: "MANUFACTURER", source_title: "", source_locator: "", publisher: "",
  published_at: "", accessed_at: new Date().toISOString().slice(0, 16), supported_fields: [],
  evidence_note: "", is_primary: false,
});

const ALL_SUPPORTED_FIELDS = [...TECHNICAL_FIELD_KEYS, ...RADAR_AXES.map(({ key }) => `${key}_score`)];

const InfoTip = ({ text }) => text ? (
  <span className="paddle-info" title={text} aria-label={text} tabIndex="0">
    <i className="fa-solid fa-circle-info" aria-hidden="true" />
  </span>
) : null;

const BooleanState = ({ value, yes, no }) => (
  <span className={`paddle-boolean ${value ? "is-positive" : ""}`}>
    <i className={`fa-solid ${value ? "fa-circle-check" : "fa-circle-minus"}`} aria-hidden="true" />
    {value ? yes : no}
  </span>
);

const AdminPaddleSpecDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [technical, setTechnical] = useState(createEmptyTechnical);
  const [scores, setScores] = useState(createEmptyScores);
  const [activeTab, setActiveTab] = useState("technical");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sourceForm, setSourceForm] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  const hydrate = useCallback((data) => {
    setDetail(data);
    if (!data.spec) return;
    setTechnical(Object.fromEntries(TECHNICAL_FIELD_KEYS.map((key) => [key, data.spec[key] ?? ""])));
    const rationale = data.spec.score_rationale || {};
    setScores(Object.fromEntries(RADAR_AXES.map(({ key }) => [key, {
      score: data.spec[`${key}_score`] ?? "",
      reason: rationale[key]?.reason || "",
      sourceIds: rationale[key]?.sourceIds || [],
      method: rationale[key]?.method || "",
      confidence: rationale[key]?.confidence || "",
      limitations: rationale[key]?.limitations || "",
    }])));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { hydrate(await getPaddleSpec(productId)); }
    catch (requestError) { setError(getApiError(requestError, "Không thể tải hồ sơ thông số vợt.")); }
    finally { setLoading(false); }
  }, [hydrate, productId]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const mutate = async (key, action, success) => {
    setSaving(key);
    setError("");
    setNotice("");
    try {
      await action();
      const fresh = await getPaddleSpec(productId);
      hydrate(fresh);
      setNotice(success);
      return true;
    } catch (requestError) {
      setError(getApiError(requestError, "Không thể hoàn tất thao tác."));
      return false;
    } finally { setSaving(""); }
  };

  const saveTechnical = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(TECHNICAL_FIELDS.map(({ key, type }) => {
      const value = technical[key];
      if (value === "") return [key, null];
      return [key, type === "number" ? Number(value) : value];
    }));
    mutate("technical", () => updatePaddleTechnical(productId, payload), "Đã lưu thông số và tải lại trạng thái xác minh từ hệ thống.");
  };

  const saveScores = (event) => {
    event.preventDefault();
    const validationErrors = validateRadarScores(scores);
    if (validationErrors.length) {
      setNotice("");
      setError(validationErrors.join(" "));
      return;
    }
    mutate("scores", () => updatePaddleScores(productId, buildRadarPayload(scores)), "Đã lưu đánh giá Radar v1.1. Xác minh kỹ thuật không phụ thuộc Radar.");
  };

  const setAxis = (axis, patch) => setScores((current) => ({ ...current, [axis]: { ...current[axis], ...patch } }));
  const clearAxis = (axis) => setScores((current) => ({ ...current, [axis]: createEmptyScores()[axis] }));
  const verifiedSources = useMemo(() => detail?.sources?.filter((source) => source.verification_status === "VERIFIED") || [], [detail]);
  const axisSources = (axis) => verifiedSources.filter((source) => source.supported_fields.includes(`${axis}_score`));

  const openSource = (source = null) => setSourceForm(source ? {
    ...source,
    id: source.paddle_spec_source_id,
    published_at: source.published_at?.slice(0, 10) || "",
    accessed_at: source.accessed_at ? new Date(source.accessed_at).toISOString().slice(0, 16) : "",
  } : emptySource());

  const saveSource = async (event) => {
    event.preventDefault();
    const { id } = sourceForm;
    const payload = {
      source_type: sourceForm.source_type,
      source_title: sourceForm.source_title,
      source_locator: sourceForm.source_locator,
      publisher: sourceForm.publisher || null,
      published_at: sourceForm.published_at || null,
      accessed_at: new Date(sourceForm.accessed_at).toISOString(),
      supported_fields: sourceForm.supported_fields,
      evidence_note: sourceForm.evidence_note || null,
      is_primary: Boolean(sourceForm.is_primary),
    };
    const technicalImpact = isTechnicalSource(sourceForm);
    const ok = await mutate("source", () => id
      ? updatePaddleSource(productId, id, payload)
      : addPaddleSource(productId, payload), technicalImpact
      ? "Đã lưu nguồn kỹ thuật. Trạng thái xác minh đã được tải lại từ hệ thống."
      : "Đã lưu nguồn Radar. Nguồn này không tự hủy xác minh kỹ thuật.");
    if (ok) setSourceForm(null);
  };

  if (loading) return <div className="paddle-detail-state" role="status"><i className="fa-solid fa-spinner fa-spin" /> Đang tải hồ sơ thông số...</div>;
  if (!detail) return <div className="paddle-detail-state"><p>{error || "Không tìm thấy hồ sơ."}</p><AdminButton onClick={() => navigate("/admin/paddle-specs")}>Quay lại</AdminButton></div>;

  const { product, spec, sources, quality } = detail;
  const canConfirm = Boolean(quality.technical_evidence?.can_confirm);
  const legacyRadar = spec.rubric_version === "v1.0" && RADAR_AXES.some(({ key }) => spec[`${key}_score`] != null);
  const tabs = [
    ["technical", "fa-ruler-combined", "Thông số kỹ thuật"],
    ["sources", "fa-link", `Nguồn (${sources.length})`],
    ["review", "fa-clipboard-check", "Xác minh & tư vấn"],
    ["scores", "fa-chart-radar", "Radar tùy chọn"],
  ];

  return (
    <section className="paddle-detail">
      <div className="paddle-detail__top">
        <AdminButton variant="ghost" icon="fa-arrow-left" onClick={() => navigate("/admin/paddle-specs")}>Danh sách</AdminButton>
        <span className={`paddle-status paddle-status--${spec.verification_status.toLowerCase()}`}>{statusLabel(spec.verification_status)}</span>
      </div>

      <header className="paddle-detail__hero">
        <div><span>Hồ sơ #{spec.paddle_spec_id} · SKU {product.sku || "Chưa có dữ liệu"}</span><h2>{product.product_name}</h2><p>{product.brand_name || "Chưa có thương hiệu"} · Cập nhật {spec.updated_at ? new Date(spec.updated_at).toLocaleString("vi-VN") : EMPTY_VALUE_LABEL}</p></div>
        <div className="paddle-detail__meter"><strong>{Number(quality.technical_completeness ?? quality.completeness ?? 0).toFixed(0)}%</strong><span>Độ đầy đủ kỹ thuật</span><div><i style={{ width: `${Math.min(Number(quality.technical_completeness ?? quality.completeness ?? 0), 100)}%` }} /></div></div>
      </header>

      {error && <div className="paddle-message paddle-message--error" role="alert"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}
      {notice && <div className="paddle-message paddle-message--success" role="status"><i className="fa-solid fa-circle-check" /> {notice}</div>}

      <nav className="paddle-detail__tabs" aria-label="Các phần hồ sơ">
        {tabs.map(([key, icon, label]) => <button key={key} type="button" className={activeTab === key ? "is-active" : ""} onClick={() => setActiveTab(key)}><i className={`fa-solid ${icon}`} />{label}</button>)}
      </nav>

      {activeTab === "technical" && <form className="paddle-panel" onSubmit={saveTechnical}>
        <div className="paddle-panel__heading"><div><h3>Thông số kỹ thuật có kiểm chứng</h3><p>Chỉ nhập giá trị xuất hiện trong nguồn. Trường chưa biết để trống; hệ thống không tự điền hoặc suy đoán.</p></div><AdminButton type="submit" variant="primary" icon="fa-floppy-disk" loading={saving === "technical"}>Lưu thông số</AdminButton></div>
        <div className="paddle-technical-groups">
          {TECHNICAL_GROUPS.map((group) => <section className="paddle-field-group" key={group.key}><header><h4>{group.title}</h4><p>{group.description}</p></header><div className="paddle-form-grid">
            {group.fields.map((field) => <label key={field.key}><span>{field.label}<InfoTip text={field.tooltip} /></span>{field.type === "shape" ? (
              <select value={technical[field.key]} onChange={(event) => setTechnical({ ...technical, [field.key]: event.target.value })}><option value="">{EMPTY_VALUE_LABEL}</option>{Object.entries(SHAPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
            ) : field.type === "number" ? (
              <div className="paddle-input-unit"><input type="number" min="0" step="0.01" value={technical[field.key]} onChange={(event) => setTechnical({ ...technical, [field.key]: event.target.value })} placeholder={EMPTY_VALUE_LABEL} />{field.unit && <b>{field.unit}</b>}</div>
            ) : <input type="text" maxLength="255" value={technical[field.key]} onChange={(event) => setTechnical({ ...technical, [field.key]: event.target.value })} placeholder={EMPTY_VALUE_LABEL} />}</label>)}
          </div></section>)}
        </div>
      </form>}

      {activeTab === "sources" && <div className="paddle-panel">
        <div className="paddle-panel__heading"><div><h3>Nguồn kiểm chứng</h3><p>Nguồn hỗ trợ thông số kỹ thuật có thể làm thay đổi trạng thái xác minh. Nguồn chỉ hỗ trợ Radar không hủy xác minh kỹ thuật.</p></div><AdminButton variant="primary" icon="fa-plus" onClick={() => openSource()}>Thêm nguồn</AdminButton></div>
        {sources.length === 0 ? <div className="paddle-empty"><i className="fa-solid fa-link-slash" /><h4>Chưa có nguồn</h4><p>Thêm và xác minh nguồn trước khi xác nhận thông số kỹ thuật.</p></div> : <div className="paddle-sources">{sources.map((source) => {
          const technicalSource = isTechnicalSource(source);
          return <article key={source.paddle_spec_source_id}><div className="paddle-sources__head"><div><span>{SOURCE_TYPE_LABELS[source.source_type] || "Loại nguồn chưa xác định"}{source.is_primary ? " · Nguồn chính" : ""}</span><h4>{source.source_title}</h4></div><span className={`paddle-status paddle-status--${source.verification_status.toLowerCase()}`}>{sourceStatusLabel(source.verification_status)}</span></div><a href={source.source_locator} target="_blank" rel="noreferrer">{source.source_locator} <i className="fa-solid fa-arrow-up-right-from-square" /></a><p>{source.evidence_note || "Chưa có ghi chú bằng chứng."}</p><p className="paddle-sources__impact"><i className={`fa-solid ${technicalSource ? "fa-shield-halved" : "fa-chart-radar"}`} /> {technicalSource ? "Nguồn kỹ thuật — thay đổi có thể hủy hiệu lực xác nhận" : "Nguồn Radar — không chi phối xác minh kỹ thuật"}</p><div className="paddle-sources__fields">{source.supported_fields.map((field) => <span key={field}>{fieldLabel(field)}</span>)}</div><div className="paddle-sources__actions"><AdminButton size="sm" icon="fa-pen" onClick={() => openSource(source)}>Sửa</AdminButton>{source.verification_status !== "VERIFIED" && <AdminButton size="sm" variant="primary" icon="fa-check" loading={saving === `verify-source-${source.paddle_spec_source_id}`} onClick={() => mutate(`verify-source-${source.paddle_spec_source_id}`, () => reviewPaddleSource(productId, source.paddle_spec_source_id, { decision: "VERIFIED" }), technicalSource ? "Đã xác minh nguồn kỹ thuật và tải lại trạng thái hồ sơ." : "Đã xác minh nguồn Radar; xác minh kỹ thuật được giữ độc lập.")}>Xác minh nguồn</AdminButton>}{source.verification_status !== "REJECTED" && <AdminButton size="sm" variant="danger" icon="fa-ban" onClick={() => { const note = window.prompt("Nhập lý do từ chối nguồn:"); if (note && window.confirm("Xác nhận từ chối nguồn này?")) mutate(`reject-source-${source.paddle_spec_source_id}`, () => reviewPaddleSource(productId, source.paddle_spec_source_id, { decision: "REJECTED", review_note: note }), "Đã từ chối nguồn và tải lại trạng thái hồ sơ."); }}>Từ chối</AdminButton>}<AdminButton size="sm" variant="danger" icon="fa-trash" onClick={() => { if (window.confirm(`Xóa nguồn này? ${technicalSource ? "Thông số kỹ thuật có thể mất hiệu lực xác nhận." : "Đánh giá Radar liên quan có thể mất hiệu lực."}`)) mutate(`delete-source-${source.paddle_spec_source_id}`, () => deletePaddleSource(productId, source.paddle_spec_source_id), "Đã xóa nguồn và tải lại trạng thái hồ sơ."); }}>Xóa</AdminButton></div></article>;
        })}</div>}
      </div>}

      {activeTab === "review" && <div className="paddle-panel paddle-review">
        <div className="paddle-panel__heading"><div><h3>Xác minh và điều kiện tham gia tư vấn</h3><p>Xác minh kỹ thuật dựa trên bằng chứng của các trường đã nhập. Radar là lớp đánh giá tùy chọn, không chặn Recommendation hoặc Finder.</p></div></div>
        <div className="paddle-quality-grid">
          <article><span>Xác minh kỹ thuật</span><BooleanState value={quality.technical_verified} yes="Đã xác minh" no="Chưa xác minh" /><small>{statusLabel(spec.verification_status)}</small></article>
          <article><span>Độ đầy đủ kỹ thuật</span><strong>{Number(quality.technical_completeness ?? quality.completeness ?? 0).toFixed(0)}%</strong><small>Không phải ngưỡng bắt buộc 75%</small></article>
          <article><span>Độ phủ bằng chứng</span><strong>{Number(quality.technical_evidence_coverage ?? 0).toFixed(0)}%</strong><small>Cho các trường kỹ thuật đã nhập</small></article>
          <article><span>Tham gia tư vấn</span><BooleanState value={quality.recommendation_eligible} yes="Đủ điều kiện" no="Chưa đủ điều kiện" /><small>{quality.recommendation_policy?.status === "PROVISIONAL" ? "Chính sách đang thử nghiệm" : "Theo chính sách hiện hành"}</small></article>
          <article><span>Finder</span><BooleanState value={quality.finder_ready} yes="Sẵn sàng" no="Chưa sẵn sàng" /><small>Phụ thuộc giá, trạng thái và tồn kho</small></article>
          <article><span>Radar tùy chọn</span><BooleanState value={quality.radar_ready} yes="Sẵn sàng" no={radarStatusLabel(quality.radar_status)} /><small>{Number(quality.radar_coverage ?? 0).toFixed(0)}% · Độ tin cậy {CONFIDENCE_LABELS[quality.radar_confidence] || EMPTY_VALUE_LABEL}</small></article>
        </div>

        <div className="paddle-review__grid">
          <article className="paddle-confirm-card"><h4>Xác nhận thông số kỹ thuật</h4><p>Chỉ xác nhận khi mọi thông số đã nhập đều có nguồn hợp lệ hỗ trợ. Nhấn Lưu không tự xác nhận.</p><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Ghi chú xác nhận (tùy chọn)" /><AdminButton variant="primary" icon="fa-shield-check" loading={saving === "confirm"} disabled={!canConfirm} onClick={() => { if (window.confirm("Xác nhận các thông số kỹ thuật đã nhập có nguồn hợp lệ?")) mutate("confirm", () => confirmPaddleSpec(productId, { review_note: reviewNote.trim() || null }), "Đã xác nhận thông số kỹ thuật và tải lại trạng thái thực tế."); }}>{quality.technical_verified ? "Xác nhận lại thông số" : "Xác nhận thông số"}</AdminButton>{!canConfirm && <p className="paddle-confirm-card__hint">Hoàn tất các mục bằng chứng còn thiếu trước khi xác nhận.</p>}</article>
          <article className="paddle-review__missing"><h4>Các điều kiện còn thiếu</h4>{quality.missing?.length ? <ul>{quality.missing.map((item) => <li key={item}><i className="fa-solid fa-circle-exclamation" />{missingLabel(item)}</li>)}</ul> : <p><i className="fa-solid fa-circle-check" /> Không còn điều kiện thiếu theo policy hiện tại.</p>}<h4>Thành phần độ đầy đủ kỹ thuật</h4><div className="paddle-review__breakdown">{Object.entries(quality.breakdown || {}).map(([key, value]) => <div key={key}><span>{BREAKDOWN_LABELS[key] || key}</span><strong>{Number(value).toFixed(1)}</strong></div>)}</div></article>
        </div>

        <details className="paddle-legacy-review"><summary>Quy trình kiểm duyệt mở rộng</summary><p>Dùng khi cần tách bước nhập và duyệt trong tương lai. Quy trình một Admin không bắt buộc bước này.</p><div className="paddle-review__actions">{["DRAFT", "REJECTED"].includes(spec.verification_status) && <AdminButton icon="fa-paper-plane" loading={saving === "submit"} onClick={() => mutate("submit", () => submitPaddleSpec(productId), "Đã chuyển hồ sơ sang Chờ xác minh.")}>Gửi sang chờ xác minh</AdminButton>}{spec.verification_status === "IN_REVIEW" && <><AdminButton variant="primary" icon="fa-badge-check" loading={saving === "verify"} onClick={() => mutate("verify", () => reviewPaddleSpec(productId, { decision: "VERIFIED", review_note: reviewNote || null }), "Đã xác minh hồ sơ qua quy trình mở rộng.")}>Xác minh</AdminButton><AdminButton variant="danger" icon="fa-ban" loading={saving === "reject"} disabled={!reviewNote.trim()} onClick={() => { if (window.confirm("Xác nhận từ chối hồ sơ này?")) mutate("reject", () => reviewPaddleSpec(productId, { decision: "REJECTED", review_note: reviewNote.trim() }), "Đã từ chối hồ sơ."); }}>Từ chối</AdminButton></>}</div></details>
      </div>}

      {activeTab === "scores" && <form className="paddle-panel" onSubmit={saveScores}>
        <div className="paddle-panel__heading"><div><h3>Đánh giá Radar tùy chọn · Rubric v1.1</h3><p>Chỉ dùng các mốc 10/30/50/70/90. Điểm là đánh giá editorial dựa trên bằng chứng, không phải thông số đo trực tiếp và không quyết định xác minh kỹ thuật.</p></div><AdminButton type="submit" variant="primary" icon="fa-floppy-disk" loading={saving === "scores"}>Lưu Radar v1.1</AdminButton></div>
        {legacyRadar && <div className="paddle-message paddle-message--warning"><i className="fa-solid fa-clock-rotate-left" /> Hồ sơ đang có điểm rubric v1.0. Khi lưu, hãy chuyển toàn bộ trục có điểm sang mốc và rationale v1.1.</div>}
        <div className="paddle-score-layout"><div className="paddle-score-list">{RADAR_AXES.map((axis) => {
          const entry = scores[axis.key];
          const supportedSources = axisSources(axis.key);
          const band = SCORE_TO_BAND[Number(entry.score)];
          const legacyValue = entry.score !== "" && !band;
          return <article className="paddle-score-card" key={axis.key}><div className="paddle-score-card__title"><div><h4>{axis.label}<InfoTip text={axis.tooltip} /></h4><p>{axis.tooltip}</p></div><select aria-label={`Điểm ${axis.label}`} value={entry.score} onChange={(event) => setAxis(axis.key, { score: event.target.value })}><option value="">{EMPTY_VALUE_LABEL}</option>{legacyValue && <option value={entry.score}>Điểm cũ {entry.score} — cần chuyển đổi</option>}{RADAR_SCORE_OPTIONS.map((option) => <option value={option.score} key={option.score}>{option.label}</option>)}</select></div><div className="paddle-score-card__meta"><span>Band: <strong>{band ? BAND_LABELS[band] : EMPTY_VALUE_LABEL}</strong></span>{entry.score !== "" && <button type="button" onClick={() => clearAxis(axis.key)}>Xóa đánh giá trục này</button>}</div>{entry.score !== "" && <div className="paddle-score-card__fields"><label><span>Phương pháp *</span><select value={entry.method} onChange={(event) => setAxis(axis.key, { method: event.target.value })}><option value="">Chọn phương pháp</option>{Object.entries(METHOD_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Độ tin cậy *</span><select value={entry.confidence} onChange={(event) => setAxis(axis.key, { confidence: event.target.value })}><option value="">Chọn mức</option>{["LOW", "MEDIUM", "HIGH"].map((value) => <option value={value} key={value}>{CONFIDENCE_LABELS[value]}</option>)}</select></label><label className="is-wide"><span>Lý do đánh giá *</span><textarea maxLength="1000" value={entry.reason} onChange={(event) => setAxis(axis.key, { reason: event.target.value })} placeholder="Nêu bằng chứng và quan hệ với đặc tính này..." /></label><label className="is-wide"><span>Giới hạn bằng chứng {entry.confidence !== "HIGH" ? "*" : "(khuyến nghị)"}</span><textarea maxLength="1000" value={entry.limitations} onChange={(event) => setAxis(axis.key, { limitations: event.target.value })} placeholder="Ví dụ: chưa có phép đo độc lập hoặc chỉ có dữ liệu từ nhà sản xuất..." /></label><fieldset className="is-wide"><legend>Nguồn đã xác minh hỗ trợ đúng trục *</legend>{supportedSources.length ? supportedSources.map((source) => { const id = Number(source.paddle_spec_source_id); const selected = entry.sourceIds.map(Number).includes(id); return <label key={id}><input type="checkbox" checked={selected} onChange={() => setAxis(axis.key, { sourceIds: selected ? entry.sourceIds.map(Number).filter((value) => value !== id) : [...entry.sourceIds.map(Number), id] })} />{source.source_title}</label>; }) : <span>Chưa có nguồn đã xác minh hỗ trợ {fieldLabel(`${axis.key}_score`)}.</span>}</fieldset></div>}</article>;
        })}</div><aside><PaddleRadarChart scores={Object.fromEntries(RADAR_AXES.map(({ key }) => [key, scores[key].score]))} /><div className="paddle-radar-note"><strong>{radarStatusLabel(quality.radar_status)}</strong><span>Radar chỉ READY khi đủ 6/6 trục hợp lệ và confidence tối thiểu Trung bình.</span></div></aside></div>
      </form>}

      {sourceForm && <div className="admin-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSourceForm(null)}><div className="admin-modal__content paddle-source-modal" role="dialog" aria-modal="true" aria-labelledby="source-title"><div className="admin-modal__header"><h3 id="source-title">{sourceForm.id ? "Cập nhật nguồn" : "Thêm nguồn kiểm chứng"}</h3><AdminButton iconOnly icon="fa-xmark" variant="ghost" onClick={() => setSourceForm(null)} /></div><form onSubmit={saveSource} className="paddle-source-form"><div className="paddle-form-grid"><label><span>Loại nguồn *</span><select value={sourceForm.source_type} onChange={(event) => setSourceForm({ ...sourceForm, source_type: event.target.value })}>{Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Tiêu đề *</span><input required maxLength="255" value={sourceForm.source_title} onChange={(event) => setSourceForm({ ...sourceForm, source_title: event.target.value })} /></label><label className="is-wide"><span>URL hoặc mã tài liệu *</span><input required maxLength="1000" value={sourceForm.source_locator} onChange={(event) => setSourceForm({ ...sourceForm, source_locator: event.target.value })} /></label><label><span>Đơn vị xuất bản</span><input maxLength="255" value={sourceForm.publisher || ""} onChange={(event) => setSourceForm({ ...sourceForm, publisher: event.target.value })} placeholder={EMPTY_VALUE_LABEL} /></label><label><span>Ngày xuất bản</span><input type="date" value={sourceForm.published_at || ""} onChange={(event) => setSourceForm({ ...sourceForm, published_at: event.target.value })} /></label><label><span>Thời điểm truy cập *</span><input required type="datetime-local" value={sourceForm.accessed_at} onChange={(event) => setSourceForm({ ...sourceForm, accessed_at: event.target.value })} /></label><label className="paddle-check"><input type="checkbox" checked={Boolean(sourceForm.is_primary)} onChange={(event) => setSourceForm({ ...sourceForm, is_primary: event.target.checked })} /><span>Đánh dấu nguồn chính</span></label><label className="is-wide"><span>Ghi chú bằng chứng {sourceForm.source_type === "INTERNAL_REVIEW" ? "*" : ""}</span><textarea required={sourceForm.source_type === "INTERNAL_REVIEW"} value={sourceForm.evidence_note || ""} onChange={(event) => setSourceForm({ ...sourceForm, evidence_note: event.target.value })} placeholder={EMPTY_VALUE_LABEL} /></label></div><fieldset className="paddle-supported"><legend>Trường được nguồn này hỗ trợ *</legend>{ALL_SUPPORTED_FIELDS.map((field) => <label key={field}><input type="checkbox" checked={sourceForm.supported_fields.includes(field)} onChange={() => setSourceForm({ ...sourceForm, supported_fields: sourceForm.supported_fields.includes(field) ? sourceForm.supported_fields.filter((value) => value !== field) : [...sourceForm.supported_fields, field] })} />{fieldLabel(field)}</label>)}</fieldset><div className="admin-form__actions"><AdminButton type="submit" variant="primary" icon="fa-floppy-disk" loading={saving === "source"} disabled={!sourceForm.supported_fields.length}>Lưu nguồn</AdminButton><AdminButton onClick={() => setSourceForm(null)}>Hủy</AdminButton></div></form></div></div>}
    </section>
  );
};

export default AdminPaddleSpecDetailPage;
