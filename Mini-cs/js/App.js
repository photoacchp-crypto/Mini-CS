const API_URL =
"https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";

async function loadData() {

    try {

        const res = await fetch(API_URL);
        const json = await res.json();

        allData = json.data || [];

        renderStats();
        populateFilters();
        renderContent();

    } catch(err) {

        console.error(err);

    }

}

function unique(field){
    return [...new Set(allData.map(x=>x[field]).filter(Boolean))];
}

function populateFilters(){

    fillSelect("kategoriFilter","Kategori");
    fillSelect("grupFilter","Grup");
    fillSelect("statusFilter","Status");
    fillSelect("platformFilter","Platform");
    fillSelect("prioritasFilter","Prioritas");

}

function fillSelect(id,key){

    const select=document.getElementById(id);

    const current=select.value;

    select.innerHTML=`<option value="">Semua ${key}</option>`;

    unique(key).forEach(item=>{

        select.innerHTML+=`<option value="${item}">${item}</option>`;

    });

    select.value=current;

}

function renderStats(){

    const totalData=allData.length;

    const totalKategori=unique("Kategori").length;
    const totalGrup=unique("Grup").length;
    const totalPlatform=unique("Platform").length;

    const totalFavorit=
        allData.filter(x=>String(x.Favorit).toUpperCase()==="TRUE").length;

    document.getElementById("stats").innerHTML=`

    <div class="stat-card">
        <h2>${totalData}</h2>
        <p>Total Data</p>
    </div>

    <div class="stat-card">
        <h2>${totalKategori}</h2>
        <p>Total Kategori</p>
    </div>

    <div class="stat-card">
        <h2>${totalGrup}</h2>
        <p>Total Grup</p>
    </div>

    <div class="stat-card">
        <h2>${totalPlatform}</h2>
        <p>Total Platform</p>
    </div>

    <div class="stat-card">
        <h2>${totalFavorit}</h2>
        <p>Total Favorit</p>
    </div>

    `;

}

function filterData(){

    const search=document
    .getElementById("searchInput")
    .value
    .toLowerCase();

    return allData.filter(item=>{

        const text=Object.values(item)
        .join(" ")
        .toLowerCase();

        if(search && !text.includes(search))
            return false;

        if(
            kategoriFilter.value &&
            item.Kategori!==kategoriFilter.value
        ) return false;

        if(
            grupFilter.value &&
            item.Grup!==grupFilter.value
        ) return false;

        if(
            statusFilter.value &&
            item.Status!==statusFilter.value
        ) return false;

        if(
            platformFilter.value &&
            item.Platform!==platformFilter.value
        ) return false;

        if(
            prioritasFilter.value &&
            item.Prioritas!==prioritasFilter.value
        ) return false;

        if(
            currentView==="favorit" &&
            String(item.Favorit).toUpperCase()!=="TRUE"
        ) return false;

        return true;

    });

}

function renderContent(){

    let data=filterData();

    if(currentView==="kategori"){

        const map={};

        data.forEach(item=>{

            map[item.Kategori]=(map[item.Kategori]||0)+1;

        });

        content.innerHTML=Object.entries(map)
        .map(([k,v])=>
        `
        <div class="card">
            <h3>${k}</h3>
            <p>${v} Item</p>
        </div>
        `)
        .join("");

        return;

    }

    if(currentView==="grup"){

        const map={};

        data.forEach(item=>{

            map[item.Grup]=(map[item.Grup]||0)+1;

        });

        content.innerHTML=Object.entries(map)
        .map(([k,v])=>
        `
        <div class="card">
            <h3>${k}</h3>
            <p>${v} Item</p>
        </div>
        `)
        .join("");

        return;

    }

    content.innerHTML=
    `<div class="cards">`+

    data.map(item=>`

    <div class="card">

        <h3>${item.Judul || "-"}</h3>

        <p>${item.Kategori || ""}</p>
        <p>${item.Grup || ""}</p>

        <p>${item.Platform || ""}</p>

        <button
            class="preview-btn"
            onclick='showModal(${JSON.stringify(item)})'
        >
            👁 Preview
        </button>

    </div>

    `).join("")

    +`</div>`;

}

function showModal(item){

    const body=document.getElementById("modalBody");

    let html=`

    <h2>${item.Judul || ""}</h2>

    <br>

    <p><b>Kategori:</b> ${item.Kategori || ""}</p>
    <p><b>Grup:</b> ${item.Grup || ""}</p>
    <p><b>Status:</b> ${item.Status || ""}</p>
    <p><b>Platform:</b> ${item.Platform || ""}</p>
    <p><b>Prioritas:</b> ${item.Prioritas || ""}</p>

    <br>

    <p><b>Pertanyaan:</b></p>
    <p>${item["Pertanyaan"] || ""}</p>

    <br>
    `;

    ["Jawaban 1","Jawaban 2","Jawaban 3","Jawaban 4"]
    .forEach(key=>{

        if(item[key]){

            html+=`

            <h4>${key}</h4>

            <button
            class="copy-btn"
            onclick="copyText(\`${item[key]}\`)">
            📋 Copy
            </button>

            <p>${item[key]}</p>

            <br>

            `;

        }

    });

    body.innerHTML=html;

    modal.style.display="flex";

}

function copyText(text){

    navigator.clipboard.writeText(text);

    alert("Berhasil disalin");

}

document
.getElementById("closeModal")
.onclick=()=>modal.style.display="none";

window.onclick=(e)=>{

    if(e.target===modal)
        modal.style.display="none";

};

document
.querySelectorAll(".menu-btn")
.forEach(btn=>{

    btn.addEventListener("click",()=>{

        document
        .querySelectorAll(".menu-btn")
        .forEach(x=>x.classList.remove("active"));

        btn.classList.add("active");

        currentView=btn.dataset.view;

        renderContent();

    });

});

document
.querySelectorAll("select")
.forEach(x=>x.addEventListener("change",renderContent));

searchInput.addEventListener("input",renderContent);

loadData();

setInterval(loadData,30000);