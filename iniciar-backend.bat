@echo off
cd /d "%~dp0"
echo Arrancando backend PosWeb...
dotnet run --project PosWeb
pause
