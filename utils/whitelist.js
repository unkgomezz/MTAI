require('dotenv').config();

function isUserAllowed(userId) {
  const allowedUsers = process.env.WHITELIST_USERS?.split(',') || [];
  return allowedUsers.includes(userId);
}

module.exports = { isUserAllowed };

function logAccessAttempt(userId, username) {
    console.log(`[WHITELIST] Tentativa de acesso: ${username} (${userId}) - ${
      isUserAllowed(userId) ? 'PERMITIDO' : 'NEGADO'
    }`);
  }
  
  module.exports = { isUserAllowed, logAccessAttempt };