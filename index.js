require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Partials,
  ActivityType 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// ======================
// CARREGAMENTO DE COMANDOS
// ======================

client.commands = new Collection();

// Carrega comandos normais
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Carrega comandos de admin
const adminCommandsPath = path.join(__dirname, 'commands', 'admin');
if (fs.existsSync(adminCommandsPath)) {
  const adminCommandFiles = fs.readdirSync(adminCommandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of adminCommandFiles) {
    const command = require(path.join(adminCommandsPath, file));
    client.commands.set(command.data.name, command);
  }
}

// Cache para arquivos
const fileCache = new Map();

// ======================
// EVENTOS
// ======================

client.on('ready', () => {
  console.log(`✅ ${client.user.tag} conectado com sucesso.`);
  
  // Status customizado do bot
  client.user.setPresence({
    activities: [{
      name: 'mtai.com.br',
      type: ActivityType.Playing
    }],
    status: 'online'
  });
});

client.on('interactionCreate', async interaction => {
  try {
    // Comandos de barra (/)
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction, fileCache);
    }
    
    // Botões
    else if (interaction.isButton()) {
      if (interaction.customId === 'download_config') {
        const userId = interaction.user.id;
        const cachedFile = fileCache.get(userId);

        if (!cachedFile) {
          return await interaction.reply({
            content: '❌ Arquivo não encontrado ou expirado. Execute o comando novamente.',
            ephemeral: true
          });
        }

        await interaction.reply({
          files: [{
            attachment: cachedFile.content,
            name: cachedFile.filename || `config_${userId}.lua`
          }],
          ephemeral: true
        });

        fileCache.delete(userId);
      }
    }
    
    // Menus de seleção
    else if (interaction.isStringSelectMenu()) {
      // Implementar lógica para menus se necessário
    }

  } catch (error) {
    console.error('Erro na interação:', error);
    
    const errorResponse = {
      content: '❌ Ocorreu um erro ao processar esta ação.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorResponse);
    } else {
      await interaction.reply(errorResponse);
    }
  }
});

// ======================
// TRATAMENTO DE ERROS
// ======================

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error);
});

// ======================
// INICIAR BOT
// ======================

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Iniciando conexão com o Discord...'))
  .catch(error => console.error('Erro ao conectar:', error));