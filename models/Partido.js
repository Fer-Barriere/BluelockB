const mongoose = require("mongoose");

const PartidoSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  equipoBlanco: {
    jugadores: [
      {
        jugador: { type: mongoose.Schema.Types.ObjectId, ref: "Jugador" },
        media: Number,
        posicionUsada: String,
      },
    ],
    mediaTotal: Number,
  },
  equipoNegro: {
    jugadores: [
      {
        jugador: { type: mongoose.Schema.Types.ObjectId, ref: "Jugador" },
        media: Number,
        posicionUsada: String,
      },
    ],
    mediaTotal: Number,
  },
  suplentes: [
    {
      jugador: { type: mongoose.Schema.Types.ObjectId, ref: "Jugador" },
      media: Number,
      equipo: String,
    },
  ],
  marcador: {
    equipoBlanco: { type: Number, default: 0 },
    equipoNegro: { type: Number, default: 0 },
  },
  highlights : [
    {
      jugador: { type: mongoose.Schema.Types.ObjectId, ref: "Jugador" },
      equipo: String,
      goles: Number,
      asistencias: Number,
      atajadas: Number,
    },
  ],
  estado: { type: String, enum: ["Abierto", "Cerrado"], default: "Abierto" },
});

module.exports = mongoose.model("Partido", PartidoSchema);
