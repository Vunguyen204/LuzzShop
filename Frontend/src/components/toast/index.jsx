import "./style.scss";

// function Toast({ message, type = "success", onClose }) {
function Toast({ message, type = "success" }) {
  return (
    <div
      className={`toast toast-${type}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className="toast-icon" aria-hidden="true">
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "warning" && "!"}
      </div>

      <span>{message}</span>

      {/* <button onClick={onClose}>×</button> */}
    </div>
  );
}

export default Toast;
