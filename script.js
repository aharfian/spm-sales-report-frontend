// script.js

// 🔁 Loading fallback jika terlalu lama (mis. server idle)
const delayNotice = document.getElementById('delayNotice');
const loadingTimeout = setTimeout(() => {
    if (delayNotice) {
        delayNotice.classList.remove('hidden');
    }
}, 5000); // 5 detik

document.addEventListener('DOMContentLoaded', function() {
    // Materialize CSS Initializations
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
        format: 'yyyy-mm-dd',
        autoClose: true,
    });
    M.textareaAutoResize(document.getElementById('notes'));

    const WEB_APP_URL = 'https://spm-middleware.onrender.com/proxy';

    const salesReportForm = document.getElementById('salesReportForm');
    const salesItemsContainer = document.getElementById('salesItemsContainer'); 
    const noSaleCheckbox = document.getElementById('noSaleCheckbox');
    const salesDetailSection = document.getElementById('salesDetailSection');
    const addSalesItemBtn = document.getElementById('addSalesItemBtn');
    const responseMessageDiv = document.getElementById('responseMessage');
    const submitReportBtn = document.getElementById('submitReportBtn'); 
    const successMessageSection = document.getElementById('successMessageSection'); 
    const submitNewReportBtn = document.getElementById('submitNewReportBtn'); 

    let storeSpmData = [];
    let productCategoryData = [];
    let categoryToKatabanMap = {};

    async function fetchStoreSpmData() {
        try {
            const response = await fetch(WEB_APP_URL + '?action=getStoreSpmData'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                storeSpmData = data.data;
                populateStoreDropdown();
            } else {
                M.toast({html: `Gagal memuat data toko/SPM: ${data.message}`, classes: 'red'});
            }
        } catch (error) {
            M.toast({html: `Kesalahan koneksi: ${error.message}`, classes: 'red'});
        }
    }

    async function fetchProdukKategoriData() {
        try {
            const response = await fetch(WEB_APP_URL + '?action=getProdukKategoriData');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                productCategoryData = data.data;
                categoryToKatabanMap = productCategoryData.reduce((acc, item) => {
                    if (!acc[item.category]) acc[item.category] = [];
                    acc[item.category].push(item.kataban);
                    return acc;
                }, {});
                if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
                    addSalesItemRow();
                }

                // ✅ Setelah berhasil load, hilangkan loading
                document.getElementById('loadingSection').style.display = 'none';
                salesReportForm.classList.remove('hidden');
                clearTimeout(loadingTimeout);

            } else {
                M.toast({html: `Gagal memuat data produk/kategori: ${data.message}`, classes: 'red'});
            }
        } catch (error) {
            M.toast({html: `Kesalahan koneksi: ${error.message}`, classes: 'red'});
        }
    }

    function populateStoreDropdown() {
        const storeSelect = document.getElementById('storeName');
        storeSelect.innerHTML = '<option value="" disabled selected>Pilih Toko</option>'; 
        const uniqueStores = [...new Set(storeSpmData.map(item => item.storeName))];
        uniqueStores.forEach(store => {
            const option = document.createElement('option');
            option.value = store;
            option.textContent = store;
            storeSelect.appendChild(option);
        });
        M.FormSelect.init(storeSelect); 
    }

    function populateSpmDropdown(selectedStore) {
        const spmSelect = document.getElementById('spmName');
        spmSelect.innerHTML = '<option value="" disabled selected>Pilih Nama SPM</option>'; 
        if (selectedStore) {
            const filteredSpms = storeSpmData.filter(item => item.storeName === selectedStore);
            const uniqueSpms = [...new Set(filteredSpms.map(item => item.spmName))]; 
            uniqueSpms.forEach(spm => {
                const option = document.createElement('option');
                option.value = spm;
                option.textContent = spm;
                spmSelect.appendChild(option);
            });
            spmSelect.removeAttribute('disabled'); 
        } else {
            spmSelect.setAttribute('disabled', 'disabled'); 
        }
        M.FormSelect.init(spmSelect); 
    }

    document.getElementById('storeName').addEventListener('change', function() {
        populateSpmDropdown(this.value);
    });

    function addSalesItemRow() {
        const itemCard = document.createElement('div');
        itemCard.classList.add('sales-item-card', 'card', 'mb-3'); 
        itemCard.innerHTML = `
            <div class="card-content">
                <span class="card-title" style="font-size: 1.2rem; margin-bottom: 15px;">Item Penjualan Baru</span>
                <div class="row">
                    <div class="input-field col s12">
                        <select class="category-select">
                            <option value="" disabled selected>Pilih Kategori</option>
                            ${Object.keys(categoryToKatabanMap).map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                        <label>Kategori</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <select class="kataban-select" disabled>
                            <option value="" disabled selected>Pilih Model</option>
                        </select>
                        <label>Kataban (Model)</label>
                    </div>
                </div>
                <div class="row">
                    <div class="input-field col s12">
                        <input type="number" class="qty-input" min="1" value="1">
                        <label>Qty</label>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col s12 right-align">
                        <button type="button" class="btn waves-effect waves-light red remove-item-btn">
                            Hapus Item
                            <i class="material-icons right">delete</i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        salesItemsContainer.appendChild(itemCard); 
        M.FormSelect.init(itemCard.querySelectorAll('select'));
        M.updateTextFields(); 

        itemCard.querySelector('.category-select').addEventListener('change', function() {
            const selectedCategory = this.value;
            const katabanSelect = itemCard.querySelector('.kataban-select');
            katabanSelect.innerHTML = '<option value="" disabled selected>Pilih Model</option>';
            if (selectedCategory && categoryToKatabanMap[selectedCategory]) {
                [...new Set(categoryToKatabanMap[selectedCategory])].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    katabanSelect.appendChild(option);
                });
                katabanSelect.removeAttribute('disabled'); 
            } else {
                katabanSelect.setAttribute('disabled', 'disabled'); 
            }
            M.FormSelect.init(katabanSelect);
        });

        itemCard.querySelector('.remove-item-btn').addEventListener('click', function() {
            itemCard.remove();
        });
    }

    addSalesItemBtn.addEventListener('click', addSalesItemRow);

    noSaleCheckbox.addEventListener('change', function() {
        if (this.checked) {
            salesDetailSection.style.display = 'none';
            salesItemsContainer.innerHTML = ''; 
        } else {
            salesDetailSection.style.display = 'block';
            if (salesItemsContainer.children.length === 0) addSalesItemRow();
        }
    });

    submitNewReportBtn.addEventListener('click', function() {
        successMessageSection.classList.add('hidden'); 
        salesReportForm.classList.remove('hidden'); 
        responseMessageDiv.innerHTML = ''; 
        responseMessageDiv.classList.remove('green-text', 'red-text', 'blue-text');
        if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
            addSalesItemRow();
        }
    });

    function resetSubmitButton() {
        submitReportBtn.disabled = false;
        submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
        submitReportBtn.classList.remove('pulse');
    }

    // Start loading + sembunyikan form
    document.getElementById('loadingSection').style.display = 'block';
    salesReportForm.classList.add('hidden');
    fetchStoreSpmData(); 
    fetchProdukKategoriData();
});
