// ==================== KONFIGURASI API ====================
const API_URL = "https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

// ==================== STATE GLOBAL ====================
let allData = [];
let currentView = "dashboard";
let currentFilters = {
    kategori: "",
    grup: "",
    status: "",
    platform: "",
    prioritas: ""
};
let searchKeyword = "";
let isLoading = false;
let lastUpdateTime = null;
let refreshInterval = null;

// ==================== DOM ELEMENTS ====================
const statsContainer = document.getElementById("statsContainer");
const contentContainer = document.getElementById("contentContainer");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const refreshBtn = document.getElementById("refreshBtn");
const lastUpdateSpan = document.getElementById("lastUpdate");
const themeToggle = document.getElementById("themeToggle");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const filtersHeader = document.getElementById("filtersHeader");
const filtersBody = document.getElementById("filtersBody");
const kategoriFilter = document.getElementById("kategoriFilter");
const grupFilter = document.getElementById("grupFilter");
const statusFilter = document.getElementById("statusFilter");
const platformFilter = document.getElementById("platformFilter");
const prioritasFilter = document.getElementById("prioritasFilter");

// ==================== HELPER FUNCTIONS ====================
function formatTime(date) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function updateLastUpdateTime() {
    if (lastUpdateTime) {
        lastUpdateSpan.textContent = formatTime(lastUpdateTime);
    }
}

function showToast(message, type = "success") {
    const existingToast = document.querySelector(".toast");
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement("div");
    toast.className = "toast";
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    toast.innerHTML = `${icon} ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function getUniqueValues(field) {
    return [...new Set(allData.map(item => item[field]).filter(v => v && v.trim() !== ""))].sort();
}

function getFilteredData() {
    let data = [...allData];
    
    // Search filter - semua field
    if (searchKeyword.trim() !== "") {
        const keyword = searchKeyword.toLowerCase();
        data = data.filter(item => {
            return Object.values(item).some(value => 
                value && String(value).toLowerCase().includes(keyword)
            );
        });
    }
    
    // Category filter
    if (currentFilters.kategori) {
        data = data.filter(item => item.Kategori === currentFilters.kategori);
    }
    
    // Group filter
    if (currentFilters.grup) {
        data = data.filter(item => item.Grup === currentFilters.grup);
    }
    
    // Status filter
    if (currentFilters.status) {
        data = data.filter(item => item.Status === currentFilters.status);
    }
    
    // Platform filter
    if (currentFilters.platform) {
        data = data.filter(item => item.Platform === currentFilters.platform);
    }
    
    // Priority filter
    if (currentFilters.prioritas) {
        data = data.filter(item => item.Prioritas === currentFilters.prioritas);
    }
    
    // Favorit view
    if (currentView === "favorit") {
        data = data.filter(item => String(item.Favorit).toUpperCase() === "TRUE");
    }
    
    return data;
}

// ==================== RENDER FUNCTIONS ====================
function renderStats() {
    const totalData = allData.length;
    const totalKategori = getUniqueValues("Kategori").length;
    const totalGrup = getUniqueValues("Grup").length;
    const totalPlatform = getUniqueValues("Platform").length;
    const totalFavorit = allData.filter(item => String(item.Favorit).toUpperCase() === "TRUE").length;
    
    statsContainer.innerHTML = `
        <div class="stat-card" data-stat="total">
            <h2>${totalData.toLocaleString()}</h2>
            <p><i class="fas fa-database"></i> Total Data</p>
        </div>
        <div class="stat-card" data-stat="kategori">
            <h2>${totalKategori}</h2>
            <p><i class="fas fa-folder-tree"></i> Kategori</p>
        </div>
        <div class="stat-card" data-stat="grup">
            <h2>${totalGrup}</h2>
            <p><i class="fas fa-layer-group"></i> Grup</p>
        </div>
        <div class="stat-card" data-stat="platform">
            <h2>${totalPlatform}</h2>
            <p><i class="fas fa-globe"></i> Platform</p>
        </div>
        <div class="stat-card" data-stat="favorit">
            <h2>${totalFavorit}</h2>
            <p><i class="fas fa-star"></i> Favorit</p>
        </div>
    `;
    
    // Add click handlers to stat cards
    document.querySelectorAll(".stat-card").forEach(card => {
        card.addEventListener("click", () => {
            const type = card.dataset.stat;
            if (type === "favorit") {
                currentView = "favorit";
                setActiveMenu("favorit");
                renderContent();
                showToast("Menampilkan data favorit");
            } else if (type === "total") {
                currentView = "dashboard";
                setActiveMenu("dashboard");
                resetFilters();
                renderContent();
            } else {
                // Reset view and highlight category filter
                currentView = "dashboard";
                setActiveMenu("dashboard");
                renderContent();
            }
        });
    });
}

function renderContent() {
    if (!contentContainer) return;
    
    const filteredData = getFilteredData();
    
    if (filteredData.length === 0) {
        contentContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Tidak ada data yang ditemukan</p>
                <small>Coba dengan kata kunci atau filter yang berbeda</small>
            </div>
        `;
        return;
    }
    
    if (currentView === "kategori") {
        renderKategoriView(filteredData);
    } else if (currentView === "grup") {
        renderGrupView(filteredData);
    } else {
        renderDashboardView(filteredData);
    }
}

function renderDashboardView(data) {
    contentContainer.innerHTML = `
        <div class="cards-grid">
            ${data.map(item => `
                <div class="content-card" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}'>
                    <h3>
                        <i class="fas fa-comment-dots"></i>
                        ${escapeHtml(item.Judul || "Tanpa Judul")}
                    </h3>
                    <div class="card-meta">
                        <span class="meta-badge"><i class="fas fa-tag"></i> ${escapeHtml(item.Kategori || "-")}</span>
                        <span class="meta-badge"><i class="fas fa-users"></i> ${escapeHtml(item.Grup || "-")}</span>
                        <span class="meta-badge"><i class="fas fa-chart-line"></i> ${escapeHtml(item.Prioritas || "-")}</span>
                        <span class="meta-badge"><i class="fas fa-globe"></i> ${escapeHtml(item.Platform || "-")}</span>
                        ${String(item.Favorit).toUpperCase() === "TRUE" ? '<span class="meta-badge"><i class="fas fa-star"></i> Favorit</span>' : ''}
                    </div>
                    <div class="card-preview">
                        ${escapeHtml((item.Pertanyaan || "").substring(0, 120))}${(item.Pertanyaan || "").length > 120 ? "..." : ""}
                    </div>
                    <button class="preview-btn" onclick="openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})">
                        <i class="fas fa-eye"></i> Preview & Salin
                    </button>
                </div>
            `).join("")}
        </div>
    `;
}

function renderKategoriView(data) {
    const kategoriMap = new Map();
    data.forEach(item => {
        const kategori = item.Kategori || "Tidak Berkategori";
        if (!kategoriMap.has(kategori)) {
            kategoriMap.set(kategori, []);
        }
        kategoriMap.get(kategori).push(item);
    });
    
    contentContainer.innerHTML = Array.from(kategoriMap.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([kategori, items]) => `
            <div class="category-item">
                <div class="category-header" onclick="toggleCategory('cat-${kategori.replace(/[^a-zA-Z0-9]/g, '')}')">
                    <div class="category-info">
                        <i class="fas fa-folder"></i>
                        <h4>${escapeHtml(kategori)}</h4>
                        <span class="category-count">${items.length} item</span>
                    </div>
                    <i class="fas fa-chevron-down category-expand" id="cat-icon-${kategori.replace(/[^a-zA-Z0-9]/g, '')}"></i>
                </div>
                <div class="category-items" id="cat-${kategori.replace(/[^a-zA-Z0-9]/g, '')}">
                    ${items.slice(0, 10).map(item => `
                        <div class="item-preview" onclick="openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})">
                            <div class="item-preview-title">
                                <span><i class="fas fa-question-circle"></i> ${escapeHtml(item.Judul || "Pertanyaan")}</span>
                                <button class="copy-mini" onclick="event.stopPropagation(); copyToClipboard('${escapeHtml(item["Jawaban 1"] || "").replace(/'/g, "\\'")}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <div class="item-preview-text">${escapeHtml((item.Pertanyaan || "").substring(0, 80))}...</div>
                        </div>
                    `).join("")}
                    ${items.length > 10 ? `<div class="item-preview" style="text-align: center; color: var(--accent-primary);">+ ${items.length - 10} item lainnya</div>` : ""}
                </div>
            </div>
        `).join("");
}

function renderGrupView(data) {
    const grupMap = new Map();
    data.forEach(item => {
        const grup = item.Grup || "Tidak Bergrup";
        if (!grupMap.has(grup)) {
            grupMap.set(grup, []);
        }
        grupMap.get(grup).push(item);
    });
    
    contentContainer.innerHTML = Array.from(grupMap.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([grup, items]) => `
            <div class="group-item">
                <div class="group-header" onclick="toggleGroup('grp-${grup.replace(/[^a-zA-Z0-9]/g, '')}')">
                    <div class="group-info">
                        <i class="fas fa-layer-group"></i>
                        <h4>${escapeHtml(grup)}</h4>
                        <span class="group-count">${items.length} item</span>
                    </div>
                    <i class="fas fa-chevron-down group-expand" id="grp-icon-${grup.replace(/[^a-zA-Z0-9]/g, '')}"></i>
                </div>
                <div class="group-items" id="grp-${grup.replace(/[^a-zA-Z0-9]/g, '')}">
                    ${items.slice(0, 10).map(item => `
                        <div class="item-preview" onclick="openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})">
                            <div class="item-preview-title">
                                <span><i class="fas fa-question-circle"></i> ${escapeHtml(item.Judul || "Pertanyaan")}</span>
                                <button class="copy-mini" onclick="event.stopPropagation(); copyToClipboard('${escapeHtml(item["Jawaban 1"] || "").replace(/'/g, "\\'")}')">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <div class="item-preview-text">${escapeHtml((item.Pertanyaan || "").substring(0, 80))}...</div>
                        </div>
                    `).join("")}
                    ${items.length > 10 ? `<div class="item-preview" style="text-align: center; color: var(--accent-primary);">+ ${items.length - 10} item lainnya</div>` : ""}
                </div>
            </div>
        `).join("");
}

// ==================== FILTER FUNCTIONS ====================
function populateFilters() {
    // Populate Kategori
    const kategoriOptions = getUniqueValues("Kategori");
    kategoriFilter.innerHTML = '<option value="">📂 Semua Kategori</option>' + 
        kategoriOptions.map(k => `<option value="${k}">${k}</option>`).join("");
    
    // Populate Grup
    const grupOptions = getUniqueValues("Grup");
    grupFilter.innerHTML = '<option value="">🗂️ Semua Grup</option>' + 
        grupOptions.map(g => `<option value="${g}">${g}</option>`).join("");
    
    // Populate Status
    const statusOptions = getUniqueValues("Status");
    statusFilter.innerHTML = '<option value="">📌 Semua Status</option>' + 
        statusOptions.map(s => `<option value="${s}">${s}</option>`).join("");
    
    // Populate Platform
    const platformOptions = getUniqueValues("Platform");
    platformFilter.innerHTML = '<option value="">🌐 Semua Platform</option>' + 
        platformOptions.map(p => `<option value="${p}">${p}</option>`).join("");
    
    // Populate Prioritas
    const prioritasOptions = getUniqueValues("Prioritas");
    prioritasFilter.innerHTML = '<option value="">⚡ Semua Prioritas</option>' + 
        prioritasOptions.map(p => `<option value="${p}">${p}</option>`).join("");
}

function resetFilters() {
    currentFilters = {
        kategori: "",
        grup: "",
        status: "",
        platform: "",
        prioritas: ""
    };
    
    kategoriFilter.value = "";
    grupFilter.value = "";
    statusFilter.value = "";
    platformFilter.value = "";
    prioritasFilter.value = "";
    searchKeyword = "";
    searchInput.value = "";
}

function applyFilters() {
    currentFilters.kategori = kategoriFilter.value;
    currentFilters.grup = grupFilter.value;
    currentFilters.status = statusFilter.value;
    currentFilters.platform = platformFilter.value;
    currentFilters.prioritas = prioritasFilter.value;
    renderContent();
}

// ==================== MODAL FUNCTIONS ====================
function openModal(item) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");
    
    let answersHtml = "";
    ["Jawaban 1", "Jawaban 2", "Jawaban 3", "Jawaban 4"].forEach((jawab, index) => {
        if (item[jawab]) {
            answersHtml += `
                <div class="answer-block">
                    <h5><i class="fas fa-reply-all"></i> ${jawab}</h5>
                    <p>${escapeHtml(item[jawab])}</p>
                    <button class="copy-btn" onclick="copyToClipboard('${escapeHtml(item[jawab]).replace(/'/g, "\\'")}')">
                        <i class="fas fa-copy"></i> Salin Jawaban
                    </button>
                </div>
            `;
        }
    });
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h4><i class="fas fa-heading"></i> Judul</h4>
            <p>${escapeHtml(item.Judul || "-")}</p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-info-circle"></i> Informasi</h4>
            <p>
                <strong>Kategori:</strong> ${escapeHtml(item.Kategori || "-")} | 
                <strong>Grup:</strong> ${escapeHtml(item.Grup || "-")} | 
                <strong>Platform:</strong> ${escapeHtml(item.Platform || "-")}<br>
                <strong>Status:</strong> ${escapeHtml(item.Status || "-")} | 
                <strong>Prioritas:</strong> ${escapeHtml(item.Prioritas || "-")}
                ${String(item.Favorit).toUpperCase() === "TRUE" ? ' | <strong><i class="fas fa-star"></i> Favorit</strong>' : ''}
            </p>
        </div>
        <div class="modal-section">
            <h4><i class="fas fa-question-circle"></i> Pertanyaan</h4>
            <p>${escapeHtml(item.Pertanyaan || "-")}</p>
        </div>
        ${answersHtml}
    `;
    
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

function copyToClipboard(text) {
    if (!text) {
        showToast("Tidak ada teks untuk disalin", "error");
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast("✅ Teks berhasil disalin ke clipboard");
    }).catch(() => {
        showToast("Gagal menyalin teks", "error");
    });
}

// ==================== MENU FUNCTIONS ====================
function setActiveMenu(view) {
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    const activeBtn = document.querySelector(`.menu-btn[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add("active");
}

function changeView(view) {
    currentView = view;
    setActiveMenu(view);
    renderContent();
}

// ==================== TOGGLE FUNCTIONS ====================
function toggleCategory(id) {
    const element = document.getElementById(id);
    const icon = document.getElementById(`cat-icon-${id.replace("cat-", "")}`);
    if (element) {
        element.classList.toggle("show");
        if (icon) icon.classList.toggle("expanded");
    }
}

function toggleGroup(id) {
    const element = document.getElementById(id);
    const icon = document.getElementById(`grp-icon-${id.replace("grp-", "")}`);
    if (element) {
        element.classList.toggle("show");
        if (icon) icon.classList.toggle("expanded");
    }
}

function toggleFilters() {
    filtersBody.classList.toggle("hidden");
    filtersHeader.classList.toggle("collapsed");
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    
    const icon = themeToggle.querySelector("i");
    const span = themeToggle.querySelector("span");
    if (newTheme === "light") {
        icon.className = "fas fa-sun";
        span.textContent = "Light";
    } else {
        icon.className = "fas fa-moon";
        span.textContent = "Dark";
    }
    
    showToast(`Mode ${newTheme === "light" ? "Terang" : "Gelap"} diaktifkan`);
}

function toggleSidebar() {
    sidebar.classList.toggle("open");
}

// ==================== DATA LOADING ====================
async function loadData(showToastMessage = false) {
    if (isLoading) return;
    
    isLoading = true;
    refreshBtn.classList.add("spinning");
    
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        allData = result.data || [];
        lastUpdateTime = new Date();
        updateLastUpdateTime();
        
        populateFilters();
        renderStats();
        renderContent();
        
        if (showToastMessage) {
            showToast(`✅ Data berhasil dimuat (${allData.length} item)`);
        }
    } catch (error) {
        console.error("Error loading data:", error);
        showToast("❌ Gagal memuat data dari server", "error");
    } finally {
        isLoading = false;
        refreshBtn.classList.remove("spinning");
    }
}

function refreshData() {
    loadData(true);
}

// ==================== SEARCH FUNCTIONS ====================
function handleSearch() {
    searchKeyword = searchInput.value;
    renderContent();
}

function clearSearch() {
    searchInput.value = "";
    searchKeyword = "";
    renderContent();
    showToast("Pencarian dibersihkan");
}

// ==================== EVENT LISTENERS ====================
function initEventListeners() {
    // Search
    searchInput.addEventListener("input", handleSearch);
    searchClear.addEventListener("click", clearSearch);
    
    // Refresh
    refreshBtn.addEventListener("click", refreshData);
    
    // Theme
    themeToggle.addEventListener("click", toggleTheme);
    
    // Mobile menu
    mobileMenuBtn.addEventListener("click", toggleSidebar);
    
    // Filters toggle
    filtersHeader.addEventListener("click", toggleFilters);
    
    // Filter changes
    kategoriFilter.addEventListener("change", applyFilters);
    grupFilter.addEventListener("change", applyFilters);
    statusFilter.addEventListener("change", applyFilters);
    platformFilter.addEventListener("change", applyFilters);
    prioritasFilter.addEventListener("change", applyFilters);
    
    // Menu buttons
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const view = btn.dataset.view;
            changeView(view);
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
    
    // Modal close
    const modal = document.getElementById("modal");
    const closeModalBtn = document.getElementById("closeModal");
    closeModalBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close sidebar on click outside (mobile)
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove("open");
            }
        }
    });
}

// ==================== AUTO REFRESH ====================
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        loadData(false);
    }, 30000);
}

// ==================== INITIALIZATION ====================
function init() {
    // Load saved theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    const themeIcon = themeToggle.querySelector("i");
    const themeSpan = themeToggle.querySelector("span");
    if (savedTheme === "light") {
        themeIcon.className = "fas fa-sun";
        themeSpan.textContent = "Light";
    } else {
        themeIcon.className = "fas fa-moon";
        themeSpan.textContent = "Dark";
    }
    
    initEventListeners();
    startAutoRefresh();
    loadData(true);
}

// Start the application
init();
