let searchTimeout;
let currentSearchKeyword = "";

function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;
    
    input.addEventListener("input", async () => {
        clearTimeout(searchTimeout);
        const keyword = input.value.trim();
        currentSearchKeyword = keyword;

        if (keyword.length < 2) {
            const resultsDiv = document.getElementById("searchResults");
            if (resultsDiv) resultsDiv.innerHTML = "";
            return;
        }

        searchTimeout = setTimeout(async () => {
            await performSearch(keyword);
        }, 400);
    });
    
    // Add clear button functionality
    input.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            input.value = "";
            document.getElementById("searchResults").innerHTML = "";
        }
    });
}

async function performSearch(keyword) {
    const resultsDiv = document.getElementById("searchResults");
    if (!resultsDiv) return;
    
    resultsDiv.innerHTML = '<div class="card loading-search"><div class="loading-spinner-small"></div>🔍 Mencari...</div>';

    try {
        const data = await searchData(keyword);
        
        if (!data || data.length === 0) {
            resultsDiv.innerHTML = `
                <div class="card empty-search">
                    <div class="empty-icon">🔍</div>
                    <p>Tidak ada hasil untuk "<strong>${escapeHtml(keyword)}</strong>"</p>
                    <p class="text-muted">Coba dengan kata kunci lain atau periksa ejaan</p>
                </div>
            `;
            return;
        }

        renderSearchResults(data, keyword);
    } catch (error) {
        console.error("Search error:", error);
        resultsDiv.innerHTML = `
            <div class="card error-search">
                <p>❌ Gagal melakukan pencarian: ${error.message}</p>
                <button onclick="performSearch('${keyword}')" class="btn-small">🔄 Coba Lagi</button>
            </div>
        `;
    }
}

function renderSearchResults(data, keyword) {
    const resultsDiv = document.getElementById("searchResults");
    if (!resultsDiv) return;
    
    // Group by sheet
    const grouped = {};
    data.forEach(item => {
        const sheet = item.sheet || "Unknown";
        if (!grouped[sheet]) grouped[sheet] = [];
        grouped[sheet].push(item);
    });

    let html = `
        <div class="search-header">
            <div class="search-stats">
                <span class="search-icon">🔍</span>
                <span class="search-keyword">"${escapeHtml(keyword)}"</span>
                <span class="search-count">${data.length} hasil dari ${Object.keys(grouped).length} kategori</span>
            </div>
            <button onclick="clearSearch()" class="btn-small">✖ Tutup</button>
        </div>
    `;

    for (const [sheet, items] of Object.entries(grouped)) {
        html += `
            <div class="card search-group">
                <div class="search-sheet-header" onclick="loadSheet('${sheet}')">
                    <span>📄 ${escapeHtml(sheet)}</span>
                    <span class="badge">${items.length}</span>
                </div>
                <div class="search-items">
        `;

        items.slice(0, 5).forEach((item, idx) => {
            const title = item.title || item.judul || item.nama || Object.values(item)[0] || "Tanpa judul";
            const preview = getPreview(item);
            html += `
                <div class="search-item" onclick="showSearchDetail('${sheet}', ${idx})" data-sheet="${sheet}" data-idx="${idx}">
                    <div class="search-item-title">📌 ${escapeHtml(String(title).substring(0, 80))}</div>
                    ${preview ? `<div class="search-item-preview">${preview}</div>` : ''}
                </div>
            `;
        });

        if (items.length > 5) {
            html += `
                <div class="search-more" onclick="loadSheet('${sheet}')">
                    + ${items.length - 5} hasil lainnya di ${escapeHtml(sheet)}
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    resultsDiv.innerHTML = html;
    
    // Store search results for detail view
    window.lastSearchData = data;
    window.lastSearchKeyword = keyword;
}

function getPreview(item) {
    // Find first meaningful text field
    const excludeFields = ['sheet', 'title', 'judul', 'nama', 'id'];
    for (const [key, value] of Object.entries(item)) {
        if (excludeFields.includes(key)) continue;
        if (value && typeof value === 'string' && value.length > 15 && value.length < 200) {
            let preview = value.substring(0, 100);
            if (value.length > 100) preview += "...";
            return escapeHtml(preview);
        }
    }
    return "";
}

function showSearchDetail(sheet, idx) {
    if (!window.lastSearchData) return;
    
    // Find items with matching sheet and index
    const sheetItems = window.lastSearchData.filter(item => item.sheet === sheet);
    const item = sheetItems[idx];
    if (!item) return;

    const content = document.getElementById("content");
    
    let detailsHtml = `
        <div class="card detail-card">
            <div class="detail-header">
                <h2>📋 Detail dari ${escapeHtml(sheet)}</h2>
                <div>
                    <button class="btn-close" onclick="clearSearchAndReload()">✖ Tutup</button>
                </div>
            </div>
            <div class="detail-body">
    `;

    // Tampilkan semua field dari item (exclude internal fields)
    for (const [key, value] of Object.entries(item)) {
        if (key === '_original') continue;
        if (key === 'sheet') continue;
        
        detailsHtml += `
            <div class="detail-row">
                <div class="detail-label">${escapeHtml(key)}</div>
                <div class="detail-value">
                    ${isUrl(value) ? `<a href="${value}" target="_blank" rel="noopener">${escapeHtml(value)}</a>` : 
                      value ? `<pre>${escapeHtml(String(value))}</pre>` : '-'}
                </div>
            </div>
        `;
    }

    detailsHtml += `
            </div>
            <div class="detail-footer">
                <button onclick="loadSheet('${sheet}')" class="btn-primary">📄 Lihat semua di ${escapeHtml(sheet)}</button>
                <button onclick="clearSearchAndReload()" class="btn-secondary">← Kembali ke Dashboard</button>
            </div>
        </div>
    `;

    content.innerHTML = detailsHtml;
    
    // Clear search results
    const searchResults = document.getElementById("searchResults");
    if (searchResults) searchResults.innerHTML = "";
    
    // Clear search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
}

function clearSearch() {
    const searchResults = document.getElementById("searchResults");
    if (searchResults) searchResults.innerHTML = "";
    
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";
    
    currentSearchKeyword = "";
    window.lastSearchData = null;
}

function clearSearchAndReload() {
    clearSearch();
    loadDashboard();
}

function isUrl(str) {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('http://') || str.startsWith('https://') || 
           str.includes('drive.google.com') || str.includes('docs.google.com');
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
