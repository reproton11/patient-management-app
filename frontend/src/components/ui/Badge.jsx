// patient-management-app/frontend/src/components/ui/Badge.jsx
import React from "react";

const toneClass = {
  blue: "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-600/20",
  gray: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/10",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
};

const Badge = ({ tone = "gray", dot = false, className = "", children }) => (
  <span className={`badge ${toneClass[tone]} ${className}`}>
    {dot ? (
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    ) : null}
    {children}
  </span>
);

export default Badge;