// patient-management-app/frontend/src/components/ui/Field.jsx
import React from "react";

const Field = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = "",
}) => (
  <div className={className}>
    {label ? (
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
    ) : null}
    {children}
    {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    {!error && hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
  </div>
);

export const Input = ({ error = false, className = "", ...props }) => (
  <input
    className={`input ${error ? "input-error" : ""} ${className}`}
    aria-invalid={error || undefined}
    {...props}
  />
);

export const Select = ({ error = false, className = "", children, ...props }) => (
  <select
    className={`input ${error ? "input-error" : ""} ${className}`}
    aria-invalid={error || undefined}
    {...props}
  >
    {children}
  </select>
);

export const Textarea = ({ error = false, className = "", ...props }) => (
  <textarea
    className={`input ${error ? "input-error" : ""} ${className}`}
    aria-invalid={error || undefined}
    {...props}
  />
);

export default Field;
