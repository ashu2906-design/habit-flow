/**
 * HabitFlow - Frontend Application
 * Smart Habit Tracker with Behavioral Psychology
 */

// API Configuration
const API_BASE = '/api';

// State
let state = {
    user: null,
    token: localStorage.getItem('habitflow_token'),
    habits: [],
    todayHabits: [],
    currentView: 'auth',
    isAuthMode: 'login'
};

// DOM Elements
const elements = {
    // Views
    authView: document.getElementById('authView'),
    dashboardView: document.getElementById('dashboardView'),
    habitsView: document.getElementById('habitsView'),
    analyticsView: document.getElementById('analyticsView'),

    // Auth
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authSubtitle: document.getElementById('authSubtitle'),
    authSubmit: document.getElementById('authSubmit'),
    authToggleLink: document.getElementById('authToggleLink'),
    usernameGroup: document.getElementById('usernameGroup'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    usernameInput: document.getElementById('username'),

    // Nav
    navLinks: document.getElementById('navLinks'),
    navUser: document.getElementById('navUser'),
    navAuth: document.getElementById('navAuth'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),

    // Dashboard
    userName: document.getElementById('userName'),
    timeOfDay: document.getElementById('timeOfDay'),
    currentDate: document.getElementById('currentDate'),
    activeStreaks: document.getElementById('activeStreaks'),
    todayProgress: document.getElementById('todayProgress'),
    weeklyRate: document.getElementById('weeklyRate'),
    longestStreak: document.getElementById('longestStreak'),
    todayHabits: document.getElementById('todayHabits'),
    insightsList: document.getElementById('insightsList'),

    // Habits
    habitsGrid: document.getElementById('habitsGrid'),

    // Analytics
    completionValue: document.getElementById('completionValue'),
    dayChart: document.getElementById('dayChart'),
    topHabits: document.getElementById('topHabits'),

    // Modal
    habitModal: document.getElementById('habitModal'),
    habitForm: document.getElementById('habitForm'),
    modalTitle: document.getElementById('modalTitle'),
    modalClose: document.getElementById('modalClose'),
    cancelHabit: document.getElementById('cancelHabit'),
    iconSelector: document.getElementById('iconSelector'),

    // Toast
    toast: document.getElementById('toast')
};

// Initialize App
document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();
    updateGreeting();

    if (state.token) {
        await loadUser();
    } else {
        showView('auth');
        updateNavState();
    }
}

// Event Listeners
function setupEventListeners() {
    // Auth
    elements.authForm.addEventListener('submit', handleAuth);
    elements.authToggleLink.addEventListener('click', toggleAuthMode);
    elements.loginBtn?.addEventListener('click', () => {
        state.isAuthMode = 'login';
        showView('auth');
        updateAuthUI();
    });
    elements.signupBtn?.addEventListener('click', () => {
        state.isAuthMode = 'signup';
        showView('auth');
        updateAuthUI();
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            navigateTo(view);
        });
    });

    // Add habit buttons
    document.getElementById('addHabitBtn')?.addEventListener('click', openHabitModal);
    document.getElementById('newHabitBtn')?.addEventListener('click', openHabitModal);

    // Modal
    elements.modalClose.addEventListener('click', closeHabitModal);
    elements.cancelHabit.addEventListener('click', closeHabitModal);
    elements.habitModal.querySelector('.modal-overlay').addEventListener('click', closeHabitModal);
    elements.habitForm.addEventListener('submit', handleHabitSubmit);

    // Icon selector
    elements.iconSelector.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            elements.iconSelector.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterHabits(tab.dataset.category);
        });
    });

    // Period selector
    document.querySelectorAll('.period-selector button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-selector button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadAnalytics(btn.dataset.period);
        });
    });
}

// API Helpers
async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token && { 'Authorization': `Bearer ${state.token}` })
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: { ...headers, ...options.headers }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth Functions
async function handleAuth(e) {
    e.preventDefault();

    const email = elements.emailInput.value;
    const password = elements.passwordInput.value;

    try {
        elements.authSubmit.disabled = true;
        elements.authSubmit.textContent = 'Please wait...';

        let data;
        if (state.isAuthMode === 'signup') {
            const username = elements.usernameInput.value;
            data = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email, password, username })
            });
        } else {
            data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
        }

        state.token = data.data.token;
        state.user = data.data.user;
        localStorage.setItem('habitflow_token', state.token);

        showToast(state.isAuthMode === 'signup' ? 'Account created!' : 'Welcome back!');
        await loadDashboard();
        showView('dashboard');
        updateNavState();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        elements.authSubmit.disabled = false;
        elements.authSubmit.textContent = state.isAuthMode === 'signup' ? 'Sign Up' : 'Sign In';
    }
}

function toggleAuthMode(e) {
    e.preventDefault();
    state.isAuthMode = state.isAuthMode === 'login' ? 'signup' : 'login';
    updateAuthUI();
}

function updateAuthUI() {
    if (state.isAuthMode === 'signup') {
        elements.authTitle.textContent = 'Create Account';
        elements.authSubtitle.textContent = 'Start building better habits today';
        elements.authSubmit.textContent = 'Sign Up';
        elements.usernameGroup.style.display = 'block';
        document.getElementById('authToggle').innerHTML = 'Already have an account? <a href="#" id="authToggleLink">Sign In</a>';
    } else {
        elements.authTitle.textContent = 'Welcome Back';
        elements.authSubtitle.textContent = 'Sign in to track your habits';
        elements.authSubmit.textContent = 'Sign In';
        elements.usernameGroup.style.display = 'none';
        document.getElementById('authToggle').innerHTML = "Don't have an account? <a href=\"#\" id=\"authToggleLink\">Sign Up</a>";
    }

    document.getElementById('authToggleLink').addEventListener('click', toggleAuthMode);
}

// User Functions
async function loadUser() {
    try {
        const data = await apiRequest('/auth/me');
        state.user = data.data.user;
        await loadDashboard();
        showView('dashboard');
        updateNavState();
    } catch (error) {
        // Token invalid, clear and show auth
        localStorage.removeItem('habitflow_token');
        state.token = null;
        showView('auth');
        updateNavState();
    }
}

function logout() {
    localStorage.removeItem('habitflow_token');
    state.token = null;
    state.user = null;
    showView('auth');
    updateNavState();
    showToast('Logged out successfully');
}

// Navigation
function navigateTo(view) {
    if (!state.token && view !== 'auth') {
        showView('auth');
        return;
    }

    showView(view);

    // Load view data
    switch (view) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'habits':
            loadHabits();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
    });
}

function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const view = document.getElementById(`${viewName}View`);
    if (view) {
        view.classList.add('active');
        state.currentView = viewName;
    }
}

function updateNavState() {
    if (state.token && state.user) {
        elements.navLinks.style.display = 'flex';
        elements.navUser.style.display = 'flex';
        elements.navAuth.style.display = 'none';

        const avatar = elements.navUser.querySelector('.user-avatar');
        if (avatar && state.user) {
            avatar.textContent = (state.user.profile?.name || state.user.username || 'U')[0].toUpperCase();
        }
    } else {
        elements.navLinks.style.display = 'none';
        elements.navUser.style.display = 'none';
        elements.navAuth.style.display = 'flex';
    }
}

// Dashboard
async function loadDashboard() {
    updateGreeting();
    await Promise.all([
        loadTodayHabits(),
        loadOverviewStats(),
        loadInsights()
    ]);
}

function updateGreeting() {
    const hour = new Date().getHours();
    let timeOfDay = 'Morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
    else if (hour >= 17) timeOfDay = 'Evening';

    elements.timeOfDay.textContent = timeOfDay;
    elements.userName.textContent = state.user?.profile?.name || state.user?.username || 'there';
    elements.currentDate.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

async function loadTodayHabits() {
    try {
        const data = await apiRequest('/logs/today');
        state.todayHabits = data.data.habits;

        // Update progress
        elements.todayProgress.textContent = `${data.data.stats.completionRate}%`;

        renderTodayHabits();
    } catch (error) {
        console.error('Failed to load today habits:', error);
        elements.todayHabits.innerHTML = `
      <div class="card-glass habit-item">
        <p style="color: var(--color-silver);">Create your first habit to get started!</p>
      </div>
    `;
    }
}

function renderTodayHabits() {
    if (state.todayHabits.length === 0) {
        elements.todayHabits.innerHTML = `
      <div class="card-glass habit-item">
        <p style="color: var(--color-silver);">No habits for today. Add one to get started!</p>
      </div>
    `;
        return;
    }

    elements.todayHabits.innerHTML = state.todayHabits.map(item => `
    <div class="card-glass habit-item ${item.completed ? 'completed' : ''}" data-habit-id="${item.habit._id}">
      <div class="habit-checkbox ${item.completed ? 'checked' : ''}" onclick="toggleHabit('${item.habit._id}', ${!item.completed})"></div>
      <div class="habit-icon">${item.habit.icon || '📌'}</div>
      <div class="habit-info">
        <div class="habit-name">${item.habit.name}</div>
        <div class="habit-meta">${item.habit.category}</div>
      </div>
      <div class="habit-streak">
        <span>🔥</span>
        <span>${item.habit.stats?.currentStreak || 0}</span>
      </div>
    </div>
  `).join('');
}

async function toggleHabit(habitId, completed) {
    try {
        const today = new Date().toISOString().split('T')[0];

        await apiRequest('/logs', {
            method: 'POST',
            body: JSON.stringify({
                habitId,
                date: today,
                completed
            })
        });

        // Update local state
        const habit = state.todayHabits.find(h => h.habit._id === habitId);
        if (habit) {
            habit.completed = completed;
        }

        renderTodayHabits();
        showToast(completed ? 'Habit completed! 🎉' : 'Habit marked incomplete');

        // Refresh stats
        loadOverviewStats();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function loadOverviewStats() {
    try {
        const data = await apiRequest('/analytics/overview?period=week');
        const stats = data.data.stats;

        elements.activeStreaks.textContent = stats.activeStreaks || 0;
        elements.weeklyRate.textContent = `${stats.successRate || 0}%`;
        elements.longestStreak.textContent = state.user?.stats?.longestStreak || 0;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadInsights() {
    try {
        const data = await apiRequest('/analytics/insights');
        const insights = data.data.insights;

        if (insights.length === 0) {
            elements.insightsList.innerHTML = `
        <div class="card-glass insight-card">
          <div class="insight-icon">💡</div>
          <div class="insight-content">
            <p class="insight-message">Complete your first week to get personalized insights!</p>
          </div>
        </div>
      `;
            return;
        }

        elements.insightsList.innerHTML = insights.slice(0, 3).map(insight => `
      <div class="card-glass insight-card">
        <div class="insight-icon">${getInsightIcon(insight.type)}</div>
        <div class="insight-content">
          <p class="insight-message">${insight.message}</p>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Failed to load insights:', error);
    }
}

function getInsightIcon(type) {
    const icons = {
        pattern: '📊',
        suggestion: '💡',
        achievement: '🏆',
        warning: '⚠️',
        tip: '✨'
    };
    return icons[type] || '💡';
}

// Habits
async function loadHabits() {
    try {
        const data = await apiRequest('/habits');
        state.habits = data.data.habits;
        renderHabitsGrid();
    } catch (error) {
        console.error('Failed to load habits:', error);
    }
}

function renderHabitsGrid(filter = 'all') {
    let habits = state.habits;

    if (filter !== 'all') {
        habits = habits.filter(h => h.category === filter);
    }

    if (habits.length === 0) {
        elements.habitsGrid.innerHTML = `
      <div class="card-glass" style="padding: var(--spacing-xl); text-align: center; grid-column: 1 / -1;">
        <p style="color: var(--color-silver);">No habits found. Create your first one!</p>
      </div>
    `;
        return;
    }

    elements.habitsGrid.innerHTML = habits.map(habit => `
    <div class="card-glass habit-card" data-habit-id="${habit._id}">
      <div class="habit-card-header">
        <div class="habit-icon">${habit.icon || '📌'}</div>
        <div class="habit-info">
          <div class="habit-name">${habit.name}</div>
          <div class="habit-meta">${habit.category}</div>
        </div>
      </div>
      <div class="habit-card-stats">
        <div class="habit-card-stat">
          <div class="habit-card-stat-value">🔥 ${habit.stats?.currentStreak || 0}</div>
          <div class="habit-card-stat-label">Current</div>
        </div>
        <div class="habit-card-stat">
          <div class="habit-card-stat-value">🏆 ${habit.stats?.longestStreak || 0}</div>
          <div class="habit-card-stat-label">Best</div>
        </div>
        <div class="habit-card-stat">
          <div class="habit-card-stat-value">${habit.stats?.successRate || 0}%</div>
          <div class="habit-card-stat-label">Rate</div>
        </div>
      </div>
    </div>
  `).join('');
}

function filterHabits(category) {
    renderHabitsGrid(category);
}

// Analytics
async function loadAnalytics(period = 'week') {
    try {
        const data = await apiRequest(`/analytics/overview?period=${period}`);
        const stats = data.data.stats;

        // Update completion chart
        elements.completionValue.textContent = `${stats.successRate || 0}%`;
        updateDonutChart(stats.successRate || 0);

        // Update top habits
        if (stats.topHabits && stats.topHabits.length > 0) {
            elements.topHabits.innerHTML = stats.topHabits.map((item, index) => `
        <div class="top-habit-item">
          <div class="top-habit-rank">${index + 1}</div>
          <div class="habit-icon">${item.habit.icon || '📌'}</div>
          <div class="top-habit-info">
            <div class="top-habit-name">${item.habit.name}</div>
            <div class="top-habit-rate">${item.rate}% completion</div>
          </div>
          <div class="top-habit-rate-bar bar-track">
            <div class="bar-fill" style="width: ${item.rate}%"></div>
          </div>
        </div>
      `).join('');
        }

        // Load patterns for day chart
        const patterns = await apiRequest('/analytics/patterns');
        updateDayChart(patterns.data.patterns.dayBreakdown);

    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

function updateDonutChart(percentage) {
    const chart = document.querySelector('.donut-chart');
    if (chart) {
        chart.style.background = `conic-gradient(
      var(--color-white) 0% ${percentage}%,
      var(--color-gray-dark) ${percentage}% 100%
    )`;
    }
}

function updateDayChart(dayBreakdown) {
    if (!dayBreakdown) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const maxCompleted = Math.max(...Object.values(dayBreakdown).map(d => d.completed || 0), 1);

    const bars = elements.dayChart.querySelectorAll('.bar-fill');
    days.forEach((day, index) => {
        const completed = dayBreakdown[day]?.completed || 0;
        const percentage = (completed / maxCompleted) * 100;
        if (bars[index]) {
            bars[index].style.width = `${percentage}%`;
        }
    });
}

// Modal
function openHabitModal() {
    elements.habitModal.classList.add('active');
    elements.habitForm.reset();
    elements.iconSelector.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
    elements.iconSelector.querySelector('.icon-btn').classList.add('active');
}

function closeHabitModal() {
    elements.habitModal.classList.remove('active');
}

async function handleHabitSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('habitName').value;
    const category = document.getElementById('habitCategory').value;
    const difficulty = document.getElementById('habitDifficulty').value;
    const motivation = document.getElementById('habitMotivation').value;
    const icon = elements.iconSelector.querySelector('.icon-btn.active')?.dataset.icon || '🎯';

    try {
        await apiRequest('/habits', {
            method: 'POST',
            body: JSON.stringify({
                name,
                icon,
                category,
                difficulty,
                motivation,
                frequency: { type: 'daily' }
            })
        });

        showToast('Habit created successfully!');
        closeHabitModal();

        // Refresh data
        await loadHabits();
        await loadTodayHabits();

    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Toast
function showToast(message, type = 'success') {
    const toast = elements.toast;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');

    if (type === 'error') {
        toast.style.background = '#ff4444';
        toast.style.color = '#ffffff';
    } else {
        toast.style.background = 'var(--color-white)';
        toast.style.color = 'var(--color-black)';
    }

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Make functions globally available
window.toggleHabit = toggleHabit;
window.logout = logout;
