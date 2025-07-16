const axios = require('axios');
require('dotenv').config();

async function gerarRespostaIA(luaContent, userRequest) {
  const prompt = `
  Você é um compilador Lua para MTA:SA. Siga estritamente:

  1. MODIFIQUE o arquivo abaixo conforme: "${userRequest}"
  2. RETORNE APENAS O CÓDIGO LUA COMPLETO
  3. Mantenha a estrutura original
  4. Preserve comentários existentes

  Arquivo original:
  ${luaContent.substring(0, 7000)}${luaContent.length > 7000 ? '\n-- [...] (truncado)' : ''}
  `;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        messages: [{
          role: 'system',
          content: 'Você é um pré-processador Lua. Responda APENAS com o código modificado.'
        }, {
          role: 'user', 
          content: prompt
        }],
        max_tokens: 4000,
        temperature: 0.1 // Reduz variações
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    let codigo = response.data.choices[0].message.content;
    
    // Limpeza agressiva de markdown
    codigo = codigo.replace(/```lua/g, '').replace(/```/g, '').trim();
    
    // Validação mínima
    if (!codigo.includes('=') || !codigo.includes('--')) {
      throw new Error('Resposta não é um arquivo Lua válido');
    }

    return {
      codigo: codigo,
      instrucoes: `✅ Pedido do usuário: "${userRequest}"`
    };

  } catch (error) {
    console.error('Erro na IA:', {
      request: error.config?.data,
      response: error.response?.data
    });
    throw new Error('A IA não conseguiu gerar um arquivo válido. Reformule seu pedido.');
  }
}

module.exports = { gerarRespostaIA };