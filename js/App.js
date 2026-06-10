// Konfigurasi API
const API_URL = "https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

// State Management
let allData = [];
let currentView = "dashboard";
let isLoading = false;
let refreshInterval = null;

// DOM Elements
let searchInput, kategoriFilter, grupFilter, statusFilter, platformFilter, prioritasFilter;
let content, stats, modal, modalBody;

// Inisialisasi saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi DOM elements
    searchInput = document.getElementById("searchInput");
    kategoriFilter = document.getElementById("kategoriFilter");
    grupFilter = document.getElementById("grupFilter");
    statusFilter = document.getElementById("statusFilter");
    platformFilter = document.getElementById("platformFilter");
    prioritasFilter = document.getElementById("prioritasFilter");
    content = document.getElementById("content");
    stats = document.getElementById("stats");
    modal = document.getElementById("modal");
    modalBody = document.getElementById("modalBody");
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadData();
    
    // Setup auto-refresh setiap 30 detik (tidak mengganggu)
    startAutoRefresh();
});

// Setup semua event listeners
function setupEventListeners() {
    // Close modal
    const closeModal = document.getElementById("closeModal");
    if (closeModal) {
        closeModal.onclick = () => modal.style.display = "none";
    }
    
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
    };
    
    // Menu buttons
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".menu-btn").forEach(x => x.classList.remove("active"));
            btn.classList.add("active");
            currentView = btn.dataset.view;
            renderContent();
            
            // Update URL hash untuk navigasi
            window.location.hash = currentView;
        });
    });
    
    // Filter perubahan
    const selects = [kategoriFilter, grupFilter, statusFilter, platformFilter, prioritasFilter];
    selects.forEach(select => {
        if (select) select.addEventListener("change", () => renderContent());
    });
    
    // Search dengan debounce
    if (searchInput) {
        searchInput.addEventListener("input", debounce(() => renderContent(), 300));
    }
    
    // Tombol reset pencarian
    const resetSearchBtn = document.getElementById("resetSearch");
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            renderContent();
            showToast("Pencarian direset", 1500);
        });
    }
    
    // Tombol refresh manual
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadData(true);
        });
    }
    
    // Tombol tema
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }
    
    // Tombol collapse sidebar
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }
    
    // Filter collapsible
    const filterHeader = document.getElementById("filterHeader");
    if (filterHeader) {
        filterHeader.addEventListener("click", () => {
            const filterContent = document.getElementById("filterContent");
            const arrow = document.getElementById("filterArrow");
            if (filterContent.style.display === "none") {
                filterContent.style.display = "flex";
                if (arrow) arrow.textContent = "▼";
            } else {
                filterContent.style.display = "none";
                if (arrow) arrow.textContent = "▶";
            }
        });
    }
    
    // Handle hash change untuk navigasi
    window.addEventListener("hashchange", () => {
        const hash = window.location.hash.slice(1);
        if (["dashboard", "kategori", "grup", "favorit"].includes(hash)) {
            currentView = hash;
            const activeBtn = document.querySelector(`.menu-btn[data-view="${hash}"]`);
            if (activeBtn) {
                document.querySelectorAll(".menu-btn").forEach(x => x.classList.remove("active"));
                activeBtn.classList.add("active");
                renderContent();
            }
        }
    });
}

// Debounce function untuk optimize search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load data dari spreadsheet
async function loadData(showToastMsg = false) {
    if (isLoading) return;
    
    isLoading = true;
    
    if (showToastMsg) {
        showToast("Mengambil data terbaru...", 1000);
    }
    
    try {
        const res = await fetch(`${API_URL}?_=${Date.now()}`); // Cache busting
        const json = await res.json();
        
        if (json.data && Array.isArray(json.data)) {
            allData = json.data;
            renderStats();
            populateFilters();
            renderContent();
            
            if (showToastMsg) {
                showToast(`✓ ${allData.length} data berhasil dimuat`, 2000);
            }
        } else {
            throw new Error("Format data tidak valid");
        }
    } catch(err) {
        console.error("Error loading data:", err);
        showToast("Gagal memuat data. Periksa koneksi internet.", 3000);
        
        // Tampilkan pesan error di content
        if (content) {
            content.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Gagal memuat data dari spreadsheet</p>
                    <small>${err.message}</small>
                    <button onclick="location.reload()" class="retry-btn">Coba Lagi</button>
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }
}

// Auto refresh dengan interval yang tidak mengganggu
function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (!isLoading && document.visibilityState === "visible") {
            loadData(false); // Silent refresh
        }
    }, 30000);
}

// Stop auto refresh (berguna untuk halaman yang tidak aktif)
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Unique values helper
function unique(field) {
    return [...new Set(allData.map(x => x[field]).filter(Boolean))];
}

// Populate filter dropdowns
function populateFilters() {
    fillSelect("kategoriFilter", "Kategori", kategoriFilter);
    fillSelect("grupFilter", "Grup", grupFilter);
    fillSelect("statusFilter", "Status", statusFilter);
    fillSelect("platformFilter", "Platform", platformFilter);
    fillSelect("prioritasFilter", "Prioritas", prioritasFilter);
}

function fillSelect(elementId, key, selectElement) {
    if (!selectElement) return;
    
    const current = selectElement.value;
    selectElement.innerHTML = `<option value="">Semua ${key}</option>`;
    
    unique(key).forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
    
    selectElement.value = current;
}

// Render statistics cards
function renderStats() {
    if (!stats) return;
    
    const totalData = allData.length;
    const totalKategori = unique("Kategori").length;
    const totalGrup = unique("Grup").length;
    const totalPlatform = unique("Platform").length;
    const totalFavorit = allData.filter(x => String(x.Favorit).toUpperCase() === "TRUE").length;
    
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
                <h2>${totalData}</h2>
                <p>Total Data</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📂</div>
            <div class="stat-info">
                <h2>${totalKategori}</h2>
                <p>Total Kategori</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🗂️</div>
            <div class="stat-info">
                <h2>${totalGrup}</h2>
                <p>Total Grup</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📱</div>
            <div class="stat-info">
                <h2>${totalPlatform}</h2>
                <p>Total Platform</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-info">
                <h2>${totalFavorit}</h2>
                <p>Total Favorit</p>
            </div>
        </div>
    `;
}

// Filter data berdasarkan search dan filter
function filterData() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const kategoriVal = kategoriFilter ? kategoriFilter.value : "";
    const grupVal = grupFilter ? grupFilter.value : "";
    const statusVal = statusFilter ? statusFilter.value : "";
    const platformVal = platformFilter ? platformFilter.value : "";
    const prioritasVal = prioritasFilter ? prioritasFilter.value : "";
    
    return allData.filter(item => {
        // Search di semua field
        if (searchTerm) {
            const searchableText = [
                item.Judul,
                item.Kategori,
                item.Grup,
                item.Platform,
                item.Status,
                item.Prioritas,
                item.Pertanyaan,
                item["Jawaban 1"],
                item["Jawaban 2"],
                item["Jawaban 3"],
                item["Jawaban 4"]
            ].filter(Boolean).join(" ").toLowerCase();
            
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        // Filter dropdowns
        if (kategoriVal && item.Kategori !== kategoriVal) return false;
        if (grupVal && item.Grup !== grupVal) return false;
        if (statusVal && item.Status !== statusVal) return false;
        if (platformVal && item.Platform !== platformVal) return false;
        if (prioritasVal && item.Prioritas !== prioritasVal) return false;
        
        // Filter favorit
        if (currentView === "favorit" && String(item.Favorit).toUpperCase() !== "TRUE") return false;
        
        return true;
    });
}

// Escape HTML untuk security
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Render konten utama
function renderContent() {
    if (!content) return;
    
    let data = filterData();
    
    // Tampilan kategori
    if (currentView === "kategori") {
        const map = {};
        data.forEach(item => {
            const key = item.Kategori || "Tanpa Kategori";
            map[key] = (map[key] || 0) + 1;
        });
        
        content.innerHTML = Object.entries(map)
            .map(([k, v]) => `
                <div class="card kategori-card">
                    <div class="card-icon">📁</div>
                    <div class="card-content">
                        <h3>${escapeHtml(k)}</h3>
                        <p>${v} Template</p>
                    </div>
                </div>
            `).join("");
        return;
    }
    
    // Tampilan grup
    if (currentView === "grup") {
        const map = {};
        data.forEach(item => {
            const key = item.Grup || "Umum";
            map[key] = (map[key] || 0) + 1;
        });
        
        content.innerHTML = Object.entries(map)
            .map(([k, v]) => `
                <div class="card grup-card">
                    <div class="card-icon">🗂️</div>
                    <div class="card-content">
                        <h3>${escapeHtml(k)}</h3>
                        <p>${v} Item</p>
                    </div>
                </div>
            `).join("");
        return;
    }
    
    // Tampilan dashboard & favorit (card view)
    if (data.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Tidak ada data ditemukan</h3>
                <p>Coba dengan kata kunci atau filter yang berbeda</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="cards-grid">
            ${data.map(item => `
                <div class="card template-card">
                    <div class="card-header">
                        <h3>${escapeHtml(item.Judul || "Tanpa Judul")}</h3>
                        ${item.Favorit === "TRUE" ? '<span class="favorit-badge">⭐ Favorit</span>' : ''}
                    </div>
                    <div class="card-meta">
                        <span class="meta-tag">📁 ${escapeHtml(item.Kategori || "-")}</span>
                        <span class="meta-tag">🗂️ ${escapeHtml(item.Grup || "-")}</span>
                        <span class="meta-tag">📱 ${escapeHtml(item.Platform || "-")}</span>
                        <span class="meta-tag">⚡ ${escapeHtml(item.Prioritas || "-")}</span>
                        <span class="meta-tag status">${escapeHtml(item.Status || "-")}</span>
                    </div>
                    <button class="preview-btn" onclick='showModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        👁️ Preview & Copy
                    </button>
                </div>
            `).join("")}
        </div>
    `;
}

// Show modal dengan detail item
function showModal(item) {
    if (!modalBody) return;
    
    let html = `
        <div class="modal-header">
            <h2>${escapeHtml(item.Judul || "Detail Template")}</h2>
        </div>
        <div class="modal-info">
            <div class="info-row"><strong>Kategori:</strong> ${escapeHtml(item.Kategori || "-")}</div>
            <div class="info-row"><strong>Grup:</strong> ${escapeHtml(item.Grup || "-")}</div>
            <div class="info-row"><strong>Status:</strong> ${escapeHtml(item.Status || "-")}</div>
            <div class="info-row"><strong>Platform:</strong> ${escapeHtml(item.Platform || "-")}</div>
            <div class="info-row"><strong>Prioritas:</strong> ${escapeHtml(item.Prioritas || "-")}</div>
        </div>
        <div class="modal-section">
            <h3>📌 Pertanyaan</h3>
            <p>${escapeHtml(item.Pertanyaan || "-")}</p>
        </div>
    `;
    
    // Jawaban
    const jawabanKeys = ["Jawaban 1", "Jawaban 2", "Jawaban 3", "Jawaban 4"];
    jawabanKeys.forEach(key => {
        if (item[key] && item[key].trim()) {
            html += `
                <div class="modal-section answer-section">
                    <h4>${key}</h4>
                    <button class="copy-btn" onclick="copyText(\`${escapeHtml(item[key]).replace(/`/g, '\\`')}\`)">
                        📋 Copy
                    </button>
                    <p>${escapeHtml(item[key])}</p>
                </div>
            `;
        }
    });
    
    modalBody.innerHTML = html;
    modal.style.display = "flex";
}

// Copy text ke clipboard
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast("✓ Berhasil disalin ke clipboard", 1500);
    } catch (err) {
        console.error("Copy failed:", err);
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast("✓ Berhasil disalin", 1500);
    }
}

// Show toast notification
function showToast(message, duration = 2000) {
    let toast = document.querySelector(".toast-notification");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast-notification";
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

// Toggle theme dark/light
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById("themeToggle");
    
    if (body.classList.contains("dark-theme")) {
        body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light");
        if (themeToggle) themeToggle.textContent = "🌙 Dark Mode";
    } else {
        body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");
        if (themeToggle) themeToggle.textContent = "☀️ Light Mode";
    }
}

// Toggle sidebar collapse
function toggleSidebar() {
    const sidebar = document.querySelector(".sidebar");
    const main = document.querySelector(".main");
    
    if (sidebar && main) {
        sidebar.classList.toggle("collapsed");
        main.classList.toggle("expanded");
        
        // Save state
        const isCollapsed = sidebar.classList.contains("collapsed");
        localStorage.setItem("sidebarCollapsed", isCollapsed);
    }
}

// Load saved preferences
function loadPreferences() {
    // Theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
        const themeToggle = document.getElementById("themeToggle");
        if (themeToggle) themeToggle.textContent = "☀️ Light Mode";
    }
    
    // Sidebar state
    const sidebarCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    if (sidebarCollapsed) {
        const sidebar = document.querySelector(".sidebar");
        const main = document.querySelector(".main");
        if (sidebar && main) {
            sidebar.classList.add("collapsed");
            main.classList.add("expanded");
        }
    }
}

// Export functions untuk global access
window.showModal = showModal;
window.copyText = copyText;

// Load preferences saat startup
loadPreferences();
