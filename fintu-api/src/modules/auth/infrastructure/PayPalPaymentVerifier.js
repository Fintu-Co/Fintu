/**
 * INFRAESTRUCTURA: Verificación server-side de órdenes PayPal.
 *
 * Nunca confiamos en el paymentId que envía el navegador: consultamos
 * la orden directamente a la API de PayPal con las credenciales del
 * servidor y validamos estado + monto + moneda.
 *
 * Env requeridas:
 *   PAYPAL_CLIENT_ID      – client id de la app (sandbox o live)
 *   PAYPAL_CLIENT_SECRET  – secret de la app (solo backend, jamás en frontend)
 *   PAYPAL_API_BASE       – https://api-m.sandbox.paypal.com (default)
 *                           https://api-m.paypal.com (producción)
 *   PAYPAL_EXPECTED_USD   – monto esperado del pago único (default 4.00)
 */
class PayPalPaymentVerifier {
  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    this.apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
    this.expectedAmount = parseFloat(process.env.PAYPAL_EXPECTED_USD || '4.00');

    if (!this.clientId || !this.clientSecret) {
      console.warn(
        '⚠️  PayPal: faltan PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET en .env. ' +
        'Los pagos serán RECHAZADOS hasta configurarlos.'
      );
    }
  }

  /** Token OAuth2 de aplicación (client_credentials). */
  async #getAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          'PayPal OAuth falló: 401 — credenciales inválidas o SECRET VENCIDO. ' +
          'Los secrets de PayPal expiran cada año: genera uno nuevo en ' +
          'developer.paypal.com → Apps & Credentials y actualiza PAYPAL_CLIENT_SECRET.'
        );
      }
      throw new Error(`PayPal OAuth falló: ${res.status}`);
    }
    const data = await res.json();
    return data.access_token;
  }

  /**
   * Verifica una orden de PayPal.
   * @param {string} orderId – id de la orden capturada en el checkout
   * @returns {{ valid: boolean, reason?: string, amount?: number, currency?: string }}
   */
  async verifyOrder(orderId) {
    // Fail-closed: sin credenciales no se aprueba ningún pago.
    if (!this.clientId || !this.clientSecret) {
      return { valid: false, reason: 'PAYPAL_NOT_CONFIGURED' };
    }
    if (!orderId || typeof orderId !== 'string' || orderId.length > 64) {
      return { valid: false, reason: 'INVALID_ORDER_ID' };
    }

    try {
      const token = await this.#getAccessToken();
      const res = await fetch(`${this.apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) return { valid: false, reason: 'ORDER_NOT_FOUND' };
      if (!res.ok)            return { valid: false, reason: `PAYPAL_API_${res.status}` };

      const order = await res.json();

      if (order.status !== 'COMPLETED') {
        return { valid: false, reason: `ORDER_STATUS_${order.status}` };
      }

      // Monto y moneda del capture real (no del carrito)
      const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
      const amount = parseFloat(capture?.amount?.value ?? order.purchase_units?.[0]?.amount?.value ?? '0');
      const currency = capture?.amount?.currency_code ?? order.purchase_units?.[0]?.amount?.currency_code;

      if (capture && capture.status !== 'COMPLETED') {
        return { valid: false, reason: `CAPTURE_STATUS_${capture.status}` };
      }
      if (currency !== 'USD') {
        return { valid: false, reason: `WRONG_CURRENCY_${currency}` };
      }
      if (amount + 0.001 < this.expectedAmount) {
        return { valid: false, reason: `AMOUNT_TOO_LOW_${amount}` };
      }

      return { valid: true, amount, currency };
    } catch (error) {
      console.error('Error verificando orden PayPal:', error.message);
      return { valid: false, reason: 'VERIFICATION_ERROR' };
    }
  }
}

module.exports = PayPalPaymentVerifier;
