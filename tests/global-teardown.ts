import { request } from '@playwright/test';

async function globalTeardown() {
  const requestContext = await request.newContext();
  try {
    const response = await requestContext.post('http://localhost:3000/api/db/reset');
    if (response.ok()) {
      console.log('Successfully reset database in global teardown.');
    } else {
      console.error('Failed to reset database in global teardown:', await response.text());
    }
  } catch (err) {
    console.error('Error during global teardown database reset:', err);
  } finally {
    await requestContext.dispose();
  }
}

export default globalTeardown;
