import { useEffect, useState } from 'react';
import { authApi } from '@/modules/auth/services/authApi';

/**
 * Oferta vigente que decide el backend:
 *   { plan: 'fundador', precio: 5, quedan: 37, limite: 100 }  mientras queden cupos
 *   { plan: 'anual',    precio: 10, quedan: 0, limite: 100 }  después
 * Mientras carga (o si el backend no responde) se asume la de fundador sin
 * número de cupos; el backend igual verifica el monto real al pagar.
 */
const POR_DEFECTO = { plan: 'fundador', precio: 5, quedan: null, limite: 100 };

export function useOferta() {
  const [oferta, setOferta] = useState(POR_DEFECTO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    authApi.getOffer()
      .then((data) => { if (activo && data?.success && data.oferta) setOferta(data.oferta); })
      .catch(() => {})
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, []);

  return { oferta, cargando, esFundador: oferta.plan === 'fundador' };
}
