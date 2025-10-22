/**
 * EvalLite CORS Proxy Server
 *
 * 这是一个轻量级的代理服务器，用于解决浏览器直接调用AI模型API时的CORS跨域问题
 *
 * 功能：
 * - 接收前端的API请求
 * - 转发到目标AI模型API
 * - 返回响应给前端
 *
 * 使用方法：
 * 1. 安装依赖: npm install
 * 2. 启动服务: npm start
 * 3. 服务将在 http://localhost:3000 运行
 */

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors()); // 允许所有跨域请求
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体，限制10MB

// 静态文件服务 - 提供HTML/CSS/JS文件
app.use(express.static(path.join(__dirname, '..')));

/**
 * 使用原生 https 模块发送请求（兼容性更好）
 */
function makeRequest(url, options, postData) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: options.headers
        };

        const req = protocol.request(requestOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: jsonData
                    });
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

/**
 * 代理端点
 * POST /proxy
 *
 * 请求体格式:
 * {
 *   url: string,        // 目标API地址
 *   headers: object,    // 请求头
 *   body: object        // 请求体
 * }
 */
app.post('/proxy', async (req, res) => {
    try {
        const { url, headers, body } = req.body;

        // 验证必需参数
        if (!url) {
            return res.status(400).json({
                error: 'Missing required parameter: url'
            });
        }

        console.log(`[${new Date().toISOString()}] Proxying request to: ${url}`);

        // 使用原生 https 模块转发请求
        const postData = JSON.stringify(body);
        const response = await makeRequest(url, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                ...headers
            }
        }, postData);

        // 返回响应
        if (response.ok) {
            console.log(`[${new Date().toISOString()}] Request successful: ${response.status}`);
            res.json(response.data);
        } else {
            console.error(`[${new Date().toISOString()}] Request failed: ${response.status}`, response.data);
            res.status(response.status).json(response.data);
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Proxy error:`, error.message);
        res.status(500).json({
            error: 'Proxy server error',
            message: error.message
        });
    }
});

/**
 * 健康检查端点
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * 根路径 - 显示使用说明
 */
app.get('/', (req, res) => {
    res.json({
        name: 'EvalLite CORS Proxy',
        version: '1.0.0',
        endpoints: {
            '/proxy': 'POST - Proxy API requests',
            '/health': 'GET - Health check'
        },
        usage: {
            method: 'POST',
            url: `http://localhost:${PORT}/proxy`,
            body: {
                url: 'https://api.example.com/endpoint',
                headers: { 'Authorization': 'Bearer YOUR_KEY' },
                body: { key: 'value' }
            }
        }
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   EvalLite CORS Proxy Server Started    ║
╚══════════════════════════════════════════╝

🚀 Server is running on: http://localhost:${PORT}
📡 Proxy endpoint: http://localhost:${PORT}/proxy
💚 Health check: http://localhost:${PORT}/health

Press Ctrl+C to stop the server
    `);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Shutting down gracefully...');
    process.exit(0);
});
