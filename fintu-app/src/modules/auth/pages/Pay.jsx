import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import { authApi } from '@/modules/auth/services/authApi';
import AuthLayout from '@/modules/auth/components/AuthLayout';

/*
  /pagar — pagar o renovar el acceso.
  Llega desde el inicio de sesión (plan vencido o pago pendiente) o desde
  "Renovar" en Mi perfil, con { userId, motivo, precio, accesoHasta } en el
  state de la navegación. El monto lo vuelve a verificar el backend.
*/
const initialOptions = {
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: 'USD',
  intent: 'capture',
};

const fecha = (iso) => {
  if (!iso) return '';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
};

function Pay() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [procesando, setProcesando] = useState(false);

  if (!state?.userId) return <Navigate to="/login" replace />;

  const renovar = state.motivo === 'RENOVAR';
  const precio = Number(state.precio || 10).toFixed(2);
  const vencido = renovar && state.accesoHasta && new Date(`${state.accesoHasta.slice(0, 10)}T23:59:59`) < new Date();

  const aside = renovar
    ? { title: 'Un año más, en orden.', text: 'Tus tarjetas, movimientos y tu plan te esperan tal como los dejaste.' }
    : { title: 'Ya casi.', text: 'Completa tu pago para empezar a usar Fintú.' };

  const handleApprove = async (data, actions) => {
    try {
      setProcesando(true);
      const order = await actions.order.capture();
      const res = await authApi.confirmPayment({ userId: state.userId, paymentId: order.id });
      if (res.success) {
        login(res.token, res.user);
        showToast(res.message || 'Pago confirmado.', 'success');
        navigate('/dashboard', { replace: true });
      } else {
        showToast(res.message || 'No pudimos confirmar tu pago.', 'error');
      }
    } catch {
      showToast('No pudimos confirmar tu pago. Si se cobró, escríbenos con tu ID de transacción.', 'error');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <AuthLayout aside={aside}>
        <div className="au-head">
          <h1>{renovar ? 'Renueva tu plan' : 'Completa tu pago'}</h1>
          {renovar ? (
            <p>
              {vencido
                ? <>Tu plan anual venció el <strong>{fecha(state.accesoHasta)}</strong>. Renuévalo para volver a entrar; tus datos siguen guardados.</>
                : <>Tu plan anual vence el <strong>{fecha(state.accesoHasta)}</strong>. Si renuevas ahora, se suma un año desde esa fecha: no pierdes días.</>}
            </p>
          ) : (
            <p>Tu cuenta está creada, pero falta el pago para entrar.</p>
          )}
        </div>

        <div className="au-pay">
          <div>
            <strong>${precio} USD</strong>
            <span>{renovar ? 'Un año más de acceso' : 'Tu acceso a Fintú'}</span>
          </div>
          <span className="au-pay-tag">{renovar ? 'Plan anual' : 'Pago seguro'}</span>
        </div>

        <PayPalButtons
          style={{ layout: 'vertical', shape: 'pill', label: 'pay', height: 48 }}
          disabled={procesando}
          createOrder={(data, actions) =>
            actions.order.create({
              purchase_units: [{
                amount: { value: precio, currency_code: 'USD' },
                description: `Fintú & Co. PE - ${renovar ? 'renovación anual' : 'acceso'}${state.email ? ` - ${state.email}` : ''}`,
              }],
            })
          }
          onApprove={handleApprove}
          onError={() => showToast('Error al procesar el pago. Intenta de nuevo.', 'error')}
          onCancel={() => showToast('Pago cancelado. Puedes intentarlo cuando quieras.', 'warning')}
        />

        {procesando && (
          <div className="au-loading" role="status">
            <div className="au-spinner" />
            <span>Confirmando tu pago…</span>
          </div>
        )}

        <p className="au-alt">
          No hay cobros automáticos: solo pagas cuando tú lo decides. <Link to="/login">Volver</Link>
        </p>
      </AuthLayout>
    </PayPalScriptProvider>
  );
}

export default Pay;
