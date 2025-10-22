# 🚀 快速排查问题指南

## ⚡ 3 步快速诊断

### 第 1 步：启动本地服务器（必须！）

**在终端执行以下命令：**

```bash
cd /Users/attendre/vscode代码区域
./start-server.sh
```

或者直接使用 Python：

```bash
python3 -m http.server 8000
```

**⚠️ 重要**：不要直接双击打开 HTML 文件！必须通过 HTTP 服务器访问。

---

### 第 2 步：打开调试页面

在浏览器中访问：

```
http://localhost:8000/debug.html
```

**这个页面会自动检测所有问题！**

页面会显示：
- ✅ 绿色 = 正常
- ⚠️ 黄色 = 警告（可能需要关注）
- ❌ 红色 = 错误（必须修复）

---

### 第 3 步：根据检测结果操作

#### 情况 A：没有任务数据

**症状**：显示 "⚠️ 没有找到任务数据"

**解决**：
1. 在 debug.html 页面点击 **"➕ 添加测试任务"** 按钮
2. 或访问 `http://localhost:8000/tasks.html` 手动创建任务
3. 重新检测

---

#### 情况 B：使用了 file:// 协议

**症状**：显示 "❌ 当前使用 file:// 协议"

**解决**：
1. 关闭当前浏览器标签
2. 确保已启动本地服务器（见第 1 步）
3. 使用 `http://localhost:8000/test.html` 访问

---

#### 情况 C：DOM 元素缺失

**症状**：显示 "❌ 部分元素缺失"

**解决**：
1. 确保访问的是 test.html 页面
2. 清除浏览器缓存（Ctrl/Cmd + Shift + R 强制刷新）
3. 检查 test.html 文件是否完整

---

## 🔍 手动排查方法

如果自动检测无法解决问题，请按以下步骤手动排查：

### 1. 打开浏览器开发者工具

```
Windows/Linux: F12 或 Ctrl + Shift + I
Mac: Cmd + Option + I
```

切换到 **Console（控制台）** 标签。

---

### 2. 检查是否有红色错误

**常见错误及解决方案：**

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Failed to load module script` | 使用 file:// 协议 | 启动本地服务器 |
| `Uncaught ReferenceError: Storage is not defined` | 模块加载失败 | 检查文件路径，使用 HTTP 服务器 |
| `Cannot read property of null` | DOM 元素未找到 | 检查 HTML 文件完整性 |

---

### 3. 在 Console 中运行测试命令

**复制以下代码到 Console 中逐行执行：**

```javascript
// 1️⃣ 检查任务数据
const tasks = JSON.parse(localStorage.getItem('evallite_tasks') || '[]');
console.log('📋 任务数量:', tasks.length);
console.log('📋 任务列表:', tasks);

// 2️⃣ 检查 App 对象
console.log('🔧 App 对象:', window.app);

// 3️⃣ 检查关键 DOM 元素
console.log('🎯 模态框:', document.getElementById('taskSelectionModal'));
console.log('🎯 按钮:', document.getElementById('selectTaskBtn'));
console.log('🎯 任务列表:', document.getElementById('modalTaskList'));

// 4️⃣ 手动触发模态框
if (window.app) {
    window.app.showTaskSelectionModal();
    console.log('✅ 已尝试打开模态框');
} else {
    console.log('❌ App 对象不存在');
}
```

---

### 4. 添加测试数据（如果需要）

**在 Console 中执行：**

```javascript
const testTasks = [
  {
    id: Date.now() + '-test',
    name: '测试任务',
    description: '这是一个测试任务',
    systemPrompt: '你是一个AI助手',
    userPrompt: '请说你好',
    tags: ['测试'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

localStorage.setItem('evallite_tasks', JSON.stringify(testTasks));
console.log('✅ 测试任务已添加，请刷新页面');
```

刷新页面后再次测试。

---

## 📸 需要提供的调试信息

如果问题依然存在，请提供以下信息：

1. **访问 URL**：（例如：`http://localhost:8000/test.html` 或 `file:///...`）
2. **浏览器版本**：（在地址栏输入 `chrome://version` 或 `about:support`）
3. **Console 截图**：（按 F12 打开开发者工具，截取 Console 标签页）
4. **debug.html 检测结果**：（访问 debug.html 并截图）

### 导出完整调试信息

在 `debug.html` 页面点击 **"📋 导出调试信息"** 按钮，会下载一个 JSON 文件，包含：
- 所有检测结果
- localStorage 数据
- 浏览器信息

---

## ✅ 验证修复成功

执行以下步骤确认问题已解决：

1. 访问 `http://localhost:8000/test.html`
2. 点击 **"选择任务"** 按钮
3. 应该看到：
   - ✅ 模态框弹出
   - ✅ 搜索框自动聚焦
   - ✅ 显示任务列表
   - ✅ 任务计数显示（如 "共 3 个任务"）
4. 在搜索框输入关键词
5. 应该看到：
   - ✅ 任务列表实时过滤
   - ✅ 计数更新（如 "1 / 3 个任务"）
6. 点击一个任务
7. 应该看到：
   - ✅ 模态框关闭
   - ✅ 按钮文字更新为任务名称

---

## 🎯 快捷操作

| 操作 | 命令 |
|-----|------|
| 启动服务器 | `./start-server.sh` |
| 查看调试页面 | `http://localhost:8000/debug.html` |
| 打开测试页面 | `http://localhost:8000/test.html` |
| 创建任务 | `http://localhost:8000/tasks.html` |
| 清空所有数据 | 在 debug.html 点击 "清空所有数据" |
| 添加测试数据 | 在 debug.html 点击 "添加测试任务" |

---

## 💡 常见问题 FAQ

### Q: 为什么必须使用本地服务器？
A: 因为使用了 ES6 模块（`import/export`），浏览器的安全策略不允许在 `file://` 协议下加载模块。

### Q: 我的 Python 版本是 2.x，可以用吗？
A: 可以！使用 `python -m SimpleHTTPServer 8000` 启动。

### Q: 我没有 Python，怎么办？
A: 可以使用 Node.js：`npx http-server -p 8000` 或 PHP：`php -S localhost:8000`

### Q: 端口 8000 被占用怎么办？
A: 换一个端口，如 `python3 -m http.server 8001`，然后访问 `http://localhost:8001/...`

### Q: 清空数据后如何恢复？
A: 无法恢复。建议先导出调试信息备份。

---

**需要更多帮助？** 请提供上述调试信息的截图或导出的 JSON 文件。
