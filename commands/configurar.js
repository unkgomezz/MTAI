const { SlashCommandBuilder } = require('discord.js');
const { gerarRespostaIA } = require('../utils/ia.js');
const { sanitizeLua } = require('../utils/sanitize');
const { isUserAllowed, logAccessAttempt } = require('../utils/whitelist');
const { sendLog } = require('../utils/logger');
const { getTokenUsage } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar')
    .setDescription('[USER] Configura um script .lua baseado no seu pedido.')
    .addStringOption(option =>
      option.setName('pedido')
        .setDescription('O que deseja configurar? Ex: "Adicione AK-47 ao inventário"')
        .setRequired(true))
    .addAttachmentOption(option =>
      option.setName('arquivo')
        .setDescription('Arquivo .lua (máx. 15KB)')
        .setRequired(true)),
        
  async execute(interaction) {
    const startTime = Date.now(); // For performance logging
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    logAccessAttempt(userId, username);

    if (!isUserAllowed(userId)) {
      await sendLog(interaction, null, null, { 
        error: 'Tentativa de acesso não autorizado' 
      });
      return interaction.reply({
        embeds: [
          {
            color: 0x00FF11,
            title: '🔒 Acesso restrito',
            description: 'Você não possui permissão para usar este comando.',
            fields: [
              {
                name: 'Solicite acesso!',
                value: 'Contate um desenvolvedor do MTAI.'
              }
            ],
            footer: {
              text: `© MTAI Inc.`
            }
          }
        ],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const pedido = interaction.options.getString('pedido');
    const attachment = interaction.options.getAttachment('arquivo');

    // Validação do arquivo
    if (!attachment?.name || !attachment.name.endsWith('.lua')) {
      await sendLog(interaction, null, null, { 
        error: 'Tipo de arquivo inválido' 
      });
      return interaction.editReply({
        embeds: [{
          color: 0x00FF11,
          title: '❌ Tipo de arquivo inválido',
          description: 'Apenas arquivos **.lua** são aceitos.',
          fields: [
            {
              name: 'Solução:',
              value: 'Envie um arquivo com extensão `.lua` válido.'
            }
          ],
          footer: {
            text: `© MTAI Inc.`
          }
        }],
        ephemeral: true
      });
    }

    try {
      const luaContent = await fetch(attachment.url).then(res => res.text());
      
      // Log initial request
      await sendLog(interaction, luaContent, { 
        status: 'process_started',
        fileSize: luaContent.length
      });

      if (luaContent.length > 15000) {
        await sendLog(interaction, luaContent, null, { 
          error: 'Arquivo muito grande' 
        });
        return interaction.editReply({
          embeds: [{
            color: 0x00FF11,
            title: '📁 Tamanho do arquivo excedido',
            description: 'O arquivo enviado é muito grande para processamento.',
            fields: [
              {
                name: 'Limite atual:',
                value: '15KB (15.000 caracteres)',
                inline: true
              },
              {
                name: 'Tamanho do seu arquivo:',
                value: `${Math.round(luaContent.length / 1024 * 100) / 100}KB (${luaContent.length} caracteres)`,
                inline: true
              }
            ],
            footer: {
              text: '© MTAI Inc.'
            }
          }],
          ephemeral: true
        });
      }

      const sanitizedContent = sanitizeLua(luaContent);
      const { codigo, instrucoes } = await gerarRespostaIA(sanitizedContent, pedido);

      // Log successful processing
      await sendLog(interaction, luaContent, {
        codigo,
        metadata: {
          processingTime: Date.now() - startTime,
          model: process.env.OPENROUTER_MODEL,
          charCount: codigo.length
        }
      });

      await interaction.editReply({
        embeds: [{
          color: 0x00FF11,
          title: '✅ Configuração atualizada',
          description: instrucoes,
          fields: [
            {
              name: '👤 Solicitado por:',
              value: username,
              inline: true
            },
            {
              name: '📝 Tamanho:',
              value: `${codigo.length} caracteres`,
              inline: true
            },
            {
              name: '⏱️ Tempo de processamento:',
              value: `${Date.now() - startTime}ms`,
              inline: true
            }
          ],
          footer: {
            text: `© MTAI Inc. | ${new Date().toLocaleString()}`
          },
        }],
        files: [{
          attachment: Buffer.from(codigo),
          name: `config_editado_${Date.now()}.lua`
        }]
      });

    } catch (error) {
      console.error(`Erro no processamento [${username}]:`, error);
      
      // Log error
      await sendLog(interaction, null, null, {
        error: error.message,
        stack: error.stack,
        processingTime: Date.now() - startTime
      });

      await interaction.editReply({
        embeds: [{
          color: 0x00FF11,
          title: '⚠️ Erro no processamento',
          description: `**Detalhes:** ${error.message || "Erro desconhecido"}`,
          fields: [
            {
              name: '📌 Dica:',
              value: 'Formule pedidos como:\n`"Altere [PARÂMETRO] para [VALOR]"`\nEx: `"Altere spawnVeh para 411"`',
              inline: false
            },
            {
              name: '🛠️ Solução:',
              value: '1. Verifique a sintaxe do pedido\n2. Revise o arquivo original\n3. Tente novamente',
              inline: false
            }
          ],
          footer: {
            text: `© MTAI Inc. | ${new Date().toLocaleString()}`
          },
        }],
        ephemeral: true
      });
    }
    console.log('🔍 Tokens usados nesta sessão:', getTokenUsage());
  }
};