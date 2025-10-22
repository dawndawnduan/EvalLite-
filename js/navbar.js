// 统一导航栏组件

/**
 * 渲染导航栏
 * @param {string} currentPage - 当前页面标识 (home|models|tasks|test|history)
 */
export function renderNavbar(currentPage = 'home') {
    const navbarHTML = `
        <nav class="navbar sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-8">
                        <a href="index.html" class="navbar-brand text-2xl">
                            EvalLite
                        </a>
                        <div class="hidden md:flex gap-2">
                            <a href="index.html" class="nav-link ${currentPage === 'home' ? 'active' : ''}">
                                首页
                            </a>
                            <a href="models.html" class="nav-link ${currentPage === 'models' ? 'active' : ''}">
                                模型管理
                            </a>
                            <a href="tasks.html" class="nav-link ${currentPage === 'tasks' ? 'active' : ''}">
                                任务管理
                            </a>
                            <a href="test.html" class="nav-link ${currentPage === 'test' ? 'active' : ''}">
                                测试执行
                            </a>
                            <a href="evaluation-config.html" class="nav-link ${currentPage === 'evaluation-config' ? 'active' : ''}">
                                评测配置
                            </a>
                            <a href="history.html" class="nav-link ${currentPage === 'history' || currentPage === 'reports' ? 'active' : ''}">
                                测试历史
                            </a>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="mobileMenuBtn" class="md:hidden px-3 py-2 text-gray-600 hover:text-gray-900">
                            ☰
                        </button>
                    </div>
                </div>

                <!-- 移动端菜单 -->
                <div id="mobileMenu" class="md:hidden hidden mt-4 space-y-2">
                    <a href="index.html" class="nav-link block ${currentPage === 'home' ? 'active' : ''}">
                        首页
                    </a>
                    <a href="models.html" class="nav-link block ${currentPage === 'models' ? 'active' : ''}">
                        模型管理
                    </a>
                    <a href="tasks.html" class="nav-link block ${currentPage === 'tasks' ? 'active' : ''}">
                        任务管理
                    </a>
                    <a href="test.html" class="nav-link block ${currentPage === 'test' ? 'active' : ''}">
                        测试执行
                    </a>
                    <a href="evaluation-config.html" class="nav-link block ${currentPage === 'evaluation-config' ? 'active' : ''}">
                        评测配置
                    </a>
                    <a href="history.html" class="nav-link block ${currentPage === 'history' || currentPage === 'reports' ? 'active' : ''}">
                        测试历史
                    </a>
                </div>
            </div>
        </nav>
    `;

    // 插入导航栏到页面顶部
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // 移动端菜单切换
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

/**
 * 显示Toast消息
 */
export function showToast(message, type = 'info') {
    const colors = {
        success: 'from-green-400 to-green-600',
        error: 'from-red-400 to-red-600',
        info: 'from-blue-400 to-blue-600',
        warning: 'from-yellow-400 to-yellow-600'
    };

    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-xl text-white shadow-2xl z-50 bg-gradient-to-r ${colors[type]}`;
    toast.style.animation = 'slideIn 0.3s ease-out';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export default { renderNavbar, showToast };
