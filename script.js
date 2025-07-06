// ====================================================================================
// KONFIGURASI UMUM UNTUK FRONTEND
// ====================================================================================

// GANTI DENGAN URL GOOGLE APPS SCRIPT WEB APP ANDA YANG TERBARU
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby6LAQbLUI6vt1BATqJyU9IcYVoxGuo68lI6j9bqu8fG2iZpvs7slNd0_dULvpYrUQ/exec'; 

// ====================================================================================
// ELEMEN DOM
// ====================================================================================
const reportForm = document.getElementById('reportForm');
const salesItemsContainer = document.getElementById('salesItems');
const addSalesItemButton = document.getElementById('addSalesItem');
const loadingOverlay = document.getElementById('loadingOverlay');
const messageContainer = document.getElementById('messageContainer');
const storeSelect = document.getElementById('storeName');
const spmSelect = document.getElementById('spmName'); // Tambahkan elemen ini jika belum ada di HTML
const noSaleCheckbox = document.getElementById('isNoSale');
const salesItemsSection = document.getElementById('salesItemsSection');

let salesItemCount = 0; // Untuk melacak jumlah item penjualan yang ditambahkan

// ====================================================================================
// FUNGSI UTILITY
// ====================================================================================

// Fungsi untuk menampilkan pesan kepada pengguna
function displayMessage(message, type) {
    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`; // 'success' atau 'error'
    messageContainer.style.display = 'block';
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000); // Pesan akan hilang setelah 5 detik
}

// Fungsi untuk menampilkan/menyembunyikan overlay loading
function toggleLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Fungsi untuk mengisi dropdown Toko dan SPM
function populateStoreSpmSelect(data) {
    storeSelect.innerHTML = '<option value="">Pilih Toko</option>';
    spmSelect.innerHTML = '<option value="">Pilih SPM</option>';

    const stores = new Set();
    const spms = new Set();

    data.forEach(item => {
        if (item.storeName) stores.add(item.storeName);
        if (item.spmName) spms.add(item.spmName);
    });

    Array.from(stores).sort().forEach(store => {
        const option = document.createElement('option');
        option.value = store;
        option.textContent = store;
        storeSelect.appendChild(option);
    });

    Array.from(spms).sort().forEach(spm => {
        const option = document.createElement('option');
        option.value = spm;
        option.textContent = spm;
        spmSelect.appendChild(option);
    });
}

// Fungsi untuk mengisi dropdown Produk dan Kategori
function populateProductCategorySelect(data) {
    // Kumpulkan kategori unik untuk dropdown Category
    const categories = new Set();
    data.forEach(item => {
        if (item.category) categories.add(item.category);
    });

    // Buat objek untuk menyimpan model berdasarkan kategori
    // { "Category A": ["Model X", "Model Y"], "Category B": ["Model Z"] }
    const modelsByCategory = {};
    data.forEach(item => {
        if (item.category && item.kataban) {
            if (!modelsByCategory[item.category]) {
                modelsByCategory[item.category] = [];
            }
            modelsByCategory[item.category].push(item.kataban);
        }
    });

    // Simpan data di window atau sebagai variabel global yang bisa diakses oleh addSalesItem
    window.productCategoryData = {
        categories: Array.from(categories).sort(),
        modelsByCategory: modelsByCategory
    };

    // Saat ini, kita hanya akan mempopulasikan dropdown pada saat item penjualan ditambahkan
    // Sehingga setiap baris item penjualan memiliki dropdown yang dinamis
}

// ====================================================================================
// FUNGSI UTAMA (FETCH DATA & SUBMIT)
// ====================================================================================

// Fetch data toko dan SPM dari Google Apps Script
async function fetchStoreSpmData() {
    toggleLoading(true);
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStoreSpmData`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // BACA RESPON SEBAGAI TEKS (BUKAN JSON LANGSUNG)
        const htmlText = await response.text(); 
        // PARSE TEKS HTML YANG SEBENARNYA HANYA JSON
        const data = JSON.parse(htmlText); 

        if (data.success) {
            populateStoreSpmSelect(data.data);
        } else {
            console.error('Failed to fetch store/SPM data:', data.message);
            displayMessage('Gagal memuat data toko/SPM: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Fetch error for store/SPM data:', error);
        displayMessage('Gagal memuat data toko/SPM. Periksa koneksi atau URL Apps Script.', 'error');
    } finally {
        toggleLoading(false);
    }
}

// Fetch data produk dan kategori dari Google Apps Script
async function fetchProdukKategoriData() {
    toggleLoading(true);
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getProdukKategoriData`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // BACA RESPON SEBAGAI TEKS (BUKAN JSON LANGSUNG)
        const htmlText = await response.text();
        // PARSE TEKS HTML YANG SEBENARNYA HANYA JSON
        const data = JSON.parse(htmlText); 

        if (data.success) {
            populateProductCategorySelect(data.data);
        } else {
            console.error('Failed to fetch product/category data:', data.message);
            displayMessage('Gagal memuat data produk/kategori: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Fetch error for product/category data:', error);
        displayMessage('Gagal memuat data produk/kategori. Periksa koneksi atau URL Apps Script.', 'error');
    } finally {
        toggleLoading(false);
    }
}

// Fungsi untuk menambahkan baris item penjualan
function addSalesItem() {
    salesItemCount++;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'sales-item';
    itemDiv.dataset.id = salesItemCount;

    const categories = window.productCategoryData ? window.productCategoryData.categories : [];
    const modelsByCategory = window.productCategoryData ? window.productCategoryData.modelsByCategory : {};

    const categoryOptions = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    itemDiv.innerHTML = `
        <label for="category${salesItemCount}">Kategori:</label>
        <select id="category${salesItemCount}" name="category" required>
            <option value="">Pilih Kategori</option>
            ${categoryOptions}
        </select>

        <label for="model${salesItemCount}">Kataban:</label>
        <select id="model${salesItemCount}" name="model" required>
            <option value="">Pilih Kataban</option>
        </select>
        
        <label for="qty${salesItemCount}">Qty:</label>
        <input type="number" id="qty${salesItemCount}" name="qty" min="1" value="1" required>
        
        <button type="button" class="remove-item-btn">Hapus</button>
    `;

    salesItemsContainer.appendChild(itemDiv);

    // Event listener untuk tombol hapus
    itemDiv.querySelector('.remove-item-btn').addEventListener('click', () => {
        itemDiv.remove();
        // Cek jika tidak ada item penjualan tersisa, tambahkan satu baris kosong
        if (salesItemsContainer.children.length === 0 && !noSaleCheckbox.checked) {
            addSalesItem();
        }
    });

    // Event listener untuk perubahan kategori
    const categorySelect = itemDiv.querySelector(`#category${salesItemCount}`);
    const modelSelect = itemDiv.querySelector(`#model${salesItemCount}`);

    categorySelect.addEventListener('change', () => {
        const selectedCategory = categorySelect.value;
        modelSelect.innerHTML = '<option value="">Pilih Kataban</option>'; // Reset model dropdown

        if (selectedCategory && modelsByCategory[selectedCategory]) {
            modelsByCategory[selectedCategory].sort().forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        }
    });

    // Panggil change event secara manual jika ada kategori terpilih (misal saat load ulang form dengan data sebelumnya)
    if (categorySelect.value) {
        categorySelect.dispatchEvent(new Event('change'));
    }
}

// Fungsi untuk menangani pengiriman formulir
async function handleSubmit(event) {
    event.preventDefault(); // Mencegah form dari reload halaman
    toggleLoading(true);
    displayMessage('', ''); // Kosongkan pesan sebelumnya

    const reportDate = document.getElementById('reportDate').value;
    const storeName = document.getElementById('storeName').value;
    const spmName = document.getElementById('spmName').value;
    const isNoSale = document.getElementById('isNoSale').checked;
    const notes = document.getElementById('notes').value;

    let salesItems = [];

    if (!isNoSale) {
        const itemDivs = salesItemsContainer.querySelectorAll('.sales-item');
        itemDivs.forEach(itemDiv => {
            const category = itemDiv.querySelector('[name="category"]').value;
            const model = itemDiv.querySelector('[name="model"]').value;
            const qty = itemDiv.querySelector('[name="qty"]').value;

            if (category && model && qty) { // Hanya tambahkan jika semua field terisi
                salesItems.push({
                    category: category,
                    model: model,
                    qty: parseInt(qty)
                });
            }
        });

        if (salesItems.length === 0) {
            displayMessage('Harap tambahkan setidaknya satu item penjualan atau centang "Tidak ada Penjualan".', 'error');
            toggleLoading(false);
            return;
        }
    }

    const formData = {
        reportDate: reportDate,
        storeName: storeName,
        spmName: spmName,
        isNoSale: isNoSale,
        notes: notes
    };

    if (!isNoSale) {
        formData.salesItems = salesItems;
    }

    try {
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // BACA RESPON SEBAGAI TEKS (BUKAN JSON LANGSUNG)
        const htmlText = await response.text();
        // PARSE TEKS HTML YANG SEBENARNYA HANYA JSON
        const result = JSON.parse(htmlText); 

        if (result.success) {
            displayMessage('Laporan berhasil disimpan!', 'success');
            // Reset form dan item penjualan setelah sukses
            salesItemsContainer.innerHTML = ''; 
            salesItemCount = 0; 
            addSalesItem(); 
            reportForm.reset(); 
            // Pastikan checkbox "Tidak ada Penjualan" di-reset dan section penjualan terlihat
            noSaleCheckbox.checked = false;
            salesItemsSection.style.display = 'block';

            // Opsional: Reload data dropdown jika ada perubahan (misal, jika ada penambahan toko/SPM)
            // fetchStoreSpmData(); 
            // fetchProdukKategoriData();
        } else {
            displayMessage(`Gagal menyimpan laporan: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        displayMessage('Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.', 'error');
    } finally {
        toggleLoading(false); 
    }
}

// ====================================================================================
// EVENT LISTENERS
// ====================================================================================

// Listener untuk tombol "Tambah Item Penjualan"
addSalesItemButton.addEventListener('click', addSalesItem);

// Listener untuk submit formulir
reportForm.addEventListener('submit', handleSubmit);

// Listener untuk checkbox "Tidak ada Penjualan"
noSaleCheckbox.addEventListener('change', () => {
    if (noSaleCheckbox.checked) {
        salesItemsSection.style.display = 'none'; // Sembunyikan bagian item penjualan
        salesItemsContainer.innerHTML = ''; // Kosongkan item yang ada
        salesItemCount = 0; // Reset counter
    } else {
        salesItemsSection.style.display = 'block'; // Tampilkan kembali
        if (salesItemsContainer.children.length === 0) { // Jika kosong, tambahkan satu baris
            addSalesItem();
        }
    }
});


// ====================================================================================
// INISIALISASI
// ====================================================================================

// Panggil fungsi untuk mengambil data saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Set tanggal laporan ke tanggal hari ini secara default
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('reportDate').value = `${yyyy}-${mm}-${dd}`;

    fetchStoreSpmData();
    fetchProdukKategoriData();
    addSalesItem(); // Tambahkan satu baris item penjualan kosong secara default
});
