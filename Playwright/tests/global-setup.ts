import { request } from '@playwright/test';

async function globalSetup() {
  const requestContext = await request.newContext();
  try {
    const response = await requestContext.post('http://localhost:3000/api/db/reset');
    if (response.ok()) {
      console.log('Successfully reset database in global setup.');
    } else {
      console.error('Failed to reset database in global setup:', await response.text());
    }
  } catch (err) {
    console.error('Error during global setup database reset:', err);
  } finally {
    await requestContext.dispose();
  }
}

export default globalSetup;
