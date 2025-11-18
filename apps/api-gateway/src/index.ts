import Fastify from 'fastify';
import authRoutes from './routes/auth.route.js';
import 'dotenv/config';

const app = Fastify();

app.register(authRoutes);

const PORT = process.env.PORT || 3000;
app.listen({ port: Number(PORT) }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
