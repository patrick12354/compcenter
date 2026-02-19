const sheetCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ81H67Eq_L447mxzEO4fmfoyuzy4sqR6cnglIeQ7Jm6sWkElooSvHNlbroZRnNWzePl-iGCTFr1ymH/pub?output=csv'; 

let globalDataLomba = [];
let savedLombas = JSON.parse(localStorage.getItem('savedLombas')) || [];
let currentMode = 'all'; // 'all' atau 'saved'

Papa.parse(sheetCsvUrl, {
    download: true,
    header: true,
    complete: function(results) {
        let rawData = results.data.filter(l => l['Nama']); // Buang baris kosong
        
        // Proses Data: Hitung sisa hari & Sortir otomatis
        globalDataLomba = rawData.map(lomba => {
            const dateInfo = parseDeadline(lomba['Tanggal Pendaftaran (close)']);
            return { ...lomba, parsedDateInfo: dateInfo };
        });

        // Urutkan: Yang masih buka dan terdekat di atas, yang tutup/TBA di bawah
        globalDataLomba.sort((a, b) => a.parsedDateInfo.sortValue - b.parsedDateInfo.sortValue);

        populateFilter();
        renderLomba();
    }
});

// --- LOGIKA TANGGAL (Pendeteksi Waktu) ---
function parseDeadline(dateStr) {
    if (!dateStr || dateStr.toLowerCase().includes('tba')) return { status: 'TBA', sisaHari: null, sortValue: 999999 };
    
    // Ambil tanggal terakhir jika ada rentang (contoh "14 Des - 11 Feb" -> "11 Feb")
    let lastDateStr = dateStr.split(/[-–]/).pop().trim().toLowerCase();
    
    // Konversi bulan Indonesia ke angka (0-11)
    const months = { jan: 0, januari: 0, feb: 1, febuari: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3, mei: 4, jun: 5, juni: 5, jul: 6, juli: 6, agu: 7, agustus: 7, sep: 8, september: 8, okt: 9, oktober: 9, nov: 10, november: 10, des: 11, desember: 11 };
    
    // Cari angka (tanggal), teks (bulan), angka (tahun - opsional)
    const match = lastDateStr.match(/(\d+)\s+([a-z]+)(?:\s+(\d{4}))?/);
    if (!match) return { status: 'UNKNOWN', sisaHari: null, sortValue: 999999 };

    let tanggal = parseInt(match[1]);
    let bulanInfo = match[2];
    let tahun = match[3] ? parseInt(match[3]) : new Date().getFullYear(); // Default tahun ini jika tidak ditulis
    let bulanIndex = months[bulanInfo] !== undefined ? months[bulanInfo] : -1;

    if (bulanIndex === -1) return { status: 'UNKNOWN', sisaHari: null, sortValue: 999999 };

    let deadlineDate = new Date(tahun, bulanIndex, tanggal, 23, 59, 59);
    let hariIni = new Date();
    
    // Hitung selisih hari
    let diffTime = deadlineDate - hariIni;
    let sisaHari = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = 'BUKA';
    let sortValue = sisaHari;
    if (sisaHari < 0) { status = 'TUTUP'; sortValue = 1000000 + Math.abs(sisaHari); } // Lempar ke paling bawah
    else if (sisaHari <= 7) { status = 'SEGERA'; } // Sisa 1 minggu

    return { status, sisaHari, sortValue, originalDate: deadlineDate };
}

// --- LOGIKA FILTER & TAB ---
function populateFilter() {
    const filterDropdown = document.getElementById('filter-penyelenggara');
    const penyelenggaras = [...new Set(globalDataLomba.map(l => l['Penyelenggara']).filter(Boolean))];
    
    penyelenggaras.forEach(p => {
        const option = document.createElement('option');
        option.value = p.toLowerCase();
        option.textContent = p;
        filterDropdown.appendChild(option);
    });
}

document.getElementById('search-input').addEventListener('input', renderLomba);
document.getElementById('filter-penyelenggara').addEventListener('change', renderLomba);

document.getElementById('tab-all').addEventListener('click', (e) => {
    currentMode = 'all';
    document.getElementById('tab-all').classList.add('active');
    document.getElementById('tab-saved').classList.remove('active');
    renderLomba();
});

document.getElementById('tab-saved').addEventListener('click', (e) => {
    currentMode = 'saved';
    document.getElementById('tab-saved').classList.add('active');
    document.getElementById('tab-all').classList.remove('active');
    renderLomba();
});


// --- FUNGSI RENDER UTAMA ---
function renderLomba() {
    const container = document.getElementById('lomba-container');
    const kataKunci = document.getElementById('search-input').value.toLowerCase();
    const filterPenyelenggara = document.getElementById('filter-penyelenggara').value;

    let dataSaring = globalDataLomba.filter(lomba => {
        const namaMatch = (lomba['Nama'] || '').toLowerCase().includes(kataKunci);
        const penyelenggara = (lomba['Penyelenggara'] || '').toLowerCase();
        const pMatch = filterPenyelenggara === 'all' || penyelenggara === filterPenyelenggara;
        const savedMatch = currentMode === 'all' || savedLombas.includes(lomba['Nama']);
        
        return namaMatch && pMatch && savedMatch;
    });

    container.innerHTML = ''; 
    if (dataSaring.length === 0) {
        container.innerHTML = `<p style="text-align:center;grid-column:1/-1;color:var(--text-grey);padding:40px;">Tidak ada lomba ditemukan di kategori ini.</p>`;
        return;
    }

    dataSaring.forEach(lomba => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Badge Generator
        let badgeHtml = '';
        const dInfo = lomba.parsedDateInfo;
        if (dInfo.status === 'TUTUP') badgeHtml = `<div class="badge-status status-tutup">Ditutup</div>`;
        else if (dInfo.status === 'SEGERA') badgeHtml = `<div class="badge-status status-segera">Sisa ${dInfo.sisaHari} Hari!</div>`;
        else if (dInfo.status === 'BUKA') badgeHtml = `<div class="badge-status status-buka">Buka</div>`;

        // Bookmark Generator
        const isSaved = savedLombas.includes(lomba['Nama']);
        const bookmarkClass = isSaved ? 'bookmark-btn saved' : 'bookmark-btn';
        const bookmarkIcon = isSaved ? 'star' : 'star_border'; 

        // GANTI WARNA BACKGROUND DI SINI JADI #020617
        let posterThumbStr = `<div class="card-thumb-container" style="background: #020617">
            ${badgeHtml} <button class="${bookmarkClass}" onclick="toggleBookmark(event, '${lomba['Nama']}')"><span class="material-symbols-rounded">${bookmarkIcon}</span></button>
        </div>`;

        if (lomba['Link Poster']) {
            posterThumbStr = `
            <div class="card-thumb-container">
                ${badgeHtml}
                <button class="${bookmarkClass}" onclick="toggleBookmark(event, '${lomba['Nama']}')"><span class="material-symbols-rounded">${bookmarkIcon}</span></button>
                <img src="${lomba['Link Poster']}" class="card-thumb" alt="${lomba['Nama']}" onerror="this.parentElement.style.background='#020617';this.remove()">
            </div>`;
        }
        // ... (kode selanjutnya) ...
        // Kalau ditutup, beri efek redup pada kartu
        const opacityStyle = dInfo.status === 'TUTUP' ? 'opacity: 0.6;' : '';

        card.innerHTML = `
            <div style="${opacityStyle}">
                ${posterThumbStr}
                <div class="card-content">
                    <h3>${lomba['Nama']}</h3>
                    <div class="card-meta"><span class="material-symbols-outlined">corporate_fare</span> ${lomba['Penyelenggara'] || 'TBA'}</div>
                    <div class="card-meta"><span class="material-symbols-outlined">calendar_month</span> Pendaftaran: ${lomba['Tanggal Pendaftaran (close)'] || 'TBA'}</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => bukaModal(lomba));
        container.appendChild(card);
    });
}

// --- FITUR BOOKMARK ---
function toggleBookmark(event, namaLomba) {
    event.stopPropagation(); // Mencegah modal terbuka saat klik bintang
    
    if (savedLombas.includes(namaLomba)) {
        savedLombas = savedLombas.filter(n => n !== namaLomba); // Hapus
    } else {
        savedLombas.push(namaLomba); // Tambah
    }
    
    localStorage.setItem('savedLombas', JSON.stringify(savedLombas));
    renderLomba(); // Refresh tampilan
}

// --- LOGIKA MODAL & TOMBOL SHARE ---
const modalOverlay = document.getElementById('modalOverlay');
function bukaModal(lomba) {
    document.getElementById('modalTitle').innerText = lomba['Nama'];
    document.getElementById('modalOrganizer').innerText = lomba['Penyelenggara'] || '-';
    document.getElementById('modalDeadline').innerText = lomba['Tanggal Pendaftaran (close)'] || '-';
    document.getElementById('modalPenyisihan').innerText = lomba['Tanggal Penyisihan'] || '-';

    const posterElem = document.getElementById('modalPoster');
    if (lomba['Link Poster']) {
        posterElem.src = lomba['Link Poster'];
        posterElem.style.display = 'block';
        posterElem.parentElement.style.display = 'block'; 
    } else {
        posterElem.style.display = 'none';
        posterElem.parentElement.style.display = 'none';
    }

    const linksContainer = document.getElementById('modalLinks');
    linksContainer.innerHTML = ''; 

    // Tombol Utama (Pendaftaran & Guidebook)
    if (lomba['Link Regis']) linksContainer.innerHTML += `<a href="${lomba['Link Regis']}" target="_blank" class="link-btn btn-primary btn-full"><span class="material-symbols-outlined">how_to_reg</span>Daftar Sekarang</a>`;
    if (lomba['Link Guidebook']) linksContainer.innerHTML += `<a href="${lomba['Link Guidebook']}" target="_blank" class="link-btn btn-secondary"><span class="material-symbols-outlined">menu_book</span>Guidebook</a>`;
    if (lomba['Linktree']) linksContainer.innerHTML += `<a href="${lomba['Linktree']}" target="_blank" class="link-btn btn-secondary"><span class="material-symbols-outlined">link</span>Linktree</a>`;

    // Tombol Ekstra: Tambah ke Kalender
    const calendarTitle = encodeURIComponent(`Deadline Lomba: ${lomba['Nama']}`);
    const calendarDetails = encodeURIComponent(`Penyelenggara: ${lomba['Penyelenggara']}\nLink Regis: ${lomba['Link Regis'] || '-'}\nGuidebook: ${lomba['Link Guidebook'] || '-'}`);
    // Karena parsing tanggal pasti untuk GCal agak rumit (butuh format YYYYMMDD), kita arahkan ke halaman GCal hari ini dengan pre-filled text
    const gCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}`;
    
    linksContainer.innerHTML += `<a href="${gCalLink}" target="_blank" class="link-btn btn-action"><span class="material-symbols-outlined">event</span>Ke Kalender</a>`;

    // Tombol Ekstra: Bagikan
    const shareText = `Halo! Ada info lomba menarik nih:\n\n*${lomba['Nama']}*\n🏢 Penyelenggara: ${lomba['Penyelenggara']}\n📅 Deadline: ${lomba['Tanggal Pendaftaran (close)']}\n\nLink Pendaftaran: ${lomba['Link Regis'] || '-'}\nGuidebook: ${lomba['Link Guidebook'] || '-'}`;
    linksContainer.innerHTML += `<button onclick="copyToClipboard(\`${shareText}\`)" class="link-btn btn-action"><span class="material-symbols-outlined">share</span>Bagikan</button>`;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById("toast");
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    });
}

function tutupModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto'; 
}
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) tutupModal(); });