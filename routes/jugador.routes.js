const express = require("express");
const Jugador = require("../models/Jugador");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Obtener todos los jugadores
router.get("/", authMiddleware, async (req, res) => {
  const jugadores = await Jugador.find();
  res.json(jugadores);
});
// Obtener todos los Maximos
router.get("/maximos", authMiddleware, async (req, res) => {
  try {
    const maximos = await Jugador.aggregate([
      {
        $project: {
          apodo: 1,
          _id: 1,
          "estadisticas.goles": 1,
          "estadisticas.asistencias": 1,
          "estadisticas.atajadas": 1,
        },
      },
      {
        $facet: {
          maxGoleador: [{ $sort: { "estadisticas.goles": -1 } }, { $limit: 1 }],
          maxAsistente: [
            { $sort: { "estadisticas.asistencias": -1 } },
            { $limit: 1 },
          ],
          maxAtajadas: [
            { $sort: { "estadisticas.atajadas": -1 } },
            { $limit: 1 },
          ],
        },
      },
    ]);

    // Extraer los resultados
    const maxGoleador = maximos[0].maxGoleador[0] || null;
    const maxAsistente = maximos[0].maxAsistente[0] || null;
    const maxAtajadas = maximos[0].maxAtajadas[0] || null;

    // Crear array con los máximos en el formato requerido
    const response = [
      maxGoleador
        ? {
            title: "Maximo Goleador",
            image: `assets/${maxGoleador._id}.png`,
            player: maxGoleador.apodo,
            stat: maxGoleador.estadisticas.goles,
          }
        : null,
      maxAsistente
        ? {
            title: "Maximo Asistidor",
            image: `assets/${maxAsistente._id}.png`,
            player: maxAsistente.apodo,
            stat: maxAsistente.estadisticas.asistencias,
          }
        : null,
      maxAtajadas
        ? {
            title: "Maximo Atajador",
            image: `assets/${maxAtajadas._id}.png`,
            player: maxAtajadas.apodo,
            stat: maxAtajadas.estadisticas.atajadas,
          }
        : null,
    ].filter(Boolean); // Elimina los valores null si no hay jugadores

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener máximos", error });
  }
});
router.get("/leaderboard",authMiddleware, async (req, res) => {
  try {
    const top = 3;

    const maximos = await Jugador.aggregate([
      {
        $match: {
          estadoPagos: true,
          "estadisticas.partidosJugados": { $gt: 0 },
        },
      },
      {
        $facet: {
          goleadores: [
            { $match: { "estadisticas.goles": { $gt: 0 } } },
            { $sort: { "estadisticas.goles": -1 } },
            { $limit: top },
          ],
          asistidores: [
            { $match: { "estadisticas.asistencias": { $gt: 0 } } },
            { $sort: { "estadisticas.asistencias": -1 } },
            { $limit: top },
          ],
          atajadores: [
            { $match: { "estadisticas.atajadas": { $gt: 0 } } },
            { $sort: { "estadisticas.atajadas": -1 } },
            { $limit: top },
          ],
        },
      },
    ]);

    const { goleadores, asistidores, atajadores } = maximos[0];

    // Mapear datos al formato deseado
    const formatJugador = (jugador, statKey) => ({
      player: jugador.apodo,
      stat: jugador.estadisticas[statKey],
    });

    res.json({
      goleadores: goleadores.map((j) => formatJugador(j, "goles")),
      asistidores: asistidores.map((j) => formatJugador(j, "asistencias")),
      atajadores: atajadores.map((j) => formatJugador(j, "atajadas")),
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener máximos", error });
  }
});
// Actualizar múltiples jugadores
router.put("/actualizarPagos",authMiddleware, async (req, res) => {
  try {
    const { jugadores } = req.body;
    if (!Array.isArray(jugadores) || jugadores.length === 0) {
      return res
        .status(400)
        .json({ message: "No se enviaron jugadores válidos" });
    }

    const bulkOps = jugadores.map((j) => ({
      updateOne: {
        filter: { _id: j.id },
        update: { $set: { estadoPagos: j.estadoPagos } },
      },
    }));

    const result = await Jugador.bulkWrite(bulkOps);

    res.status(200).json({
      message: "Pagos actualizados correctamente",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error al actualizar pagos:", error);
    res.status(500).json({ message: "Error interno al actualizar pagos" });
  }
});
// Obtener jugador por ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const jugador = await Jugador.findById(req.params.id);

    if (!jugador) {
      return res.status(404).json({ mensaje: "Jugador no encontrado" });
    }
    res.json(jugador);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/por-ids",authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body; // Recibir un array de IDs
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "Debes proporcionar un array de IDs válido" });
    }

    const jugadores = await Jugador.find({ _id: { $in: ids } }).select(
      "_id nombre pos_principal pos_secundaria media"
    );

    if (!jugadores.length) {
      return res.status(404).json({ message: "No se encontraron jugadores" });
    }
    res.json(jugadores);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
});

// Crear un nuevo jugador
router.post("/", authMiddleware, async (req, res) => {
  const nuevoJugador = new Jugador(req.body);
  await nuevoJugador.save();
  res.json(nuevoJugador);
});

// Editar jugador por ID
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const jugadorActualizado = await Jugador.findByIdAndUpdate(
      req.params.id, // ID del jugador que se va a actualizar
      req.body, // Nuevos datos
      { new: true } // Para devolver el jugador actualizado
    );

    if (!jugadorActualizado) {
      return res.status(404).json({ mensaje: "Jugador no encontrado" });
    }

    res.json(jugadorActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar jugador por ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const jugadorEliminado = await Jugador.findByIdAndDelete(req.params.id);

    if (!jugadorEliminado) {
      return res.status(404).json({ mensaje: "Jugador no encontrado" });
    }

    res.json({
      mensaje: "Jugador eliminado correctamente",
      jugador: jugadorEliminado,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
