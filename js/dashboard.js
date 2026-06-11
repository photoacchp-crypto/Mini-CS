async function loadDashboard() {
    const content = document.getElementById("content");
    if (!content) return;
    
    content.innerHTML = '<div class="card"><h3>📊 Memuat Dashboard...</h3><div class="loading-spinner"></div></div>';
    
    // Clear search results
    const searchResults = document.getElementById("searchResults");
    if (searchResults) searchResults.innerHTML = "";
    
    // Clear search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    try {
        const sheets = await getSheets();
        console.log("Dashboard sheets:", sheets);
        
        if (!sheets || sheets.length === 0) {
            content.innerHTML = `
                <div class="card error-card">
                    <h3>⚠️ Tidak Ada Database</h3>
                    <p>Belum ada sheet yang tersedia. Silakan tambahkan sheet di Google Spreadsheet.</p>
                    <button onclick="loadDashboard()" class="btn-primary">🔄 Refresh</button>
                </div>
            `;
            return;
        }
        
        // Get stats for each sheet
        const stats = [];
        let totalItems = 0;
        
        for (const sheet of sheets) {
            const data = await getSheetData(sheet);
            const count = data.length;
            stats.push({ name: sheet, count: count });
            totalItems += count;
        }

        let html = `
            <div class="dashboard-welcome">
                <h1>🏠 Creator Vault</h1>
                <p>Personal Knowledge Hub & Digital Library</p>
                <div class="last-updated">🕐 Last updated: ${new Date().toLocaleTimeString()}</div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${sheets.length}</div>
                    <div class="stat-label">Database Categories</div>
                    <div class="stat-icon">📁</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalItems}</div>
                    <div class="stat-label">Total Items</div>
                    <div class="stat-icon">📄</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">⚡</div>
                    <div class="stat-label">Real-time Sync</div>
                    <div class="stat-icon">🔄</div>
                </div>
            </div>

            <div class="card">
                <h3>📚 Semua Database</h3>
                <div class="sheet-grid">
        `;

        for (const sheet of stats) {
            const icon = getSheetIcon(sheet.name);
            html += `
                <div class="sheet-card" onclick="loadSheet('${escapeHtml(sheet.name)}')">
                    <div class="sheet-icon">${icon}</div>
                    <div class="sheet-name">${escapeHtml(sheet.name)}</div>
                    <div class="sheet-count">📊 ${sheet.count} items</div>
                    <div class="sheet-hover">Klik untuk lihat detail →</div>
                </div>
            `;
        }

        html += `
                </div>
            </div>

            <div class="card tips-card">
                <h3>💡 Panduan Cepat</h3>
                <ul>
                    <li>🔍 Gunakan kotak search di atas untuk mencari ke semua database</li>
                    <li>📄 Klik sheet di sidebar kiri atau di dashboard untuk melihat semua data</li>
                    <li>👆 Klik baris tabel untuk melihat detail lengkap</li>
                    <li>✨ Tambah sheet baru di Google Spreadsheet, otomatis muncul di sini</li>
                    <li>🔄 Sidebar akan refresh otomatis setiap 30 detik</li>
                </ul>
            </div>
        `;

        content.innerHTML = html;
        
        // Update active menu
        const menuItems = document.querySelectorAll(".menu-item");
        menuItems.forEach(item => {
            if (item.textContent.includes("Dashboard")) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });
        
    } catch (error) {
        console.error("Dashboard error:", error);
        content.innerHTML = `
            <div class="card error-card">
                <h3>⚠️ Gagal Memuat Dashboard</h3>
                <p>Error: ${error.message}</p>
                <p class="text-muted">Pastikan koneksi internet Anda aktif dan API dapat diakses.</p>
                <button onclick="loadDashboard()" class="btn-primary">🔄 Coba Lagi</button>
                <button onclick="testAPIConnection()" class="btn-secondary">🔍 Test API Connection</button>
            </div>
        `;
    }
}

function getSheetIcon(sheetName) {
    const icons = {
        "Ebook": "📚",
        "Produk": "🛒",
        "Pelanggan": "👥",
        "TemplateChat": "💬",
        "Affiliate": "🔗",
        "PromptAI": "🤖",
        "IdeKonten": "💡",
        "Notes": "📝",
        "ReadingProgress": "📖",
        "Bookmarks": "🔖",
        "Highlights": "✨"
    };
    return icons[sheetName] || "📄";
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Test API connection
async function testAPIConnection() {
    const result = await testAPIConnection();
    if (result.success) {
        alert(`✅ API Connected!\nFound ${result.count} sheets:\n${result.sheets.join(", ")}`);
    } else {
        alert(`❌ API Error:\n${result.error}`);
    }
}
