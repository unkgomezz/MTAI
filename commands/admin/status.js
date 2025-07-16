const { SlashCommandBuilder } = require('discord.js');
const { getTokenUsage } = require('../../utils/logger');
const { isAdmin, ADMIN_CONFIG } = require('../../utils/admin'); // Importe do admin.js

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('[ADMIN] Verifica o status e uso do sistema.'),
    
  async execute(interaction) {
    // Verificação de admin usando a função importada
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({
        embeds: [{
          color: ADMIN_CONFIG.embedColor,
          title: '⛔ Acesso restrito',
          description: 'Apenas administradores podem usar este comando.',
          footer: { text: `ID: ${interaction.user.id}` }
        }],
        ephemeral: true
      });
    }

    const { dailyTokens, TOKEN_LIMIT } = getTokenUsage();
    const resetTime = Date.now() + ADMIN_CONFIG.tokenResetTime;

    await interaction.reply({
      embeds: [{
        color: ADMIN_CONFIG.embedColor,
        title: '🔧 Status do Sistema',
        fields: [
          {
            name: '🧠 Uso de IA',
            value: `▰${'▰'.repeat(Math.floor(dailyTokens/TOKEN_LIMIT*10))}▱${'▱'.repeat(10-Math.floor(dailyTokens/TOKEN_LIMIT*10))} ${dailyTokens}/${TOKEN_LIMIT} tokens`,
            inline: false
          },
          {
            name: '🔄 Reset em',
            value: `<t:${Math.floor(resetTime/1000)}:R>`,
            inline: true
          }
        ],
        footer: { text: '© MTAI Inc.' }
      }],
      ephemeral: true
    });
  }
};