const API_URL = "https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";
let isLoading = false;

// Cache keys
const CACHE_KEY = 'minics_data';
const CACHE_TIME_KEY = 'minics_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load data with cache
async function loadData(forceRefresh = false) {
    if (isLoading) return;
    
    // Check cache
    if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIME_KEY);
        
        if (cached && timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION) {
            allData = JSON.parse(cached);
            renderAll();
            showNotification('Data loaded from cache', 'info');
            return;
        }
    }
    
    isLoading = true;
    showLoading();
    
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        allData = json.data || [];
        
        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(allData));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        
        renderAll();
        showNotification('Data refreshed successfully', 'success');
    } catch(err) {
        console.error(err);
        showNotification('Failed to load data', 'error');
        
        // Try to load from cache if available
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            allData = JSON.parse(cached);
            renderAll();
            showNotification('Using cached data', 'warning');
        }
    } finally {
        isLoading = false;
        hideLoading();
    }
}

function showLoading() {
    const content = document.getElementById('content');
    if (content) content.innerHTML = '<div class="loading">Loading data</div>';
}

function hideLoading() {
    // handled by render
}

function showNotification(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function unique(field) {
    return [...new Set(allData.map(x => x[field]).filter(Boolean))].sort();
}

function populateFilters() {
    fillSelect("kategoriFilter", "Kategori");
    fillSelect("grupFilter", "Grup");
    fillSelect("statusFilter", "Status");
    fillSelect("platformFilter", "Platform");
    fillSelect("prioritasFilter", "Prioritas");
}

function fillSelect(id, key) {
    const select = document.getElementById(id);
    if (!select) return;
    
    const current = select.value;
    select.innerHTML = `<option value="">Semua ${key}</option>`;
    
    unique(key).forEach(item => {
        select.innerHTML += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
    });
    
    select.value = current;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderStats() {
    const totalData = allData.length;
    const totalKategori = unique("Kategori").length;
    const totalGrup = unique("Grup").length;
    const totalPlatform = unique("Platform").length;
    const totalFavorit = allData.filter(x => String(x.Favorit).toUpperCase() === "TRUE").length;

    const statsHtml = `
        <div class="stat-card">
            <h2>${totalData}</h2>
            <p>Total Data</p>
        </div>
        <div class="stat-card">
            <h2>${totalKategori}</h2>
            <p>Total Kategori</p>
        </div>
        <div class="stat-card">
            <h2>${totalGrup}</h2>
            <p>Total Grup</p>
        </div>
        <div class="stat-card">
            <h2>${totalPlatform}</h2>
            <p>Total Platform</p>
        </div>
        <div class="stat-card">
            <h2>${totalFavorit}</h2>
            <p>Total Favorit</p>
        </div>
    `;
    
    const statsContainer = document.getElementById("stats");
    if (statsContainer) statsContainer.innerHTML = statsHtml;
}

function filterData() {
    const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const kategoriFilter = document.getElementById("kategoriFilter");
    const grupFilter = document.getElementById("grupFilter");
    const statusFilter = document.getElementById("statusFilter");
    const platformFilter = document.getElementById("platformFilter");
    const prioritasFilter = document.getElementById("prioritasFilter");
    
    return allData.filter(item => {
        // Enhanced search across all fields
        if (search) {
            const searchableFields = [
                item.Judul, item.Kategori, item.Grup, item.Platform,
                item.Pertanyaan, item["Jawaban 1"], item["Jawaban 2"],
                item["Jawaban 3"], item["Jawaban 4"], item.Status, item.Prioritas
            ].filter(Boolean).join(" ").toLowerCase();
            
            if (!searchableFields.includes(search)) return false;
        }
        
        if (kategoriFilter?.value && item.Kategori !== kategoriFilter.value) return false;
        if (grupFilter?.value && item.Grup !== grupFilter.value) return false;
        if (statusFilter?.value && item.Status !== statusFilter.value) return false;
        if (platformFilter?.value && item.Platform !== platformFilter.value) return false;
        if (prioritasFilter?.value && item.Prioritas !== prioritasFilter.value) return false;
        
        if (currentView === "favorit" && String(item.Favorit).toUpperCase() !== "TRUE") return false;
        
        return true;
    });
}

function renderContent() {
    const data = filterData();
    const content = document.getElementById("content");
    if (!content) return;
    
    if (currentView === "kategori") {
        const map = {};
        data.forEach(item => {
            map[item.Kategori] = (map[item.Kategori] || 0) + 1;
        });
        
        content.innerHTML = Object.entries(map)
            .map(([k, v]) => `
                <div class="card">
                    <h3>📁 ${escapeHtml(k) || 'Tanpa Kategori'}</h3>
                    <p>${v} Item</p>
                </div>
            `).join("");
        return;
    }
    
    if (currentView === "grup") {
        const map = {};
        data.forEach(item => {
            map[item.Grup] = (map[item.Grup] || 0) + 1;
        });
        
        content.innerHTML = Object.entries(map)
            .map(([k, v]) => `
                <div class="card">
                    <h3>🗂️ ${escapeHtml(k) || 'Tanpa Grup'}</h3>
                    <p>${v} Item</p>
                </div>
            `).join("");
        return;
    }
    
    // Dashboard view
    content.innerHTML = `<div class="cards">` +
        data.map(item => `
            <div class="card">
                <h3>${escapeHtml(item.Judul) || '-'}</h3>
                <div class="card-badges">
                    <span class="badge">📁 ${escapeHtml(item.Kategori) || '-'}</span>
                    <span class="badge">🗂️ ${escapeHtml(item.Grup) || '-'}</span>
                    <span class="badge">💻 ${escapeHtml(item.Platform) || '-'}</span>
                    ${item.Favorit === 'TRUE' ? '<span class="badge">⭐ Favorit</span>' : ''}
                </div>
                <button class="preview-btn" onclick='showModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                    👁️ Preview & Copy
                </button>
            </div>
        `).join("") + `</div>`;
}

function showModal(item) {
    const body = document.getElementById("modalBody");
    if (!body) return;
    
    let html = `
        <h2>📄 ${escapeHtml(item.Judul) || ''}</h2>
        <hr style="margin: 15px 0; border-color: var(--border);">
        <p><strong>📁 Kategori:</strong> ${escapeHtml(item.Kategori) || '-'}</p>
        <p><strong>🗂️ Grup:</strong> ${escapeHtml(item.Grup) || '-'}</p>
        <p><strong>📌 Status:</strong> ${escapeHtml(item.Status) || '-'}</p>
        <p><strong>💻 Platform:</strong> ${escapeHtml(item.Platform) || '-'}</p>
        <p><strong>⚡ Prioritas:</strong> ${escapeHtml(item.Prioritas) || '-'}</p>
        ${item.Favorit === 'TRUE' ? '<p><strong>⭐ Favorit:</strong> Ya</p>' : ''}
        <hr style="margin: 15px 0; border-color: var(--border);">
        <p><strong>❓ Pertanyaan:</strong></p>
        <p style="background: var(--bg-primary); padding: 10px; border-radius: 8px; margin: 10px 0;">${escapeHtml(item.Pertanyaan) || '-'}</p>
    `;
    
    ["Jawaban 1", "Jawaban 2", "Jawaban 3", "Jawaban 4"].forEach(key => {
        if (item[key]) {
            html += `
                <hr style="margin: 15px 0; border-color: var(--border);">
                <h4>📝 ${key}</h4>
                <button class="copy-btn" onclick="copyText(\`${escapeHtml(item[key]).replace(/`/g, '\\`')}\`)">
                    📋 Copy
                </button>
                <p style="background: var(--bg-primary); padding: 10px; border-radius: 8px; margin-top: 10px;">${escapeHtml(item[key])}</p>
            `;
        }
    });
    
    body.innerHTML = html;
    document.getElementById("modal").style.display = "flex";
}

function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Berhasil disalin!', 'success');
    }).catch(() => {
        showNotification('Gagal menyalin', 'error');
    });
}

function renderAll() {
    renderStats();
    populateFilters();
    renderContent();
}

// Event Listeners
function initEventListeners() {
    // Menu navigation
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".menu-btn").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            currentView = btn.dataset.view;
            renderContent();
        });
    });
    
    // Filters
    document.querySelectorAll("select").forEach(select => {
        select.addEventListener("change", () => renderContent());
    });
    
    // Search
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");
    
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderContent();
            if (clearSearch) {
                clearSearch.classList.toggle("visible", searchInput.value.length > 0);
            }
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener("click", () => {
            if (searchInput) {
                searchInput.value = "";
                renderContent();
                clearSearch.classList.remove("visible");
            }
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => loadData(true));
    }
    
    // Modal close
    const closeModal = document.getElementById("closeModal");
    const modal = document.getElementById("modal");
    
    if (closeModal) {
        closeModal.onclick = () => modal.style.display = "none";
    }
    
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
    };
    
    // Collapse sidebar
    const collapseBtn = document.getElementById("collapseBtn");
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main");
    
    if (collapseBtn && sidebar && main) {
        collapseBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
            main.classList.toggle("expanded");
        });
    }
    
    // Filter toggles
    document.querySelectorAll(".filter-toggle").forEach(toggle => {
        toggle.addEventListener("click", () => {
            const content = toggle.parentElement.querySelector(".filter-content");
            if (content) {
                content.classList.toggle("active");
                toggle.textContent = toggle.textContent.includes("▼") 
                    ? toggle.textContent.replace("▼", "▲") 
                    : toggle.textContent.replace("▲", "▼");
            }
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light");
            themeToggle.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
            localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "light") {
            document.body.classList.add("light");
            themeToggle.textContent = "☀️";
        }
    }
}

// Initialize
function init() {
    initEventListeners();
    loadData();
}

// Start app
init();
