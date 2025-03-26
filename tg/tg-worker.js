import { parentPort } from 'worker_threads';
import { clearAuthSession, completeAuthWithCode, startAuthProcess } from './tg-auth.js';

parentPort.on('message', async (message) => {
  console.log('Worker received message:', message.type, 'with data:', JSON.stringify(message));

  try {
    let response;

    switch (message.type) {
      case 'AUTH_INIT':
        console.log('Worker starting authorization for phone:', message.phone);
        response = await startAuthProcess(message.phone, message.password);

        parentPort.postMessage({
          type: response.success ? 'AUTH_CODE_REQUIRED' : 'AUTH_ERROR',
          success: response.success,
          error: response.error,
        });
        break;

      case 'AUTH_SUBMIT_CODE':
        console.log('Worker received code for phone:', message.phone);
        response = await completeAuthWithCode(message.code, message.userId);

        parentPort.postMessage({
          type: response.success ? 'AUTH_COMPLETE' : 'AUTH_ERROR',
          success: response.success,
          session: response.session,
          error: response.error,
        });
        break;

      case 'AUTH_CANCEL':
        response = clearAuthSession();
        parentPort.postMessage({
          type: 'AUTH_CANCELLED',
          success: true,
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
        parentPort.postMessage({
          type: 'UNKNOWN_MESSAGE',
          success: false,
          error: 'Unknown message type',
        });
    }
  } catch (error) {
    console.error('Error in worker:', error);
    parentPort.postMessage({
      type: 'WORKER_ERROR',
      success: false,
      error: error.message,
    });
  }
});
