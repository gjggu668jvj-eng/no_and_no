@echo off
chcp 65001 >nul
title NO AND NO BOT
cd /d "%~dp0"
node index.js
pause
