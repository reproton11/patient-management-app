// patient-management-app/frontend/src/components/ui/Button.jsx
import React from "react";

const variantClass = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  success: "btn-success",
  warning: "btn-warning",
  ghost: "btn-ghost",
};

const sizeClass = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

const Button = ({
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  loadingText = "Memproses...",
  className = "",
  children,
  disabled,
  ...props
}) => {
  const Icon = icon;
  return (
    <button
      className={`${variantClass[variant]} ${sizeClass[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {loadingText}
        </>
      ) : (
        <>
          {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
