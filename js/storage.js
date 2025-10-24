// LocalStorage 封装 - 处理所有本地数据存储

const STORAGE_KEYS = {
    MODELS: 'evallite_models',
    HISTORY: 'evallite_history',
    SETTINGS: 'evallite_settings',
    TASKS: 'evallite_tasks',
    CHAINS: 'evallite_chains',
    EVALUATION_TEMPLATES: 'evallite_evaluation_templates',  // 评测模板
    CUSTOM_CATEGORIES: 'evallite_custom_categories'  // 新增：自定义分类
};

const MAX_HISTORY_ITEMS = 10;

/**
 * 存储管理器
 */
export const Storage = {
    /**
     * 保存模型列表
     * @param {Array} models - 模型数组
     */
    saveModels(models) {
        try {
            localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(models));
            return true;
        } catch (error) {
            console.error('保存模型失败:', error);
            return false;
        }
    },

    /**
     * 获取模型列表
     * @returns {Array} 模型数组
     */
    getModels() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.MODELS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取模型失败:', error);
            return [];
        }
    },

    /**
     * 添加单个模型
     * @param {Object} model - 模型对象
     */
    addModel(model) {
        const models = this.getModels();
        const newModel = {
            id: this.generateId(),
            ...model,
            createdAt: new Date().toISOString()
        };
        models.push(newModel);
        this.saveModels(models);
        return newModel;
    },

    /**
     * 删除模型
     * @param {string} modelId - 模型ID
     */
    deleteModel(modelId) {
        const models = this.getModels();
        const filtered = models.filter(m => m.id !== modelId);
        return this.saveModels(filtered);
    },

    /**
     * 更新模型
     * @param {string} modelId - 模型ID
     * @param {Object} updates - 更新的字段
     */
    updateModel(modelId, updates) {
        const models = this.getModels();
        const index = models.findIndex(m => m.id === modelId);
        if (index !== -1) {
            models[index] = { ...models[index], ...updates };
            return this.saveModels(models);
        }
        return false;
    },

    /**
     * 保存测评历史
     * @param {Object} evaluation - 测评对象
     */
    saveHistory(evaluation) {
        try {
            const history = this.getHistory();
            const newItem = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                ...evaluation
            };

            // 保持最多10条历史记录
            history.unshift(newItem);
            if (history.length > MAX_HISTORY_ITEMS) {
                history.pop();
            }

            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
            return newItem;
        } catch (error) {
            console.error('保存历史失败:', error);
            return null;
        }
    },

    /**
     * 获取测评历史
     * @returns {Array} 历史记录数组
     */
    getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取历史失败:', error);
            return [];
        }
    },

    /**
     * 删除历史记录
     * @param {string} historyId - 历史记录ID
     */
    deleteHistory(historyId) {
        try {
            const history = this.getHistory();
            const filtered = history.filter(h => h.id !== historyId);
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('删除历史失败:', error);
            return false;
        }
    },

    /**
     * 清空所有数据
     */
    clearAll() {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    },

    /**
     * 生成唯一ID
     * @returns {string} UUID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 导出所有数据为JSON
     * @returns {Object} 所有数据
     */
    exportAllData() {
        return {
            models: this.getModels(),
            history: this.getHistory(),
            exportedAt: new Date().toISOString()
        };
    },

    /**
     * 导入数据
     * @param {Object} data - 要导入的数据
     */
    importData(data) {
        try {
            if (data.models) {
                this.saveModels(data.models);
            }
            if (data.history) {
                localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
            }
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    },

    // ==================== 任务库管理 ====================

    /**
     * 保存任务到任务库
     */
    saveTasks(tasks) {
        try {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('保存任务失败:', error);
            return false;
        }
    },

    /**
     * 获取所有任务
     */
    getTasks() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.TASKS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取任务失败:', error);
            return [];
        }
    },

    /**
     * 添加单个任务
     */
    addTask(task) {
        const tasks = this.getTasks();
        const newTask = {
            id: this.generateId(),
            ...task,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        this.saveTasks(tasks);
        return newTask;
    },

    /**
     * 更新任务
     */
    updateTask(taskId, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveTasks(tasks);
            return tasks[index];
        }
        return null;
    },

    /**
     * 删除任务
     */
    deleteTask(taskId) {
        const tasks = this.getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        return this.saveTasks(filtered);
    },

    /**
     * 获取单个任务
     */
    getTask(taskId) {
        const tasks = this.getTasks();
        return tasks.find(t => t.id === taskId);
    },

    // ==================== 任务链管理 ====================

    /**
     * 保存所有任务链
     */
    saveChains(chains) {
        try {
            localStorage.setItem(STORAGE_KEYS.CHAINS, JSON.stringify(chains));
            return true;
        } catch (error) {
            console.error('保存任务链失败:', error);
            return false;
        }
    },

    /**
     * 获取所有任务链
     */
    getChains() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CHAINS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取任务链失败:', error);
            return [];
        }
    },

    /**
     * 添加任务链
     */
    addChain(chain) {
        const chains = this.getChains();
        const newChain = {
            id: this.generateId(),
            ...chain,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        chains.push(newChain);
        this.saveChains(chains);
        return newChain;
    },

    /**
     * 更新任务链
     */
    updateChain(chainId, updates) {
        const chains = this.getChains();
        const index = chains.findIndex(c => c.id === chainId);
        if (index !== -1) {
            chains[index] = {
                ...chains[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveChains(chains);
            return chains[index];
        }
        return null;
    },

    /**
     * 删除任务链
     */
    deleteChain(chainId) {
        const chains = this.getChains();
        const filtered = chains.filter(c => c.id !== chainId);
        return this.saveChains(filtered);
    },

    /**
     * 获取单个任务链
     */
    getChain(chainId) {
        const chains = this.getChains();
        return chains.find(c => c.id === chainId);
    },

    // ==================== 评测模板管理 ====================

    /**
     * 保存所有评测模板
     */
    saveEvaluationTemplates(templates) {
        try {
            localStorage.setItem(STORAGE_KEYS.EVALUATION_TEMPLATES, JSON.stringify(templates));
            return true;
        } catch (error) {
            console.error('保存评测模板失败:', error);
            return false;
        }
    },

    /**
     * 获取所有评测模板
     */
    getEvaluationTemplates() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.EVALUATION_TEMPLATES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取评测模板失败:', error);
            return [];
        }
    },

    /**
     * 添加评测模板
     */
    addEvaluationTemplate(template) {
        const templates = this.getEvaluationTemplates();
        const newTemplate = {
            id: this.generateId(),
            ...template,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        templates.push(newTemplate);
        this.saveEvaluationTemplates(templates);
        return newTemplate;
    },

    /**
     * 更新评测模板
     */
    updateEvaluationTemplate(templateId, updates) {
        const templates = this.getEvaluationTemplates();
        const index = templates.findIndex(t => t.id === templateId);
        if (index !== -1) {
            templates[index] = {
                ...templates[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveEvaluationTemplates(templates);
            return templates[index];
        }
        return null;
    },

    /**
     * 删除评测模板
     */
    deleteEvaluationTemplate(templateId) {
        const templates = this.getEvaluationTemplates();
        const filtered = templates.filter(t => t.id !== templateId);
        return this.saveEvaluationTemplates(filtered);
    },

    /**
     * 获取单个评测模板
     */
    getEvaluationTemplate(templateId) {
        const templates = this.getEvaluationTemplates();
        return templates.find(t => t.id === templateId);
    },

    // ==================== 模型价格管理 ====================

    /**
     * 内置模型价格表（硬编码，可被用户覆盖）
     * 价格单位：$/1M tokens
     */
    BUILTIN_MODEL_PRICES: {
        // OpenAI
        'gpt-4o': { inputPrice: 5.00, outputPrice: 15.00 },
        'gpt-4o-2024-11-20': { inputPrice: 5.00, outputPrice: 15.00 },
        'gpt-4o-mini': { inputPrice: 0.15, outputPrice: 0.60 },
        'gpt-4o-mini-2024-07-18': { inputPrice: 0.15, outputPrice: 0.60 },
        'gpt-4-turbo': { inputPrice: 10.00, outputPrice: 30.00 },
        'gpt-4': { inputPrice: 30.00, outputPrice: 60.00 },
        'gpt-3.5-turbo': { inputPrice: 0.50, outputPrice: 1.50 },

        // Anthropic
        'claude-3-5-sonnet-20241022': { inputPrice: 3.00, outputPrice: 15.00 },
        'claude-3-5-sonnet-20240620': { inputPrice: 3.00, outputPrice: 15.00 },
        'claude-3-opus-20240229': { inputPrice: 15.00, outputPrice: 75.00 },
        'claude-3-sonnet-20240229': { inputPrice: 3.00, outputPrice: 15.00 },
        'claude-3-haiku-20240307': { inputPrice: 0.25, outputPrice: 1.25 },

        // Google
        'gemini-1.5-pro': { inputPrice: 1.25, outputPrice: 5.00 },
        'gemini-1.5-flash': { inputPrice: 0.01875, outputPrice: 0.075 },
        'gemini-1.0-pro': { inputPrice: 0.50, outputPrice: 1.50 },

        // DeepSeek
        'deepseek-chat': { inputPrice: 0.27, outputPrice: 1.10 },
        'deepseek-coder': { inputPrice: 0.27, outputPrice: 1.10 },

        // 阿里巴巴通义千问
        'qwen-max': { inputPrice: 2.00, outputPrice: 6.00 },
        'qwen-plus': { inputPrice: 0.80, outputPrice: 2.00 },
        'qwen-turbo': { inputPrice: 0.30, outputPrice: 0.60 }
    },

    /**
     * 获取模型价格（优先使用用户自定义，否则使用内置价格）
     * @param {Object} model - 模型对象
     * @returns {Object} { inputPrice, outputPrice } 或 null
     */
    getModelPricing(model) {
        // 如果模型有自定义价格，直接返回
        if (model.pricing && model.pricing.isCustom) {
            return {
                inputPrice: model.pricing.inputPrice,
                outputPrice: model.pricing.outputPrice
            };
        }

        // 否则查找内置价格
        const modelId = model.modelId || model.model_id;
        if (this.BUILTIN_MODEL_PRICES[modelId]) {
            return this.BUILTIN_MODEL_PRICES[modelId];
        }

        // 没有找到价格
        return null;
    },

    /**
     * 计算调用成本
     * @param {number} inputTokens - 输入token数
     * @param {number} outputTokens - 输出token数
     * @param {Object} pricing - 价格对象 { inputPrice, outputPrice }（单位：$/1M tokens）
     * @returns {number} 成本（美元）
     */
    calculateCost(inputTokens, outputTokens, pricing) {
        if (!pricing) return 0;

        const inputCost = (inputTokens / 1000000) * pricing.inputPrice;
        const outputCost = (outputTokens / 1000000) * pricing.outputPrice;

        return inputCost + outputCost;
    },

    // ==================== 评测结果管理（增强历史记录）====================

    /**
     * 获取单个历史记录（评测报告）
     */
    getHistoryById(historyId) {
        const history = this.getHistory();
        return history.find(h => h.id === historyId);
    },

    /**
     * 计算聚合统计（按模型）
     * @param {Object} evaluation - 评测对象
     * @param {Object} historyRecord - 历史记录对象
     * @returns {Object} 聚合结果
     */
    calculateAggregatedByModel(evaluation, historyRecord) {
        if (!evaluation || !evaluation.scores || !evaluation.dimensions) {
            return {};
        }

        const aggregated = {};

        // 按模型分组executionId/stepId
        const executionsByModel = {};

        if (historyRecord.mode === 'single') {
            // 单任务模式：遍历results
            historyRecord.results.forEach((modelResult) => {
                const modelId = modelResult.model.id || modelResult.model.modelName;
                if (!executionsByModel[modelId]) {
                    executionsByModel[modelId] = {
                        modelName: modelResult.model.modelName,
                        executionIds: []
                    };
                }
                modelResult.executions.forEach(exec => {
                    if (exec.executionId) {
                        executionsByModel[modelId].executionIds.push(exec.executionId);
                    }
                });
            });
        } else if (historyRecord.mode === 'chain') {
            // 任务链模式：遍历steps
            historyRecord.results.forEach((modelResult) => {
                const modelId = modelResult.model.id || modelResult.model.modelName;
                if (!executionsByModel[modelId]) {
                    executionsByModel[modelId] = {
                        modelName: modelResult.model.modelName,
                        executionIds: []
                    };
                }
                modelResult.steps.forEach(step => {
                    if (step.stepId) {
                        executionsByModel[modelId].executionIds.push(step.stepId);
                    }
                });
            });
        }

        // 计算每个模型的统计数据
        for (const [modelId, data] of Object.entries(executionsByModel)) {
            const executionIds = data.executionIds;
            if (executionIds.length === 0) continue;

            // 初始化统计对象
            const avgScores = {};
            const minScores = {};
            const maxScores = {};
            const stdDevScores = {};

            // 计算每个维度的统计
            evaluation.dimensions.forEach(dim => {
                const scores = [];
                executionIds.forEach(execId => {
                    const score = evaluation.scores[execId]?.[dim.id];
                    if (score !== undefined && score !== null && score !== 0) {
                        scores.push(score);
                    }
                });

                if (scores.length > 0) {
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    const min = Math.min(...scores);
                    const max = Math.max(...scores);

                    // 计算标准差
                    const variance = scores.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / scores.length;
                    const stdDev = Math.sqrt(variance);

                    avgScores[dim.id] = parseFloat(avg.toFixed(2));
                    minScores[dim.id] = parseFloat(min.toFixed(2));
                    maxScores[dim.id] = parseFloat(max.toFixed(2));
                    stdDevScores[dim.id] = parseFloat(stdDev.toFixed(2));
                } else {
                    avgScores[dim.id] = 0;
                    minScores[dim.id] = 0;
                    maxScores[dim.id] = 0;
                    stdDevScores[dim.id] = 0;
                }
            });

            // 计算成本和响应时间
            let totalCost = 0;
            let totalResponseTime = 0;
            let validExecutions = 0;

            if (historyRecord.mode === 'single') {
                const modelResult = historyRecord.results.find(r =>
                    (r.model.id || r.model.modelName) === modelId
                );
                if (modelResult) {
                    modelResult.executions.forEach(exec => {
                        if (exec.success) {
                            // 计算成本
                            const pricing = this.getModelPricing(modelResult.model);
                            if (pricing && exec.tokensUsed) {
                                const cost = this.calculateCost(
                                    exec.tokensUsed / 2,
                                    exec.tokensUsed / 2,
                                    pricing
                                );
                                totalCost += cost;
                            }
                            // 计算响应时间
                            if (exec.responseTime) {
                                totalResponseTime += exec.responseTime;
                            }
                            validExecutions++;
                        }
                    });
                }
            } else if (historyRecord.mode === 'chain') {
                const modelResult = historyRecord.results.find(r =>
                    (r.model.id || r.model.modelName) === modelId
                );
                if (modelResult) {
                    modelResult.steps.forEach(step => {
                        if (step.result && step.result.success) {
                            const pricing = this.getModelPricing(modelResult.model);
                            if (pricing && step.result.tokensUsed) {
                                const cost = this.calculateCost(
                                    step.result.tokensUsed / 2,
                                    step.result.tokensUsed / 2,
                                    pricing
                                );
                                totalCost += cost;
                            }
                            if (step.result.responseTime) {
                                totalResponseTime += step.result.responseTime;
                            }
                            validExecutions++;
                        }
                    });
                }
            }

            const avgCost = validExecutions > 0 ? totalCost / validExecutions : 0;
            const avgResponseTime = validExecutions > 0 ? totalResponseTime / validExecutions : 0;

            aggregated[modelId] = {
                modelName: data.modelName,
                executionCount: executionIds.length,
                avgScores,
                minScores,
                maxScores,
                stdDevScores,
                avgCost,
                avgResponseTime
            };
        }

        return aggregated;
    },

    /**
     * 计算聚合统计（按任务节点）- 仅适用于任务链
     * @param {Object} evaluation - 评测对象
     * @param {Object} historyRecord - 历史记录对象
     * @returns {Object} 聚合结果
     */
    calculateAggregatedByTask(evaluation, historyRecord) {
        if (!evaluation || !evaluation.scores || historyRecord.mode !== 'chain') {
            return {};
        }

        const aggregated = {};

        // 遍历所有step，按任务分组
        historyRecord.results.forEach((modelResult) => {
            const modelId = modelResult.model.id || modelResult.model.modelName;
            const modelName = modelResult.model.modelName;

            modelResult.steps.forEach((step, stepIndex) => {
                const taskId = step.task.id;
                const taskName = step.task.name;

                if (!aggregated[taskId]) {
                    aggregated[taskId] = {
                        taskName,
                        stepIndex,
                        models: {}
                    };
                }

                if (!step.stepId) return;

                // 计算该step的综合得分
                let weightedSum = 0;
                let totalWeight = 0;
                evaluation.dimensions.forEach(dim => {
                    const score = evaluation.scores[step.stepId]?.[dim.id];
                    const weight = evaluation.weights?.[dim.id] || (1 / evaluation.dimensions.length);
                    if (score !== undefined && score !== null && score !== 0) {
                        const normalized = score / dim.scoreRange.max;
                        weightedSum += normalized * weight;
                        totalWeight += weight;
                    }
                });

                if (totalWeight > 0) {
                    const finalScore = (weightedSum / totalWeight) * 100;
                    aggregated[taskId].models[modelId] = {
                        modelName,
                        finalScore: parseFloat(finalScore.toFixed(2))
                    };
                }
            });
        });

        // 计算每个任务的平均分
        for (const taskId in aggregated) {
            const modelScores = Object.values(aggregated[taskId].models).map(m => m.finalScore);
            const avgScore = modelScores.length > 0
                ? modelScores.reduce((a, b) => a + b, 0) / modelScores.length
                : 0;
            aggregated[taskId].avgScore = parseFloat(avgScore.toFixed(2));
        }

        return aggregated;
    },

    /**
     * 向后兼容：迁移旧版evaluation数据
     * @param {Object} evaluation - 旧版evaluation对象
     * @param {Object} historyRecord - 历史记录对象
     * @returns {Object} 迁移后的evaluation对象
     */
    migrateEvaluationData(evaluation, historyRecord) {
        if (!evaluation || !evaluation.scores) {
            return evaluation;
        }

        // 检测是否为旧格式：scores的key是modelId而不是executionId
        const firstKey = Object.keys(evaluation.scores)[0];
        if (!firstKey) return evaluation;

        // 如果key格式不是exec_xxx或step_xxx，则认为是旧格式
        if (!firstKey.startsWith('exec_') && !firstKey.startsWith('step_')) {
            console.log('[数据迁移] 检测到旧版evaluation数据，开始迁移...');

            const newScores = {};

            if (historyRecord.mode === 'single') {
                // 单任务：将模型级评分复制到每个execution
                historyRecord.results.forEach(modelResult => {
                    const modelId = modelResult.model.id || modelResult.model.modelName;
                    const oldScores = evaluation.scores[modelId];

                    if (oldScores) {
                        modelResult.executions.forEach(exec => {
                            if (exec.executionId) {
                                newScores[exec.executionId] = { ...oldScores };
                            }
                        });
                    }
                });
            } else if (historyRecord.mode === 'chain') {
                // 任务链：将模型级评分复制到最后一个step
                historyRecord.results.forEach(modelResult => {
                    const modelId = modelResult.model.id || modelResult.model.modelName;
                    const oldScores = evaluation.scores[modelId];

                    if (oldScores && modelResult.steps.length > 0) {
                        const lastStep = modelResult.steps[modelResult.steps.length - 1];
                        if (lastStep.stepId) {
                            newScores[lastStep.stepId] = { ...oldScores };
                        }
                    }
                });
            }

            return {
                ...evaluation,
                scores: newScores,
                _migrated: true,  // 标记已迁移
                _originalScores: evaluation.scores  // 保留原始数据以防万一
            };
        }

        return evaluation;
    },

    /**
     * 更新历史记录中的评测数据
     * @param {string} historyId - 历史记录ID
     * @param {Object} evaluationData - 评测数据（评分、权重等）
     */
    updateHistoryEvaluation(historyId, evaluationData) {
        try {
            const history = this.getHistory();
            const index = history.findIndex(h => h.id === historyId);

            if (index !== -1) {
                history[index].evaluation = {
                    ...history[index].evaluation,
                    ...evaluationData,
                    updatedAt: new Date().toISOString()
                };

                localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
                return history[index];
            }

            return null;
        } catch (error) {
            console.error('更新评测数据失败:', error);
            return null;
        }
    },

    // ==================== 自定义分类管理 ====================

    /**
     * 获取所有自定义分类
     * @returns {Array} 自定义分类数组
     */
    getCustomCategories() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('读取自定义分类失败:', error);
            return [];
        }
    },

    /**
     * 添加自定义分类
     * @param {string} categoryName - 分类名称
     * @returns {Object|null} 新建的分类对象，如果已存在则返回null
     */
    addCustomCategory(categoryName) {
        const categories = this.getCustomCategories();

        // 检查是否已存在
        const existing = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (existing) {
            return null; // 已存在
        }

        const newCategory = {
            id: this.generateId(),
            name: categoryName,
            createdAt: new Date().toISOString()
        };

        categories.push(newCategory);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
        return newCategory;
    },

    /**
     * 删除自定义分类
     * @param {string} categoryId - 分类ID
     * @returns {boolean} 是否删除成功
     */
    deleteCustomCategory(categoryId) {
        try {
            const categories = this.getCustomCategories();
            const filtered = categories.filter(c => c.id !== categoryId);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('删除自定义分类失败:', error);
            return false;
        }
    },

    /**
     * 获取所有分类（内置 + 自定义）
     * @returns {Object} { builtin: [], custom: [] }
     */
    getAllCategories() {
        const builtin = [
            { id: 'general', name: '通用', isBuiltin: true },
            { id: 'translation', name: '翻译', isBuiltin: true },
            { id: 'writing', name: '写作', isBuiltin: true },
            { id: 'analysis', name: '分析', isBuiltin: true },
            { id: 'coding', name: '编程', isBuiltin: true },
            { id: 'other', name: '其他', isBuiltin: true }
        ];

        const custom = this.getCustomCategories().map(c => ({
            ...c,
            isBuiltin: false
        }));

        return { builtin, custom };
    }
};

// 导出为默认对象
export default Storage;
