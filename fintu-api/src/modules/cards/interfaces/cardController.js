/**
 * INTERFAZ HTTP: controller delgado de tarjetas.
 * Respuestas idénticas al controller anterior.
 *
 * Nota: getCardById tenía un bug latente en la versión previa
 * (referenciaba `db` sin importarlo y siempre devolvía 500);
 * con el repositorio ahora funciona como se diseñó originalmente.
 */
function buildCardController({
  getUserCards,
  updateCardSlot,
  clearCardSlot,
  updateCardDebt,
  getBanks,
  getCardById,
}) {
  return {
    async getUserCards(req, res) {
      try {
        const { userId } = req.query;

        if (!userId) {
          return res.json({ success: false, message: 'Usuario no identificado' });
        }

        const tarjetas = await getUserCards.execute(userId);
        res.json({ success: true, tarjetas });
      } catch (error) {
        console.error('Error al obtener tarjetas:', error);
        res.json({ success: false, message: 'Error al obtener tarjetas' });
      }
    },

    async updateCard(req, res) {
      try {
        const {
          usuario_id,
          slot_numero,
          banco_id,
          banco_nombre_custom,
          linea_credito,
          dia_inicio_ciclo,
          dia_cierre_ciclo,
          dia_pago,
        } = req.body;

        // banco_id puede ser null si se usa banco_nombre_custom
        const bancoValido = banco_id || banco_nombre_custom;

        if (
          !usuario_id || !slot_numero || !bancoValido || !linea_credito ||
          !dia_inicio_ciclo || !dia_cierre_ciclo || !dia_pago
        ) {
          return res.json({
            success: false,
            message: 'Faltan campos obligatorios (banco, línea de crédito, días de ciclo)',
          });
        }

        const result = await updateCardSlot.execute(req.body);

        if (result.ok) {
          res.json({ success: true, message: 'Tarjeta agregada exitosamente' });
        } else {
          res.json({ success: false, message: result.message });
        }
      } catch (error) {
        console.error('Error al actualizar tarjeta:', error);
        res.json({ success: false, message: 'Error al actualizar tarjeta' });
      }
    },

    async clearCard(req, res) {
      try {
        const { userId, slotNumero } = req.body;

        if (!userId || !slotNumero) {
          return res.json({ success: false, message: 'Datos incompletos' });
        }

        const cleared = await clearCardSlot.execute({ userId, slotNumero });

        if (cleared) {
          res.json({ success: true, message: 'Tarjeta limpiada exitosamente' });
        } else {
          res.json({ success: false, message: 'No se pudo limpiar la tarjeta' });
        }
      } catch (error) {
        console.error('Error al limpiar tarjeta:', error);
        res.json({ success: false, message: 'Error al limpiar tarjeta' });
      }
    },

    async updateDeuda(req, res) {
      try {
        const { userId, slotNumero, nuevaDeuda } = req.body;

        if (!userId || !slotNumero || nuevaDeuda === undefined) {
          return res.json({ success: false, message: 'Datos incompletos' });
        }

        const updated = await updateCardDebt.execute({ userId, slotNumero, nuevaDeuda });

        if (updated) {
          res.json({ success: true, message: 'Deuda actualizada exitosamente' });
        } else {
          res.json({ success: false, message: 'No se pudo actualizar la deuda' });
        }
      } catch (error) {
        console.error('Error al actualizar deuda:', error);
        res.json({ success: false, message: 'Error al actualizar deuda' });
      }
    },

    async getBancos(req, res) {
      try {
        const bancos = await getBanks.execute();
        res.json({ success: true, bancos });
      } catch (error) {
        console.error('Error al obtener bancos:', error);
        res.json({ success: false, message: 'Error al obtener bancos' });
      }
    },

    async getCardById(req, res) {
      try {
        const { id } = req.params;
        const tarjeta = await getCardById.execute(id);

        if (!tarjeta) {
          return res.status(404).json({ success: false, message: 'Tarjeta no encontrada' });
        }

        res.json({ success: true, tarjeta });
      } catch (error) {
        console.error('Error al obtener tarjeta:', error);
        res.status(500).json({ success: false, message: 'Error al obtener tarjeta' });
      }
    },
  };
}

module.exports = buildCardController;
