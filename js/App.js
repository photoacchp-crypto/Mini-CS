const API_URL = "https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";
let isLoading = false;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdateSpan = document.getElementById('lastUpdate');
const themeToggle = document.getElementById('themeToggle');
const filtersToggle = document.getElementById('filtersToggle');
const filtersBody = document.getElementById('filtersBody');
const filtersIcon = document.getElementById('filtersIcon');
const content = document.getElementById('content');
const stats = document.getElementById('stats');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const toast = document.getElementById('toast');

// Filter elements
const kategoriFilter = document.getElementById('kategoriFilter');
const grupFilter = document.getElementById('grupFilter');
const statusFilter = document.getElementById('statusFilter');
const platformFilter = document.getElementById('platformFilter');
const prioritasFilter = document.getElementById('prioritasFilter');

// ============ Helper Functions ============
function showToast(message) {
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

function formatDate() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

function updateLastUpdate() {
    lastUpdateSpan.textContent = `Last update: ${formatDate()}`;
}

// ============ Data Loading ============
async function loadData(showLoading = true) {
    if (isLoading) return;
    
    isLoading = true;
    
    if (showLoading) {
        content.innerHTML = `<div class="loading"><i class="fas fa-spinner"></i> Loading data...</div>`;
    }
    
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        
        if (json.data && Array.isArray(json.data)) {
            allData = json.data;
            updateLastUpdate();
            renderStats();
            populateFilters();
            renderContent();
            showToast('Data berhasil diperbarui');
        } else {
            throw new Error('Invalid data format');
        }
    } catch (err) {
        console.error('Error loading data:', err);
        content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Gagal memuat data. Periksa koneksi Anda.</p></div>`;
        showToast('Gagal memuat data');
    } finally {
        isLoading = false;
    }
}

// ============ Helper Functions ============
function unique(field) {
    return [...new Set(allData.map(x => x[field]).filter(Boolean))];
}

function populateFilters() {
    const currentValues = {
        kategori: kategoriFilter.value,
        grup: grupFilter.value,
        status: statusFilter.value,
        platform: platformFilter.value,
        prioritas: prioritasFilter.value
    };
    
    fillSelect(kategoriFilter, "Kategori", currentValues.kategori);
    fillSelect(grupFilter, "Grup", currentValues.grup);
    fillSelect(statusFilter, "Status", currentValues.status);
    fillSelect(platformFilter, "Platform", currentValues.platform);
    fillSelect(prioritasFilter, "Prioritas", currentValues.prioritas);
}

function fillSelect(selectElement, key, currentValue) {
    const items = unique(key);
    selectElement.innerHTML = `<option value="">Semua ${key}</option>`;
    items.forEach(item => {
        selectElement.innerHTML += `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`;
    });
    selectElement.value = currentValue;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ Filter Data ============
function filterData() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    return allData.filter(item => {
        // Search across all fields
        if (searchTerm) {
            const searchableText = [
                item.Judul,
                item.Kategori,
                item.Grup,
                item.Platform,
                item.Pertanyaan,
                item["Jawaban 1"],
                item["Jawaban 2"],
                item["Jawaban 3"],
                item["Jawaban 4"],
                item.Status,
                item.Prioritas
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        // Category filter
        if (kategoriFilter.value && item.Kategori !== kategoriFilter.value) return false;
        
        // Group filter
        if (grupFilter.value && item.Grup !== grupFilter.value) return false;
        
        // Status filter
        if (statusFilter.value && item.Status !== statusFilter.value) return false;
        
        // Platform filter
        if (platformFilter.value && item.Platform !== platformFilter.value) return false;
        
        // Priority filter
        if (prioritasFilter.value && item.Prioritas !== prioritasFilter.value) return false;
        
        // Favorite filter
        if (currentView === "favorit" && String(item.Favorit).toUpperCase() !== "TRUE") return false;
        
        return true;
    });
}

// ============ Render Stats ============
function renderStats() {
    const totalData = allData.length;
    const totalKategori = unique("Kategori").length;
    const totalGrup = unique("Grup").length;
    const totalPlatform = unique("Platform").length;
    const totalFavorit = allData.filter(x => String(x.Favorit).toUpperCase() === "TRUE").length;
    
    stats.innerHTML = `
        <div class="stat-card">
            <h2>${totalData}</h2>
            <p><i class="fas fa-database"></i> Total Data</p>
        </div>
        <div class="stat-card">
            <h2>${totalKategori}</h2>
            <p><i class="fas fa-folder-tree"></i> Kategori</p>
        </div>
        <div class="stat-card">
            <h2>${totalGrup}</h2>
            <p><i class="fas fa-layer-group"></i> Grup</p>
        </div>
        <div class="stat-card">
            <h2>${totalPlatform}</h2>
            <p><i class="fas fa-mobile-alt"></i> Platform</p>
        </div>
        <div class="stat-card">
            <h2>${totalFavorit}</h2>
            <p><i class="fas fa-star"></i> Favorit</p>
        </div>
    `;
}

// ============ Render Content Based on View ============
function renderContent() {
    const filtered = filterData();
    
    switch (currentView) {
        case "dashboard":
            renderDashboard(filtered);
            break;
        case "kategori":
            renderKategori(filtered);
            break;
        case "grup":
            renderGrup(filtered);
            break;
        case "favorit":
            renderDashboard(filtered);
            break;
        default:
            renderDashboard(filtered);
    }
}

function renderDashboard(data) {
    if (data.length === 0) {
        content.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><p>Tidak ada data yang ditemukan</p></div>`;
        return;
    }
    
    content.innerHTML = `<div class="cards-grid">${data.map(item => renderCard(item)).join('')}</div>`;
}

function renderCard(item) {
    const previewText = [item.Pertanyaan, item["Jawaban 1"]].filter(Boolean)[0] || '';
    const truncatedPreview = previewText.length > 100 ? previewText.substring(0, 100) + '...' : previewText;
    
    return `
        <div class="content-card">
            <h3>${escapeHtml(item.Judul || '-')}</h3>
            <div class="card-meta">
                <span class="meta-badge"><i class="fas fa-tag"></i> ${escapeHtml(item.Kategori || '-')}</span>
                <span class="meta-badge"><i class="fas fa-layer-group"></i> ${escapeHtml(item.Grup || '-')}</span>
                <span class="meta-badge"><i class="fas fa-mobile-alt"></i> ${escapeHtml(item.Platform || '-')}</span>
                ${String(item.Favorit).toUpperCase() === 'TRUE' ? '<span class="meta-badge"><i class="fas fa-star" style="color: #f59e0b;"></i> Favorit</span>' : ''}
            </div>
            <div class="card-preview">${escapeHtml(truncatedPreview)}</div>
            <button class="preview-btn" onclick="showModal(${JSON.stringify(item).replace(/</g, '\\u003c')})">
                <i class="fas fa-eye"></i> Preview & Copy
            </button>
        </div>
    `;
}

async function renderKategori(data) {
    const kategoriMap = {};
    
    data.forEach(item => {
        if (item.Kategori) {
            if (!kategoriMap[item.Kategori]) {
                kategoriMap[item.Kategori] = [];
            }
            kategoriMap[item.Kategori].push(item);
        }
    });
    
    const sortedKategori = Object.keys(kategoriMap).sort();
    
    if (sortedKategori.length === 0) {
        content.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>Tidak ada kategori</p></div>`;
        return;
    }
    
    let html = '<div class="categories-list">';
    
    for (const kategori of sortedKategori) {
        const items = kategoriMap[kategori];
        const categoryId = `cat_${kategori.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        html += `
            <div class="category-item" data-category="${escapeHtml(kategori)}">
                <div class="category-header" onclick="toggleCategory('${categoryId}')">
                    <div class="category-info">
                        <i class="fas fa-folder"></i>
                        <h4>${escapeHtml(kategori)}</h4>
                        <span class="category-count">${items.length} item</span>
                    </div>
                    <i class="fas fa-chevron-down category-expand" id="${categoryId}_icon"></i>
                </div>
                <div class="category-items" id="${categoryId}">
                    <div class="cards-grid">
                        ${items.map(item => renderCard(item)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    content.innerHTML = html;
}

async function renderGrup(data) {
    const grupMap = {};
    
    data.forEach(item => {
        if (item.Grup) {
            if (!grupMap[item.Grup]) {
                grupMap[item.Grup] = [];
            }
            grupMap[item.Grup].push(item);
        }
    });
    
    const sortedGrup = Object.keys(grupMap).sort();
    
    if (sortedGrup.length === 0) {
        content.innerHTML = `<div class="empty-state"><i class="fas fa-layer-group"></i><p>Tidak ada grup</p></div>`;
        return;
    }
    
    let html = '<div class="groups-list">';
    
    for (const grup of sortedGrup) {
        const items = grupMap[grup];
        const groupId = `grp_${grup.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        html += `
            <div class="group-item" data-group="${escapeHtml(grup)}">
                <div class="group-header" onclick="toggleGroup('${groupId}')">
                    <div class="group-info">
                        <i class="fas fa-layer-group"></i>
                        <h4>${escapeHtml(grup)}</h4>
                        <span class="group-count">${items.length} item</span>
                    </div>
                    <i class="fas fa-chevron-down group-expand" id="${groupId}_icon"></i>
                </div>
                <div class="group-items" id="${groupId}">
                    <div class="cards-grid">
                        ${items.map(item => renderCard(item)).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    content.innerHTML = html;
}

// Toggle functions for categories and groups
window.toggleCategory = function(id) {
    const element = document.getElementById(id);
    const icon = document.getElementById(`${id}_icon`);
    if (element) {
        element.classList.toggle('show');
        icon.classList.toggle('expanded');
    }
};

window.toggleGroup = function(id) {
    const element = document.getElementById(id);
    const icon = document.getElementById(`${id}_icon`);
    if (element) {
        element.classList.toggle('show');
        icon.classList.toggle('expanded');
    }
};

// ============ Modal Functions ============
window.showModal = function(item) {
    modalTitle.textContent = item.Judul || 'Detail';
    
    let html = `
        <div class="modal-section">
            <h4><i class="fas fa-tag"></i> Kategori</h4>
            <p>${escapeHtml(item.Kategori || '-')}</p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-layer-group"></i> Grup</h4>
            <p>${escapeHtml(item.Grup || '-')}</p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-circle-info"></i> Status</h4>
            <p>${escapeHtml(item.Status || '-')}</p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-mobile-alt"></i> Platform</h4>
            <p>${escapeHtml(item.Platform || '-')}</p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-flag"></i> Prioritas</h4>
            <p>${escapeHtml(item.Prioritas || '-')}</p>
        </div>
    `;
    
    if (item.Pertanyaan) {
        html += `
            <div class="modal-section">
                <h4><i class="fas fa-question-circle"></i> Pertanyaan</h4>
                <p>${escapeHtml(item.Pertanyaan)}</p>
            </div>
        `;
    }
    
    const answers = ["Jawaban 1", "Jawaban 2", "Jawaban 3", "Jawaban 4"];
    answers.forEach((answerKey, index) => {
        if (item[answerKey]) {
            const answerText = item[answerKey];
            html += `
                <div class="answer-block">
                    <h5><i class="fas fa-reply"></i> ${answerKey}</h5>
                    <p>${escapeHtml(answerText)}</p>
                    <button class="copy-btn" onclick="copyText(\`${escapeHtml(answerText).replace(/`/g, '\\`')}\`)">
                        <i class="fas fa-copy"></i> Salin
                    </button>
                </div>
            `;
        }
    });
    
    modalBody.innerHTML = html;
    modal.style.display = "flex";
};

window.copyText = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Berhasil disalin!');
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('Gagal menyalin');
    }
};

// Close modal
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// ============ Navigation ============
document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".menu-btn").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        currentView = btn.dataset.view;
        renderContent();
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});

// ============ Event Listeners ============
// Search
searchInput.addEventListener("input", () => {
    searchClear.style.display = searchInput.value ? "block" : "none";
    renderContent();
});

searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    renderContent();
});

// Filters
const filterElements = [kategoriFilter, grupFilter, statusFilter, platformFilter, prioritasFilter];
filterElements.forEach(el => {
    if (el) el.addEventListener("change", renderContent);
});

// Refresh
refreshBtn.addEventListener("click", async () => {
    refreshBtn.classList.add('spinning');
    await loadData(true);
    setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
});

// Theme Toggle
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
    const icon = themeToggle.querySelector('i');
    const span = themeToggle.querySelector('span');
    if (theme === 'light') {
        icon.className = 'fas fa-sun';
        span.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        span.textContent = 'Dark Mode';
    }
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
});

// Filters Collapsible
let filtersCollapsed = false;
filtersToggle.addEventListener("click", () => {
    filtersCollapsed = !filtersCollapsed;
    filtersBody.classList.toggle('hidden', filtersCollapsed);
    filtersToggle.classList.toggle('collapsed', filtersCollapsed);
});

// Mobile Sidebar
mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.add('open');
});

sidebarToggle.addEventListener("click", () => {
    sidebar.classList.remove('open');
});

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ============ Initialization ============
initTheme();
loadData();

// Auto refresh every 30 seconds
setInterval(() => {
    loadData(false);
}, 30000);
