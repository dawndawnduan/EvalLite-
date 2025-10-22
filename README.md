# EvalLite

> 轻量级 AI 模型测评工具 - 快速对比不同大模型的表现

一个纯前端的AI模型评测工具，支持OpenAI、Anthropic、Google、DeepSeek等多个模型提供商。无需复杂部署，轻松对比不同模型在相同任务下的效果、速度和成本。

## ✨ 特性

- 🚀 **零数据库** - 所有数据存储在浏览器本地（LocalStorage）
- 🔒 **隐私优先** - API Key仅保存在本地，不上传到任何服务器
- 🎯 **两种测试模式**：
  - **单任务测试** - 支持重复执行,测试模型稳定性和输出多样性
  - **任务链测试** - 串联多个任务,支持3种输入模式(使用上一输出/使用原始prompt/拼接模式)
- 📝 **任务库管理** - 独立的任务管理页面,方便创建、编辑、复用和组织任务
- 📊 **实时对比** - 并排显示多个模型的响应结果
- 📈 **统计分析** - 重复执行时显示平均耗时、成功率等统计信息
- 📝 **历史记录** - 自动保存最近10次测评
- 💾 **数据导出** - 支持导出结果为JSON格式
- 🌐 **多模型支持** - OpenAI、Anthropic、Google、DeepSeek、硅基流动

## 🎬 快速开始

### 1. 启动代理服务器

由于浏览器的CORS限制，需要启动一个轻量级代理服务器：

```bash
# 进入代理服务器目录
cd proxy-server

# 安装依赖
npm install

# 启动服务器
npm start
```

服务器将在 `http://localhost:3000` 运行。

### 2. 打开前端页面

有两种方式：

**方式一：直接打开（推荐用于测试）**
```bash
# 在项目根目录
open index.html
# 或者用浏览器直接打开 index.html 文件
```

**方式二：使用本地HTTP服务器（推荐）**
```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000

# 然后在浏览器访问 http://localhost:8000
```

## 📖 使用指南

### 工作流程

```
1. 管理任务 (tasks.html)  →  2. 配置模型 (index.html)  →  3. 执行测试  →  4. 查看结果
```

### 第一步：创建任务（任务管理页面）

1. 点击页面右上角的"任务管理"按钮
2. 在任务管理页面,点击"+ 创建任务"
3. 填写任务信息:
   - **任务名称** (必填): 如"英译中翻译"
   - **任务描述** (可选): 简短描述任务用途
   - **System Prompt** (可选): 设定模型角色
   - **User Prompt** (必填): 实际要执行的指令
   - **分类**: 选择任务类型(翻译/写作/分析/编程等)
   - **标签**: 用分号分隔,如"翻译;常用"
4. 点击"保存"

**提示**: 可以创建多个任务,在测试页面灵活组合使用

### 第二步：添加模型（主页）

1. 在左侧"模型管理"区域，选择提供商（OpenAI、Anthropic等）
2. 输入模型名称（自定义，如"GPT-4"）
3. 选择具体的模型ID（如 gpt-4、claude-3-opus等）
4. 输入对应的API Key
5. 点击"添加模型"

**支持的模型列表：**

| 提供商 | 模型示例 |
|--------|----------|
| OpenAI | GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, GPT-4o |
| Anthropic | Claude 3 Opus, Claude 3 Sonnet, Claude 3.5 Sonnet |
| Google | Gemini Pro, Gemini 1.5 Pro, Gemini 1.5 Flash |
| DeepSeek | DeepSeek Chat, DeepSeek Coder |
| 硅基流动 | 各种开源模型 |

### 第三步：配置测试

**模式A: 单任务测试**
1. 选择测试模式为"单任务测试"
2. 从下拉框选择一个任务
3. (可选) 勾选"启用重复执行",设置重复次数(1-1000)
   - 用于测试模型输出的稳定性和多样性
   - 自动计算平均耗时、成功率等统计数据
4. 选择要测试的模型(可多选)
5. 点击"开始测试"

**模式B: 任务链测试**
1. 选择测试模式为"任务链测试"
2. 点击"+ 添加任务",选择第一个任务
3. 继续添加更多任务,每个任务(除第一个)可以配置输入方式:
   - **使用上一任务的输出**: 纯pipeline模式,如"翻译 → 润色 → 摘要"
   - **使用任务原始prompt**: 独立执行,不依赖前一个任务
   - **拼接: 原始prompt + 上一输出**: 同时提供指令和上一步结果
4. 选择要测试的模型(可多选)
5. 点击"开始测试"

**任务链示例场景:**
```
任务1: 英文翻译成中文 (输入: original)
  ↓ (使用上一输出)
任务2: 润色翻译结果 (输入: previous)
  ↓ (拼接模式)
任务3: 评分并说明理由 (输入: concat - "请评分: " + 润色结果)
```

### 第四步：查看结果和导出

1. 测试完成后自动显示结果
2. 对比不同模型的输出、耗时、token用量
3. 点击"导出JSON"保存完整结果
4. 历史记录自动保存在下方,随时可以查看

## 🏗️ 项目结构

```
/
├── index.html              # 主页面 - 测试执行
├── tasks.html              # 任务管理页面
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── storage.js         # LocalStorage封装
│   ├── apiClient.js       # API客户端（支持多个提供商）
│   ├── modelManager.js    # 模型管理模块
│   ├── taskManager.js     # 任务管理模块(tasks.html使用)
│   └── app.js             # 主应用逻辑(index.html使用)
├── proxy-server/          # CORS代理服务器
│   ├── package.json
│   └── server.js
├── prd.md                 # 产品需求文档
├── models.md              # 模型管理规范
├── test.md                # 任务管理系统重构设计
├── CLAUDE.md              # Claude Code指南
└── README.md              # 本文件
```

## 🔧 技术栈

- **前端**: 原生 JavaScript (ES6+) + HTML5 + CSS3
- **样式框架**: Tailwind CSS (CDN)
- **数据存储**: LocalStorage
- **代理服务器**: Node.js + Express

## 📋 数据存储说明

所有数据存储在浏览器的 LocalStorage 中，包括：

- **模型配置** (`evallite_models`) - 包含API Key等敏感信息
- **历史记录** (`evallite_history`) - 最近10次测评结果
- **设置** (`evallite_settings`) - 用户偏好设置

**⚠️ 重要提示**：
- API Key仅保存在本地浏览器中，不会上传到任何服务器
- 清除浏览器数据会导致所有配置丢失
- 建议定期导出重要的测评结果

## 🔐 安全性

- ✅ API Key加密存储在浏览器本地
- ✅ 不经过任何第三方服务器（除了官方API）
- ✅ 代理服务器仅做CORS转发，不记录任何数据
- ✅ 完全开源，代码透明

## 🚀 部署代理服务器

### 本地部署

```bash
cd proxy-server
npm install
npm start
```

### Vercel部署（免费）

1. 安装Vercel CLI: `npm i -g vercel`
2. 在 `proxy-server` 目录运行: `vercel`
3. 更新 `js/apiClient.js` 中的 `PROXY_URL`

### Cloudflare Workers部署（免费）

```javascript
// worker.js
export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { url, headers, body } = await request.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## ❓ 常见问题

### Q1: 为什么需要代理服务器？

浏览器的CORS（跨域资源共享）策略阻止直接调用第三方API。代理服务器作为中转，帮助绕过这个限制。

### Q2: API Key安全吗？

API Key仅存储在你的浏览器本地，不会发送到除了官方API以外的任何服务器。代理服务器不会记录或存储任何敏感信息。

### Q3: 支持哪些模型？

目前支持：
- OpenAI (GPT系列)
- Anthropic (Claude系列)
- Google (Gemini系列)
- DeepSeek

更多模型可通过修改 `js/apiClient.js` 添加。

### Q4: 如何添加新的模型提供商？

1. 在 `js/apiClient.js` 的 `MODEL_CONFIGS` 中添加配置
2. 实现对应的 `call{Provider}` 方法
3. 在 `index.html` 的下拉框中添加选项

### Q5: 测评结果保存在哪里？

测评结果保存在浏览器的LocalStorage中，最多保存10条历史记录。建议定期使用"导出JSON"功能备份重要结果。

## 🛣️ 路线图

- [x] 任务库管理（独立页面）
- [x] 单任务测试（支持重复执行）
- [x] 任务链功能（串联执行多个任务,支持3种输入模式）
- [ ] 支持批量任务导入（CSV/Excel）
- [ ] 改进任务链选择界面（模态框选择代替prompt）
- [ ] AI自动评分
- [ ] 可视化图表（雷达图、散点图）
- [ ] 成本计算
- [ ] PDF报告导出
- [ ] 更多模型提供商支持

## 🆕 最新更新 (v0.2)

### 任务管理系统重构
根据 `test.md` 设计文档完成的重构:

**核心改进:**
- ✅ 简化为两种测试模式: 单任务测试 + 任务链测试
- ✅ 独立的任务管理页面 (tasks.html)
- ✅ 单任务支持重复执行 (1-1000次)
- ✅ 任务链支持3种输入模式:
  - 使用上一任务的输出
  - 使用任务原始prompt
  - 拼接: 原始prompt + 上一输出
- ✅ 统计分析功能 (平均耗时、成功率等)
- ✅ 优化的UI和用户体验

**移除功能:**
- ❌ 批量任务模式 (可通过任务链实现相同效果)
- ❌ 工作流可视化编辑器 (简化为表单式配置)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**注意**：本工具仅供评测和对比使用，请遵守各模型提供商的使用条款和API配额限制。
