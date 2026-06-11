let currentSheet = null;
let currentPage = 1;
let currentData = [];
let currentHeaders = [];
let currentFilter = "";
const itemsPerPage = 20;

async function loadSheet(sheetName) {
    currentSheet = sheetName;
    currentPage = 1;
    currentFilter = "";
    showLoading();

    try {
        const data = await getSheetData(sheetName);
        currentData = data;
        
        if (data.length > 0) {
            currentHeaders = Object.keys(data[0]);
        }
        
        renderSheetData();
        
        // Clear search
        const searchInput = document.getElementById("searchInput");
        if (searchInput) searchInput.value = "";
        const searchResults = document.getElementById("searchResults");
        if (searchResults) searchResults.innerHTML = "";
        
    } catch (error) {
        console.error("Error loading sheet:", error);
        showError(`Gagal memuat data ${sheetName}: ${error.message}`);
    }
}

function renderSheetData() {
    const content = document.getElementById("content");
    
    if (!currentData || currentData.length === 0) {
        content.innerHTML = `
            <div class="card empty-sheet">
                <div class="empty-icon">📭</div>
                <h2>📄 ${escapeHtml(currentSheet)}</h2>
                <p>Tidak ada data di sheet ini.</p>
                <p class="text-muted">Silakan tambahkan data di Google Spreadsheet.</p>
                <button onclick="loadDashboard()" class="btn-primary">← Kembali ke Dashboard</button>
            </div>
        `;
        return;
    }

    // Apply filter if any
    let filteredData = [...currentData];
    if (currentFilter) {
        filteredData = currentData.filter(row => 
            JSON.stringify(row).toLowerCase().includes(currentFilter.toLowerCase())
        );
    }

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filteredData.slice(startIdx, endIdx);

    let html = `
        <div class="sheet-header">
            <div>
                <h2>📄 ${escapeHtml(currentSheet)}</h2>
                <div class="sheet-stats">📊 ${filteredData.length} item ditemukan ${currentFilter ? `(filter: "${currentFilter}")` : ""}</div>
            </div>
            <div class="sheet-actions">
                <button onclick="loadDashboard()" class="btn-secondary">← Dashboard</button>
                <button onclick="exportSheetData()" class="btn-secondary">📥 Export</button>
            </div>
        </div>
        
        <div class="card">
            <div class="filter-bar">
                <input type="text" id="sheetFilter" placeholder="🔍 Filter data di sheet ini..." 
                       value="${escapeHtml(currentFilter)}" onkeyup="filterSheetData(event)">
                ${currentFilter ? `<button onclick="clearFilter()" class="btn-small">✖ Clear</button>` : ""}
            </div>
            
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            ${currentHeaders.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
                            <th style="width:80px">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map((row, idx) => renderTableRow(row, startIdx + idx)).join('')}
                    </tbody>
                </table>
            </div>
    `;

    if (totalPages > 1) {
        html += `
            <div class="pagination">
                <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>◀ Sebelumnya</button>
                <span>Halaman ${currentPage} dari ${totalPages}</span>
                <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>Berikutnya ▶</button>
            </div>
        `;
    }

    html += `</div>`;
    content.innerHTML = html;
    
    // Focus on filter input if exists
    const filterInput = document.getElementById("sheetFilter");
    if (filterInput) filterInput.focus();
}

function renderTableRow(row, index) {
    return `
        <tr onclick="showDetail(${index})" style="cursor: pointer;">
            ${currentHeaders.map(col => {
                const value = row[col] || '';
                const truncated = value.length > 50 ? value.substring(0, 50) + '...' : value;
                return `<td title="${escapeHtml(value)}">${escapeHtml(truncated)}</td>`;
            }).join('')}
            <td>
                <button class="btn-small" onclick="event.stopPropagation(); showDetail(${index})">👁️ Detail</button>
            </td>
        </tr>
    `;
}

function filterSheetData(event) {
    currentFilter = event.target.value;
    currentPage = 1;
    renderSheetData();
}

function clearFilter() {
    currentFilter = "";
    currentPage = 1;
    renderSheetData();
}

function changePage(delta) {
    currentPage += delta;
    renderSheetData();
}

function showDetail(index) {
    // Apply filter to get correct index
    let filteredData = [...currentData];
    if (currentFilter) {
        filteredData = currentData.filter(row => 
            JSON.stringify(row).toLowerCase().includes(currentFilter.toLowerCase())
        );
    }
    const item = filteredData[index];
    if (!item) return;

    const content = document.getElementById("content");
    
    let detailsHtml = `
        <div class="card detail-card">
            <div class="detail-header">
                <h2>📋 Detail Item - ${escapeHtml(currentSheet)}</h2>
                <button class="btn-close" onclick="loadSheet('${currentSheet}')">✖ Kembali</button>
            </div>
            <div class="detail-body">
    `;

    for (const [key, value] of Object.entries(item)) {
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
                <button onclick="loadSheet('${currentSheet}')" class="btn-primary">📄 Lihat semua di ${escapeHtml(currentSheet)}</button>
            </div>
        </div>
    `;

    content.innerHTML = detailsHtml;
}

function exportSheetData() {
    if (!currentData || currentData.length === 0) {
        alert("Tidak ada data untuk diexport");
        return;
    }
    
    // Convert to CSV
    const headers = currentHeaders;
    const rows = currentData.map(row => headers.map(h => JSON.stringify(row[h] || "").replace(/,/g, " ")));
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    // Download
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentSheet}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function isUrl(str) {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('http://') || str.startsWith('https://') || 
           str.includes('drive.google.com') || str.includes('docs.google.com') ||
           str.includes('youtube.com') || str.includes('youtu.be');
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

function showLoading() {
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="card loading-card">
            <div class="loading-spinner"></div>
            <h3>🔄 Memuat data...</h3>
            <p>Mengambil data dari Google Sheets...</p>
        </div>
    `;
}

function showError(message) {
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="card error-card">
            <h3>⚠️ Error</h3>
            <p>${escapeHtml(message)}</p>
            <button onclick="loadDashboard()" class="btn-primary">← Kembali ke Dashboard</button>
            <button onclick="loadSheet('${currentSheet}')" class="btn-secondary">🔄 Coba Lagi</button>
        </div>
    `;
}
