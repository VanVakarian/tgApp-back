// // Интервал проверки сессий в миллисекундах (10 минут)
// const SESSION_CHECK_INTERVAL = 10 * 60 * 1000;

// export function startSessionMonitoring() {
//   // Периодически проверяем сессии всех пользователей
//   setInterval(async () => {
//     try {
//       // Получаем всех активных пользователей с SSE соединениями
//       const userIds = Array.from(sseClients.keys());

//       for (const userId of userIds) {
//         const notifyFunction = sseClients.get(userId);
//         if (notifyFunction) {
//           await tgAuthService.checkSessionAndNotify(userId, notifyFunction);
//         }
//       }
//     } catch (error) {
//       console.error('Error in session monitoring:', error);
//     }
//   }, SESSION_CHECK_INTERVAL);
// }

// export async function checkUserSession(userId) {
//   try {
//     const session = await db.getTelegramSession(userId);
//     if (!session) return false;

//     return await tgAuthService.validateSession(session);
//   } catch (error) {
//     console.error(`Error checking session for user ${userId}:`, error);
//     return false;
//   }
// }

// export function notifyReauthRequired(userId) {
//   const notifyFunction = sseClients.get(userId);
//   if (notifyFunction) {
//     notifyFunction({
//       event: 'auth_required',
//       data: 'Session expired, reauthorization required',
//     });
//   }
// }
