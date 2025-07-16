const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [
  require('../commands/ajuda').data.toJSON(),
  require('../commands/configurar').data.toJSON(),
  require('../commands/admin/status').data.toJSON(),
  require('../commands/admin/broadcast').data.toJSON(),
  require('../commands/admin/clear').data.toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔁 Registrando comandos...');
    
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log('✅ Comandos registrados com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();