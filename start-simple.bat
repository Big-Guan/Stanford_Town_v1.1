@echo off
chcp 65001 >nul
echo ================================
echo   AI 进化小镇 - 简单启动方式
echo ================================
echo.
echo 此方式会打开两个窗口分别运行前后端
echo.
echo 按任意键继续...
pause >nul

echo.
echo [1/2] 启动后端服务器...
start "后端服务器" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [2/2] 启动前端服务器...
start "前端服务器" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ✅ 启动完成！
echo.
echo 前端地址: http://localhost:5173
echo 后端地址: http://localhost:3000
echo.
echo 两个窗口已打开，关闭窗口即可停止服务
echo.
pause

