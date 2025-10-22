# EvalLite 用户使用指南

> 一个轻量级、开箱即用的 AI 模型评测平台

## 目录

- [快速开始](#快速开始)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [启动服务](#启动服务)
- [端口配置](#端口配置)
- [使用流程](#使用流程)
- [常见问题](#常见问题)

---

## 快速开始

EvalLite 是一个纯前端+轻量代理服务器的 AI 模型评测工具。下载后只需简单配置即可使用。

### 核心特性

- 零数据库：所有数据存储在浏览器 localStorage
- 隐私优先：API 密钥仅保存在本地，不上传云端
- 轻量部署：只需 Node.js 环境即可启动
- 多模型支持：OpenAI、Claude、Gemini、DeepSeek、Qwen 等

---

## 系统要求

### 必需

- **Node.js**: v14.0 或更高版本
- **npm**: v6.0 或更高版本（通常随 Node.js 自动安装）

### 可选

- **现代浏览器**: Chrome、Edge、Safari 或 Firefox 最新版本
- **Python 3**: 用于快速启动本地 HTTP 服务器（可选，有其他替代方案）

### 检查是否已安装 Node.js

打开终端（macOS/Linux）或命令提示符（Windows），运行：

```bash
node --version
npm --version
```

如果显示版本号（如 `v18.17.0`），说明已安装。否则请访问 [nodejs.org](https://nodejs.org) 下载安装。

---

## 安装步骤

### 1. 下载项目

解压下载的 `EvalLite.zip` 文件到任意目录，例如：

```
~/Documents/EvalLite/
```

### 2. 安装依赖

打开终端，进入项目的 `proxy-server` 目录：

```bash
cd ~/Documents/EvalLite/proxy-server
```

安装 Node.js 依赖：

```bash
npm install
```

等待安装完成（约 10-30 秒）。

---

## 启动服务

EvalLite 需要同时启动两个服务：

1. **代理服务器**（Proxy Server）：处理 CORS 跨域请求
2. **前端服务器**（Frontend Server）：提供网页访问

### 方法一：使用启动脚本（推荐）

#### macOS/Linux

在项目根目录运行：

```bash
chmod +x start.sh
./start.sh
```

#### Windows

创建 `start.bat` 文件（或手动执行以下命令）：

```batch
@echo off
echo Starting EvalLite...

cd proxy-server
start /B npm start
cd ..

timeout /t 2
python -m http.server 8000
```

运行 `start.bat`。

### 方法二：手动启动

#### 步骤 1：启动代理服务器

打开**第一个终端**窗口：

```bash
cd ~/Documents/EvalLite/proxy-server
npm start
```

看到以下信息说明启动成功：

```
╔══════════════════════════════════════════╗
║   EvalLite CORS Proxy Server Started    ║
╚══════════════════════════════════════════╝

🚀 Server is running on: http://localhost:3000
📡 Proxy endpoint: http://localhost:3000/proxy
💚 Health check: http://localhost:3000/health
```

**保持此终端窗口运行，不要关闭。**

#### 步骤 2：启动前端服务器

打开**第二个终端**窗口，进入项目根目录：

```bash
cd ~/Documents/EvalLite
```

使用以下任一命令启动前端服务器：

**选项 A：使用 Python 3**

```bash
python3 -m http.server 8000
```

**选项 B：使用 Python 2**

```bash
python -m SimpleHTTPServer 8000
```

**选项 C：使用 Node.js http-server**

```bash
npx http-server -p 8000
```

**选项 D：使用 PHP**

```bash
php -S localhost:8000
```

看到类似以下信息说明启动成功：

```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

#### 步骤 3：访问应用

打开浏览器，访问：

```
http://localhost:8000
```

---

## 端口配置

### 默认端口

- **前端服务器**: 8000
- **代理服务器**: 3000

### 修改端口

#### 修改代理服务器端口

编辑 `proxy-server/server.js` 文件，修改第 24 行：

```javascript
const PORT = process.env.PORT || 3000;  // 改为你想要的端口，如 5000
```

或启动时设置环境变量：

```bash
PORT=5000 npm start
```

**重要**：如果修改了代理服务器端口，还需要更新前端配置。

编辑 `js/apiClient.js` 文件，找到第 3 行：

```javascript
const PROXY_URL = 'http://localhost:3000/proxy';  // 改为新端口
```

#### 修改前端服务器端口

启动前端时指定端口：

```bash
python3 -m http.server 9000  # 使用端口 9000
```

然后访问 `http://localhost:9000`。

### 端口被占用怎么办？

如果看到 `Address already in use` 错误，说明端口已被其他程序占用。

**查找占用端口的进程**：

```bash
# macOS/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

**停止占用的进程**：

```bash
# macOS/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

或者直接修改为其他端口（见上文）。

---

## 使用流程

### 1. 配置模型

访问 **模型管理** 页面：

1. 点击 "添加模型"
2. 输入模型信息：
   - **显示名称**: 自定义名称（如 "GPT-4o-测试"）
   - **提供商**: 选择 OpenAI、Anthropic 等
   - **模型 ID**: 如 `gpt-4o`、`claude-3-5-sonnet-20241022`
   - **API Key**: 输入你的 API 密钥
3. 点击 "测试连接" 验证配置
4. 保存模型

### 2. 创建任务

访问 **任务管理** 页面：

- **手动创建**: 输入 System Prompt 和 User Prompt
- **批量导入**: 上传 CSV 文件（提供模板 `task_template.csv`）

### 3. 执行测试

访问 **测试执行** 页面：

1. 选择任务
2. 选择要测试的模型（可多选）
3. 点击 "开始测试"
4. 等待所有模型响应完成

### 4. 配置评测维度

访问 **评测配置** 页面：

1. 创建评测模板（如 "通用质量评测"）
2. 添加评测维度：
   - 流畅度 (0-5分)
   - 准确性 (0-5分)
   - 完整性 (0-5分)
3. 保存模板

### 5. 评分与分析

访问 **历史记录** 页面：

1. 点击测试记录的 "开始评测"
2. 选择评测模板
3. 选择评分方式：
   - **手动评分**: 逐个模型打分
   - **AI 自动评分**: 选择一个模型作为评委，批量评分
4. 配置指标权重
5. 查看可视化报告：
   - 雷达图对比
   - 综合得分排名
   - 成本分析

### 6. 导出报告

在评测报告页面：

- 导出 PNG 图片
- 导出 HTML 报告
- 导出 CSV 原始数据

---

## 常见问题

### Q1: 页面打不开，显示 "无法连接"

**解决方法**：

1. 确认代理服务器已启动（检查终端是否显示启动信息）
2. 确认前端服务器已启动
3. 检查浏览器地址是否正确：`http://localhost:8000`
4. 尝试使用 `127.0.0.1` 替代 `localhost`

### Q2: API 调用失败，显示 "Network Error"

**可能原因**：

1. 代理服务器未启动
2. API Key 错误或已失效
3. 模型提供商服务异常
4. 网络连接问题

**解决方法**：

1. 检查代理服务器终端是否有错误日志
2. 在模型管理页面重新测试连接
3. 检查 API Key 是否正确
4. 检查网络连接

### Q3: localStorage 数据丢失

**原因**：浏览器清理缓存时可能清除 localStorage。

**解决方法**：

1. 定期导出评测报告
2. 导出模型配置（JSON 格式）
3. 使用浏览器的"导出数据"功能备份

### Q4: 如何在局域网内访问？

**步骤**：

1. 启动前端服务器时绑定到 `0.0.0.0`：

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

2. 查找本机 IP 地址：

```bash
# macOS/Linux
ifconfig | grep inet

# Windows
ipconfig
```

3. 在局域网内其他设备访问：

```
http://192.168.x.x:8000
```

**注意**：需要同时配置代理服务器允许局域网访问。编辑 `proxy-server/server.js`，将 `app.listen(PORT, ...)` 改为 `app.listen(PORT, '0.0.0.0', ...)`。

### Q5: 如何停止服务？

在终端窗口按 `Ctrl + C` 停止服务。

如果使用启动脚本，停止脚本会自动清理后台进程。

---

## 数据安全说明

1. **API Key 安全**：
   - API Key 仅存储在浏览器 localStorage
   - 不会上传到任何云端服务器
   - 代理服务器仅转发请求，不记录密钥

2. **测试数据**：
   - 所有测试结果保存在浏览器本地
   - 清除浏览器数据会删除所有记录
   - 建议定期导出重要数据

3. **隐私保护**：
   - 代理服务器仅在本地运行
   - 不收集任何用户数据
   - 所有 API 调用直连官方服务

---

## 技术支持

如遇到问题，请检查：

1. **浏览器控制台**（按 F12）查看错误信息
2. **代理服务器终端**查看请求日志
3. 参考 `DEBUG_GUIDE.md` 进行排查

---

## 版本信息

- **当前版本**: v0.5
- **更新日期**: 2024-10-22
- **Node.js 最低版本**: v14.0

---

## 快速命令参考

```bash
# 安装依赖
cd proxy-server && npm install

# 启动代理服务器
cd proxy-server && npm start

# 启动前端服务器（在项目根目录）
python3 -m http.server 8000

# 检查端口占用（macOS/Linux）
lsof -i :3000
lsof -i :8000

# 停止服务
Ctrl + C
```

---

祝使用愉快！如有问题欢迎反馈。
