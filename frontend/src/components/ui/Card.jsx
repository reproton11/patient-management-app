// patient-management-app/frontend/src/components/ui/Card.jsx
import React from "react";

const Card = ({ className = "", hover = false, children, ...props }) => (
  <div className={`card ${hover ? "card-hover" : ""} ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, action, className = "" }) => (
  <div
    className={`flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3 mb-4 ${className}`}
  >
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle ? <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

Card.Header = CardHeader;
export default Card;
