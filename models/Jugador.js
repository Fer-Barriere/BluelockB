const mongoose = require("mongoose");

const jugadorSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    apodo: { type: String, required: true },
    pos_principal: { type: String, required: true },
    pos_secundaria: { type: String, required: true },
    pierna_habil: { type: String, required: true },
    media: { type: Number, required: true, default: 0 },
    datosMedia: {
        ritmo: {type: Number, required: true, default: 0},
        tiro: {type: Number, required: true, default: 0},
        pase: {type: Number, required: true, default: 0},
        regate: {type: Number, required: true, default: 0},
        defensa: {type: Number, required: true, default: 0},
        fisico: {type: Number, required: true, default: 0},
    },
    estadisticas: {
      partidosJugados: { type: Number, default: 0 },
      partidosGanados: { type: Number, default: 0 },
      goles: { type: Number, default: 0 },
      asistencias: { type: Number, default: 0 },
      atajadas: { type: Number, default: 0 },
      porcentajeVictoria: { type: Number, default: 0},
    },
    estadoPagos: {type: Boolean,default: false},
  },
  {
    timestamps: true,
    toObject: { virtuals: true }, // Habilita los virtuals en objetos normales
    toJSON: { virtuals: true },   // Asegura que los virtuals también estén en JSON
  }
);

// Middleware para reemplazar _id con id en las respuestas JSON
jugadorSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id; // Copiar _id a id
    delete ret._id;   // Eliminar _id
    delete ret.__v;   // (Opcional) Eliminar el campo __v que agrega Mongoose
    return ret;
  },
});

module.exports = mongoose.model("Jugador", jugadorSchema);
