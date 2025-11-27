#!/bin/bash

echo "================================"
echo "  AI 进化小镇 - 依赖安装脚本"
echo "================================"
echo ""

echo "[1/3] 检查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到 Node.js"
    echo "请访问 https://nodejs.org 下载安装 Node.js 18+"
    exit 1
fi
node -v

echo ""
echo "[2/3] 安装根目录依赖..."
npm install

echo ""
echo "[3/3] 安装前后端依赖..."
npm run install:all

echo ""
echo "================================"
echo "  ✅ 安装完成！"
echo "================================"
echo ""
echo "下一步：运行 ./start.sh 启动项目"
echo ""

