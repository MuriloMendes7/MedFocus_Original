@echo off
echo ========================================
echo Liberando portas 4000 e 4001
echo ========================================
echo.

echo Verificando processos nas portas 4000 e 4001...
netstat -ano | findstr ":4000 :4001" | findstr LISTENING

echo.
echo Encerrando processos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000" ^| findstr LISTENING') do (
    echo Encerrando processo %%a na porta 4000...
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4001" ^| findstr LISTENING') do (
    echo Encerrando processo %%a na porta 4001...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Portas liberadas! Agora você pode executar: npm run dev
echo ========================================
pause
