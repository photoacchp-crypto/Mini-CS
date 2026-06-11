// Global variables
let appInitialized = false;

// Register global functions for HTML onclick
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

// Main initialization function
async function initApp() {
    if (appInitialized) return;
    
    console.log("🚀 Initializing Creator Vault...");
    
    // Show loading indicator
    showAppLoading();
    
    try {
        // Test API connection first
        const apiTest = await testAPIConnection();
        if (!apiTest.success) {
            console.warn("API connection test failed:", apiTest.error);
            showAPIError(apiTest.error);
        } else {
            console.log("✅ API Connected. Found", apiTest.count, "sheets:", apiTest.sheets);
        }
        
        // Load sidebar
        await loadSidebar();
        
        // Load dashboard
        await loadDashboard();
        
        // Initialize search
        initSearch();
        
        // Start auto-refresh sidebar (optional)
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
                <p>Menghubungkan ke database...</p>
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
                <p class="text-muted">Pastikan Google Apps Script sudah di-deploy dengan akses "Anyone"</p>
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

// Handle offline mode
window.addEventListener('online', () => {
    console.log("🔄 Back online, refreshing data...");
    if (appInitialized) {
        loadDashboard();
        loadSidebar();
    }
});

window.addEventListener('offline', () => {
    console.warn("⚠️ You are offline. Some features may not work.");
    const content = document.getElementById("content");
    if (content && content.innerHTML.includes("Memuat")) {
        content.innerHTML = `
            <div class="card warning-card">
                <h3>⚠️ Koneksi Terputus</h3>
                <p>Anda sedang offline. Periksa kembali koneksi internet Anda.</p>
            </div>
        `;
    }
});

// Start the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

// Optional: Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Escape to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById("searchInput");
        if (searchInput && searchInput.value) {
            searchInput.value = "";
            clearSearch();
        }
    }
});
