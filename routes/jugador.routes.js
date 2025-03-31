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
router.get("/Maximos", authMiddleware, async (req, res) => {
    try {
        const maxGoleador = await Jugador.findOne().sort({ "estadisticas.goles": -1 }).select("nombre apodo _id estadisticas.goles");
        const maxAsistente = await Jugador.findOne().sort({ "estadisticas.asistencias": -1 }).select("nombre apodo _id estadisticas.asistencias");
        const maxAtajadas = await Jugador.findOne().sort({ "estadisticas.atajadas": -1 }).select("nombre apodo _id estadisticas.atajadas");

        res.json({
            maxGoleador: maxGoleador ? { nombre: maxGoleador.apodo, goles: maxGoleador.estadisticas.goles, imagen: `assets/${maxGoleador._id}.png` } : null,
            maxAsistente: maxAsistente ? { nombre: maxAsistente.apodo, asistencias: maxAsistente.estadisticas.asistencias, imagen: `assets/${maxAsistente._id}.png` } : null,
            maxAtajadas: maxAtajadas ? { nombre: maxAtajadas.apodo, atajadas: maxAtajadas.estadisticas.atajadas, imagen: `assets/${maxAtajadas._id}.png` } : null
        });

    } catch (error) {
        res.status(500).json({ message: "Error al obtener máximos", error });
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

router.post('/por-ids', async (req, res) => {
    try {
      const { ids } = req.body; // Recibir un array de IDs
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'Debes proporcionar un array de IDs válido' });
      }
  
      const jugadores = await Jugador.find({ _id: { $in: ids } })
      .select("_id nombre pos_principal pos_secundaria media");
  
      if (!jugadores.length) {
        return res.status(404).json({ message: 'No se encontraron jugadores' });
      }
      res.json(jugadores);
    } catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error });
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
            req.params.id,  // ID del jugador que se va a actualizar
            req.body,       // Nuevos datos
            { new: true }   // Para devolver el jugador actualizado
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

        res.json({ mensaje: "Jugador eliminado correctamente", jugador: jugadorEliminado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
