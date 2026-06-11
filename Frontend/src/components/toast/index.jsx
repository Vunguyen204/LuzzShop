import "./style.scss";

// function Toast({ message, type = "success", onClose }) {
function Toast({ message, type = "success" }) {
  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
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
