require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jugadorRoutes = require('./routes/jugador.routes')
const usuarioRoutes = require('./routes/usuario.routes')
const partidoRoutes = require('./routes/partido.routes')

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { 
    dbName: "Bluelock"
})
   .then(() => console.log('MongoDB Conectado'))
   .catch(err => console.error(err));

app.use('/api/jugadores/', jugadorRoutes);
app.use('/api/usuarios/', usuarioRoutes);
app.use('/api/partidos/', partidoRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
