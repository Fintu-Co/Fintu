/**
 * INTERFAZ HTTP: controller delgado de objetivos.
 *
 * Solo traduce HTTP ↔ casos de uso: valida presencia de campos,
 * invoca el caso de uso y arma el JSON. Cero lógica de negocio.
 * Las respuestas son idénticas a las del controller anterior.
 */
function buildGoalController({
  getUserGoals,
  createGoal,
  updateGoalProgress,
  completeGoal,
  deleteGoal,
  syncGoalsProgress,
}) {
  return {
    async getGoals(req, res) {
      try {
        const { userId } = req.query;
        if (!userId) return res.json({ success: false, message: 'Usuario requerido' });
        const { objetivos, completados } = await getUserGoals.execute(userId);
        res.json({ success: true, objetivos, completados });
      } catch (e) {
        res.json({ success: false, message: 'Error al obtener objetivos' });
      }
    },

    async createGoal(req, res) {
      try {
        const { usuario_id, tipo, descripcion } = req.body;
        if (!usuario_id || !tipo || !descripcion) {
          return res.json({ success: false, message: 'Faltan campos obligatorios' });
        }
        const result = await createGoal.execute(req.body);
        if (!result.ok) return res.json({ success: false, message: result.message });
        res.json({ success: true, message: 'Objetivo creado', id: result.id });
      } catch (e) {
        console.error(e);
        res.json({ success: false, message: 'Error al crear objetivo' });
      }
    },

    async updateProgress(req, res) {
      try {
        const { objetivo_id, usuario_id, progreso } = req.body;
        if (!objetivo_id || !usuario_id || progreso === undefined) {
          return res.json({ success: false });
        }
        const updated = await updateGoalProgress.execute(req.body);
        res.json({ success: updated });
      } catch (e) {
        res.json({ success: false });
      }
    },

    async completeGoal(req, res) {
      try {
        const { objetivo_id, usuario_id } = req.body;
        if (!objetivo_id || !usuario_id) return res.json({ success: false });
        const completed = await completeGoal.execute(req.body);
        res.json({ success: completed });
      } catch (e) {
        res.json({ success: false });
      }
    },

    async deleteGoal(req, res) {
      try {
        const { objetivo_id, usuario_id } = req.body;
        if (!objetivo_id || !usuario_id) return res.json({ success: false });
        const deleted = await deleteGoal.execute(req.body);
        res.json({ success: deleted });
      } catch (e) {
        res.json({ success: false });
      }
    },

    async syncProgress(req, res) {
      try {
        const { usuario_id } = req.body;
        if (!usuario_id) return res.json({ success: false });
        const { objetivos, completados } = await syncGoalsProgress.execute(usuario_id);
        res.json({ success: true, objetivos, completados });
      } catch (e) {
        console.error(e);
        res.json({ success: false });
      }
    },
  };
}

module.exports = buildGoalController;
