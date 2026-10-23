import './BrandLogo.css';

/*
  Logo de marca — Fintú & Co.
  Wordmark serif elegante ("FINTÚ & CO.") con tagline opcional
  ("TOMA EL CONTROL"). Hereda el color del contenedor (currentColor),
  por lo que se adapta solo a fondos claros u oscuros.

  Props:
   · size:    'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
   · tagline: boolean — muestra "TOMA EL CONTROL"  (default false)
   · as:      etiqueta contenedora ('div' | 'span' | 'h1' | 'h2'...) (default 'div')
   · className, onClick, ...rest
*/
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
      <span className="brand-logo-word" aria-hidden="true">
        FINTÚ<span className="brand-logo-amp">&amp;</span>CO.
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
