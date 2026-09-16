import express from 'express';
import cors from 'cors';
import papeletasRouter from './routes/papeletas.js';
import reportesRouter from './routes/reportes.js';
import reportesV1Router from './routes/reportesV1.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/papeletas', papeletasRouter);
app.use('/api/reportes', reportesRouter);
app.use('/api/v1/reportes', reportesV1Router);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});