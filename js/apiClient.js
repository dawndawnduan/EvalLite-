// API 客户端 - 统一封装各大模型提供商的API调用

// 代理服务器地址（如果使用本地代理）
const PROXY_URL = 'http://localhost:3000/proxy';

// 模型配置 - 各提供商支持的模型列表
export const MODEL_CONFIGS = {
    openai: {
        name: 'OpenAI',
        models: [
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }
        ],
        endpoint: 'https://api.openai.com/v1/chat/completions'
    },
    anthropic: {
        name: 'Anthropic',
        models: [
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }
        ],
        endpoint: 'https://api.anthropic.com/v1/messages'
    },
    google: {
        name: 'Google',
        models: [
            { id: 'gemini-pro', name: 'Gemini Pro' },
            { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ],
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/'
    },
    deepseek: {
        name: 'DeepSeek',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat' },
            { id: 'deepseek-coder', name: 'DeepSeek Coder' }
        ],
        endpoint: 'https://api.deepseek.com/v1/chat/completions'
    },
    siliconflow: {
        name: '硅基流动 SiliconFlow',
        models: [
            // 默认模型列表（后备）- 当API调用失败时使用
            { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3' },
            { id: 'Qwen/QwQ-32B', name: 'QwQ-32B' },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B-Instruct' },
            { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen2.5-32B-Instruct' },
            { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B-Instruct' },
            { id: 'THUDM/glm-4-9b-chat', name: 'GLM-4-9B-Chat' },
            { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama-3.3-70B-Instruct' },
            { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama-3.1-70B-Instruct' }
        ],
        endpoint: 'https://api.siliconflow.cn/v1/chat/completions',
        modelsEndpoint: 'https://api.siliconflow.cn/v1/models?type=text&sub_type=chat', // 使用查询参数过滤聊天模型
        supportsLiveModels: true // 标记支持实时获取模型列表
    },
    openrouter: {
        name: 'OpenRouter',
        models: [
            // 默认模型列表（后备）- 当API调用失败时使用
            { id: 'openai/gpt-4o', name: 'GPT-4o' },
            { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
            { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
            { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
            { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
            { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B' }
        ],
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        modelsEndpoint: 'https://openrouter.ai/api/v1/models',
        supportsLiveModels: true // 标记支持实时获取模型列表
    }
};

/**
 * API 客户端类
 */
export class APIClient {
    /**
     * 调用模型API
     * @param {Object} model - 模型配置对象
     * @param {string} systemPrompt - System Prompt
     * @param {string} userPrompt - User Prompt
     * @returns {Promise<Object>} 包含响应和元数据的对象
     */
    static async callModel(model, systemPrompt, userPrompt) {
        const startTime = Date.now();

        try {
            let result;

            switch (model.provider) {
                case 'openai':
                    result = await this.callOpenAI(model, systemPrompt, userPrompt);
                    break;
                case 'anthropic':
                    result = await this.callAnthropic(model, systemPrompt, userPrompt);
                    break;
                case 'google':
                    result = await this.callGoogle(model, systemPrompt, userPrompt);
                    break;
                case 'deepseek':
                    result = await this.callDeepSeek(model, systemPrompt, userPrompt);
                    break;
                case 'siliconflow':
                    result = await this.callSiliconFlow(model, systemPrompt, userPrompt);
                    break;
                case 'openrouter':
                    result = await this.callOpenRouter(model, systemPrompt, userPrompt);
                    break;
                default:
                    throw new Error(`不支持的提供商: ${model.provider}`);
            }

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            return {
                success: true,
                content: result.content,
                responseTime,
                inputTokens: result.inputTokens || 0,
                outputTokens: result.outputTokens || 0,
                tokensUsed: result.tokensUsed || 0,
                model: model,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            return {
                success: false,
                error: error.message,
                responseTime,
                model: model,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 调用 OpenAI API
     */
    static async callOpenAI(model, systemPrompt, userPrompt) {
        const messages = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        // 如果userPrompt为空，使用默认提示
        const actualUserPrompt = userPrompt || (systemPrompt ? '请根据上述要求进行回复' : '你好');
        messages.push({ role: 'user', content: actualUserPrompt });

        const requestBody = {
            model: model.modelId,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        };

        console.log('[APIClient] 调用 OpenAI:', {
            proxy: PROXY_URL,
            model: model.modelId,
            endpoint: MODEL_CONFIGS.openai.endpoint
        });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.openai.endpoint,
                headers: {
                    'Authorization': `Bearer ${model.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: requestBody
            })
        }).catch(error => {
            console.error('[APIClient] Fetch 错误:', error);
            throw new Error(`网络连接失败: ${error.message}. 请确认代理服务器是否运行在 ${PROXY_URL}`);
        });

        console.log('[APIClient] 响应状态:', response.status);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[APIClient] API 错误:', error);

            // 特殊处理配额错误
            if (error.error?.code === 'insufficient_quota') {
                throw new Error('API 配额已用尽，请检查 OpenAI 账户余额和付款方式');
            }

            throw new Error(error.error?.message || error.message || `OpenAI API 错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('[APIClient] 调用成功');

        return {
            content: data.choices[0].message.content,
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    /**
     * 调用 Anthropic API
     */
    static async callAnthropic(model, systemPrompt, userPrompt) {
        // 如果userPrompt为空，使用默认提示
        const actualUserPrompt = userPrompt || (systemPrompt ? '请根据上述要求进行回复' : '你好');

        const requestBody = {
            model: model.modelId,
            max_tokens: 2000,
            messages: [
                { role: 'user', content: actualUserPrompt }
            ]
        };

        if (systemPrompt) {
            requestBody.system = systemPrompt;
        }

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.anthropic.endpoint,
                headers: {
                    'x-api-key': model.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                body: requestBody
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Anthropic API 错误: ${response.status}`);
        }

        const data = await response.json();

        return {
            content: data.content[0].text,
            inputTokens: data.usage?.input_tokens || 0,
            outputTokens: data.usage?.output_tokens || 0,
            tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        };
    }

    /**
     * 调用 Google API
     */
    static async callGoogle(model, systemPrompt, userPrompt) {
        // 如果userPrompt为空，使用默认提示
        const actualUserPrompt = userPrompt || (systemPrompt ? '请根据上述要求进行回复' : '你好');

        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\n${actualUserPrompt}`
            : actualUserPrompt;

        const requestBody = {
            contents: [{
                parts: [{ text: fullPrompt }]
            }]
        };

        const url = `${MODEL_CONFIGS.google.endpoint}${model.modelId}:generateContent?key=${model.apiKey}`;

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Google API 错误: ${response.status}`);
        }

        const data = await response.json();

        return {
            content: data.candidates[0].content.parts[0].text,
            inputTokens: 0, // Google API 不直接返回token数
            outputTokens: 0,
            tokensUsed: 0
        };
    }

    /**
     * 调用 DeepSeek API
     */
    static async callDeepSeek(model, systemPrompt, userPrompt) {
        const messages = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        // 如果userPrompt为空，使用默认提示
        const actualUserPrompt = userPrompt || (systemPrompt ? '请根据上述要求进行回复' : '你好');
        messages.push({ role: 'user', content: actualUserPrompt });

        const requestBody = {
            model: model.modelId,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        };

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.deepseek.endpoint,
                headers: {
                    'Authorization': `Bearer ${model.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: requestBody
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `DeepSeek API 错误: ${response.status}`);
        }

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    /**
     * 调用硅基流动 SiliconFlow API
     */
    static async callSiliconFlow(model, systemPrompt, userPrompt) {
        const messages = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        // 如果userPrompt为空，使用默认提示
        const actualUserPrompt = userPrompt || (systemPrompt ? '请根据上述要求进行回复' : '你好');
        messages.push({ role: 'user', content: actualUserPrompt });

        const requestBody = {
            model: model.modelId,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false
        };

        console.log('[APIClient] 调用硅基流动:', {
            proxy: PROXY_URL,
            model: model.modelId,
            endpoint: MODEL_CONFIGS.siliconflow.endpoint
        });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.siliconflow.endpoint,
                headers: {
                    'Authorization': `Bearer ${model.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: requestBody
            })
        }).catch(error => {
            console.error('[APIClient] Fetch 错误:', error);
            throw new Error(`网络连接失败: ${error.message}. 请确认代理服务器是否运行在 ${PROXY_URL}`);
        });

        console.log('[APIClient] 响应状态:', response.status);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[APIClient] API 错误:', error);
            throw new Error(error.error?.message || error.message || `硅基流动 API 错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('[APIClient] 调用成功');

        return {
            content: data.choices[0].message.content,
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    /**
     * 调用 OpenRouter API
     */
    static async callOpenRouter(model, systemPrompt, userPrompt) {
        const messages = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        // 如果userPrompt为空，使用默认提示
        const actualUserPrompt = userPrompt || (systemPrompt ? '请根据上述要求进行回复' : '你好');
        messages.push({ role: 'user', content: actualUserPrompt });

        const requestBody = {
            model: model.modelId,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        };

        console.log('[APIClient] 调用 OpenRouter:', {
            proxy: PROXY_URL,
            model: model.modelId,
            endpoint: MODEL_CONFIGS.openrouter.endpoint
        });

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.openrouter.endpoint,
                headers: {
                    'Authorization': `Bearer ${model.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://evallite.app', // OpenRouter 要求的 Referer
                    'X-Title': 'EvalLite' // OpenRouter 要求的应用标识
                },
                body: requestBody
            })
        }).catch(error => {
            console.error('[APIClient] Fetch 错误:', error);
            throw new Error(`网络连接失败: ${error.message}. 请确认代理服务器是否运行在 ${PROXY_URL}`);
        });

        console.log('[APIClient] 响应状态:', response.status);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[APIClient] API 错误:', error);
            throw new Error(error.error?.message || error.message || `OpenRouter API 错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('[APIClient] 调用成功');

        return {
            content: data.choices[0].message.content,
            inputTokens: data.usage?.prompt_tokens || 0,
            outputTokens: data.usage?.completion_tokens || 0,
            tokensUsed: data.usage?.total_tokens || 0
        };
    }
}

/**
 * 独立函数：调用模型API（用于AI评分等场景）
 * @param {string} provider - 提供商名称
 * @param {string} modelId - 模型ID
 * @param {string} apiKey - API密钥
 * @param {Array} messages - 消息数组 [{ role: 'user', content: '...' }]
 * @returns {Promise<Object>} { content: string, tokensUsed: number }
 */
export async function callModelAPI(provider, modelId, apiKey, messages) {
    const model = {
        provider,
        modelId,
        apiKey
    };

    // 提取 system 和 user prompts
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsg = messages.find(m => m.role === 'user');

    const systemPrompt = systemMsg ? systemMsg.content : '';
    const userPrompt = userMsg ? userMsg.content : '';

    const result = await APIClient.callModel(model, systemPrompt, userPrompt);

    if (!result.success) {
        throw new Error(result.error);
    }

    return {
        content: result.content,
        tokensUsed: result.tokensUsed
    };
}

/**
 * 获取硅基流动的完整模型列表
 * @param {string} apiKey - API密钥（推荐提供以获取完整列表）
 * @returns {Promise<Array>} 模型列表 [{ id: string, name: string }]
 */
export async function fetchSiliconFlowModels(apiKey = null) {
    try {
        console.log('[APIClient] 正在获取硅基流动模型列表...');
        console.log('[APIClient] API Key 提供:', apiKey ? '是' : '否（可能只返回公开模型）');

        const headers = {
            'Content-Type': 'application/json'
        };

        // 如果提供了 API Key，添加到请求头（推荐，可获取完整模型列表）
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.siliconflow.modelsEndpoint,
                method: 'GET', // 指定使用GET方法
                headers: headers,
                body: {} // GET请求，body为空
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('[APIClient] 获取硅基流动模型列表失败:', response.status, errorText);
            console.warn('[APIClient] 使用默认模型列表');
            return MODEL_CONFIGS.siliconflow.models;
        }

        const data = await response.json();
        console.log('[APIClient] API 返回数据:', data);

        // 硅基流动 API 返回格式: { object: "list", data: [{ id: "model-id", object: "model", created: 0, owned_by: "" }] }
        if (!data || !data.data || !Array.isArray(data.data)) {
            console.warn('[APIClient] 硅基流动API返回格式不符合预期:', data);
            console.warn('[APIClient] 使用默认模型列表');
            return MODEL_CONFIGS.siliconflow.models;
        }

        // 转换为我们需要的格式（API已通过 type=text&sub_type=chat 参数过滤了聊天模型）
        const models = data.data
            .map(model => ({
                id: model.id,
                // 使用模型ID的最后部分作为显示名称，如果有斜杠则取最后一部分
                name: model.id.includes('/') ? model.id.split('/').pop() : model.id
            }))
            .sort((a, b) => a.name.localeCompare(b.name)); // 按名称排序

        console.log(`[APIClient] 成功获取 ${models.length} 个硅基流动聊天模型`);
        console.log('[APIClient] 模型列表预览:', models.slice(0, 5));

        // 如果模型数量很少，可能是没有提供 API Key
        if (models.length < 10 && !apiKey) {
            console.warn('[APIClient] ⚠️ 提示：未提供API Key，可能只返回了部分公开模型');
            console.warn('[APIClient] ⚠️ 建议：在选择硅基流动后，输入您的API Key以获取完整模型列表');
        }

        return models;

    } catch (error) {
        console.error('[APIClient] 获取硅基流动模型列表出错:', error);
        console.warn('[APIClient] 使用默认模型列表');
        return MODEL_CONFIGS.siliconflow.models;
    }
}

/**
 * 获取 OpenRouter 的完整模型列表
 * @param {string} apiKey - API密钥（OpenRouter 需要认证才能获取完整列表）
 * @returns {Promise<Array>} 模型列表 [{ id: string, name: string }]
 */
export async function fetchOpenRouterModels(apiKey = null) {
    try {
        console.log('[APIClient] 正在获取 OpenRouter 模型列表...');
        console.log('[APIClient] API Key 提供:', apiKey ? '是' : '否');

        const headers = {
            'Content-Type': 'application/json'
        };

        // OpenRouter 需要 API Key 才能获取完整模型列表
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: MODEL_CONFIGS.openrouter.modelsEndpoint,
                method: 'GET', // 使用 GET 方法
                headers: headers,
                body: {} // GET 请求，body 为空
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('[APIClient] 获取 OpenRouter 模型列表失败:', response.status, errorText);
            console.warn('[APIClient] 使用默认模型列表');
            return MODEL_CONFIGS.openrouter.models;
        }

        const data = await response.json();
        console.log('[APIClient] API 返回数据样本:', data.data?.slice(0, 3));

        // OpenRouter API 返回格式: { data: [{ id: "provider/model-name", name: "Model Name", ... }] }
        if (!data || !data.data || !Array.isArray(data.data)) {
            console.warn('[APIClient] OpenRouter API 返回格式不符合预期:', data);
            console.warn('[APIClient] 使用默认模型列表');
            return MODEL_CONFIGS.openrouter.models;
        }

        // 转换为我们需要的格式
        const models = data.data
            .map(model => ({
                id: model.id,
                // 使用模型的 name 字段（如果有），否则使用 id 的最后部分
                name: model.name || (model.id.includes('/') ? model.id.split('/').pop() : model.id)
            }))
            .sort((a, b) => a.name.localeCompare(b.name)); // 按名称排序

        console.log(`[APIClient] 成功获取 ${models.length} 个 OpenRouter 模型`);
        console.log('[APIClient] 模型列表预览:', models.slice(0, 5));

        // 如果没有提供 API Key，提示用户
        if (!apiKey) {
            console.warn('[APIClient] ⚠️ 提示：未提供 API Key，可能只返回了部分模型');
            console.warn('[APIClient] ⚠️ 建议：输入您的 OpenRouter API Key 以获取完整模型列表');
        }

        return models;

    } catch (error) {
        console.error('[APIClient] 获取 OpenRouter 模型列表出错:', error);
        console.warn('[APIClient] 使用默认模型列表');
        return MODEL_CONFIGS.openrouter.models;
    }
}

export default APIClient;
