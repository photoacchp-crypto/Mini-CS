async function loadSidebar() {
    const menu = document.getElementById("sidebarMenu");
    if (!menu) return;
    
    menu.innerHTML = '<li class="loading">🔄 Memuat menu...</li>';

    try {
        const sheets = await getSheets();
        console.log("Sidebar sheets:", sheets);
        
        menu.innerHTML = "";

        // Dashboard menu (always first)
        const dashboardLi = document.createElement("li");
        dashboardLi.textContent = "📊 Dashboard";
        dashboardLi.className = "menu-item active";
        dashboardLi.addEventListener("click", () => {
            setActiveMenu(dashboardLi);
            if (typeof loadDashboard === 'function') loadDashboard();
            else console.error("loadDashboard not defined");
        });
        menu.appendChild(dashboardLi);

        // Separator
        const separator = document.createElement("li");
        separator.textContent = "━━━━━━━━━━━━━━━━";
        separator.className = "menu-separator";
        menu.appendChild(separator);

        // Dynamic sheets
        if (sheets && sheets.length > 0) {
            sheets.forEach(sheet => {
                const li = document.createElement("li");
                li.textContent = `📄 ${sheet}`;
                li.className = "menu-item";
                li.addEventListener("click", () => {
                    setActiveMenu(li);
                    if (typeof loadSheet === 'function') loadSheet(sheet);
                    else console.error("loadSheet not defined");
                });
                menu.appendChild(li);
            });
        } else {
            const emptyLi = document.createElement("li");
            emptyLi.textContent = "⚠️ Tidak ada sheet ditemukan";
            emptyLi.style.color = "#ff6b6b";
            menu.appendChild(emptyLi);
        }
        
        // Add refresh button at bottom
        const refreshLi = document.createElement("li");
        refreshLi.textContent = "🔄 Refresh Menu";
        refreshLi.className = "menu-item";
        refreshLi.style.marginTop = "20px";
        refreshLi.style.borderTop = "1px solid #2a2a2a";
        refreshLi.style.paddingTop = "12px";
        refreshLi.addEventListener("click", async () => {
            refreshLi.textContent = "🔄 Memuat ulang...";
            await loadSidebar();
        });
        menu.appendChild(refreshLi);
        
    } catch (error) {
        console.error("Error loading sidebar:", error);
        menu.innerHTML = `<li class="error">❌ Error: ${error.message}</li>
                          <li class="retry" onclick="loadSidebar()">🔄 Coba lagi</li>`;
    }
}

function setActiveMenu(activeItem) {
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.remove("active");
    });
    activeItem.classList.add("active");
}

// Auto-refresh sidebar every 30 seconds (optional)
let sidebarRefreshInterval;
function startSidebarAutoRefresh() {
    if (sidebarRefreshInterval) clearInterval(sidebarRefreshInterval);
    sidebarRefreshInterval = setInterval(() => {
        loadSidebar();
    }, 30000);
}

function stopSidebarAutoRefresh() {
    if (sidebarRefreshInterval) clearInterval(sidebarRefreshInterval);
}
