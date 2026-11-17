import "./style.scss";

function AdminButton({
  children,
  className = "",
  icon,
  iconOnly = false,
  loading = false,
  variant = "secondary",
  size = "md",
  type = "button",
  disabled,
  title,
  ...props
}) {
  const classes = [
    "admin-button",
    `admin-button--${variant}`,
    `admin-button--${size}`,
    iconOnly ? "admin-button--icon-only" : "",
    loading ? "admin-button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      title={title}
      {...props}
    >
      <span className="admin-button__content">
        {loading ? (
          <i className="fa-solid fa-spinner admin-button__spinner" aria-hidden="true" />
        ) : icon ? (
          <i className={`fa-solid ${icon}`} aria-hidden="true" />
        ) : null}
        {!iconOnly && <span>{children}</span>}
      </span>
    </button>
  );
}

export default AdminButton;
