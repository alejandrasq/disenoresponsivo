const path = require('path');
// Carga dotenv de forma flexible en local sin romper Vercel en producción
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { isAllowedFrontendOrigin } = require('./middleware/auth');

const app = express();

// Clave secreta con un fallback seguro de más de 32 bytes
const SESSION_SECRET = process.env.SESSION_SECRET || 'c7f9a8d2e1b4c6a8f0d3e5b7a9c1e3f5b7d9a1c3e5f7b9a1c3e5f7b9a1c3e5f7';

if (Buffer.byteLength(SESSION_SECRET) < 32) {
  throw new Error('SESSION_SECRET debe tener al menos 32 bytes aleatorios.');
}

if (!process.env.SESSION_SECRET) {
  console.warn('SESSION_SECRET no está configurado en las variables de entorno; usando fallback por defecto.');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedFrontendOrigin(origin)) return callback(null, true);
    return callback(new Error('Origen CORS no permitido.'));
  },
  credentials: true
}));
app.use(express.json());

// Conexión a MongoDB (optimizada para funciones Serverless)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/justificat';

let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log(`Conectado a MongoDB correctamente: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('Error al conectar MongoDB:', err);
  }
};

// Middleware para asegurar la conexión a BD en cada petición
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Rutas de la API
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/justifications', require('./routes/justifications'));

// En entorno local iniciamos el servidor con app.listen; en Vercel exportamos la app
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}

// Exportación requerida para Vercel Serverless Functions
module.exports = app;