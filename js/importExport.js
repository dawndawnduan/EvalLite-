// 导入/导出功能模块

import { Storage } from './storage.js';
import { showToast } from './navbar.js';

/**
 * 导入/导出管理器
 */
class ImportExportManager {
    constructor() {
        this.pendingImportData = null; // 待导入的数据
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // 按钮
        this.importBtn = document.getElementById('importTaskBtn');
        this.exportBtn = document.getElementById('exportTaskBtn');
        this.downloadTemplateDirectBtn = document.getElementById('downloadTemplateDirectBtn');
        this.fileInput = document.getElementById('importFileInput');

        // 导入模态框
        this.importModal = document.getElementById('importModal');
        this.cancelImportBtn = document.getElementById('cancelImportBtn');
        this.confirmImportBtn = document.getElementById('confirmImportBtn');
        this.importPreviewBody = document.getElementById('importPreviewBody');
        this.totalCountEl = document.getElementById('totalCount');
        this.validCountEl = document.getElementById('validCount');
        this.invalidCountEl = document.getElementById('invalidCount');

        // 导出模态框
        this.exportModal = document.getElementById('exportModal');
        this.cancelExportBtn = document.getElementById('cancelExportBtn');
        this.exportExcelBtn = document.getElementById('exportExcelBtn');
        this.exportCSVBtn = document.getElementById('exportCSVBtn');
        this.downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
    }

    attachEventListeners() {
        // 导入按钮
        this.importBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 导出按钮
        this.exportBtn.addEventListener('click', () => this.showExportModal());

        // 直接下载模板按钮
        this.downloadTemplateDirectBtn.addEventListener('click', () => this.downloadTemplate());

        // 导入模态框
        this.cancelImportBtn.addEventListener('click', () => this.closeImportModal());
        this.confirmImportBtn.addEventListener('click', () => this.executeImport());

        // 导出模态框
        this.cancelExportBtn.addEventListener('click', () => this.closeExportModal());
        this.exportExcelBtn.addEventListener('click', () => this.exportTasks('excel'));
        this.exportCSVBtn.addEventListener('click', () => this.exportTasks('csv'));
        this.downloadTemplateBtn.addEventListener('click', () => this.downloadTemplate());

        // 点击背景关闭模态框
        this.importModal.addEventListener('click', (e) => {
            if (e.target === this.importModal) this.closeImportModal();
        });
        this.exportModal.addEventListener('click', (e) => {
            if (e.target === this.exportModal) this.closeExportModal();
        });
    }

    /**
     * 处理文件选择
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // 显示加载提示
            showToast('正在解析文件...', 'info');

            // 根据文件类型解析
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let data;

            if (fileExtension === 'xlsx') {
                data = await this.parseExcel(file);
            } else if (fileExtension === 'csv') {
                data = await this.parseCSV(file);
            } else {
                throw new Error('不支持的文件格式，请选择 .xlsx 或 .csv 文件');
            }

            // 验证和预览
            this.previewImportData(data);

        } catch (error) {
            console.error('文件解析失败:', error);
            showToast(error.message || '文件解析失败', 'error');
        } finally {
            // 重置文件输入
            this.fileInput.value = '';
        }
    }

    /**
     * 解析 Excel 文件
     */
    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // 读取第一个工作表
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // 转换为JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                    if (jsonData.length === 0) {
                        reject(new Error('Excel 文件为空'));
                        return;
                    }

                    resolve(jsonData);
                } catch (error) {
                    reject(new Error(`Excel 解析错误: ${error.message}`));
                }
            };

            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 解析 CSV 文件
     */
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.errors.length > 0) {
                        console.warn('CSV 解析警告:', results.errors);
                    }

                    if (!results.data || results.data.length === 0) {
                        reject(new Error('CSV 文件为空'));
                        return;
                    }

                    resolve(results.data);
                },
                error: (error) => {
                    reject(new Error(`CSV 解析错误: ${error.message}`));
                }
            });
        });
    }

    /**
     * 验证和预览导入数据
     */
    previewImportData(rawData) {
        const existingTasks = Storage.getTasks();
        const existingNames = existingTasks.map(t => t.name.toLowerCase());

        const validatedData = [];
        let validCount = 0;
        let invalidCount = 0;

        rawData.forEach((row, index) => {
            const validated = this.validateTaskRow(row, index + 2, existingNames); // +2 因为Excel行号从1开始，且第1行是表头
            validatedData.push(validated);

            if (validated.valid) {
                validCount++;
            } else {
                invalidCount++;
            }
        });

        // 保存待导入数据
        this.pendingImportData = validatedData;

        // 显示统计
        this.totalCountEl.textContent = validatedData.length;
        this.validCountEl.textContent = validCount;
        this.invalidCountEl.textContent = invalidCount;

        // 渲染预览表格
        this.renderPreviewTable(validatedData);

        // 显示模态框
        this.showImportModal();
    }

    /**
     * 验证单行任务数据
     */
    validateTaskRow(row, rowNumber, existingNames) {
        const result = {
            rowNumber,
            valid: true,
            warnings: [],
            errors: [],
            data: {}
        };

        // 支持的列名映射（中文和英文）
        const fieldMapping = {
            '任务名称': 'name',
            'name': 'name',
            '任务描述': 'description',
            'description': 'description',
            'System Prompt': 'systemPrompt',
            'system_prompt': 'systemPrompt',
            'systemPrompt': 'systemPrompt',
            'User Prompt': 'userPrompt',
            'user_prompt': 'userPrompt',
            'userPrompt': 'userPrompt',
            '分类': 'category',
            'category': 'category',
            '标签': 'tags',
            'tags': 'tags'
        };

        // 映射字段
        for (const [key, value] of Object.entries(row)) {
            const mappedKey = fieldMapping[key];
            if (mappedKey) {
                result.data[mappedKey] = value;
            }
        }

        // 验证必填字段
        const name = result.data.name?.trim();
        if (!name) {
            result.valid = false;
            result.errors.push('缺少任务名称');
            return result;
        }
        result.data.name = name;

        // 检查重复名称
        if (existingNames.includes(name.toLowerCase())) {
            result.warnings.push('任务名称重复，将自动重命名');
            result.isDuplicate = true;
        }

        // 验证分类（支持内置和自定义分类）
        const validCategories = {
            '翻译': 'translation',
            'translation': 'translation',
            '写作': 'writing',
            'writing': 'writing',
            '分析': 'analysis',
            'analysis': 'analysis',
            '编程': 'coding',
            'coding': 'coding',
            '通用': 'general',
            'general': 'general',
            '其他': 'other',
            'other': 'other'
        };

        if (result.data.category) {
            const category = result.data.category.trim();
            if (validCategories[category]) {
                result.data.category = validCategories[category];
            } else {
                // 检查是否为自定义分类
                const allCategories = Storage.getAllCategories();
                const customCategory = allCategories.custom.find(c =>
                    c.name === category || c.id === category
                );

                if (customCategory) {
                    result.data.category = customCategory.id;
                } else {
                    result.warnings.push(`未知分类"${category}"，将使用默认分类`);
                    result.data.category = 'general';
                }
            }
        } else {
            result.data.category = 'general';
        }

        // 处理标签
        if (result.data.tags) {
            const tagsStr = result.data.tags.trim();
            if (tagsStr) {
                result.data.tags = tagsStr.split(/[;；,，]/).map(t => t.trim()).filter(t => t);
            } else {
                result.data.tags = [];
            }
        } else {
            result.data.tags = [];
        }

        // 处理可选字段
        result.data.description = result.data.description?.trim() || '';
        result.data.systemPrompt = result.data.systemPrompt?.trim() || '';
        result.data.userPrompt = result.data.userPrompt?.trim() || '';

        return result;
    }

    /**
     * 渲染预览表格
     */
    renderPreviewTable(data) {
        const rows = data.map(item => {
            const statusIcon = item.valid ? '✅' : '❌';
            const statusColor = item.valid ? 'text-green-600' : 'text-red-600';
            const warningIcon = item.warnings.length > 0 ? '⚠️' : '';

            const messages = [
                ...item.errors,
                ...item.warnings
            ].join(', ');

            return `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="px-4 py-3 ${statusColor}">${statusIcon} ${warningIcon}</td>
                    <td class="px-4 py-3 font-medium">${this.escapeHtml(item.data.name || '(缺失)')}</td>
                    <td class="px-4 py-3 text-gray-600">${this.escapeHtml(item.data.description || '-')}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 bg-gray-100 rounded text-xs">${this.getCategoryName(item.data.category)}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">${messages || '-'}</td>
                </tr>
            `;
        }).join('');

        this.importPreviewBody.innerHTML = rows;
    }

    /**
     * 执行导入
     */
    executeImport() {
        if (!this.pendingImportData) return;

        const validTasks = this.pendingImportData.filter(item => item.valid);

        if (validTasks.length === 0) {
            showToast('没有有效的任务可以导入', 'warning');
            return;
        }

        // 处理重复名称
        const existingTasks = Storage.getTasks();
        const tasksToImport = this.handleDuplicates(validTasks.map(v => v.data), existingTasks);

        // 批量导入
        let successCount = 0;
        let renamedCount = 0;

        tasksToImport.forEach(task => {
            try {
                Storage.addTask(task);
                successCount++;
                if (task._renamed) {
                    renamedCount++;
                }
            } catch (error) {
                console.error('导入任务失败:', error, task);
            }
        });

        // 关闭模态框
        this.closeImportModal();

        // 显示结果
        let message = `成功导入 ${successCount} 个任务`;
        if (renamedCount > 0) {
            message += `，其中 ${renamedCount} 个任务已自动重命名`;
        }
        showToast(message, 'success');

        // 刷新任务列表（通过事件）
        window.dispatchEvent(new CustomEvent('tasksUpdated'));
    }

    /**
     * 处理重复名称
     */
    handleDuplicates(tasks, existingTasks) {
        const existingNames = existingTasks.map(t => t.name.toLowerCase());
        const newTaskNames = new Set();

        return tasks.map(task => {
            let finalName = task.name;
            const baseName = task.name;
            let counter = 2;

            // 检查是否重复
            while (existingNames.includes(finalName.toLowerCase()) || newTaskNames.has(finalName.toLowerCase())) {
                finalName = `${baseName}(${counter})`;
                counter++;
            }

            newTaskNames.add(finalName.toLowerCase());

            if (finalName !== baseName) {
                task._renamed = true;
            }

            return {
                ...task,
                name: finalName
            };
        });
    }

    /**
     * 显示导入模态框
     */
    showImportModal() {
        this.importModal.style.display = 'flex';
    }

    /**
     * 关闭导入模态框
     */
    closeImportModal() {
        this.importModal.style.display = 'none';
        this.pendingImportData = null;
    }

    /**
     * 显示导出模态框
     */
    showExportModal() {
        const tasks = Storage.getTasks();
        if (tasks.length === 0) {
            showToast('没有任务可以导出', 'warning');
            return;
        }

        this.exportModal.style.display = 'flex';
    }

    /**
     * 关闭导出模态框
     */
    closeExportModal() {
        this.exportModal.style.display = 'none';
    }

    /**
     * 导出任务
     */
    exportTasks(format) {
        const tasks = Storage.getTasks();

        if (tasks.length === 0) {
            showToast('没有任务可以导出', 'warning');
            return;
        }

        // 准备导出数据
        const exportData = tasks.map(task => ({
            '任务名称': task.name,
            '任务描述': task.description || '',
            'System Prompt': task.systemPrompt || '',
            'User Prompt': task.userPrompt || '',
            '分类': this.getCategoryName(task.category),
            '标签': task.tags ? task.tags.join(';') : ''
        }));

        if (format === 'excel') {
            this.exportToExcel(exportData);
        } else if (format === 'csv') {
            this.exportToCSV(exportData);
        }

        this.closeExportModal();
    }

    /**
     * 导出为 Excel
     */
    exportToExcel(data) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '任务列表');

        // 设置列宽
        const colWidths = [
            { wch: 20 }, // 任务名称
            { wch: 30 }, // 任务描述
            { wch: 40 }, // System Prompt
            { wch: 40 }, // User Prompt
            { wch: 10 }, // 分类
            { wch: 20 }  // 标签
        ];
        worksheet['!cols'] = colWidths;

        // 下载文件
        const fileName = `EvalLite-任务导出-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        showToast('Excel 文件已导出', 'success');
    }

    /**
     * 导出为 CSV
     */
    exportToCSV(data) {
        const csv = Papa.unparse(data, {
            quotes: true,
            delimiter: ',',
            header: true
        });

        // 添加 BOM 以支持中文
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const fileName = `EvalLite-任务导出-${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('CSV 文件已导出', 'success');
    }

    /**
     * 下载模板
     */
    downloadTemplate() {
        const templateData = [
            {
                '任务名称': '英译中翻译',
                '任务描述': '将英文文档翻译成中文',
                'System Prompt': '你是一个专业的翻译助手',
                'User Prompt': '请将以下英文翻译成中文：{input}',
                '分类': 'translation',
                '标签': '翻译;常用'
            },
            {
                '任务名称': '代码审查',
                '任务描述': '审查Python代码质量',
                'System Prompt': '你是一个资深的Python工程师',
                'User Prompt': '请审查以下代码并提出改进建议',
                '分类': 'coding',
                '标签': '编程;代码审查'
            },
            {
                '任务名称': '文章摘要',
                '任务描述': '生成文章摘要',
                'System Prompt': '你是一个专业的内容编辑',
                'User Prompt': '请为以下文章生成200字摘要',
                '分类': 'writing',
                '标签': '写作;摘要'
            }
        ];

        // 导出为 Excel 模板
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '任务模板');

        // 设置列宽
        const colWidths = [
            { wch: 20 },
            { wch: 30 },
            { wch: 40 },
            { wch: 40 },
            { wch: 15 },
            { wch: 20 }
        ];
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, 'EvalLite-任务导入模板.xlsx');

        showToast('模板已下载', 'success');
        this.closeExportModal();
    }

    /**
     * 获取分类显示名称（支持自定义分类）
     */
    getCategoryName(category) {
        const names = {
            'translation': '翻译',
            'writing': '写作',
            'analysis': '分析',
            'coding': '编程',
            'general': '通用',
            'other': '其他'
        };

        // 如果是内置分类，返回中文名
        if (names[category]) {
            return names[category];
        }

        // 如果是自定义分类，查找分类名称
        const allCategories = Storage.getAllCategories();
        const customCategory = allCategories.custom.find(c => c.id === category);
        if (customCategory) {
            return customCategory.name;
        }

        // 未找到，返回原值
        return category;
    }

    /**
     * 转义 HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化
const importExportManager = new ImportExportManager();

// 导出实例供外部使用
export default importExportManager;
