import './PlaceholderPage.css';

export default function PlaceholderPage({ title }) {
  return (
    <div className="placeholder-page">
      <h1 className="placeholder-page__title">{title}</h1>
      <p className="placeholder-page__text">This page will be built in a future round.</p>
    </div>
  );
}
