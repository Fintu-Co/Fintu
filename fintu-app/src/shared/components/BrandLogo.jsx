import './BrandLogo.css';

/*
  Logo de marca — Fintú & Co.
  Símbolo: la "ú" de Fintú. El aro abierto es el ciclo de facturación y
  la tilde, en el hueco, marca el pago a tiempo que lo cierra.
  Wordmark "FINTÚ" dibujado con el mismo trazo + "& Co." en Fraunces itálica.
  Letras y aro heredan el color del contenedor (currentColor); la tilde usa
  --brand-accent, así se adapta solo a fondos claros u oscuros.

  Props:
   · size:    'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
   · tagline: boolean — muestra "TOMA EL CONTROL"  (default false)
   · as:      etiqueta contenedora ('div' | 'span' | 'h1' | 'h2'...) (default 'div')
   · className, onClick, ...rest
*/
export function BrandSymbol() {
  return (
    <svg className="brand-symbol" viewBox="4 2 112 112" aria-hidden="true">
      <path d="M85.46 38.54 A36 36 0 1 1 34.54 38.54" fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      <path d="M55 35 L71 15" fill="none" stroke="var(--brand-accent)" strokeWidth="13" strokeLinecap="round" />
    </svg>
  );
}

function BrandWordmark() {
  return (
    <svg className="brand-logo-word" viewBox="-2 -30 262 98" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 60 V4.5 H34 M4.5 31 H29" />
        <path d="M59 4.5 V60" />
        <path d="M84 60 V4.5 L122 60 V4.5" />
        <path d="M147 4.5 H189 M168 4.5 V60" />
        <path d="M214 4.5 V41 A19 19 0 0 0 252 41 V4.5" />
      </g>
      <path d="M227 -8 L239 -22" fill="none" stroke="var(--brand-accent)" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

function BrandLogo({
  size = 'md',
  tagline = false,
  as: Tag = 'div',
  className = '',
  ...rest
}) {
  return (
    <Tag
      className={`brand-logo brand-logo--${size}${tagline ? ' has-tagline' : ''} ${className}`.trim()}
      aria-label="Fintú & Co."
      {...rest}
    >
      <span className="brand-logo-lockup">
        <BrandSymbol />
        <BrandWordmark />
        <span className="brand-logo-amp" aria-hidden="true">&amp; Co.</span>
      </span>
      {tagline && (
        <span className="brand-logo-tagline" aria-hidden="true">
          <span className="brand-logo-rule" />
          Toma el control
        </span>
      )}
    </Tag>
  );
}

export default BrandLogo;
