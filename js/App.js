const API_URL =
"https://script.google.com/macros/s/AKfycbyrznbrQDzNXiPc0fJ0fXxClPGtGktm2iTMZbzhin-o6ZenmlZfIbUp4RoCuzTPp5zH/exec";

let allData = [];
let currentView = "dashboard";

/* =========================
LOAD DATA
========================= */

async function loadData(showMessage = false){

```
try{

    const res = await fetch(API_URL);

    const json = await res.json();

    allData = json.data || [];

    localStorage.setItem(
        "online_cs_cache",
        JSON.stringify(allData)
    );

    renderStats();
    populateFilters();
    renderContent();

    if(showMessage){
        showToast("Data berhasil diperbarui");
    }

}catch(err){

    console.error(err);

    const cache =
    localStorage.getItem(
        "online_cs_cache"
    );

    if(cache){

        allData = JSON.parse(cache);

        renderStats();
        populateFilters();
        renderContent();

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

function kategoriClass(kategori){

```
const k =
String(kategori || "")
.toLowerCase();

if(k.includes("produk"))
    return "kategori-produk";

if(k.includes("marketing"))
    return "kategori-marketing";

if(k.includes("komplain"))
    return "kategori-komplain";

if(k.includes("follow"))
    return "kategori-followup";

return "";
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
const keyword =
document
.getElementById("searchInput")
.value
.trim()
.toLowerCase();

return allData.filter(item=>{

    const text =
    Object.values(item)
    .join(" ")
    .toLowerCase();

    if(
        keyword &&
        !text.includes(keyword)
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

    return true;

});
```

}

/* =========================
STATS
========================= */

function renderStats(){

```
document.getElementById(
    "stats"
).innerHTML =

`

<div class="stat-card">
    <h2>${allData.length}</h2>
    <p>Total Data</p>
</div>

<div class="stat-card">
    <h2>${unique("Kategori").length}</h2>
    <p>Kategori</p>
</div>

<div class="stat-card">
    <h2>${unique("Grup").length}</h2>
    <p>Grup</p>
</div>

<div class="stat-card">
    <h2>${unique("Platform").length}</h2>
    <p>Platform</p>
</div>

`;
```

}

/* =========================
CONTENT
========================= */

function renderContent(){

```
const content =
document.getElementById(
    "content"
);

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

if(currentView === "kategori"){

    const map = {};

    data.forEach(item=>{

        const key =
        item.Kategori || "-";

        map[key] =
        (map[key] || 0)+1;

    });

    content.innerHTML =

    `<div class="cards">`

    +

    Object.entries(map)
    .map(([k,v])=>

    `
    <div class="card">

        <div class="card-header">

            <div class="card-title">
                ${k}
            </div>

        </div>

        <div class="card-body"
             style="display:block">

            ${v} Item

        </div>

    </div>
    `

    ).join("")

    +

    `</div>`;

    return;

}

if(currentView === "grup"){

    const map = {};

    data.forEach(item=>{

        const key =
        item.Grup || "-";

        map[key] =
        (map[key] || 0)+1;

    });

    content.innerHTML =

    `<div class="cards">`

    +

    Object.entries(map)
    .map(([k,v])=>

    `
    <div class="card">

        <div class="card-header">

            <div class="card-title">
                ${k}
            </div>

        </div>

        <div class="card-body"
             style="display:block">

            ${v} Item

        </div>

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

data.map(item=>{

    const answers =

    ["Jawaban 1",
     "Jawaban 2",
     "Jawaban 3",
     "Jawaban 4"]

    .filter(x=>item[x]);

    return `

    <div class="card ${kategoriClass(item.Kategori)}">

        <div
        class="card-header"
        onclick="toggleCard(this)">

            <div class="card-title">

                ${item.Judul || "-"}

            </div>

            <div class="card-arrow">
                ▼
            </div>

        </div>

        <div class="card-body">

            <div class="badges">

                <span class="badge">
                    ${item.Kategori || "-"}
                </span>

                <span class="badge">
                    ${item.Grup || "-"}
                </span>

                <span class="badge">
                    ${item.Platform || "-"}
                </span>

            </div>

            <p>
                <b>Pertanyaan:</b>
            </p>

            <p>
                ${item["Pertanyaan"] || "-"}
            </p>

            ${answers.map(key=>`

            <hr>

            <p>
                <b>${key}</b>
            </p>

            <button
            class="copy-btn"
            onclick='copyText(${JSON.stringify(item[key])})'>

            📋 Copy

            </button>

            <p>
                ${item[key]}
            </p>

            `).join("")}

        </div>

    </div>

    `;

}).join("")

+

`</div>`;
```

}

/* =========================
CARD
========================= */

function toggleCard(el){

```
el.parentElement
.classList.toggle("active");
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
    searchInput.value = "";

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

/* =========================
INIT
========================= */

loadData();
