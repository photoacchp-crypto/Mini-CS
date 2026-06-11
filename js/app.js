// Global variables
let appInitialized = false;

// Pastikan API_URL dari config.js sudah benar
console.log("🚀 Creator Vault Starting...");
console.log("📡 API URL:", API_URL);

// Register global functions
window.loadDashboard = loadDashboard;
window.loadSheet = loadSheet;
window.showDetail = showDetail;
window.changePage = changePage;
window.showSearchDetail = showSearchDetail;
window.clearSearch = clearSearch;
window.testAPIConnection = testAPIConnection;
window.exportSheetData = exportSheetData;
window.filterSheetData = filterSheetData;
window.clearFilter = clearFilter;

async function initApp() {
    if (appInitialized) return;
    
    console.log("🚀 Initializing Creator Vault...");
    console.log("📡 Using API:", API_URL);
    
    showAppLoading();
    
    try {
        const apiTest = await testAPIConnection();
        if (!apiTest.success) {
            console.warn("API connection test failed:", apiTest.error);
            showAPIError(apiTest.error);
        } else {
            console.log("✅ API Connected. Found", apiTest.count, "sheets:", apiTest.sheets);
        }
        
        await loadSidebar();
        await loadDashboard();
        initSearch();
        startSidebarAutoRefresh();
        
        appInitialized = true;
        console.log("✅ Creator Vault initialized successfully");
        
    } catch (error) {
        console.error("❌ Initialization error:", error);
        showInitError(error.message);
    }
}

function showAppLoading() {
    const content = document.getElementById("content");
    if (content) {
        content.innerHTML = `
            <div class="card loading-card">
                <div class="loading-spinner"></div>
                <h3>🚀 Memulai Creator Vault...</h3>
                <p>Menghubungkan ke database: ${API_URL.substring(0, 60)}...</p>
            </div>
        `;
    }
}

function showAPIError(errorMsg) {
    const content = document.getElementById("content");
    if (content) {
        content.innerHTML = `
            <div class="card error-card">
                <h3>⚠️ Koneksi API Gagal</h3>
                <p>Error: ${escapeHtml(errorMsg)}</p>
                <p class="text-muted">URL: ${API_URL}</p>
                <button onclick="initApp()" class="btn-primary">🔄 Coba Lagi</button>
                <button onclick="testAPIConnection()" class="btn-secondary">🔍 Test Connection</button>
            </div>
        `;
    }
}

function showInitError(errorMsg) {
    const content = document.getElementById("content");
    if (content) {
        content.innerHTML = `
            <div class="card error-card">
                <h3>❌ Gagal Memulai Aplikasi</h3>
                <p>${escapeHtml(errorMsg)}</p>
                <button onclick="initApp()" class="btn-primary">🔄 Refresh Aplikasi</button>
            </div>
        `;
    }
}

window.addEventListener('online', () => {
    console.log("🔄 Back online, refreshing data...");
    if (appInitialized) {
        loadDashboard();
        loadSidebar();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    if (e.key === 'Escape') {
        const searchInput = document.getElementById("searchInput");
        if (searchInput && searchInput.value) {
            searchInput.value = "";
            clearSearch();
        }
    }
});
