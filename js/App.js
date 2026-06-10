const API_URL = "https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";
let isLoading = false;
let lastUpdateTime = null;

// DOM Elements
const content = document.getElementById("content");
const searchInput = document.getElementById("searchInput");
const searchClear = document.getElementById("searchClear");
const kategoriFilter = document.getElementById("kategoriFilter");
const grupFilter = document.getElementById("grupFilter");
const statusFilter = document.getElementById("statusFilter");
const platformFilter = document.getElementById("platformFilter");
const prioritasFilter = document.getElementById("prioritasFilter");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const modalTitle = document.getElementById("modalTitle");
const loadingOverlay = document.getElementById("loadingOverlay");
const lastUpdateSpan = document.getElementById("lastUpdate");
const toast = document.getElementById("toast");
const refreshBtn = document.getElementById("refreshBtn");
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mobileOverlay = document.getElementById("mobileOverlay");
const sidebarClose = document.getElementById("sidebarClose");
const filterToggle = document.getElementById("filterToggle");
const filterSection = document.querySelector(".filter-section");

// Show toast notification
function showToast(message, isError = false) {
    toast.textContent = message;
    if (isError) {
        toast.style.background = "var(--danger)";
    } else {
        toast.style.background = "var(--success)";
    }
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.style.background = "var(--success)";
        }, 300);
    }, 2500);
}

// Show/hide loading
function setLoading(loading) {
    isLoading = loading;
    loadingOverlay.style.display = loading ? "flex" : "none";
}

// Load data from API
async function loadData(showLoading = true) {
    if (isLoading) return;
    
    if (showLoading) setLoading(true);
    
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        allData = json.data || [];
        lastUpdateTime = new Date();
        updateLastUpdateTime();
        
        renderStats();
        populateFilters();
        renderContent();
        
        showToast("Data berhasil diperbarui");
    } catch (err) {
        console.error(err);
        showToast("Gagal memuat data", true);
    } finally {
        if (showLoading) setLoading(false);
    }
}

// Update last update time display
function updateLastUpdateTime() {
    if (lastUpdateTime) {
        const formatted = lastUpdateTime.toLocaleTimeString("id-ID");
        lastUpdateSpan.textContent = `Terakhir: ${formatted}`;
    }
}

// Get unique values from field
function unique(field) {
    return [...new Set(allData.map(x => x[field]).filter(Boolean))].sort();
}

// Populate filter dropdowns
function populateFilters() {
    fillSelect(kategoriFilter, "Kategori", "Semua Kategori");
    fillSelect(grupFilter, "Grup", "Semua Grup");
    fillSelect(statusFilter, "Status", "Semua Status");
    fillSelect(platformFilter, "Platform", "Semua Platform");
    fillSelect(prioritasFilter, "Prioritas", "Semua Prioritas");
}

function fillSelect(selectElement, key, defaultText) {
    const current = selectElement.value;
    selectElement.innerHTML = `<option value="">${defaultText}</option>`;
    unique(key).forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
    selectElement.value = current;
}

// Render stats cards
function renderStats() {
    const totalData = allData.length;
    const totalKategori = unique("Kategori").length;
    const totalGrup = unique("Grup").length;
    const totalPlatform = unique("Platform").length;
    const totalFavorit = allData.filter(x => String(x.Favorit).toUpperCase() === "TRUE").length;

    document.getElementById("stats").innerHTML = `
        <div class="stat-card">
            <h2>${totalData.toLocaleString()}</h2>
            <p>Total Data</p>
        </div>
        <div class="stat-card">
            <h2>${totalKategori}</h2>
            <p>Kategori</p>
        </div>
        <div class="stat-card">
            <h2>${totalGrup}</h2>
            <p>Grup</p>
        </div>
        <div class="stat-card">
            <h2>${totalPlatform}</h2>
            <p>Platform</p>
        </div>
        <div class="stat-card">
            <h2>${totalFavorit}</h2>
            <p>Favorit</p>
        </div>
    `;
}

// Filter data based on search and filters
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
            ].filter(Boolean).join(" ").toLowerCase();
            
            if (!searchableText.includes(searchTerm)) return false;
        }
        
        // Apply filters
        if (kategoriFilter.value && item.Kategori !== kategoriFilter.value) return false;
        if (grupFilter.value && item.Grup !== grupFilter.value) return false;
        if (statusFilter.value && item.Status !== statusFilter.value) return false;
        if (platformFilter.value && item.Platform !== platformFilter.value) return false;
        if (prioritasFilter.value && item.Prioritas !== prioritasFilter.value) return false;
        
        // Favorit view filter
        if (currentView === "favorit" && String(item.Favorit).toUpperCase() !== "TRUE") return false;
        
        return true;
    });
}

// Render main content based on current view
function renderContent() {
    let data = filterData();
    
    if (data.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <span>🔍</span>
                <p>Tidak ada data yang ditemukan</p>
            </div>
        `;
        return;
    }
    
    if (currentView === "kategori") {
        const map = {};
        data.forEach(item => {
            const key = item.Kategori || "Tidak Berkategori";
            map[key] = (map[key] || 0) + 1;
        });
        
        content.innerHTML = `
            <div class="cards">
                ${Object.entries(map).sort((a,b) => b[1] - a[1]).map(([k, v]) => `
                    <div class="card" onclick="filterByKategori('${k.replace(/'/g, "\\'")}')">
                        <h3>📂 ${k}</h3>
                        <p>${v} item</p>
                    </div>
                `).join("")}
            </div>
        `;
        return;
    }
    
    if (currentView === "grup") {
        const map = {};
        data.forEach(item => {
            const key = item.Grup || "Tidak Bergrup";
            map[key] = (map[key] || 0) + 1;
        });
        
        content.innerHTML = `
            <div class="cards">
                ${Object.entries(map).sort((a,b) => b[1] - a[1]).map(([k, v]) => `
                    <div class="card" onclick="filterByGrup('${k.replace(/'/g, "\\'")}')">
                        <h3>🗂 ${k}</h3>
                        <p>${v} item</p>
                    </div>
                `).join("")}
            </div>
        `;
        return;
    }
    
    // Dashboard view (default)
    content.innerHTML = `
        <div class="cards">
            ${data.map(item => `
                <div class="card">
                    <h3>${escapeHtml(item.Judul || "-")}</h3>
                    <div class="card-meta">
                        <span class="meta-tag">📂 ${escapeHtml(item.Kategori || "-")}</span>
                        <span class="meta-tag">🗂 ${escapeHtml(item.Grup || "-")}</span>
                        <span class="meta-tag">🖥 ${escapeHtml(item.Platform || "-")}</span>
                        ${item.Status ? `<span class="meta-tag">📌 ${escapeHtml(item.Status)}</span>` : ""}
                        ${String(item.Favorit).toUpperCase() === "TRUE" ? '<span class="meta-tag">⭐ Favorit</span>' : ""}
                    </div>
                    <button class="preview-btn" onclick='showModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
                        👁 Preview & Copy
                    </button>
                </div>
            `).join("")}
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Filter by kategori from card click
function filterByKategori(kategori) {
    kategoriFilter.value = kategori;
    currentView = "dashboard";
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.view === "dashboard") btn.classList.add("active");
    });
    renderContent();
}

// Filter by grup from card click
function filterByGrup(grup) {
    grupFilter.value = grup;
    currentView = "dashboard";
    document.querySelectorAll(".menu-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.view === "dashboard") btn.classList.add("active");
    });
    renderContent();
}

// Show modal with item details
function showModal(item) {
    modalTitle.textContent = item.Judul || "Detail";
    
    let html = `
        <div style="margin-bottom: 20px;">
            <p><strong>📂 Kategori:</strong> ${escapeHtml(item.Kategori) || "-"}</p>
            <p><strong>🗂 Grup:</strong> ${escapeHtml(item.Grup) || "-"}</p>
            <p><strong>📌 Status:</strong> ${escapeHtml(item.Status) || "-"}</p>
            <p><strong>🖥 Platform:</strong> ${escapeHtml(item.Platform) || "-"}</p>
            <p><strong>⚠️ Prioritas:</strong> ${escapeHtml(item.Prioritas) || "-"}</p>
            ${String(item.Favorit).toUpperCase() === "TRUE" ? '<p><strong>⭐ Favorit:</strong> Ya</p>' : ""}
        </div>
    `;
    
    if (item.Pertanyaan) {
        html += `
            <div style="margin-bottom: 20px;">
                <h4>❓ Pertanyaan</h4>
                <p>${escapeHtml(item.Pertanyaan)}</p>
            </div>
        `;
    }
    
    ["Jawaban 1", "Jawaban 2", "Jawaban 3", "Jawaban 4"].forEach(key => {
        if (item[key]) {
            html += `
                <div style="margin-bottom: 16px;">
                    <h4>📝 ${key}</h4>
                    <button class="copy-btn" onclick="copyText('${escapeHtml(item[key]).replace(/'/g, "\\'")}')">
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

// Copy text to clipboard
function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("Berhasil disalin ke clipboard!");
    }).catch(() => {
        showToast("Gagal menyalin", true);
    });
}

// Close modal
document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
};

// Search clear button
searchInput.addEventListener("input", () => {
    searchClear.style.display = searchInput.value ? "block" : "none";
    renderContent();
});

searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.style.display = "none";
    renderContent();
});

// Filter change listeners
[kategoriFilter, grupFilter, statusFilter, platformFilter, prioritasFilter].forEach(select => {
    select.addEventListener("change", renderContent);
});

// Menu navigation
document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".menu-btn").forEach(x => x.classList.remove("active"));
        btn.classList.add("active");
        currentView = btn.dataset.view;
        renderContent();
    });
});

// Refresh button
refreshBtn.addEventListener("click", () => {
    loadData(true);
});

// Theme toggle
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", savedTheme);
    themeToggle.textContent = savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}

themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    themeToggle.textContent = newTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
});

// Mobile menu
menuToggle.addEventListener("click", () => {
    sidebar.classList.add("open");
    mobileOverlay.classList.add("open");
});

sidebarClose.addEventListener("click", () => {
    sidebar.classList.remove("open");
    mobileOverlay.classList.remove("open");
});

mobileOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    mobileOverlay.classList.remove("open");
});

// Filter collapsible
filterToggle.addEventListener("click", () => {
    filterSection.classList.toggle("collapsed");
});

// Make functions global for onclick
window.showModal = showModal;
window.copyText = copyText;
window.filterByKategori = filterByKategori;
window.filterByGrup = filterByGrup;

// Initialize
initTheme();
loadData(true);
