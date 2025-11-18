import 'dotenv/config';
import Fastify from 'fastify';
import authRoutes from './routes/auth.route.js';


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
