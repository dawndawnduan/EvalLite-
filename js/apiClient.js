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
            { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3' },
            { id: 'Qwen/QwQ-32B', name: 'QwQ-32B' },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B' },
            { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen2.5-32B' },
            { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen2.5-14B' },
            { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B' },
            { id: 'THUDM/glm-4-9b-chat', name: 'GLM-4-9B' },
            { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama-3.3-70B' },
            { id: 'meta-llama/Llama-3.1-70B-Instruct', name: 'Llama-3.1-70B' },
            { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama-3.1-8B' }
        ],
        endpoint: 'https://api.siliconflow.cn/v1/chat/completions'
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
                default:
                    throw new Error(`不支持的提供商: ${model.provider}`);
            }

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            return {
                success: true,
                content: result.content,
                responseTime,
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
        messages.push({ role: 'user', content: userPrompt });

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
            tokensUsed: data.usage?.total_tokens || 0
        };
    }

    /**
     * 调用 Anthropic API
     */
    static async callAnthropic(model, systemPrompt, userPrompt) {
        const requestBody = {
            model: model.modelId,
            max_tokens: 2000,
            messages: [
                { role: 'user', content: userPrompt }
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
            tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0
        };
    }

    /**
     * 调用 Google API
     */
    static async callGoogle(model, systemPrompt, userPrompt) {
        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\n${userPrompt}`
            : userPrompt;

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
            tokensUsed: 0 // Google API 不直接返回token数
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
        messages.push({ role: 'user', content: userPrompt });

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
        messages.push({ role: 'user', content: userPrompt });

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

export default APIClient;
