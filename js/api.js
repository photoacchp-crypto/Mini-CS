// API_URL sudah didefinisikan di config.js
// Pastikan config.js di-load sebelum file ini

async function getSheets() {
    try {
        const res = await fetch(`${API_URL}?action=sheets`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("getSheets response:", data);
        
        // Handle various response formats
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.sheets)) return data.sheets;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && data.success === false) throw new Error(data.message);
        
        // Fallback untuk testing
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
        
        // Convert 2D array to array of objects
        if (Array.isArray(data) && data.length > 0) {
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
        
        // If already array of objects
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
            return data;
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
                sheet: item.sheet,
                title: item.title || item.judul || item.nama || item.data?.judul || "Tanpa Judul",
                ...item.data,
                _original: item
            }));
        }
        
        // If response has results property
        if (data && Array.isArray(data.results)) {
            return data.results;
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
