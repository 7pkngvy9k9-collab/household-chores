import { Link } from "react-router-dom";

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  actionTo?: string;
};

export function PlaceholderPage({ title, body, actionLabel, actionTo }: Props) {
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Coming later</p>
          <h1 className="brand">{title}</h1>
        </div>
      </header>
      <div className="card">
        <p className="empty" style={{ paddingBottom: 8 }}>
          {body}
        </p>
        {actionLabel && actionTo ? (
          <Link className="dash-more" to={actionTo}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
