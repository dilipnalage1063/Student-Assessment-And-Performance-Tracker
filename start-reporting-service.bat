@echo off
echo Starting Reporting Service (.NET)...
cd ReportingService
set DB_CONNECTION_STRING=Server=localhost;Database=sapt_db;Uid=root;Pwd=root;
dotnet run --urls=http://localhost:5174
pause
