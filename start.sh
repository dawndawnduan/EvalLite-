#!/bin/bash

# EvalLite 启动脚本

echo "🚀 启动 EvalLite..."
echo ""

# 检查是否在正确的目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 启动代理服务器（后台运行）
echo "📡 启动代理服务器..."
cd proxy-server
npm install > /dev/null 2>&1
node server.js &
PROXY_PID=$!
cd ..

echo "✅ 代理服务器已启动 (PID: $PROXY_PID)"
echo ""

# 等待代理服务器启动
sleep 2

# 启动前端服务器
echo "🌐 启动前端服务器..."
echo "✅ 前端服务器运行在: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 启动前端并在退出时清理
python3 -m http.server 8000

# 清理：停止代理服务器
echo ""
echo "🛑 正在停止服务..."
kill $PROXY_PID 2>/dev/null
echo "✅ 已停止所有服务"
