// 主应用文件 - 新版本,支持单任务测试和任务链测试

import { renderNavbar, showToast } from './navbar.js';
import { Storage } from './storage.js';
import { APIClient } from './apiClient.js';
import ModelManager from './modelManager.js';

/**
 * 主应用类
 */
class App {
    constructor() {
        this.currentResults = null;
        this.currentEvaluation = null;
        this.taskMode = 'single'; // single | chain
        this.chainTasks = []; // 任务链中的任务列表
        this.selectedTaskId = null; // 单任务选择的任务ID
        this.initializeElements();
        this.initializeModelManager();
        this.attachEventListeners();
        this.renderNavbar();
    }

    /**
     * 渲染导航栏
     */
    renderNavbar() {
        renderNavbar('test');
    }

    /**
     * 初始化DOM元素
     */
    initializeElements() {
        // 模式选择
        this.taskModeRadios = document.querySelectorAll('input[name="taskMode"]');

        // 单任务相关
        this.singleTaskPanel = document.getElementById('singleTaskPanel');
        this.selectTaskBtn = document.getElementById('selectTaskBtn');
        this.selectedTaskName = document.getElementById('selectedTaskName');
        this.selectedTaskIdInput = document.getElementById('selectedTaskId');
        this.enableRepeat = document.getElementById('enableRepeat');
        this.repeatConfig = document.getElementById('repeatConfig');
        this.repeatCount = document.getElementById('repeatCount');

        // 任务选择模态框
        this.taskSelectionModal = document.getElementById('taskSelectionModal');
        this.closeTaskModal = document.getElementById('closeTaskModal');
        this.taskSearchInput = document.getElementById('taskSearchInput');
        this.modalTaskList = document.getElementById('modalTaskList');
        this.modalEmptyState = document.getElementById('modalEmptyState');
        this.taskCount = document.getElementById('taskCount');

        // 任务链相关
        this.chainTaskPanel = document.getElementById('chainTaskPanel');
        this.addToChainBtn = document.getElementById('addToChainBtn');
        this.chainList = document.getElementById('chainList');

        // 测评相关
        this.startEvalBtn = document.getElementById('startEvalBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContent = document.getElementById('resultsContent');
        this.loadingModal = document.getElementById('loadingModal');
        this.loadingText = document.getElementById('loadingText');
        this.exportBtn = document.getElementById('exportBtn');
        this.exportCSVBtn = document.getElementById('exportCSVBtn');
    }

    /**
     * 初始化模型管理器
     */
    initializeModelManager() {
        this.modelManager = new ModelManager();
        window.modelManager = this.modelManager;
    }

    /**
     * 附加事件监听器
     */
    attachEventListeners() {
        // 模式切换
        this.taskModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.switchMode(e.target.value));
        });

        // 单任务相关
        this.selectTaskBtn.addEventListener('click', () => this.showTaskSelectionModal());
        this.enableRepeat.addEventListener('change', () => {
            this.repeatConfig.style.display = this.enableRepeat.checked ? 'block' : 'none';
        });

        // 任务选择模态框
        this.closeTaskModal.addEventListener('click', () => this.closeTaskSelectionModal());
        this.taskSelectionModal.addEventListener('click', (e) => {
            if (e.target === this.taskSelectionModal) this.closeTaskSelectionModal();
        });
        this.taskSearchInput.addEventListener('input', () => this.filterTasksInModal());

        // 键盘快捷键支持
        this.taskSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTaskSelectionModal();
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.taskSelectionModal.classList.contains('hidden')) {
                this.closeTaskSelectionModal();
            }
        });

        // 任务链相关
        this.addToChainBtn.addEventListener('click', () => this.showTaskSelectionModal(true));

        // 测评相关
        this.startEvalBtn.addEventListener('click', () => this.startEvaluation());
        this.exportBtn.addEventListener('click', () => this.exportResults());
        this.exportCSVBtn.addEventListener('click', () => this.exportCSV());
    }

    /**
     * 切换模式
     */
    switchMode(mode) {
        this.taskMode = mode;

        if (mode === 'single') {
            this.singleTaskPanel.style.display = 'block';
            this.chainTaskPanel.style.display = 'none';
        } else if (mode === 'chain') {
            this.singleTaskPanel.style.display = 'none';
            this.chainTaskPanel.style.display = 'block';
            this.renderChainList();
        }
    }

    /**
     * 显示任务选择模态框
     */
    showTaskSelectionModal(forChain = false) {
        this.isSelectingForChain = forChain;
        const tasks = Storage.getTasks();

        if (tasks.length === 0) {
            this.modalTaskList.style.display = 'none';
            this.modalEmptyState.style.display = 'block';
        } else {
            this.modalTaskList.style.display = 'block';
            this.modalEmptyState.style.display = 'none';
            this.renderTasksInModal(tasks);
        }

        this.taskSearchInput.value = '';
        this.taskSelectionModal.classList.remove('hidden');
        this.taskSelectionModal.classList.add('flex');

        // 自动聚焦搜索框,便于快速搜索
        setTimeout(() => {
            this.taskSearchInput.focus();
        }, 100);
    }

    /**
     * 关闭任务选择模态框
     */
    closeTaskSelectionModal() {
        this.taskSelectionModal.classList.remove('flex');
        this.taskSelectionModal.classList.add('hidden');
    }

    /**
     * 渲染模态框中的任务列表
     */
    renderTasksInModal(tasks) {
        // 更新任务计数
        if (this.taskCount) {
            const totalTasks = Storage.getTasks().length;
            if (tasks.length === totalTasks) {
                this.taskCount.textContent = `共 ${totalTasks} 个任务`;
            } else {
                this.taskCount.textContent = `${tasks.length} / ${totalTasks} 个任务`;
            }
        }

        this.modalTaskList.innerHTML = tasks.map(task => `
            <div
                class="p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition"
                onclick="window.app.selectTask('${task.id}')"
            >
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-800">${this.escapeHtml(task.name)}</h4>
                    ${task.tags && task.tags.length > 0 ? `
                        <span class="tag text-xs">${this.escapeHtml(task.tags[0])}</span>
                    ` : ''}
                </div>
                ${task.description ? `
                    <p class="text-sm text-gray-600 mb-2">${this.escapeHtml(task.description)}</p>
                ` : ''}
                <p class="text-xs text-gray-500 line-clamp-2">
                    ${task.systemPrompt ? `System: ${this.escapeHtml(task.systemPrompt)} | ` : ''}
                    User: ${this.escapeHtml(task.userPrompt)}
                </p>
            </div>
        `).join('');
    }

    /**
     * 过滤模态框中的任务
     */
    filterTasksInModal() {
        const searchTerm = this.taskSearchInput.value.toLowerCase().trim();
        const tasks = Storage.getTasks();

        // 如果搜索框为空,显示所有任务
        if (!searchTerm) {
            this.renderTasksInModal(tasks);
            return;
        }

        // 过滤任务:搜索名称、描述、标签和提示词
        const filteredTasks = tasks.filter(task => {
            const matchName = task.name && task.name.toLowerCase().includes(searchTerm);
            const matchDescription = task.description && task.description.toLowerCase().includes(searchTerm);
            const matchUserPrompt = task.userPrompt && task.userPrompt.toLowerCase().includes(searchTerm);
            const matchSystemPrompt = task.systemPrompt && task.systemPrompt.toLowerCase().includes(searchTerm);
            const matchTags = task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            return matchName || matchDescription || matchUserPrompt || matchSystemPrompt || matchTags;
        });

        if (filteredTasks.length === 0) {
            this.modalTaskList.innerHTML = `
                <div class="text-center text-gray-500 py-12">
                    <div class="text-5xl mb-3">🔍</div>
                    <p class="text-lg">未找到匹配的任务</p>
                    <p class="text-sm mt-2">尝试使用其他关键词搜索</p>
                </div>
            `;
        } else {
            this.renderTasksInModal(filteredTasks);
        }
    }

    /**
     * 选择任务
     */
    selectTask(taskId) {
        const task = Storage.getTask(taskId);
        if (!task) return;

        if (this.isSelectingForChain) {
            // 添加到任务链
            this.addTaskToChain(taskId);
        } else {
            // 单任务选择
            this.selectedTaskId = taskId;
            this.selectedTaskIdInput.value = taskId;
            this.selectedTaskName.textContent = task.name;
            this.selectedTaskName.classList.remove('text-gray-500');
            this.selectedTaskName.classList.add('text-gray-800');
        }

        this.closeTaskSelectionModal();
    }

    /**
     * 添加任务到链
     */
    addTaskToChain(taskId) {
        const task = Storage.getTask(taskId);
        if (!task) return;

        // 默认输入模式
        const inputMode = this.chainTasks.length === 0 ? 'original' : 'previous';

        this.chainTasks.push({
            taskId: task.id,
            order: this.chainTasks.length,
            inputMode: inputMode
        });

        this.renderChainList();
    }

    /**
     * 渲染任务链列表 - 优化版,体现变量流转
     */
    renderChainList() {
        if (this.chainTasks.length === 0) {
            this.chainList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-5xl mb-3">🔗</div>
                    <p>暂无任务,点击上方"添加任务"按钮开始</p>
                </div>
            `;
            return;
        }

        this.chainList.innerHTML = this.chainTasks.map((chainTask, index) => {
            const task = Storage.getTask(chainTask.taskId);
            if (!task) return '';

            const isFirst = index === 0;
            const isLast = index === this.chainTasks.length - 1;

            return `
                <div class="relative">
                    <!-- 任务卡片 -->
                    <div class="border-2 ${isFirst ? 'border-green-400' : isLast ? 'border-blue-400' : 'border-purple-300'} rounded-xl p-4 bg-white">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-2 flex-1">
                                <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    ${index + 1}
                                </span>
                                <div class="flex-1">
                                    <h4 class="font-semibold text-gray-800">${this.escapeHtml(task.name)}</h4>
                                    ${task.description ? `<p class="text-xs text-gray-500">${this.escapeHtml(task.description)}</p>` : ''}
                                </div>
                            </div>
                            <button
                                onclick="window.app.removeFromChain(${index})"
                                class="text-red-600 hover:text-red-800 text-sm ml-2 px-2 py-1 rounded hover:bg-red-50 transition">
                                删除
                            </button>
                        </div>

                        <!-- 变量说明 -->
                        ${!isFirst ? `
                            <div class="mt-3 pt-3 border-t border-gray-200">
                                <label class="block text-xs font-medium text-gray-700 mb-2">
                                    <span class="inline-flex items-center gap-1">
                                        <span>📥</span>
                                        <span>输入变量:</span>
                                    </span>
                                </label>
                                <div class="space-y-1">
                                    <label class="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input
                                            type="radio"
                                            name="input_${index}"
                                            value="previous"
                                            ${chainTask.inputMode === 'previous' ? 'checked' : ''}
                                            onchange="window.app.updateChainInputMode(${index}, 'previous')"
                                            class="mr-2">
                                        <span class="flex-1">
                                            <code class="text-purple-600 bg-purple-50 px-1 rounded">{{output}}</code>
                                            <span class="text-gray-600 ml-1">= 上一任务的输出</span>
                                        </span>
                                    </label>
                                    <label class="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input
                                            type="radio"
                                            name="input_${index}"
                                            value="original"
                                            ${chainTask.inputMode === 'original' ? 'checked' : ''}
                                            onchange="window.app.updateChainInputMode(${index}, 'original')"
                                            class="mr-2">
                                        <span class="flex-1">
                                            <span class="text-gray-600">使用任务原始prompt (忽略上一输出)</span>
                                        </span>
                                    </label>
                                    <label class="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                                        <input
                                            type="radio"
                                            name="input_${index}"
                                            value="concat"
                                            ${chainTask.inputMode === 'concat' ? 'checked' : ''}
                                            onchange="window.app.updateChainInputMode(${index}, 'concat')"
                                            class="mr-2">
                                        <span class="flex-1">
                                            <span class="text-gray-600">原始prompt + </span>
                                            <code class="text-purple-600 bg-purple-50 px-1 rounded">{{output}}</code>
                                        </span>
                                    </label>
                                </div>

                                <!-- 提示 -->
                                <div class="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                                    💡 提示: 在任务的User Prompt中使用 <code class="bg-white px-1 rounded">{{output}}</code> 代表上一任务的输出结果
                                </div>
                            </div>
                        ` : `
                            <div class="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <span>📤</span>
                                <span>首个任务,使用原始prompt作为输入</span>
                            </div>
                        `}
                    </div>

                    <!-- 流程箭头 -->
                    ${!isLast ? `
                        <div class="flex justify-center my-2">
                            <div class="text-purple-400 text-2xl">↓</div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * 更新任务链输入模式
     */
    updateChainInputMode(index, mode) {
        if (this.chainTasks[index]) {
            this.chainTasks[index].inputMode = mode;
        }
    }

    /**
     * 从链中移除任务
     */
    removeFromChain(index) {
        this.chainTasks.splice(index, 1);
        // 重新排序
        this.chainTasks.forEach((task, i) => {
            task.order = i;
        });
        this.renderChainList();
    }

    /**
     * 开始测评
     */
    async startEvaluation() {
        const selectedModels = this.modelManager.getSelectedModels();
        if (selectedModels.length === 0) {
            showToast('请至少选择一个模型', 'warning');
            return;
        }

        if (this.taskMode === 'single') {
            await this.executeSingleTask();
        } else if (this.taskMode === 'chain') {
            await this.executeTaskChain();
        }
    }

    /**
     * 执行单任务
     */
    async executeSingleTask() {
        const taskId = this.selectedTaskId;
        if (!taskId) {
            showToast('请选择一个任务', 'warning');
            return;
        }

        const task = Storage.getTask(taskId);
        if (!task) {
            showToast('任务不存在', 'error');
            return;
        }

        const selectedModels = this.modelManager.getSelectedModels();
        const repeatEnabled = this.enableRepeat.checked;
        const repeatCount = repeatEnabled ? parseInt(this.repeatCount.value) : 1;

        this.showLoading(true);

        const results = [];

        for (let i = 0; i < selectedModels.length; i++) {
            const model = selectedModels[i];
            this.loadingText.textContent = `正在测试 ${model.modelName} (${i + 1}/${selectedModels.length})...`;

            const executions = [];

            for (let j = 0; j < repeatCount; j++) {
                if (repeatCount > 1) {
                    this.loadingText.textContent = `正在测试 ${model.modelName} (${i + 1}/${selectedModels.length}) - 第 ${j + 1}/${repeatCount} 次`;
                }

                // 生成唯一executionId
                const executionId = `exec_${Date.now()}_${model.id || model.modelName}_${j}`;

                try {
                    const result = await APIClient.callModel(model, task.systemPrompt, task.userPrompt);
                    // 为每个execution添加唯一ID
                    executions.push({
                        ...result,
                        executionId: executionId,
                        executionIndex: j  // 保留执行序号，方便UI显示
                    });
                } catch (error) {
                    console.error(`调用 ${model.modelName} 失败:`, error);
                    executions.push({
                        executionId: executionId,
                        executionIndex: j,
                        success: false,
                        error: error.message,
                        model: model,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            results.push({
                model: model,
                executions: executions
            });
        }

        this.showLoading(false);

        this.currentEvaluation = {
            mode: 'single',
            task: task,
            repeatCount: repeatCount,
            results: results,
            timestamp: new Date().toISOString()
        };

        this.displaySingleTaskResults();
        this.saveToHistory();
    }

    /**
     * 执行任务链
     */
    async executeTaskChain() {
        if (this.chainTasks.length === 0) {
            showToast('请先添加任务到链中', 'warning');
            return;
        }

        const selectedModels = this.modelManager.getSelectedModels();
        this.showLoading(true);

        const chainResults = [];

        for (const model of selectedModels) {
            this.loadingText.textContent = `${model.modelName}: 执行任务链...`;

            let previousOutput = '';
            const steps = [];

            for (let i = 0; i < this.chainTasks.length; i++) {
                const chainTask = this.chainTasks[i];
                const task = Storage.getTask(chainTask.taskId);

                if (!task) continue;

                // 根据输入模式决定input
                let userPrompt = task.userPrompt;

                if (i > 0) {
                    if (chainTask.inputMode === 'previous') {
                        // 直接使用上一个输出
                        userPrompt = previousOutput;
                    } else if (chainTask.inputMode === 'original') {
                        // 使用原始prompt
                        userPrompt = task.userPrompt;
                    } else if (chainTask.inputMode === 'concat') {
                        // 拼接模式
                        userPrompt = task.userPrompt + '\n\n' + previousOutput;
                    }
                }

                // 替换变量 {{output}}
                if (i > 0 && userPrompt.includes('{{output}}')) {
                    userPrompt = userPrompt.replace(/\{\{output\}\}/g, previousOutput);
                }

                this.loadingText.textContent = `${model.modelName}: 任务 ${i + 1}/${this.chainTasks.length} - ${task.name}`;

                // 生成唯一stepId
                const stepId = `step_${Date.now()}_${model.id || model.modelName}_${i}`;

                try {
                    const result = await APIClient.callModel(model, task.systemPrompt, userPrompt);
                    previousOutput = result.content;

                    steps.push({
                        stepId: stepId,  // 添加唯一ID
                        stepIndex: i,    // 保留步骤序号
                        task: task,
                        input: userPrompt,
                        inputMode: chainTask.inputMode,
                        result: result
                    });
                } catch (error) {
                    steps.push({
                        stepId: stepId,
                        stepIndex: i,
                        task: task,
                        input: userPrompt,
                        inputMode: chainTask.inputMode,
                        result: {
                            success: false,
                            error: error.message,
                            model: model
                        }
                    });
                    break; // 任务链中断
                }
            }

            chainResults.push({
                model: model,
                steps: steps
            });
        }

        this.showLoading(false);

        this.currentEvaluation = {
            mode: 'chain',
            chain: this.chainTasks,
            results: chainResults,
            timestamp: new Date().toISOString()
        };

        this.displayChainResults();
        this.saveToHistory();
    }

    /**
     * 显示单任务结果
     */
    displaySingleTaskResults() {
        this.resultsSection.style.display = 'block';

        const { task, repeatCount, results } = this.currentEvaluation;

        const resultsHTML = results.map((modelResult, index) => {
            const { model, executions } = modelResult;

            // 计算统计信息
            const successExecutions = executions.filter(e => e.success);
            const avgResponseTime = successExecutions.length > 0
                ? (successExecutions.reduce((sum, e) => sum + e.responseTime, 0) / successExecutions.length).toFixed(0)
                : 0;
            const avgTokens = successExecutions.length > 0
                ? (successExecutions.reduce((sum, e) => sum + (e.tokensUsed || 0), 0) / successExecutions.length).toFixed(0)
                : 0;

            return `
                <div class="result-card bg-white border-2 border-gray-200 rounded-lg p-6 mb-4">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">${model.modelName}</h3>
                            <p class="text-sm text-gray-600">${model.provider} - ${model.modelId}</p>
                        </div>
                        ${repeatCount > 1 ? `
                            <div class="text-right">
                                <div class="text-sm text-gray-600">
                                    成功: ${successExecutions.length}/${repeatCount}
                                </div>
                                <div class="text-xs text-gray-500">
                                    平均耗时: ${avgResponseTime}ms | 平均tokens: ${avgTokens}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    ${repeatCount === 1 ? `
                        ${executions[0].success ? `
                            <div class="bg-gray-50 p-4 rounded border border-gray-200 mb-3">
                                <p class="text-gray-800 whitespace-pre-wrap">${this.escapeHtml(executions[0].content)}</p>
                            </div>
                            <div class="text-sm text-gray-600">
                                耗时: ${executions[0].responseTime}ms | Tokens: ${executions[0].tokensUsed}
                            </div>
                        ` : `
                            <div class="bg-red-50 p-4 rounded border border-red-200">
                                <p class="text-red-600">❌ 调用失败: ${this.escapeHtml(executions[0].error)}</p>
                            </div>
                        `}
                    ` : `
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            ${executions.map((exec, i) => `
                                <div class="border-l-4 ${exec.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} p-3 rounded">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="text-xs font-medium text-gray-700">执行 ${i + 1}</span>
                                        ${exec.success ? `
                                            <span class="text-xs text-gray-500">${exec.responseTime}ms | ${exec.tokensUsed} tokens</span>
                                        ` : ''}
                                    </div>
                                    ${exec.success ? `
                                        <p class="text-sm text-gray-700 line-clamp-3">${this.escapeHtml(exec.content)}</p>
                                    ` : `
                                        <p class="text-sm text-red-600">❌ ${this.escapeHtml(exec.error)}</p>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            `;
        }).join('');

        this.resultsContent.innerHTML = `
            <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 class="font-semibold text-blue-900 mb-2">任务信息</h3>
                <p class="text-sm text-blue-800 mb-1"><strong>任务名称:</strong> ${this.escapeHtml(task.name)}</p>
                ${task.systemPrompt ? `<p class="text-sm text-blue-800 mb-1"><strong>System Prompt:</strong> ${this.escapeHtml(task.systemPrompt)}</p>` : ''}
                <p class="text-sm text-blue-800"><strong>User Prompt:</strong> ${this.escapeHtml(task.userPrompt)}</p>
                ${repeatCount > 1 ? `<p class="text-sm text-blue-800 mt-2"><strong>重复次数:</strong> ${repeatCount}</p>` : ''}
            </div>
            ${resultsHTML}
        `;

        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 显示任务链结果
     */
    displayChainResults() {
        this.resultsSection.style.display = 'block';

        const { results } = this.currentEvaluation;

        const resultsHTML = results.map((modelResult) => {
            const { model, steps } = modelResult;

            return `
                <div class="mb-8 border-2 border-purple-300 rounded-lg p-6">
                    <h3 class="text-xl font-semibold mb-4 text-gray-800">
                        ${model.modelName} 任务链执行
                        <span class="text-sm text-gray-500 ml-2">(${model.provider})</span>
                    </h3>

                    <div class="space-y-4">
                        ${steps.map((step, stepIndex) => {
                            const { task, input, inputMode, result } = step;

                            return `
                                <div class="border-l-4 border-purple-400 pl-4">
                                    <div class="flex items-center mb-2">
                                        <span class="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-2">
                                            ${stepIndex + 1}
                                        </span>
                                        <span class="font-medium text-gray-800">${this.escapeHtml(task.name)}</span>
                                        ${stepIndex > 0 ? `
                                            <span class="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                ${inputMode === 'previous' ? '📥 使用上一输出' : inputMode === 'original' ? '📝 使用原始prompt' : '🔗 拼接模式'}
                                            </span>
                                        ` : ''}
                                    </div>

                                    ${result.success ? `
                                        <div class="bg-white border border-gray-200 rounded p-3 mb-2">
                                            <p class="text-sm text-gray-800 whitespace-pre-wrap">${this.escapeHtml(result.content)}</p>
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            ⏱️ ${result.responseTime}ms | 🔤 ${result.tokensUsed} tokens
                                        </div>
                                    ` : `
                                        <div class="bg-red-50 border border-red-200 rounded p-3">
                                            <p class="text-sm text-red-600">❌ 链中断: ${this.escapeHtml(result.error)}</p>
                                        </div>
                                    `}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        this.resultsContent.innerHTML = resultsHTML;
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * 保存到历史记录
     */
    saveToHistory() {
        Storage.saveHistory(this.currentEvaluation);
    }

    /**
     * 导出结果为JSON
     */
    exportResults() {
        if (!this.currentEvaluation) {
            showToast('没有可导出的结果', 'warning');
            return;
        }

        const dataStr = JSON.stringify(this.currentEvaluation, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `evallite-results-${Date.now()}.json`;
        link.click();

        showToast('结果已导出', 'success');
    }

    /**
     * 导出结果为CSV
     */
    exportCSV() {
        if (!this.currentEvaluation) {
            showToast('没有可导出的结果', 'warning');
            return;
        }

        const { mode } = this.currentEvaluation;
        let csvContent;

        if (mode === 'single') {
            csvContent = this.generateSingleTaskCSV();
        } else if (mode === 'chain') {
            csvContent = this.generateChainTaskCSV();
        } else {
            showToast('不支持的测试模式', 'error');
            return;
        }

        // 创建Blob并下载
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // 添加BOM支持中文
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `evallite-results-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('CSV已导出', 'success');
    }

    /**
     * 生成单任务模式的CSV
     */
    generateSingleTaskCSV() {
        const { task, repeatCount, results } = this.currentEvaluation;

        // CSV表头
        const headers = [
            '模型名称',
            '提供商',
            '模型ID',
            '任务名称',
            '执行序号',
            '状态',
            '输出文本',
            '耗时(ms)',
            'Token数',
            '错误信息',
            '时间戳'
        ];

        const csvRows = [headers.join(',')];

        // 遍历每个模型的结果
        results.forEach(modelResult => {
            const { model, executions } = modelResult;

            executions.forEach((exec, index) => {
                const row = [
                    `"${model.modelName}"`,
                    `"${model.provider}"`,
                    `"${model.modelId}"`,
                    `"${task.name}"`,
                    index + 1,
                    exec.success ? '成功' : '失败',
                    exec.success ? `"${(exec.content || '').replace(/"/g, '""')}"` : '', // 转义双引号
                    exec.success ? exec.responseTime : '',
                    exec.success ? (exec.tokensUsed || 0) : '',
                    exec.success ? '' : `"${(exec.error || '').replace(/"/g, '""')}"`,
                    exec.timestamp || ''
                ];

                csvRows.push(row.join(','));
            });
        });

        return csvRows.join('\n');
    }

    /**
     * 生成任务链模式的CSV
     */
    generateChainTaskCSV() {
        const { results } = this.currentEvaluation;

        // CSV表头
        const headers = [
            '模型名称',
            '提供商',
            '模型ID',
            '步骤序号',
            '任务名称',
            '输入模式',
            '状态',
            '输出文本',
            '耗时(ms)',
            'Token数',
            '错误信息',
            '时间戳'
        ];

        const csvRows = [headers.join(',')];

        // 遍历每个模型的结果
        results.forEach(modelResult => {
            const { model, steps } = modelResult;

            steps.forEach((step, index) => {
                const { task, inputMode, result } = step;
                const inputModeText = inputMode === 'previous' ? '使用上一输出' :
                                     inputMode === 'original' ? '使用原始prompt' :
                                     inputMode === 'concat' ? '拼接模式' : inputMode;

                const row = [
                    `"${model.modelName}"`,
                    `"${model.provider}"`,
                    `"${model.modelId}"`,
                    index + 1,
                    `"${task.name}"`,
                    `"${inputModeText}"`,
                    result.success ? '成功' : '失败',
                    result.success ? `"${(result.content || '').replace(/"/g, '""')}"` : '', // 转义双引号
                    result.success ? result.responseTime : '',
                    result.success ? (result.tokensUsed || 0) : '',
                    result.success ? '' : `"${(result.error || '').replace(/"/g, '""')}"`,
                    result.timestamp || ''
                ];

                csvRows.push(row.join(','));
            });
        });

        return csvRows.join('\n');
    }

    /**
     * 显示/隐藏加载动画
     */
    showLoading(show) {
        this.loadingModal.style.display = show ? 'flex' : 'none';
    }

    /**
     * 转义HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
