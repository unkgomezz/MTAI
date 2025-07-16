module.exports = {
    sanitizeLua: (content) => {
      if (content.length > 10000) throw new Error('Arquivo muito grande (máx. 10KB)');
      
      const forbidden = [/os\.execute/, /io\.popen/, /loadstring/, /debug\./];
      forbidden.forEach(pattern => {
        if (pattern.test(content)) throw new Error('Código contém padrões inseguros');
      });
      
      return content;
    }
  };