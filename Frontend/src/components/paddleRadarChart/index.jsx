import { EMPTY_VALUE_LABEL, RADAR_AXES } from "../../config/paddleSpecs";
import "./style.scss";

const point = (index, value, radius = 104, center = 140) => {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / RADAR_AXES.length;
  const scale = Number(value) / 100;
  return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale];
};

const valueOf = (scores, key) => {
  const raw = scores[key] ?? scores[`${key}_score`];
  return raw === "" || raw === null || raw === undefined ? null : Number(raw);
};

const PaddleRadarChart = ({ scores = {} }) => {
  const values = RADAR_AXES.map(({ key }) => valueOf(scores, key));
  const complete = values.every((value) => Number.isFinite(value));
  const available = values.filter((value) => Number.isFinite(value)).length;
  const polygon = complete ? values.map((value, index) => point(index, value).join(",")).join(" ") : "";

  return (
    <figure className="paddle-radar" aria-label="Biểu đồ Radar sáu đặc tính vợt">
      <svg viewBox="0 0 280 280" role="img">
        <title>{complete ? "Biểu đồ Radar đủ sáu đặc tính" : `Radar có ${available} trên 6 đặc tính`}</title>
        {[20, 40, 60, 80, 100].map((level) => (
          <polygon key={level} className="paddle-radar__grid" points={RADAR_AXES.map((_, index) => point(index, level).join(",")).join(" ")} />
        ))}
        {RADAR_AXES.map((_, index) => {
          const [x, y] = point(index, 100);
          return <line key={index} className="paddle-radar__axis" x1="140" y1="140" x2={x} y2={y} />;
        })}
        {complete && <polygon className="paddle-radar__value" points={polygon} />}
        {!complete && values.map((value, index) => {
          if (!Number.isFinite(value)) return null;
          const [cx, cy] = point(index, value);
          return <circle key={RADAR_AXES[index].key} className="paddle-radar__point" cx={cx} cy={cy} r="4" />;
        })}
        {RADAR_AXES.map(({ key, label }, index) => {
          const [x, y] = point(index, 120);
          return <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{label}</text>;
        })}
      </svg>
      <figcaption>
        <strong>{available}/6 đặc tính có dữ liệu</strong>
        <span>{complete ? "Radar v1.1 đầy đủ" : `${EMPTY_VALUE_LABEL} không được quy đổi thành 0`}</span>
      </figcaption>
    </figure>
  );
};

export default PaddleRadarChart;
