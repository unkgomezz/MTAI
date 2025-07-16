const { SlashCommandBuilder } = require('discord.js');
const { isAdmin } = require('../../utils/admin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('[ADMIN] Envia um embed para um canal específico.')
    .addStringOption(option =>
      option.setName('titulo')
        .setDescription('Título do anúncio')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('mensagem')
        .setDescription('Conteúdo da mensagem')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('canal')
        .setDescription('Canal para enviar o anúncio')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('autor')
        .setDescription('Autor do anúncio (opcional)'))
    .addStringOption(option =>
      option.setName('cor')
        .setDescription('Cor do embed em hexadecimal (ex: 00FF11)'))
    .addStringOption(option =>
      option.setName('imagem')
        .setDescription('URL da imagem (opcional)'))
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('URL da thumbnail (opcional)')),

  async execute(interaction) {
    // Verificação de admin
    if (!isAdmin(interaction.user.id)) {
      return interaction.reply({
        content: '❌ Apenas administradores podem usar este comando!',
        ephemeral: true
      });
    }

    // Obter todas as opções
    const titulo = interaction.options.getString('titulo');
    const mensagem = interaction.options.getString('mensagem');
    const canal = interaction.options.getChannel('canal');
    const autor = interaction.options.getString('autor') || interaction.user.username;
    const cor = interaction.options.getString('cor') || '00FF11';
    const imagem = interaction.options.getString('imagem');
    const thumbnail = interaction.options.getString('thumbnail');

    // Verificação adicional do canal
    if (!canal) {
      return interaction.reply({
        content: '❌ Canal inválido ou não encontrado!',
        ephemeral: true
      });
    }

    try {
      // Verificar se o bot tem permissão no canal
      const permissions = canal.permissionsFor(interaction.client.user);
      if (!permissions.has('SendMessages')) {
        return interaction.reply({
          content: '❌ Não tenho permissão para enviar mensagens nesse canal!',
          ephemeral: true
        });
      }

      // Criar embed
      const embed = {
        title: titulo,
        description: mensagem,
        color: parseInt(cor.replace('#', ''), 16),
        timestamp: new Date(),
        author: {
          name: autor,
          icon_url: interaction.user.displayAvatarURL()
        },
        footer: {
          text: '© MTAI Inc.'
        }
      };

      // Adicionar mídias se existirem
      if (imagem) embed.image = { url: imagem };
      if (thumbnail) embed.thumbnail = { url: thumbnail };

      // Enviar para o canal especificado
      await canal.send({ embeds: [embed] });

      // Confirmar para o admin
      await interaction.reply({
        content: `✅ Anúncio enviado com sucesso para ${canal}!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Erro no broadcast:', error);
      await interaction.reply({
        content: '❌ Erro ao enviar o anúncio! Verifique o console.',
        ephemeral: true
      });
    }
  }
};