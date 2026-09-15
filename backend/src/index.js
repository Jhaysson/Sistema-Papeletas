import express from 'express';
import cors from 'cors';
import papeletasRouter from './routes/papeletas.js';
import reportesRouter from './routes/reportes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/papeletas', papeletasRouter);
app.use('/api/reportes', reportesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});