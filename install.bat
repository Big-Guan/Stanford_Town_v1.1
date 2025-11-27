@echo off
chcp 65001 >nul
echo ================================
echo   AI 进化小镇 - 依赖安装脚本
echo ================================
echo.

echo [1/3] 检查 Node.js 版本...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo 请访问 https://nodejs.org 下载安装 Node.js 18+
    pause
    exit /b 1
)
node -v

echo.
echo [2/4] 安装根目录依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 根目录依赖安装失败
    pause
    exit /b 1
)

echo.
echo [3/4] 安装前端依赖...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ 前端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ 后端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ================================
echo   ✅ 安装完成！
echo ================================
echo.
echo 下一步：运行 start.bat 启动项目
echo.
pause

