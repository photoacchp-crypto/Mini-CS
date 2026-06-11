// API_URL dari config.js
// SOURCE DATABASE BARU

async function getSheets() {
    try {
        const res = await fetch(`${API_URL}?action=sheets`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("📋 getSheets response:", data);
        
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.sheets)) return data.sheets;
        if (data && Array.isArray(data.data)) return data.data;
        
        return [];
    } catch (error) {
        console.error("getSheets error:", error);
        return [];
    }
}

async function getSheetData(sheetName) {
    try {
        const res = await fetch(`${API_URL}?action=data&sheet=${encodeURIComponent(sheetName)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(`📊 getSheetData(${sheetName}):`, data);
        
        if (Array.isArray(data) && data.length > 0) {
            if (Array.isArray(data[0])) {
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
            return data;
        }
        
        return [];
    } catch (error) {
        console.error(`getSheetData error for ${sheetName}:`, error);
        return [];
    }
}

async function searchData(keyword) {
    if (!keyword || keyword.length < 2) return [];
    
    try {
        const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(keyword)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("🔍 searchData response:", data);
        
        if (Array.isArray(data)) {
            return data.map(item => ({
                sheet: item.sheet || "Unknown",
                title: item.title || item.judul || item.nama || "Tanpa Judul",
                ...item
            }));
        }
        
        return [];
    } catch (error) {
        console.error("searchData error:", error);
        return [];
    }
}

async function testAPIConnection() {
    try {
        const sheets = await getSheets();
        return { success: true, sheets: sheets, count: sheets.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
