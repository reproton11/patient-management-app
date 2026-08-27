// patient-management-app/frontend/src/components/ui/PageHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "@heroicons/react/outline";

const PageHeader = ({ title, subtitle, breadcrumb, action, className = "" }) => (
  <div className={`page-header ${className}`}>
    <div className="min-w-0">
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-xs text-gray-500">
          {breadcrumb.map((item, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && (
                  <ChevronRightIcon className="h-3 w-3 shrink-0 text-gray-300" aria-hidden="true" />
                )}
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="font-medium text-gray-500 transition-colors hover:text-primary-700"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={`truncate ${isLast ? "font-semibold text-gray-700" : ""}`}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      ) : null}
      <h1 className="page-title">{title}</h1>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export default PageHeader;