#!/bin/bash

echo "================================"
echo "  AI 进化小镇 - 简单启动方式"
echo "================================"
echo ""
echo "此方式会打开两个终端分别运行前后端"
echo ""

# 启动后端（后台运行）
echo "[1/2] 启动后端服务器..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 3

# 启动前端
echo "[2/2] 启动前端服务器..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 5

echo ""
echo "✅ 启动完成！"
echo ""
echo "前端地址: http://localhost:5173"
echo "后端地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

