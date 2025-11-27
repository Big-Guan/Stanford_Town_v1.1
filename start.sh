#!/bin/bash

echo "================================"
echo "  AI 进化小镇 - 启动中..."
echo "================================"
echo ""

echo "[1/2] 检查环境变量..."
if [ ! -f "backend/.env" ]; then
    echo "⚠️  警告：未找到 backend/.env 文件"
    echo "将使用默认配置（本地验证模式）"
    echo ""
    echo "如需配置 Coze API，请："
    echo "1. 复制 backend/.env.example 为 backend/.env"
    echo "2. 填写 COZE_API_KEY 等配置"
    echo ""
fi

echo "[2/2] 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  检测到依赖未安装，正在安装..."
    npm install
    echo ""
fi

echo "[3/3] 启动开发服务器..."
echo ""
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3000"
echo ""
echo "================================"
echo "  按 Ctrl+C 停止服务器"
echo "================================"
echo ""

# 在Mac上自动打开浏览器
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
fi

npm run dev

