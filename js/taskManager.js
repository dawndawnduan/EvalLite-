// 任务管理器 - 新版本

import { Storage } from './storage.js';

class TaskManager {
    constructor() {
        this.currentEditingId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.renderTasks();
    }

    initializeElements() {
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.searchInput = document.getElementById('searchInput');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.clearFilterBtn = document.getElementById('clearFilterBtn');

        // Modal elements
        this.modal = document.getElementById('taskModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.createTaskBtn = document.getElementById('createTaskBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveTaskBtn = document.getElementById('saveTaskBtn');

        // Form fields
        this.taskName = document.getElementById('taskName');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskSystemPrompt = document.getElementById('taskSystemPrompt');
        this.taskUserPrompt = document.getElementById('taskUserPrompt');
        this.taskCategory = document.getElementById('taskCategory');
        this.taskTags = document.getElementById('taskTags');
    }

    attachEventListeners() {
        this.createTaskBtn.addEventListener('click', () => this.showCreateModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.saveTaskBtn.addEventListener('click', () => this.saveTask());
        this.searchInput.addEventListener('input', () => this.renderTasks());
        this.categoryFilter.addEventListener('change', () => this.renderTasks());
        this.clearFilterBtn.addEventListener('click', () => this.clearFilters());

        // Close modal on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    showCreateModal() {
        this.currentEditingId = null;
        this.modalTitle.textContent = '创建任务';
        this.clearForm();
        this.modal.style.display = 'flex';
    }

    showEditModal(taskId) {
        this.currentEditingId = taskId;
        const task = Storage.getTask(taskId);
        if (!task) return;

        this.modalTitle.textContent = '编辑任务';
        this.taskName.value = task.name;
        this.taskDescription.value = task.description || '';
        this.taskSystemPrompt.value = task.systemPrompt || '';
        this.taskUserPrompt.value = task.userPrompt || '';
        this.taskCategory.value = task.category || 'general';
        this.taskTags.value = task.tags ? task.tags.join(';') : '';

        this.modal.style.display = 'flex';
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.clearForm();
    }

    clearForm() {
        this.taskName.value = '';
        this.taskDescription.value = '';
        this.taskSystemPrompt.value = '';
        this.taskUserPrompt.value = '';
        this.taskCategory.value = 'general';
        this.taskTags.value = '';
    }

    clearFilters() {
        this.searchInput.value = '';
        this.categoryFilter.value = '';
        this.renderTasks();
    }

    saveTask() {
        const name = this.taskName.value.trim();
        const userPrompt = this.taskUserPrompt.value.trim();

        if (!name || !userPrompt) {
            alert('请填写任务名称和 User Prompt');
            return;
        }

        const taskData = {
            name,
            description: this.taskDescription.value.trim(),
            systemPrompt: this.taskSystemPrompt.value.trim(),
            userPrompt,
            category: this.taskCategory.value,
            tags: this.taskTags.value.trim() ?
                  this.taskTags.value.split(';').map(t => t.trim()).filter(t => t) : []
        };

        if (this.currentEditingId) {
            Storage.updateTask(this.currentEditingId, taskData);
            this.showToast('任务已更新', 'success');
        } else {
            Storage.addTask(taskData);
            this.showToast('任务已创建', 'success');
        }

        this.closeModal();
        this.renderTasks();
    }

    deleteTask(taskId) {
        if (!confirm('确定要删除这个任务吗？')) return;

        Storage.deleteTask(taskId);
        this.renderTasks();
        this.showToast('任务已删除', 'info');
    }

    duplicateTask(taskId) {
        const task = Storage.getTask(taskId);
        if (!task) return;

        const duplicate = {
            name: task.name + ' (副本)',
            description: task.description,
            systemPrompt: task.systemPrompt,
            userPrompt: task.userPrompt,
            category: task.category,
            tags: [...(task.tags || [])]
        };

        Storage.addTask(duplicate);
        this.renderTasks();
        this.showToast('任务已复制', 'success');
    }

    renderTasks() {
        let tasks = Storage.getTasks();

        // Apply filters
        const searchTerm = this.searchInput.value.toLowerCase();
        const category = this.categoryFilter.value;

        if (searchTerm) {
            tasks = tasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm) ||
                (task.description && task.description.toLowerCase().includes(searchTerm))
            );
        }

        if (category) {
            tasks = tasks.filter(task => task.category === category);
        }

        if (tasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }

        this.taskList.style.display = 'grid';
        this.emptyState.style.display = 'none';

        this.taskList.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');
    }

    renderTaskCard(task) {
        const categoryColors = {
            translation: 'from-blue-400 to-blue-600',
            writing: 'from-green-400 to-green-600',
            analysis: 'from-purple-400 to-purple-600',
            coding: 'from-orange-400 to-orange-600',
            general: 'from-gray-400 to-gray-600',
            other: 'from-pink-400 to-pink-600'
        };

        const categoryNames = {
            translation: '翻译',
            writing: '写作',
            analysis: '分析',
            coding: '编程',
            general: '通用',
            other: '其他'
        };

        const gradient = categoryColors[task.category] || categoryColors.general;
        const categoryName = categoryNames[task.category] || '通用';

        return `
            <div class="task-card glass-effect rounded-2xl p-6 shadow-lg">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800 mb-1">${this.escapeHtml(task.name)}</h3>
                        ${task.description ? `<p class="text-sm text-gray-500">${this.escapeHtml(task.description)}</p>` : ''}
                    </div>
                    <span class="px-3 py-1 text-xs font-medium text-white rounded-full bg-gradient-to-r ${gradient}">
                        ${categoryName}
                    </span>
                </div>

                ${task.systemPrompt ? `
                    <div class="mb-3 p-3 bg-gray-50 rounded-xl">
                        <p class="text-xs text-gray-500 mb-1">System Prompt</p>
                        <p class="text-sm text-gray-700 line-clamp-2">${this.escapeHtml(task.systemPrompt)}</p>
                    </div>
                ` : ''}

                <div class="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p class="text-xs text-gray-500 mb-1">User Prompt</p>
                    <p class="text-sm text-gray-700 line-clamp-3">${this.escapeHtml(task.userPrompt)}</p>
                </div>

                ${task.tags && task.tags.length > 0 ? `
                    <div class="flex gap-2 mb-4 flex-wrap">
                        ${task.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                        onclick="window.taskManager.showEditModal('${task.id}')"
                        class="flex-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium">
                        编辑
                    </button>
                    <button
                        onclick="window.taskManager.duplicateTask('${task.id}')"
                        class="flex-1 px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition font-medium">
                        复制
                    </button>
                    <button
                        onclick="window.taskManager.deleteTask('${task.id}')"
                        class="flex-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium">
                        删除
                    </button>
                </div>

                <div class="mt-3 pt-3 border-t border-gray-200">
                    <p class="text-xs text-gray-400">
                        创建于 ${new Date(task.createdAt).toLocaleString('zh-CN')}
                    </p>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        // 使用全局showToast函数
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
}

// Initialize
window.taskManager = new TaskManager();
