const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajuda')
    .setDescription('[USER] Mostra como utilizar o bot corretamente.'),
    
  async execute(interaction) {
    await interaction.reply({
      embeds: [{
        title: '🤖 MTAI - Ajuda',
        description: 'Envie um arquivo `config.lua` com o comando `/configurar` seguido da descrição do que deseja.\n\nExemplo:\n`/configurar "Adicione AK-47 ao inventário"`',
        color: 0x00FF11
      }]
    });
  }
};