// 模型管理模块 - 处理模型的添加、删除、显示等

import { Storage } from './storage.js';
import { MODEL_CONFIGS, fetchSiliconFlowModels } from './apiClient.js';

/**
 * 模型管理器类
 */
export class ModelManager {
    constructor() {
        this.models = [];
        this.initializeElements();
        this.attachEventListeners();
        this.loadModels();
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        this.providerSelect = document.getElementById('providerSelect');
        this.modelNameInput = document.getElementById('modelNameInput');
        this.modelIdSelect = document.getElementById('modelIdSelect');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.addModelBtn = document.getElementById('addModelBtn');
        this.modelList = document.getElementById('modelList');
        this.modelCheckboxes = document.getElementById('modelCheckboxes');

        // 价格配置相关元素（新增）
        this.inputPriceInput = document.getElementById('inputPriceInput');
        this.outputPriceInput = document.getElementById('outputPriceInput');
        this.defaultInputPrice = document.getElementById('defaultInputPrice');
        this.defaultOutputPrice = document.getElementById('defaultOutputPrice');
        this.pricingStatus = document.getElementById('pricingStatus');

        // 刷新模型按钮（新增）
        this.refreshModelsBtn = document.getElementById('refreshModelsBtn');
        this.refreshHint = document.getElementById('refreshHint');
    }

    /**
     * 附加事件监听器
     */
    attachEventListeners() {
        // 只在模型管理页面添加事件监听器
        if (this.providerSelect) {
            this.providerSelect.addEventListener('change', () => {
                this.updateModelIdOptions();
                this.toggleRefreshButton();
            });
        }

        if (this.addModelBtn) {
            this.addModelBtn.addEventListener('click', () => {
                this.addModel();
            });
        }

        // 模型ID改变时更新默认价格提示（新增）
        if (this.modelIdSelect) {
            this.modelIdSelect.addEventListener('change', () => {
                this.updateDefaultPriceDisplay();
            });
        }

        // 刷新模型按钮（新增）
        if (this.refreshModelsBtn) {
            this.refreshModelsBtn.addEventListener('click', () => {
                this.refreshModelsWithApiKey();
            });
        }

        // API Key输入框变化时显示提示
        if (this.apiKeyInput) {
            this.apiKeyInput.addEventListener('input', () => {
                this.toggleRefreshButton();
            });
        }
    }

    /**
     * 切换刷新按钮显示状态
     */
    toggleRefreshButton() {
        if (!this.refreshModelsBtn || !this.refreshHint) return;

        const provider = this.providerSelect?.value;
        const hasApiKey = this.apiKeyInput?.value.trim().length > 0;

        // 只有选择硅基流动且输入了API Key时才显示刷新按钮
        if (provider === 'siliconflow' && hasApiKey) {
            this.refreshModelsBtn.style.display = 'block';
            this.refreshHint.style.display = 'block';
        } else if (provider === 'siliconflow' && !hasApiKey) {
            this.refreshModelsBtn.style.display = 'none';
            this.refreshHint.style.display = 'block';
        } else {
            this.refreshModelsBtn.style.display = 'none';
            this.refreshHint.style.display = 'none';
        }
    }

    /**
     * 使用API Key刷新模型列表
     */
    async refreshModelsWithApiKey() {
        const apiKey = this.apiKeyInput?.value.trim();
        if (!apiKey) {
            alert('请先输入API Key');
            return;
        }

        // 显示加载状态
        this.modelIdSelect.innerHTML = '<option value="">正在刷新模型列表...</option>';
        this.modelIdSelect.disabled = true;
        this.refreshModelsBtn.disabled = true;
        this.refreshModelsBtn.textContent = '⏳ 刷新中...';

        try {
            console.log('[ModelManager] 使用API Key刷新硅基流动模型列表');
            const models = await fetchSiliconFlowModels(apiKey);

            // 恢复可用状态
            this.modelIdSelect.disabled = false;
            this.refreshModelsBtn.disabled = false;
            this.refreshModelsBtn.textContent = '🔄 刷新模型';

            this.modelIdSelect.innerHTML = '<option value="">选择模型</option>';

            // 填充模型列表
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                this.modelIdSelect.appendChild(option);
            });

            // 显示成功提示
            if (window.showToast) {
                window.showToast(`✅ 成功加载 ${models.length} 个最新模型！`, 'success');
            } else {
                alert(`✅ 成功加载 ${models.length} 个模型！`);
            }

        } catch (error) {
            console.error('[ModelManager] 刷新模型列表失败:', error);
            this.modelIdSelect.disabled = false;
            this.refreshModelsBtn.disabled = false;
            this.refreshModelsBtn.textContent = '🔄 刷新模型';

            alert('刷新模型列表失败，请检查API Key是否正确');
        }
    }

    /**
     * 更新默认价格显示（新增）
     */
    updateDefaultPriceDisplay() {
        const modelId = this.modelIdSelect.value;

        if (!modelId || !this.defaultInputPrice || !this.defaultOutputPrice) return;

        const defaultPricing = Storage.BUILTIN_MODEL_PRICES[modelId];

        if (defaultPricing) {
            this.defaultInputPrice.textContent = `默认: $${defaultPricing.inputPrice}`;
            this.defaultOutputPrice.textContent = `默认: $${defaultPricing.outputPrice}`;
            this.pricingStatus.textContent = '✅ 系统已有内置价格';
            this.pricingStatus.className = 'text-xs text-green-600';
        } else {
            this.defaultInputPrice.textContent = '无内置价格';
            this.defaultOutputPrice.textContent = '无内置价格';
            this.pricingStatus.textContent = '⚠️ 建议手动填写价格';
            this.pricingStatus.className = 'text-xs text-orange-600';
        }
    }

    /**
     * 更新模型ID选项
     */
    async updateModelIdOptions() {
        const provider = this.providerSelect.value;
        this.modelIdSelect.innerHTML = '<option value="">选择模型</option>';

        if (!provider || !MODEL_CONFIGS[provider]) {
            return;
        }

        // 如果是硅基流动且支持实时模型列表，则动态获取
        if (provider === 'siliconflow' && MODEL_CONFIGS[provider].supportsLiveModels) {
            // 显示加载状态
            this.modelIdSelect.innerHTML = '<option value="">正在加载模型列表...</option>';
            this.modelIdSelect.disabled = true;

            try {
                const models = await fetchSiliconFlowModels();

                // 恢复可用状态
                this.modelIdSelect.disabled = false;
                this.modelIdSelect.innerHTML = '<option value="">选择模型</option>';

                // 填充模型列表
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    this.modelIdSelect.appendChild(option);
                });

                // 显示提示信息
                if (window.showToast) {
                    window.showToast(`已加载 ${models.length} 个最新模型`, 'success');
                }
            } catch (error) {
                console.error('加载硅基流动模型列表失败:', error);
                this.modelIdSelect.disabled = false;
                this.modelIdSelect.innerHTML = '<option value="">加载失败，使用默认列表</option>';

                // 使用默认列表
                MODEL_CONFIGS[provider].models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    this.modelIdSelect.appendChild(option);
                });
            }
        } else {
            // 其他提供商使用静态列表
            MODEL_CONFIGS[provider].models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                this.modelIdSelect.appendChild(option);
            });
        }
    }

    /**
     * 加载已保存的模型
     */
    loadModels() {
        this.models = Storage.getModels();
        this.renderModelList();
        this.renderModelCheckboxes();
    }

    /**
     * 添加模型
     */
    addModel() {
        const provider = this.providerSelect.value;
        const modelName = this.modelNameInput.value.trim();
        const modelId = this.modelIdSelect.value;
        const apiKey = this.apiKeyInput.value.trim();

        // 验证输入
        if (!provider) {
            alert('请选择提供商');
            return;
        }

        if (!modelName) {
            alert('请输入模型名称');
            return;
        }

        if (!modelId) {
            alert('请选择模型ID');
            return;
        }

        if (!apiKey) {
            alert('请输入API Key');
            return;
        }

        // 获取价格配置（新增）
        const inputPrice = this.inputPriceInput?.value;
        const outputPrice = this.outputPriceInput?.value;

        // 创建模型对象
        const model = {
            provider,
            modelName,
            modelId,
            apiKey
        };

        // 如果用户填写了自定义价格，添加到模型对象（新增）
        if (inputPrice || outputPrice) {
            model.pricing = {
                inputPrice: inputPrice ? parseFloat(inputPrice) : 0,
                outputPrice: outputPrice ? parseFloat(outputPrice) : 0,
                currency: 'USD',
                isCustom: true,
                updatedAt: new Date().toISOString()
            };
        }

        // 保存到存储
        const savedModel = Storage.addModel(model);
        this.models.push(savedModel);

        // 更新UI
        this.renderModelList();
        this.renderModelCheckboxes();

        // 清空表单
        this.clearForm();

        // 显示成功消息
        this.showMessage('模型添加成功！', 'success');
    }

    /**
     * 删除模型
     */
    deleteModel(modelId) {
        if (!confirm('确定要删除这个模型吗？')) {
            return;
        }

        Storage.deleteModel(modelId);
        this.models = this.models.filter(m => m.id !== modelId);

        this.renderModelList();
        this.renderModelCheckboxes();

        this.showMessage('模型已删除', 'info');
    }

    /**
     * 渲染模型列表
     */
    renderModelList() {
        // 检查元素是否存在（test.html中不存在此元素）
        if (!this.modelList) return;

        if (this.models.length === 0) {
            this.modelList.innerHTML = '<p class="text-gray-500 text-sm">还没有添加模型</p>';
            return;
        }

        this.modelList.innerHTML = this.models.map(model => {
            // 获取模型价格信息
            const pricing = Storage.getModelPricing(model);
            const pricingDisplay = pricing
                ? `<p class="text-xs text-blue-600 mt-1">💰 价格: $${pricing.inputPrice}/$${pricing.outputPrice} (输入/输出 per 1M tokens)${model.pricing?.isCustom ? ' ·自定义' : ''}</p>`
                : '<p class="text-xs text-gray-400 mt-1">💰 未配置价格</p>';

            return `
                <div class="model-card p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="badge badge-${model.provider}">${MODEL_CONFIGS[model.provider]?.name || model.provider}</span>
                                <span class="font-medium text-gray-800">${model.modelName}</span>
                            </div>
                            <p class="text-xs text-gray-600">${model.modelId}</p>
                            <p class="text-xs text-gray-400 mt-1">Key: ${this.maskApiKey(model.apiKey)}</p>
                            ${pricingDisplay}
                        </div>
                        <button
                            class="text-red-600 hover:text-red-800 text-sm"
                            onclick="window.modelManager.deleteModel('${model.id}')"
                        >
                            删除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * 渲染模型复选框（用于选择要测评的模型）
     */
    renderModelCheckboxes() {
        // 检查元素是否存在（models.html中不存在此元素，只在test.html中存在）
        if (!this.modelCheckboxes) return;

        if (this.models.length === 0) {
            this.modelCheckboxes.innerHTML = '<p class="text-gray-500 text-sm">请先添加模型</p>';
            return;
        }

        this.modelCheckboxes.innerHTML = this.models.map(model => `
            <label class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                    type="checkbox"
                    class="model-checkbox w-4 h-4 text-blue-600"
                    value="${model.id}"
                    data-model-id="${model.id}"
                >
                <span class="badge badge-${model.provider} text-xs">${MODEL_CONFIGS[model.provider]?.name || model.provider}</span>
                <span class="text-sm text-gray-700">${model.modelName}</span>
            </label>
        `).join('');
    }

    /**
     * 获取选中的模型
     */
    getSelectedModels() {
        const checkboxes = document.querySelectorAll('.model-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        return this.models.filter(m => selectedIds.includes(m.id));
    }

    /**
     * 掩码API Key（只显示前后几位）
     */
    maskApiKey(apiKey) {
        if (!apiKey || apiKey.length < 8) return '****';
        return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
    }

    /**
     * 清空表单
     */
    clearForm() {
        this.providerSelect.value = '';
        this.modelNameInput.value = '';
        this.modelIdSelect.innerHTML = '<option value="">先选择提供商</option>';
        this.apiKeyInput.value = '';

        // 清空价格输入框（新增）
        if (this.inputPriceInput) this.inputPriceInput.value = '';
        if (this.outputPriceInput) this.outputPriceInput.value = '';
        if (this.defaultInputPrice) this.defaultInputPrice.textContent = '';
        if (this.defaultOutputPrice) this.defaultOutputPrice.textContent = '';
        if (this.pricingStatus) this.pricingStatus.textContent = '';
    }

    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        // 简单的消息提示（可以后续优化为更好看的toast）
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 2000);
    }
}

// 导出单例
export default ModelManager;
