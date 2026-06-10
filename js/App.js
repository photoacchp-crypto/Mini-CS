const API_URL =
"https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";

/* =========================
ELEMENTS
========================= */

const content =
document.getElementById("content");

const modal =
document.getElementById("modal");

const modalBody =
document.getElementById("modalBody");

const searchInput =
document.getElementById("searchInput");

const kategoriFilter =
document.getElementById("kategoriFilter");

const grupFilter =
document.getElementById("grupFilter");

const statusFilter =
document.getElementById("statusFilter");

const platformFilter =
document.getElementById("platformFilter");

const prioritasFilter =
document.getElementById("prioritasFilter");

/* =========================
LOAD DATA
========================= */

async function loadData(showMessage = false){

```
try{

    const res =
    await fetch(API_URL);

    const json =
    await res.json();

    allData =
    json.data || [];

    localStorage.setItem(
        "onlinecs_cache",
        JSON.stringify(allData)
    );

    renderStats();
    populateFilters();
    renderContent();

    if(showMessage){

        showToast(
            "Data berhasil diperbarui"
        );

    }

}catch(err){

    console.error(err);

    const cache =
    localStorage.getItem(
        "onlinecs_cache"
    );

    if(cache){

        allData =
        JSON.parse(cache);

        renderStats();
        populateFilters();
        renderContent();

        showToast(
            "Menggunakan cache lokal"
        );

    }

}
```

}

/* =========================
UTIL
========================= */

function unique(field){

```
return [

    ...new Set(

        allData
        .map(x=>x[field])
        .filter(Boolean)

    )

];
```

}

/* =========================
FILTER
========================= */

function populateFilters(){

```
fillSelect(
    "kategoriFilter",
    "Kategori"
);

fillSelect(
    "grupFilter",
    "Grup"
);

fillSelect(
    "statusFilter",
    "Status"
);

fillSelect(
    "platformFilter",
    "Platform"
);

fillSelect(
    "prioritasFilter",
    "Prioritas"
);
```

}

function fillSelect(id,key){

```
const select =
document.getElementById(id);

if(!select) return;

const current =
select.value;

select.innerHTML =
`<option value="">
Semua ${key}
</option>`;

unique(key).forEach(item=>{

    select.innerHTML +=
    `<option value="${item}">
        ${item}
    </option>`;

});

select.value = current;
```

}

function filterData(){

```
const search =
searchInput.value
.trim()
.toLowerCase();

return allData.filter(item=>{

    const text =
    Object.values(item)
    .join(" ")
    .toLowerCase();

    if(
        search &&
        !text.includes(search)
    ){
        return false;
    }

    if(
        kategoriFilter.value &&
        item.Kategori !==
        kategoriFilter.value
    ){
        return false;
    }

    if(
        grupFilter.value &&
        item.Grup !==
        grupFilter.value
    ){
        return false;
    }

    if(
        statusFilter.value &&
        item.Status !==
        statusFilter.value
    ){
        return false;
    }

    if(
        platformFilter.value &&
        item.Platform !==
        platformFilter.value
    ){
        return false;
    }

    if(
        prioritasFilter.value &&
        item.Prioritas !==
        prioritasFilter.value
    ){
        return false;
    }

    if(
        currentView ===
        "favorit"
    ){

        if(
            String(
                item.Favorit
            ).toUpperCase()
            !==
            "TRUE"
        ){
            return false;
        }

    }

    return true;

});
```

}

/* =========================
STATS
========================= */

function renderStats(){

```
const totalData =
allData.length;

const totalKategori =
unique("Kategori").length;

const totalGrup =
unique("Grup").length;

const totalPlatform =
unique("Platform").length;

const totalFavorit =

allData.filter(

    x=>

    String(
        x.Favorit
    ).toUpperCase()

    ===

    "TRUE"

).length;

document
.getElementById("stats")
.innerHTML =

`

<div class="stat-card">
    <h2>${totalData}</h2>
    <p>Total Data</p>
</div>

<div class="stat-card">
    <h2>${totalKategori}</h2>
    <p>Kategori</p>
</div>

<div class="stat-card">
    <h2>${totalGrup}</h2>
    <p>Grup</p>
</div>

<div class="stat-card">
    <h2>${totalPlatform}</h2>
    <p>Platform</p>
</div>

<div class="stat-card">
    <h2>${totalFavorit}</h2>
    <p>Favorit</p>
</div>

`;
```

}

/* =========================
CONTENT
========================= */

function renderContent(){

```
let data =
filterData();

if(!data.length){

    content.innerHTML =

    `
    <div class="empty-state">
        Tidak ada data ditemukan
    </div>
    `;

    return;

}

if(
    currentView ===
    "kategori"
){

    const map = {};

    data.forEach(item=>{

        map[item.Kategori] =
        (map[item.Kategori]||0)+1;

    });

    content.innerHTML =

    `<div class="cards">`

    +

    Object.entries(map)
    .map(([k,v])=>

    `
    <div class="card">
        <h3>${k}</h3>
        <p>${v} Item</p>
    </div>
    `

    ).join("")

    +

    `</div>`;

    return;

}

if(
    currentView ===
    "grup"
){

    const map = {};

    data.forEach(item=>{

        map[item.Grup] =
        (map[item.Grup]||0)+1;

    });

    content.innerHTML =

    `<div class="cards">`

    +

    Object.entries(map)
    .map(([k,v])=>

    `
    <div class="card">
        <h3>${k}</h3>
        <p>${v} Item</p>
    </div>
    `

    ).join("")

    +

    `</div>`;

    return;

}

content.innerHTML =

`<div class="cards">`

+

data.map(item=>`

<div class="card">

    <h3>
        ${item.Judul || "-"}
    </h3>

    <span class="badge">
        ${item.Kategori || "-"}
    </span>

    <span class="badge">
        ${item.Grup || "-"}
    </span>

    <span class="badge">
        ${item.Platform || "-"}
    </span>

    <br><br>

    <button
        class="preview-btn"
        onclick='showModal(${JSON.stringify(item)})'>
        👁 Preview
    </button>

</div>

`).join("")

+

`</div>`;
```

}

/* =========================
MODAL
========================= */

function showModal(item){

```
let html =

`

<h2>
    ${item.Judul || ""}
</h2>

<p>
    <b>Kategori:</b>
    ${item.Kategori || "-"}
</p>

<p>
    <b>Grup:</b>
    ${item.Grup || "-"}
</p>

<p>
    <b>Status:</b>
    ${item.Status || "-"}
</p>

<p>
    <b>Platform:</b>
    ${item.Platform || "-"}
</p>

<p>
    <b>Prioritas:</b>
    ${item.Prioritas || "-"}
</p>

<hr>

<h3>
    Pertanyaan
</h3>

<p>
    ${item["Pertanyaan"] || ""}
</p>

`;

[

    "Jawaban 1",
    "Jawaban 2",
    "Jawaban 3",
    "Jawaban 4"

]

.forEach(key=>{

    if(item[key]){

        html +=

        `

        <hr>

        <h3>
            ${key}
        </h3>

        <button
            class="copy-btn"
            onclick="copyText(\`${item[key]
            .replace(/`/g,'\\`')}\`)">

            📋 Copy

        </button>

        <p>
            ${item[key]}
        </p>

        `;

    }

});

modalBody.innerHTML =
html;

modal.style.display =
"flex";
```

}

/* =========================
COPY
========================= */

function copyText(text){

```
navigator.clipboard
.writeText(text)
.then(()=>{

    showToast(
        "Berhasil disalin"
    );

});
```

}

/* =========================
TOAST
========================= */

function showToast(message){

```
const toast =
document.getElementById(
    "toast"
);

toast.innerText =
message;

toast.classList.add(
    "show"
);

setTimeout(()=>{

    toast.classList.remove(
        "show"
    );

},2000);
```

}

/* =========================
EVENTS
========================= */

document
.querySelectorAll(".menu-btn")
.forEach(btn=>{

```
btn.addEventListener(
    "click",
    ()=>{

        document
        .querySelectorAll(
            ".menu-btn"
        )
        .forEach(x=>
            x.classList.remove(
                "active"
            )
        );

        btn.classList.add(
            "active"
        );

        currentView =
        btn.dataset.view;

        renderContent();

    }
);
```

});

document
.querySelectorAll("select")
.forEach(select=>{

```
select.addEventListener(
    "change",
    renderContent
);
```

});

searchInput.addEventListener(
"input",
renderContent
);

document
.getElementById(
"clearSearch"
)
.addEventListener(
"click",
()=>{

```
    searchInput.value =
    "";

    renderContent();

}
```

);

document
.getElementById(
"refreshBtn"
)
.addEventListener(
"click",
()=>{

```
    loadData(true);

}
```

);

document
.getElementById(
"closeModal"
)
.onclick = ()=>
modal.style.display =
"none";

window.onclick = (e)=>{

```
if(
    e.target === modal
){

    modal.style.display =
    "none";

}
```

};

/* =========================
INIT
========================= */

loadData();
