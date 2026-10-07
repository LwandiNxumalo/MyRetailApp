import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/products/products.routes.js';
import shoppingListRoutes from './modules/shopping-lists/shopping-lists.routes.js';
import storeRoutes from './modules/stores/stores.routes.js';
import favouriteRoutes from './modules/favourites/favourites.routes.js';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shopping-lists', shoppingListRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/favourites', favouriteRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'BasketRadar API' });
});

export default app;