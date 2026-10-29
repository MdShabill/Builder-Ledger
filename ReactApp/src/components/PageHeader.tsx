import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export default function PageHeader({ title, addTo, badge }: { title: string; addTo: string; badge?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="page-header__badge">{badge}</div>
      <h3 className="page-header__title">{title}</h3>
      <Link to={addTo} className="page-header__add">+ Add New</Link>
    </div>
  );
}