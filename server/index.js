require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { attachUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const favouriteRoutes = require('./routes/favourites');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/favourites', favouriteRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const publicDir = path.join(__dirname, '..', 'public');
const spaIndex = path.join(clientDist, 'index.html');
const spaReady = fs.existsSync(spaIndex);

if (spaReady) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(spaIndex);
  });
} else {
  app.use(express.static(publicDir));
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  const message =
    status === 500 ? 'Something went wrong. Please try again later.' : err.message;
  res.status(status).json({ error: message });
});

const server = app.listen(PORT, () => {
  console.log(`Buyer portal listening on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  // Windows often reports EADDRINUSE with errno -4091 (libuv).
  const inUse =
    err.code === 'EADDRINUSE' ||
    err.errno === -4091 ||
    err.code === 'EACCES';
  if (inUse) {
    console.error(
      `Cannot listen on port ${PORT} (${err.code || err.errno}): address already in use or permission denied.`,
    );
    console.error('Try a different PORT in .env, or stop the process using that port.');
    process.exit(1);
    return;
  }
  console.error('Server error:', err);
  process.exit(1);
});
