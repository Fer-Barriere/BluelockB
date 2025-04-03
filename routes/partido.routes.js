const Partido = require("../models/Partido");
const Jugador = require("../models/Jugador");
const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

// Función para obtener el próximo domingo
const getNextSunday = () => {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + ((7 - today.getDay()) % 7 || 7));
  nextSunday.setHours(0, 0, 0, 0);
  return nextSunday;
};

const posiciones = ["POR", "DFC", "DFC", "DC", "MC", "MC"];
const posicionesEquivalentes = {
  POR: ["POR"],
  DFC: ["DFC", "LD", "LI"],
  MC: ["MC", "MCD", "MCO", "MD", "MI"],
  DC: ["DC", "ED", "EI"],
};

// Función para armar equipos balanceados
function armarEquipos(jugadores) {
  if (jugadores.length < 12)
    throw new Error("Se requieren al menos 12 jugadores.");

  let equipoBlanco = { jugadores: [], suplentes: [], mediaTotal: 0 };
  let equipoNegro = { jugadores: [], suplentes: [], mediaTotal: 0 };
  const usados = new Set();

  posiciones.forEach((posicion) => {
    const equivalentes = posicionesEquivalentes[posicion] || [posicion];
    const candidatos = jugadores
      .filter(
        (j) =>
          !usados.has(j.id) &&
          (equivalentes.includes(j.pos_principal) ||
            equivalentes.includes(j.pos_secundaria))
      )
      .sort((a, b) => b.media - a.media);

    const principales = candidatos
      .filter((j) => equivalentes.includes(j.pos_principal))
      .sort((a, b) => b.media - a.media);

    const secundarios = candidatos
      .filter(
        (j) =>
          !equivalentes.includes(j.pos_principal) &&
          equivalentes.includes(j.pos_secundaria)
      )
      .sort((a, b) => b.media - a.media);

    const candidatosValidos = principales.concat(secundarios);
    if (candidatos.length >= 2) {
      const [jugador1, jugador2] = candidatosValidos.slice(0, 2);

      equipoBlanco.jugadores.push({
        jugador: jugador1._id,
        nombre: jugador1.nombre,
        media: jugador1.media,
        pos_principal: jugador1.pos_principal,
        pos_secundaria: jugador1.pos_secundaria,
        posicionUsada: posicion,
      });
      equipoNegro.jugadores.push({
        jugador: jugador2._id,
        nombre: jugador2.nombre,
        media: jugador2.media,
        pos_principal: jugador2.pos_principal,
        pos_secundaria: jugador2.pos_secundaria,
        posicionUsada: posicion,
      });

      usados.add(jugador1.id);
      usados.add(jugador2.id);
    } else {
      const restantes = jugadores
        .filter((j) => !usados.has(j.id))
        .sort((a, b) => b.media - a.media);
      const [jugador1, jugador2] = restantes.slice(0, 2);
      equipoBlanco.jugadores.push({
        jugador: jugador1._id,
        nombre: jugador1.nombre,
        media: jugador1.media,
        pos_principal: jugador1.pos_principal,
        pos_secundaria: jugador1.pos_secundaria,
        posicionUsada: posicion,
      });
      equipoNegro.jugadores.push({
        jugador: jugador2._id,
        nombre: jugador2.nombre,
        media: jugador2.media,
        pos_principal: jugador2.pos_principal,
        pos_secundaria: jugador2.pos_secundaria,
        posicionUsada: posicion,
      });

      usados.add(jugador1.id);
      usados.add(jugador2.id);
    }
  });
  equipoBlanco.mediaTotal = calcularMedia(equipoBlanco.jugadores);
  equipoNegro.mediaTotal = calcularMedia(equipoNegro.jugadores);

  return { equipoBlanco, equipoNegro };
}

// Ajustar balance de equipos intercambiando jugadores si es necesario
function balancearEquipos(equipoBlanco, equipoNegro, jugadores) {
  let diferencia = Math.abs(equipoBlanco.mediaTotal - equipoNegro.mediaTotal);
  let mejorIntercambio = null;
  while (diferencia > 1) {
    for (const j1 of equipoBlanco.jugadores) {
      for (const j2 of equipoNegro.jugadores) {
        if (j1.posicionUsada === j2.posicionUsada) {
          const nuevoEB = [...equipoBlanco.jugadores].map((j) =>
            j === j1 ? j2 : j
          );
          const nuevoEN = [...equipoNegro.jugadores].map((j) =>
            j === j2 ? j1 : j
          );
          const nuevaMediaEB = calcularMedia(nuevoEB);
          const nuevaMediaEN = calcularMedia(nuevoEN);
          const nuevaDiferencia = Math.abs(nuevaMediaEB - nuevaMediaEN);

          if (nuevaDiferencia < diferencia) {
            mejorIntercambio = { j1, j2 };
            diferencia = nuevaDiferencia;
          }
        }
      }
    }

    if (mejorIntercambio) {
      equipoBlanco.jugadores = equipoBlanco.jugadores.map((j) =>
        j === mejorIntercambio.j1 ? mejorIntercambio.j2 : j
      );
      equipoNegro.jugadores = equipoNegro.jugadores.map((j) =>
        j === mejorIntercambio.j2 ? mejorIntercambio.j1 : j
      );
      equipoBlanco.mediaTotal = calcularMedia(equipoBlanco.jugadores);
      equipoNegro.mediaTotal = calcularMedia(equipoNegro.jugadores);
    } else {
      break;
    }
  }

  // Determinar suplentes y asignarlos al equipo con menor media
  const usados = new Set(
    [...equipoBlanco.jugadores, ...equipoNegro.jugadores].map((j) => j.jugador)
  );
  const suplentes = jugadores
    .filter((j) => !usados.has(j._id)) // Filtra los jugadores que no están en usados
    .sort((a, b) => b.media - a.media); // Ordena de mayor a menor por media
  // const suplentes = jugadores.filter((j) => !usados.has(j.id)).sort((a, b) => b.media - a.media);
  suplentes.forEach((jugador) => {
    if (equipoBlanco.mediaTotal <= equipoNegro.mediaTotal) {
      equipoBlanco.suplentes.push({
        jugador: jugador._id,
        media: jugador.media,
        equipo: "Blanco",
      });
      equipoBlanco.mediaTotal += jugador.media;
    } else {
      equipoNegro.suplentes.push({
        jugador: jugador._id,
        media: jugador.media,
        equipo: "Negro",
      });
      equipoNegro.mediaTotal += jugador.media;
    }
  });

  //   //PRUEBA
  const calcNuevaMediaBlancoTotal = [
    ...equipoBlanco.jugadores,
    ...equipoBlanco.suplentes,
  ];
  const calcNuevaMediaNegroTotal = [
    ...equipoNegro.jugadores,
    ...equipoNegro.suplentes,
  ];
  equipoBlanco.mediaTotal = Math.round(
    calcularMedia(calcNuevaMediaBlancoTotal),
    2
  );
  equipoNegro.mediaTotal = Math.round(
    calcularMedia(calcNuevaMediaNegroTotal),
    2
  );
  return {
    equipoBlanco,
    equipoNegro,
    suplentes: [...equipoBlanco.suplentes, ...equipoNegro.suplentes],
  };
}

// Función para calcular la media de un equipo
function calcularMedia(equipo) {
  return equipo.reduce((sum, j) => sum + j.media, 0) / equipo.length;
}
async function actualizarEstadisticas(jugadorId, partido) {
  const jugador = await Jugador.findById(jugadorId);
  if (!jugador) return;

  // Extraer datos actuales
  const stats = jugador.estadisticas;
  stats.partidosJugados += 1;

  // Determinar si el jugador ganó
  if (
    (partido.equipoBlanco.jugadores.some((j) => j.jugador.equals(jugadorId)) &&
      partido.marcador.equipoBlanco > partido.marcador.equipoNegro) ||
    (partido.equipoNegro.jugadores.some((j) => j.jugador.equals(jugadorId)) &&
      partido.marcador.equipoNegro > partido.marcador.equipoBlanco)
  ) {
    stats.partidosGanados += 1;
  }

  // Actualizar goles, asistencias y atajadas
  const registroHighlight = partido.highlights.find((g) =>
    g.jugador.equals(jugadorId)
  );

  if (registroHighlight) {
    stats.goles += registroHighlight.goles;
    stats.asistencias += registroHighlight.asistencias;
    stats.atajadas += registroHighlight.atajadas;
  }

  // Actualizar promedio de media
  stats.promedioMedia =
    (stats.promedioMedia * (stats.partidosJugados - 1) + jugador.media) /
    stats.partidosJugados;

  // Guardar cambios
  await jugador.save();
}

router.post("/generar",authMiddleware, async (req, res) => {
  const { ids } = req.body;
  try {
    const jugadores = await Jugador.find({ _id: { $in: ids } });

    if (jugadores.length !== ids.length) {
      return res.status(400).send("Algunos jugadores no fueron encontrados");
    }
    const { equipoBlanco, equipoNegro } = armarEquipos(jugadores);
    const {
      equipoBlanco: EB,
      equipoNegro: EN,
      suplentes,
    } = balancearEquipos(equipoBlanco, equipoNegro, jugadores);

    // Crear el partido
    const partido = new Partido({
      //fecha: getNextSunday(),
      equipoBlanco: EB,
      equipoNegro: EN,
      marcador: { equipoBlanco: 0, equipoNegro: 0 },
      suplentes: suplentes,
      highlights: [],
    });
    await partido.save();
    res.status(201).json({
      ...partido.toObject(), // Convertimos el objeto de Mongoose a un objeto JS plano
      id: partido._id, // Agregamos el campo `id`
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error al crear el partido" });
  }
});
// Ruta para eliminar un partido por su ID
router.delete("/eliminarPartido/:id", authMiddleware,  async (req, res) => {
  try {
    const partidoId = req.params.id;
    const verificar = await Partido.findById(partidoId);
    if (verificar.estado === "Cerrado") {
      return res
        .status(400)
        .json({ message: "No se puede eliminar un partido finalizado" });
    }
    // Intentar eliminar el partido de la base de datos
    const partidoEliminado = await Partido.findByIdAndDelete(partidoId);

    if (!partidoEliminado) {
      return res.status(404).json({ message: "Partido no encontrado" });
    }

    // Respuesta si se elimina correctamente
    res.status(200).json({ message: "Partido eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Hubo un problema al eliminar el partido" });
  }
});

router.put("/actualizar-partido/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { marcador, highlights, estado } = req.body;

    // Verificar que se envían datos válidos
    if (!marcador || !highlights) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const partidoActualizado = await Partido.findByIdAndUpdate(
      id,
      { marcador, highlights, estado },
      { new: true }
    );

    if (partidoActualizado.estado === "Cerrado") {
      const jugadoresIds = [
        ...partidoActualizado.equipoBlanco.jugadores.map((j) => j.jugador),
        ...partidoActualizado.equipoNegro.jugadores.map((j) => j.jugador),
      ];
      for (const jugadorId of jugadoresIds) {
        await actualizarEstadisticas(jugadorId, partidoActualizado);
      }
    }

    if (!partidoActualizado) {
      return res.status(404).json({ mensaje: "Partido no encontrado" });
    }

    res.json(partidoActualizado);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al actualizar el partido",
      error: error.message,
    });
  }
});

router.get("/listar-partidos", authMiddleware, async (req, res) => {
  try {
    const partidos = await Partido.find()
      .sort({ fecha: -1 })
      .populate(
        "equipoBlanco.jugadores.jugador equipoNegro.jugadores.jugador suplentes.jugador highlights.jugador"
      );
    // Agregar el campo 'id' igual al '_id' en cada partido
    const partidosConId = partidos.map((partido) => ({
      ...partido.toObject(),
      id: partido._id.toString(), // Aquí agregamos el campo 'id'
    }));
    res.json(partidosConId);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los partidos." });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const partido = await Partido.findById(id).populate(
      "equipoBlanco.jugadores.jugador equipoNegro.jugadores.jugador suplentes.jugador highlights.jugador"
    );
    // Agregar el campo 'id' igual al '_id' en cada partido
    const partidoConId = {
      ...partido.toObject(),
      id: partido._id,
    };
    res.json(partidoConId);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error al obtener los partidos." });
  }
});

module.exports = router;
