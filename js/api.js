// API_URL sudah didefinisikan di config.js
// Pastikan config.js di-load sebelum file ini

async function getSheets() {
    try {
        const res = await fetch(`${API_URL}?action=sheets`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("getSheets response:", data);
        
        // Handle various response formats dari Apps Script
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.sheets)) return data.sheets;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && data.success === false) throw new Error(data.message);
        
        // Fallback untuk testing - ambil dari response lain
        if (data && typeof data === 'object') {
            const possibleSheets = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (possibleSheets.length > 0) return possibleSheets;
        }
        
        console.warn("Using fallback sheets");
        return ["Ebook", "Produk", "Pelanggan", "TemplateChat", "Affiliate", "PromptAI", "IdeKonten", "Notes"];
    } catch (error) {
        console.error("getSheets error:", error);
        throw error;
    }
}

async function getSheetData(sheetName) {
    try {
        const res = await fetch(`${API_URL}?action=data&sheet=${encodeURIComponent(sheetName)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`getSheetData(${sheetName}) response:`, data);
        
        // Convert 2D array to array of objects (format umum dari Apps Script)
        if (Array.isArray(data) && data.length > 0) {
            // Cek apakah ini format 2D array (baris pertama adalah header)
            if (Array.isArray(data[0]) && data[0].length > 0) {
                const headers = data[0];
                const rows = data.slice(1);
                return rows.map(row => {
                    const obj = {};
                    headers.forEach((header, idx) => {
                        obj[header] = row[idx] || "";
                    });
                    return obj;
                });
            }
            
            // Jika sudah array of objects
            if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
                return data;
            }
        }
        
        // Jika response memiliki property data
        if (data && Array.isArray(data.data)) {
            if (Array.isArray(data.data[0]) && data.data.length > 0) {
                const headers = data.data[0];
                const rows = data.data.slice(1);
                return rows.map(row => {
                    const obj = {};
                    headers.forEach((header, idx) => {
                        obj[header] = row[idx] || "";
                    });
                    return obj;
                });
            }
            return data.data;
        }
        
        return [];
    } catch (error) {
        console.error(`getSheetData(${sheetName}) error:`, error);
        return [];
    }
}

async function searchData(keyword) {
    if (!keyword || keyword.length < 2) return [];
    
    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(keyword)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("searchData response:", data);
        
        // Format search results
        if (Array.isArray(data)) {
            return data.map(item => ({
                sheet: item.sheet || item.Sheet || "Unknown",
                title: item.title || item.judul || item.nama || item.data?.judul || "Tanpa Judul",
                ...item.data,
                _original: item
            }));
        }
        
        // Jika response memiliki results property
        if (data && Array.isArray(data.results)) {
            return data.results;
        }
        
        // Jika response memiliki data property
        if (data && Array.isArray(data.data)) {
            return data.data;
        }
        
        return [];
    } catch (error) {
        console.error("searchData error:", error);
        return [];
    }
}

// Test connection function
async function testAPIConnection() {
    try {
        const sheets = await getSheets();
        return { success: true, sheets: sheets, count: sheets.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Fungsi tambahan untuk mendapatkan metadata spreadsheet
async function getSpreadsheetInfo() {
    try {
        const res = await fetch(`${API_URL}?action=info`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
    } catch (error) {
        console.error("getSpreadsheetInfo error:", error);
        return null;
    }
}
