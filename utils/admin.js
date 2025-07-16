// Lista de administradores (IDs Discord)
const ADMINS = [
  ];
  
  // Configurações do sistema admin
  const ADMIN_CONFIG = {
    tokenResetTime: 24 * 60 * 60 * 1000, // 24h em ms
    embedColor: 0x00FF11 // Verde neon
  };
  
  // Função de verificação
  function isAdmin(userId) {
    return ADMINS.includes(userId);
  }
  
  module.exports = {
    ADMINS,
    isAdmin,
    ADMIN_CONFIG
  };