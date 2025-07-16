const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isAdmin } = require('../../utils/admin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('[ADMIN] Limpa as mensagens do chat.')
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de mensagens para apagar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Limpar apenas mensagens de um usuário específico'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    // Verificação de permissão dupla (admin + ManageMessages)
    if (!isAdmin(interaction.user.id) && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ Você precisa ter permissão para gerenciar mensagens!',
        ephemeral: true
      });
    }

    const quantidade = interaction.options.getInteger('quantidade');
    const usuario = interaction.options.getUser('usuario');
    const canal = interaction.channel;

    try {
      // Buscar mensagens para deletar
      const messages = await canal.messages.fetch({ limit: quantidade });
      const toDelete = usuario 
        ? messages.filter(m => m.author.id === usuario.id)
        : messages;

      // Verificar se há mensagens para apagar
      if (toDelete.size === 0) {
        return interaction.reply({
          content: '❌ Nenhuma mensagem encontrada para apagar!',
          ephemeral: true
        });
      }

      // Apagar em lotes (Discord limita a 100 por vez)
      await canal.bulkDelete(toDelete, true);

      // Responder com confirmação
      const reply = await interaction.reply({
        content: `✅ ${toDelete.size} mensagens ${usuario ? `do usuário ${usuario.tag} ` : ''}foram apagadas!`,
        ephemeral: true
      });

      // Apagar a confirmação após 5 segundos
      setTimeout(() => reply.delete().catch(console.error), 5000);

    } catch (error) {
      console.error('Erro ao limpar mensagens:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao apagar mensagens!',
        ephemeral: true
      });
    }
  }
};