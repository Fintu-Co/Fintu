const Goal = require('../models/Goal');
const Card = require('../models/Card');

exports.getGoals = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ success: false, message: 'Usuario requerido' });
    const objetivos = await Goal.getByUserId(userId);
    const completados = await Goal.getCompletadosByUserId(userId);
    res.json({ success: true, objetivos, completados });
  } catch (e) {
    res.json({ success: false, message: 'Error al obtener objetivos' });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { usuario_id, tipo, descripcion, meta_valor, fecha_limite, tarjeta_id, tarjeta_nombre } = req.body;
    if (!usuario_id || !tipo || !descripcion) return res.json({ success: false, message: 'Faltan campos obligatorios' });

    const totalActivos = await Goal.countActivos(usuario_id);
    if (totalActivos >= 3) return res.json({ success: false, message: 'Ya tienes 3 objetivos activos. Completa o elimina uno primero.' });

    // Calcular progreso inicial basado en la tarjeta específica
    let progresoInicial = 0;
    if (tarjeta_id) {
      const tarjetas = await Card.getByUserId(usuario_id);
      const tarjeta = tarjetas.find(t => t.id === parseInt(tarjeta_id));
      if (tarjeta) {
        const deuda = parseFloat(tarjeta.deuda_actual || 0);
        const linea = parseFloat(tarjeta.linea_credito || 1);
        if (tipo === 'reducir_uso') progresoInicial = Math.round((deuda / linea) * 100);
        if (tipo === 'reducir_deuda') progresoInicial = deuda;
      }
    }

    const id = await Goal.create(usuario_id, {
      tipo, descripcion, meta_valor: meta_valor || null,
      progreso_actual: progresoInicial,
      fecha_limite: fecha_limite || null,
      tarjeta_id: tarjeta_id || null,
      tarjeta_nombre: tarjeta_nombre || null,
    });

    res.json({ success: true, message: 'Objetivo creado', id });
  } catch (e) {
    console.error(e);
    res.json({ success: false, message: 'Error al crear objetivo' });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { objetivo_id, usuario_id, progreso } = req.body;
    if (!objetivo_id || !usuario_id || progreso === undefined) return res.json({ success: false });
    const updated = await Goal.updateProgreso(objetivo_id, usuario_id, progreso);
    res.json({ success: updated });
  } catch (e) {
    res.json({ success: false });
  }
};

exports.completeGoal = async (req, res) => {
  try {
    const { objetivo_id, usuario_id } = req.body;
    if (!objetivo_id || !usuario_id) return res.json({ success: false });
    const completed = await Goal.completar(objetivo_id, usuario_id);
    res.json({ success: completed });
  } catch (e) {
    res.json({ success: false });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { objetivo_id, usuario_id } = req.body;
    if (!objetivo_id || !usuario_id) return res.json({ success: false });
    const deleted = await Goal.eliminar(objetivo_id, usuario_id);
    res.json({ success: deleted });
  } catch (e) {
    res.json({ success: false });
  }
};

exports.syncProgress = async (req, res) => {
  try {
    const { usuario_id } = req.body;
    if (!usuario_id) return res.json({ success: false });

    const objetivos = await Goal.getByUserId(usuario_id);
    const tarjetas = await Card.getByUserId(usuario_id);

    for (const obj of objetivos) {
      if (obj.completado) continue;

      // Buscar la tarjeta específica del objetivo
      const tarjeta = obj.tarjeta_id
        ? tarjetas.find(t => t.id === obj.tarjeta_id)
        : null;

      const deuda = tarjeta ? parseFloat(tarjeta.deuda_actual || 0) : 0;
      const linea = tarjeta ? parseFloat(tarjeta.linea_credito || 1) : 1;
      const uso = Math.round((deuda / linea) * 100);

      let nuevoProgreso = obj.progreso_actual;
      let completar = false;

      if (obj.tipo === 'reducir_uso') {
        nuevoProgreso = uso;
        if (uso <= obj.meta_valor) completar = true;
      }
      if (obj.tipo === 'reducir_deuda') {
        nuevoProgreso = deuda;
        if (deuda <= obj.meta_valor) completar = true;
      }
      if (obj.tipo === 'pago_total') {
        nuevoProgreso = deuda === 0 ? 100 : 0;
        if (deuda === 0) completar = true;
      }

      await Goal.updateProgreso(obj.id, usuario_id, nuevoProgreso);
      if (completar) await Goal.completar(obj.id, usuario_id);
    }

    const objetivosActualizados = await Goal.getByUserId(usuario_id);
    const completados = await Goal.getCompletadosByUserId(usuario_id);
    res.json({ success: true, objetivos: objetivosActualizados, completados });
  } catch (e) {
    console.error(e);
    res.json({ success: false });
  }
};