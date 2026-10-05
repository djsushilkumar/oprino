import { createAuthService } from './server.js';

const { app } = createAuthService();

async function start() {
  try {
    const address = await app.listen({ port: 3088, host: '0.0.0.0' });
    console.log(`Better Auth test server running at ${address}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
