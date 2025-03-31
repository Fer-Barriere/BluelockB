const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
    nombre: {type: String, required: [true, 'El Nombre es Necesario']},
    email: { type: String, unique: true, required: [true, 'El Correo es Necesario']},
    password: {type: String, required: [true, 'Obligatorio']},
},{
    toJSON:{
        virtuals: true
    },
    toObject:{
        virtuals: true
    },
    timestamps:true
});

module.exports = mongoose.model("Usuario", usuarioSchema);
