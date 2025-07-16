require('dotenv').config();
const axios = require('axios');
const { encode } = require('gpt-3-encoder'); // Para contagem precisa de tokens

// Cache de uso diário (opcional)
let dailyTokens = 0;
const TOKEN_LIMIT = 200000; // Limite diário seguro

// Função para estimar tokens (com fallback)
function countTokens(text) {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    return Math.ceil(text.length / 3.5); // Fallback aproximado
  }
}

async function sendLog(interaction, luaContent, respostaIA, error = null) {
  if (!process.env.LOG_WEBHOOK_URL) return;

  const { user, options } = interaction;
  const attachment = options.getAttachment('arquivo');
  const pedido = options.getString('pedido');

  // Cálculo de tokens
  const inputTokens = countTokens(luaContent) + countTokens(pedido);
  const outputTokens = countTokens(respostaIA?.codigo);
  const totalTokens = inputTokens + outputTokens;
  
  // Atualiza contador diário
  dailyTokens += totalTokens;
  const tokenPercentage = (dailyTokens / TOKEN_LIMIT * 100).toFixed(1);

  // Construção do Embed
  const embed = {
    color: error ? 0x00FF11 : 0x00FF11,
    title: error ? '⚠️ Erro no processamento' : '📊 Log de configuração',
    description: `**Usuário:** ${user.tag} (${user.id})`,
    fields: [
      {
        name: '📂 Arquivo',
        value: [
          `Nome: ${attachment?.name || 'N/A'}`,
          `Tamanho: ${luaContent?.length || 0} caracteres`,
          `Tokens Input: ${inputTokens}`
        ].join('\n'),
        inline: true
      },
      {
        name: '📌 Pedido',
        value: `\`\`\`${pedido.substring(0, 150)}${pedido.length > 150 ? '...' : ''}\`\`\``,
        inline: false
      },
      {
        name: '🧮 Uso de IA',
        value: [
          `Tokens Output: ${outputTokens}`,
          `Total: ${totalTokens} tokens`,
          `Modelo: ${process.env.OPENROUTER_MODEL || 'Claude 3 Haiku'}`
        ].join('\n'),
        inline: true
      },
      {
        name: '📅 Uso Diário',
        value: `${dailyTokens}/${TOKEN_LIMIT} (${tokenPercentage}%)`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: '© MTAI Inc. | ' + new Date().toLocaleString() }
  };

  // Adiciona seção de erro se necessário
//  if (error) {
//    embed.fields.push({
//      name: '❌ Detalhes do Erro',
//      value: `\`\`\`${error.message.substring(0, 500)}\`\`\``,
//      inline: false
//    });

//    if (error.stack) {
//      embed.fields.push({
//        name: '🔍 Stack Trace',
//        value: `\`\`\`${error.stack.substring(0, 300)}...\`\`\``,
//        inline: false
//      });
//    }
//  }

  // Alertas de limite
  if (tokenPercentage > 80) {
    embed.fields.push({
      name: '🚨 Alerta de Limite',
      value: `Uso diário próximo ao limite (${tokenPercentage}%)`,
      inline: false
    });
    embed.color = 0x00FF11; // Laranja para alertas
  }

  // Envia via webhook
  try {
    await axios.post(process.env.LOG_WEBHOOK_URL, { 
      embeds: [embed],
      content: tokenPercentage > 90 ? `@here Limite diário de tokens atingido (${tokenPercentage}%)` : null
    });
  } catch (err) {
    console.error('Falha no webhook:', err.message);
    
    // Fallback: Log local
    fs.appendFileSync('./logs/backup.log', 
      `${new Date().toISOString()} | ${user.tag} | Tokens: ${totalTokens}\n`
    );
  }
}

// Opcional: Limpar contador diário à meia-noite
setInterval(() => { dailyTokens = 0 }, 86400000);

module.exports = { 
  sendLog,
  getTokenUsage: () => ({ dailyTokens, TOKEN_LIMIT }) // Para monitoramento externo
};