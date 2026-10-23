/**
 * INTERFAZ HTTP: controller delgado de analytics.
 * Respuestas idénticas al controller anterior.
 */
function buildAnalyticsController({ getUsageAnalysis }) {
  return {
    async getUsageAnalysis(req, res) {
      try {
        const { tarjetaId } = req.params;

        const result = await getUsageAnalysis.execute(tarjetaId);

        if (!result.ok) {
          return res.json({ success: false, message: 'Tarjeta no encontrada' });
        }

        res.json({ success: true, analysis: result.analysis });
      } catch (error) {
        console.error('Error al obtener análisis:', error);
        res.json({ success: false, message: 'Error al obtener análisis' });
      }
    },
  };
}

module.exports = buildAnalyticsController;
