/**
 * INTERFAZ HTTP: controller delgado de movimientos.
 * Respuestas idénticas al controller anterior.
 */
function buildMovementController({
  getMovementsByCard,
  getMovementsByCycle,
  createMovement,
  getCycleStats,
  getChartData,
  getDetailedChartData,
  deleteMovement,
  cleanupOldMovements,
}) {
  return {
    async getMovements(req, res) {
      try {
        const { tarjetaId } = req.params;

        if (!tarjetaId) {
          return res.json({ success: false, message: 'ID de tarjeta no proporcionado' });
        }

        const movimientos = await getMovementsByCard.execute(tarjetaId);
        res.json({ success: true, movimientos });
      } catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.json({ success: false, message: 'Error al obtener movimientos' });
      }
    },

    async getMovementsByCycle(req, res) {
      try {
        const { tarjetaId, mes, anio } = req.query;

        if (!tarjetaId || !mes || !anio) {
          return res.json({ success: false, message: 'Faltan parámetros (tarjetaId, mes, anio)' });
        }

        const movimientos = await getMovementsByCycle.execute({ tarjetaId, mes, anio });
        res.json({ success: true, movimientos });
      } catch (error) {
        console.error('Error al obtener movimientos del ciclo:', error);
        res.json({ success: false, message: 'Error al obtener movimientos del ciclo' });
      }
    },

    async createMovement(req, res) {
      try {
        const { tarjeta_id, usuario_id, tipo, monto } = req.body;

        if (!tarjeta_id || !usuario_id || !tipo || !monto) {
          return res.json({
            success: false,
            message: 'Faltan campos obligatorios (tarjeta_id, usuario_id, tipo, monto)',
          });
        }

        const result = await createMovement.execute(req.body);

        if (!result.ok) {
          return res.json({ success: false, message: result.message });
        }

        res.json({
          success: true,
          message: 'Movimiento registrado exitosamente',
          movimientoId: result.movimientoId,
        });
      } catch (error) {
        console.error('Error al crear movimiento:', error);
        res.json({ success: false, message: 'Error al crear movimiento' });
      }
    },

    async getStats(req, res) {
      try {
        const { tarjetaId } = req.params;
        const { mes, anio } = req.query;

        if (!tarjetaId) {
          return res.json({ success: false, message: 'ID de tarjeta no proporcionado' });
        }

        // Si no se especifica mes/año, usar actual
        const fecha = new Date();
        const ciclo_mes = mes ? parseInt(mes) : fecha.getMonth() + 1;
        const ciclo_anio = anio ? parseInt(anio) : fecha.getFullYear();

        const stats = await getCycleStats.execute({ tarjetaId, mes: ciclo_mes, anio: ciclo_anio });
        res.json({ success: true, stats });
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.json({ success: false, message: 'Error al obtener estadísticas' });
      }
    },

    async getChartData(req, res) {
      try {
        const { tarjetaId } = req.params;
        const { dias } = req.query;

        if (!tarjetaId) {
          return res.json({ success: false, message: 'ID de tarjeta no proporcionado' });
        }

        const chartData = await getChartData.execute({ tarjetaId, dias: parseInt(dias) || 30 });
        res.json({ success: true, chartData });
      } catch (error) {
        console.error('Error al obtener datos del gráfico:', error);
        res.json({ success: false, message: 'Error al obtener datos del gráfico' });
      }
    },

    async getDetailedChartData(req, res) {
      try {
        const { tarjetaId } = req.params;
        const dias = parseInt(req.query.dias) || 14;

        const result = await getDetailedChartData.execute({ tarjetaId, dias });

        res.json({
          success: true,
          chartData: result.chartData,
          insights: result.insights,
        });
      } catch (error) {
        console.error('Error al obtener datos del gráfico:', error);
        res.json({ success: false, message: 'Error al obtener datos' });
      }
    },

    async deleteMovement(req, res) {
      try {
        const { movimientoId, userId } = req.body;

        if (!movimientoId || !userId) {
          return res.json({ success: false, message: 'Datos incompletos' });
        }

        const deleted = await deleteMovement.execute({ movimientoId, userId });

        if (deleted) {
          res.json({ success: true, message: 'Movimiento eliminado' });
        } else {
          res.json({ success: false, message: 'No se pudo eliminar el movimiento' });
        }
      } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        res.json({ success: false, message: 'Error al eliminar movimiento' });
      }
    },

    async cleanup(req, res) {
      try {
        const deleted = await cleanupOldMovements.execute();
        res.json({
          success: true,
          message: `Limpieza completada. ${deleted} movimientos eliminados.`,
        });
      } catch (error) {
        console.error('Error en limpieza:', error);
        res.json({ success: false, message: 'Error en limpieza de movimientos' });
      }
    },
  };
}

module.exports = buildMovementController;
