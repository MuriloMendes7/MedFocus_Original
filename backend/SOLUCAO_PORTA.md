# 🔧 Solução para Problema de Porta em Uso

## Situação Atual
A porta 4000 está sendo usada por outro processo. Você tem duas opções:

## Opção 1: Liberar a Porta 4000 (Recomendado)

### Windows (PowerShell ou CMD):
```bash
# 1. Encontrar o processo
netstat -ano | findstr :4000

# 2. Encerrar o processo (substitua [PID] pelo número encontrado)
taskkill /PID [PID] /F
```

### Ou use o script automático:
```bash
# Execute o arquivo liberar-porta.bat
liberar-porta.bat
```

## Opção 2: Usar a Porta 4001

1. Edite o arquivo `.env` no diretório `backend/`
2. Altere a linha:
   ```
   PORT=4000
   ```
   Para:
   ```
   PORT=4001
   ```
3. Salve o arquivo
4. Execute `npm run dev` novamente

## Verificar se Funcionou

Após escolher uma das opções, execute:
```bash
cd backend
npm run dev
```

O servidor deve iniciar mostrando:
```
✅ MedFocus Backend iniciado com sucesso!
📍 Local:     https://medfocus.onrender.com (ou 4001)
🌐 Rede:      http://0.0.0.0:4000 (ou 4001)
```

## ⚠️ Importante

- O servidor **não tentará mais usar portas automaticamente**
- Você deve escolher entre liberar a porta 4000 ou usar a 4001
- Se mudar para 4001, o frontend detectará automaticamente
