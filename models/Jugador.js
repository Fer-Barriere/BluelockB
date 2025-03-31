const mongoose = require("mongoose");

const jugadorSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    apodo: { type: String, required: true},
    pos_principal: {type: String, required: true},
    pos_secundaria: {type: String, required: true},
    pierna_habil: {type: String, required: true},
    media: {type: Number, required: true, default: 0},
    estadisticas: {
        partidosJugados: { type: Number, default: 0 },
        partidosGanados: { type: Number, default: 0 },
        goles: { type: Number, default: 0 },
        asistencias: { type: Number, default: 0 },
        atajadas: { type: Number, default: 0 },
      },
},{
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    },
    timestamps:true
});

module.exports = mongoose.model("Jugador", jugadorSchema);
