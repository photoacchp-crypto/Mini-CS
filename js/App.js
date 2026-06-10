const API_URL = "https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";
let isLoading = false;
let refreshTimer = null;
let searchDebounce = null;

// DOM Elements
let searchInput, clearSearch, kategoriFilter, grupFilter, statusFilter, platformFilter, prioritasFilter;
let content, stats, lastUpdate, themeToggle, refreshBtn, openSidebar, closeSidebar, sidebar, main;
let filterToggle, filtersPanel;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    searchInput = document.getElementById('searchInput');
    clearSearch = document.getElementById('clearSearch');
    kategoriFilter = document.getElementById('kategoriFilter');
    grupFilter = document.getElementById('grupFilter');
    statusFilter = document.getElementById('statusFilter');
    platformFilter = document.getElementById('platformFilter');
    prioritasFilter = document.getElementById('prioritasFilter');
    content = document.getElementById('content');
    stats = document.getElementById('stats');
    lastUpdate = document.getElementById('lastUpdate');
    themeToggle = document.getElementById('themeToggle');
    refreshBtn = document.getElementById('refreshBtn');
    openSidebar = document.getElementById('openSidebar');
    closeSidebar = document.getElementById('closeSidebar');
    sidebar = document.getElementById('sidebar');
    main = document.querySelector('.main');
    filterToggle = document.getElementById('filterToggle');
    filtersPanel = document.getElementById('filtersPanel');
    
    // Load theme preference
    loadTheme();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadData();
    
    // Auto refresh every 5 minutes (without polling, manual + silent)
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(silentRefresh, 300000);
});

function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', handleSearch);
    clearSearch.addEventListener('click', clearSearchInput);
    
    // Filters
    [kategoriFilter, grupFilter, statusFilter, platformFilter, prioritasFilter].forEach(filter => {
        filter.addEventListener('change', () => renderContent());
    });
    
    // Menu buttons
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.menu-btn').forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            renderContent();
        });
    });
    
    // Theme
    themeToggle.addEventListener('click', toggleTheme);
    
    // Refresh
    refreshBtn.addEventListener('click', () => {
        showToast('🔄 Memuat ulang data...');
        loadData(true);
    });
    
    // Sidebar toggle
    openSidebar.addEventListener('click', () => {
        sidebar.classList.add('open');
    });
    
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
    
    // Close sidebar on click outside (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !openSidebar.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
    
    // Filter toggle
    if (filterToggle) {
        filterToggle.addEventListener('click', () => {
            filterToggle.classList.toggle('open');
            filtersPanel.classList.toggle('show');
        });
    }
    
    // Modal close
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('closeModal');
    closeModal.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

function handleSearch() {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        renderContent();
    }, 300);
    clearSearch.classList.toggle('visible', searchInput.value.length > 0);
}

function clearSearchInput() {
    searchInput.value = '';
    clearSearch.classList.remove('visible');
    renderContent();
}

async function loadData(showLoading = true) {
    if (isLoading) return;
    isLoading = true;
    
    if (showLoading) {
        content.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Memuat data dari spreadsheet...</p>
            </div>
        `;
    }
    
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        allData = json.data || [];
        
        // Update last update time
        const now = new Date();
        lastUpdate.textContent = `Last update: ${now.toLocaleTimeString()}`;
        
        renderStats();
        populateFilters();
        renderContent();
        
        showToast(`✅ ${allData.length} data berhasil dimuat`, 2000);
    } catch(err) {
        console.error(err);
        content.innerHTML = `
            <div class="loading">
                <p>❌ Gagal memuat data</p>
                <button onclick="location.reload()" style="margin-top:16px;padding:8px 16px;background:var(--accent);border:none;border-radius:8px;color:white;cursor:pointer;">Coba Lagi</button>
            </div>
        `;
        showToast('❌ Gagal memuat data dari spreadsheet', 3000);
    } finally {
        isLoading = false;
    }
}

async function silentRefresh() {
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (json.data && json.data.length !== allData.length) {
            allData = json.data;
            renderStats();
            populateFilters();
            renderContent();
            const now = new Date();
            lastUpdate.textContent = `Last update: ${now.toLocaleTimeString()}`;
            showToast('🔄 Data telah diperbarui', 2000);
        }
    } catch(err) {
        console.error('Silent refresh failed:', err);
    }
}

function unique(field) {
    return [...new Set(allData.map(x => x[field]).filter(Boolean))];
}

function populateFilters() {
    fillSelect(kategoriFilter, "Kategori", "Semua Kategori");
    fillSelect(grupFilter, "Grup", "Semua Grup");
    fillSelect(statusFilter, "Status", "Semua Status");
    fillSelect(platformFilter, "Platform", "Semua Platform");
    fillSelect(prioritasFilter, "Prioritas", "Semua Prioritas");
}

function fillSelect(select, key, defaultLabel) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${defaultLabel}</option>`;
    unique(key).forEach(item => {
        select.innerHTML += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
    });
    select.value = current;
}

function renderStats() {
    const totalData = allData.length;
    const totalKategori = unique("Kategori").length;
    const totalGrup = unique("Grup").length;
    const totalPlatform = unique("Platform").length;
    const totalFavorit = allData.filter(x => String(x.Favorit).toUpperCase() === "TRUE").length;
    
    stats.innerHTML = `
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
            <p>⭐ Favorit</p>
        </div>
    `;
}

function filterData() {
    const search = searchInput.value.toLowerCase().trim();
    
    return allData.filter(item => {
        // Search across all fields
        if (search) {
            const searchableText = [
                item.Judul, item.Kategori, item.Grup, item.Platform,
                item.Pertanyaan, item["Jawaban 1"], item["Jawaban 2"],
                item["Jawaban 3"], item["Jawaban 4"], item.Status, item.Prioritas
            ].filter(Boolean).join(" ").toLowerCase();
            
            if (!searchableText.includes(search)) return false;
        }
        
        // Filters
        if (kategoriFilter.value && item.Kategori !== kategoriFilter.value) return false;
        if (grupFilter.value && item.Grup !== grupFilter.value) return false;
        if (statusFilter.value && item.Status !== statusFilter.value) return false;
        if (platformFilter.value && item.Platform !== platformFilter.value) return false;
        if (prioritasFilter.value && item.Prioritas !== prioritasFilter.value) return false;
        if (currentView === "favorit" && String(item.Favorit).toUpperCase() !== "TRUE") return false;
        
        return true;
    });
}

function renderContent() {
    let data = filterData();
    
    if (currentView === "kategori") {
        renderKategoriView(data);
    } else if (currentView === "grup") {
        renderGrupView(data);
    } else {
        renderDashboardView(data);
    }
}

function renderKategoriView(data) {
    const map = {};
    data.forEach(item => {
        const kategori = item.Kategori || "Tanpa Kategori";
        if (!map[kategori]) map[kategori] = [];
        map[kategori].push(item);
    });
    
    content.innerHTML = `
        <div class="category-grid">
            ${Object.entries(map).sort().map(([kategori, items]) => `
                <div class="category-card">
                    <div class="category-header" onclick="toggleCategory('${kategori.replace(/'/g, "\\'")}')">
                        <h3>📁 ${escapeHtml(kategori)}</h3>
                        <span class="category-count">${items.length} item</span>
                    </div>
                    <div class="category-items" id="cat-${kategori.replace(/[^a-zA-Z0-9]/g, '_')}">
                        ${items.map(item => `
                            <div class="category-item">
                                <div class="category-item-title">${escapeHtml(item.Judul || '-')}</div>
                                <button class="category-item-copy" onclick='copyItemToClipboard(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                                    📋 Copy
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderGrupView(data) {
    const map = {};
    data.forEach(item => {
        const grup = item.Grup || "Tanpa Grup";
        if (!map[grup]) map[grup] = [];
        map[grup].push(item);
    });
    
    content.innerHTML = `
        <div class="group-grid">
            ${Object.entries(map).sort().map(([grup, items]) => `
                <div class="group-card">
                    <div class="group-header" onclick="toggleGroup('${grup.replace(/'/g, "\\'")}')">
                        <h3>🗂️ ${escapeHtml(grup)}</h3>
                        <span class="group-count">${items.length} item</span>
                    </div>
                    <div class="group-items" id="grp-${grup.replace(/[^a-zA-Z0-9]/g, '_')}">
                        ${items.map(item => `
                            <div class="group-item">
                                <div class="group-item-title">${escapeHtml(item.Judul || '-')}</div>
                                <button class="group-item-copy" onclick='copyItemToClipboard(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                                    📋 Copy
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderDashboardView(data) {
    if (data.length === 0) {
        content.innerHTML = `
            <div class="loading">
                <p>📭 Tidak ada data yang ditemukan</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="cards">
            ${data.map(item => `
                <div class="card">
                    <h3>${escapeHtml(item.Judul || '-')}</h3>
                    <div class="card-badges">
                        ${item.Kategori ? `<span class="badge badge-kategori">📁 ${escapeHtml(item.Kategori)}</span>` : ''}
                        ${item.Grup ? `<span class="badge badge-grup">🗂️ ${escapeHtml(item.Grup)}</span>` : ''}
                        ${item.Platform ? `<span class="badge badge-platform">💻 ${escapeHtml(item.Platform)}</span>` : ''}
                        ${item.Status ? `<span class="badge badge-status">📌 ${escapeHtml(item.Status)}</span>` : ''}
                        ${item.Prioritas ? `<span class="badge badge-prioritas">⚡ ${escapeHtml(item.Prioritas)}</span>` : ''}
                    </div>
                    <div class="card-desc">
                        ${item.Pertanyaan ? escapeHtml(item.Pertanyaan.substring(0, 100)) + (item.Pertanyaan.length > 100 ? '...' : '') : ''}
                    </div>
                    <button class="preview-btn" onclick='showModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        👁️ Preview & Copy
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Global functions for onclick
window.toggleCategory = function(id) {
    const element = document.getElementById(`cat-${id.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (element) element.classList.toggle('open');
};

window.toggleGroup = function(id) {
    const element = document.getElementById(`grp-${id.replace(/[^a-zA-Z0-9]/g, '_')}`);
    if (element) element.classList.toggle('open');
};

window.copyItemToClipboard = function(item) {
    const text = `${item.Judul || ''}\n\n${item.Pertanyaan || ''}\n\n${item["Jawaban 1"] || ''}${item["Jawaban 2"] ? '\n\n' + item["Jawaban 2"] : ''}${item["Jawaban 3"] ? '\n\n' + item["Jawaban 3"] : ''}${item["Jawaban 4"] ? '\n\n' + item["Jawaban 4"] : ''}`;
    navigator.clipboard.writeText(text);
    showToast('📋 Berhasil disalin ke clipboard!', 1500);
};

window.showModal = function(item) {
    const modalBody = document.getElementById("modalBody");
    const modalTitle = document.getElementById("modalTitle");
    
    modalTitle.textContent = item.Judul || "Detail";
    
    let html = `
        <div class="modal-section">
            <h4>📋 Informasi</h4>
            <div class="modal-text">
                <strong>Kategori:</strong> ${escapeHtml(item.Kategori || '-')}<br>
                <strong>Grup:</strong> ${escapeHtml(item.Grup || '-')}<br>
                <strong>Status:</strong> ${escapeHtml(item.Status || '-')}<br>
                <strong>Platform:</strong> ${escapeHtml(item.Platform || '-')}<br>
                <strong>Prioritas:</strong> ${escapeHtml(item.Prioritas || '-')}
            </div>
        </div>
    `;
    
    if (item.Pertanyaan) {
        html += `
            <div class="modal-section">
                <h4>❓ Pertanyaan</h4>
                <div class="modal-text">${escapeHtml(item.Pertanyaan)}</div>
                <button class="copy-btn" onclick="copyText('${escapeHtml(item.Pertanyaan).replace(/'/g, "\\'")}')">📋 Copy</button>
            </div>
        `;
    }
    
    ["Jawaban 1", "Jawaban 2", "Jawaban 3", "Jawaban 4"].forEach(key => {
        if (item[key]) {
            html += `
                <div class="modal-section">
                    <h4>💬 ${key}</h4>
                    <div class="modal-text">${escapeHtml(item[key])}</div>
                    <button class="copy-btn" onclick="copyText('${escapeHtml(item[key]).replace(/'/g, "\\'")}')">📋 Copy</button>
                </div>
            `;
        }
    });
    
    modalBody.innerHTML = html;
    document.getElementById('modal').style.display = 'flex';
};

window.copyText = function(text) {
    navigator.clipboard.writeText(text);
    showToast('📋 Teks berhasil disalin!', 1500);
};

function showToast(message, duration = 2000) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.textContent = '🌙 Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ Light Mode';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '🌙 Dark Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '☀️ Light Mode';
    }
}
