import './ImproveCard.css';

const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

/**
 * Formato común de "¿Qué puedes mejorar?":
 * pregunta + para qué te sirve → respuesta → tu siguiente paso → acción.
 */
function ImproveCard({ chip, pregunta, valor, tono = '', detalle, children, paso, cta, onCta }) {
  return (
    <article className="cdx-card mj">
      <header className="mj-head">
        <h3 className="mj-q">{pregunta}</h3>
        {chip && <span className="mj-chip">{chip}</span>}
      </header>

      <div className="mj-answer">
        <b className={`mj-valor ${tono}`}>{valor}</b>
        {detalle && <span className="mj-detalle">{detalle}</span>}
      </div>

      {children}

      {paso && (
        <div className="mj-paso">
          <span>Tu siguiente paso</span>
          <p>{paso}</p>
        </div>
      )}

      {cta && (
        <button className="mj-cta" onClick={onCta}>
          {cta} <IcArrow />
        </button>
      )}
    </article>
  );
}

export default ImproveCard;
