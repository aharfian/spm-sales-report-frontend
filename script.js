document.addEventListener('DOMContentLoaded', function() {
    // Materialize CSS Initializations
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
        format: 'yyyy-mm-dd',
        autoClose: true,
    });
    M.textareaAutoResize(document.getElementById('notes'));

    // ====================================================================================
    // KONFIGURASI FRONTEND
    // ====================================================================================
    // GANTI INI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA!
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzMrewsGvQA0EhcNteulqE51QgCJiATYsA5Vftxqng7GBdtrLeto0OTxjsDrrBDJSw/exec'; 

    const salesReportForm = document.getElementById('salesReportForm');
    const salesItemsContainer = document.getElementById('salesItemsContainer'); 
    const noSaleCheckbox = document.getElementById('noSaleCheckbox');
    const salesDetailSection = document.getElementById('salesDetailSection');
    const addSalesItemBtn = document.getElementById('addSalesItemBtn');
    const responseMessageDiv = document.getElementById('responseMessage');
    const submitReportBtn = document.getElementById('submitReportBtn'); 
    const successMessageSection = document.getElementById('successMessageSection'); 
    const submitNewReportBtn = document.getElementById('submitNewReportBtn'); 

    // ====================================================================================
    // VAR GLOBAL UNTUK DATA MASTER (DARI GOOGLE APPS SCRIPT)
    // ====================================================================================
    let storeSpmData = []; // Akan diisi dari Google Apps Script (untuk Toko & SPM)
    let productCategoryData = []; // BARU: Akan diisi dari Google Apps Script (untuk Kategori & Kataban)
    let categoryToKatabanMap = {}; // BARU: Akan dibuat dari productCategoryData untuk memudahkan lookup

    // ====================================================================================
    // FUNGSI UNTUK MENGAMBIL DATA TOKO/SPM DARI APPS SCRIPT
    // ====================================================================================
    async function fetchStoreSpmData() {
        try {
            const response = await fetch(WEB_APP_URL + '?action=getStoreSpmData'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                storeSpmData = data.data;
                populateStoreDropdown();
            } else {
                M.toast({html: `Gagal memuat data toko/SPM: ${data.message}`, classes: 'red'});
                console.error("Error fetching store/SPM data:", data.message);
            }
        } catch (error) {
            M.toast({html: `Kesalahan koneksi saat memuat data toko/SPM: ${error.message}`, classes: 'red'});
            console.error("Fetch error for store/SPM data:", error);
        }
    }

    // ====================================================================================
    // FUNGSI BARU: UNTUK MENGAMBIL DATA PRODUK/KATEGORI DARI APPS SCRIPT
    // ====================================================================================
    async function fetchProdukKategoriData() {
        try {
            const response = await fetch(WEB_APP_URL + '?action=getProdukKategoriData'); // Menambahkan parameter 'action'
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                productCategoryData = data.data;
                // Buat categoryToKatabanMap dari data yang diambil
                categoryToKatabanMap = productCategoryData.reduce((acc, item) => {
                    if (!acc[item.category]) {
                        acc[item.category] = [];
                    }
                    acc[item.category].push(item.kataban);
                    return acc;
                }, {});
                // Setelah data produk dimuat, tambahkan baris penjualan awal jika diperlukan
                if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) { 
                    addSalesItemRow();
                }
            } else {
                M.toast({html: `Gagal memuat data produk/kategori: ${data.message}`, classes: 'red'});
                console.error("Error fetching product/category data:", data.message);
            }
        } catch (error) {
            M.toast({html: `Kesalahan koneksi saat memuat data produk/kategori: ${error.message}`, classes: 'red'});
            console.error("Fetch error for product/category data:", error);
        }
    }

    // ====================================================================================
    // FUNGSI UNTUK MENGISI DROPDOWN TOKO
    // ====================================================================================
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

    // ====================================================================================
    // FUNGSI UNTUK MENGISI DROPDOWN SPM BERDASARKAN TOKO TERPILIH
    // ====================================================================================
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

    // ====================================================================================
    // EVENT LISTENER UNTUK DROPDOWN TOKO
    // ====================================================================================
    document.getElementById('storeName').addEventListener('change', function() {
        populateSpmDropdown(this.value);
    });

    // ====================================================================================
    // FUNGSI addSalesItemRow - MENGGUNAKAN DATA PRODUK DARI APPS SCRIPT
    // ====================================================================================
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
                            ${Object.keys(categoryToKatabanMap).map(category => `<option value="${category}">${category}</option>`).join('')}
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
                // Pastikan kataban unik jika ada duplikasi di sheet
                const uniqueKatabans = [...new Set(categoryToKatabanMap[selectedCategory])];
                uniqueKatabans.forEach(model => {
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

    // ====================================================================================
    // LOGIKA INITIALIZATION, ADD ITEM, NO SALE (UPDATE PANGGILAN FUNGSI FETCH)
    // ====================================================================================

    // Panggil fungsi untuk mengambil data toko/SPM DAN data produk/kategori saat DOMContentLoaded
    fetchStoreSpmData(); 
    fetchProdukKategoriData(); // PANGGILAN FUNGSI BARU!

    // Baris awal item penjualan akan ditambahkan setelah fetchProdukKategoriData() selesai
    // Ini untuk memastikan dropdown kategori sudah terisi.
    // if (!noSaleCheckbox.checked) {
    //     addSalesItemRow(); // Ini dipindahkan ke dalam fetchProdukKategoriData()
    // }

    addSalesItemBtn.addEventListener('click', addSalesItemRow);

    noSaleCheckbox.addEventListener('change', function() {
        if (this.checked) {
            salesDetailSection.style.display = 'none';
            salesItemsContainer.innerHTML = ''; 
        } else {
            salesDetailSection.style.display = 'block';
            if (salesItemsContainer.children.length === 0) { 
                addSalesItemRow();
            }
        }
    });

    // ====================================================================================
    // FORM SUBMISSION LISTENER - MENGIRIM DATA KE APPS SCRIPT
    // ====================================================================================
    salesReportForm.addEventListener('submit', async function(e) { 
        e.preventDefault(); 

        responseMessageDiv.innerHTML = ''; 
        responseMessageDiv.classList.remove('green-text', 'red-text', 'blue-text');

        submitReportBtn.disabled = true; 
        submitReportBtn.innerHTML = 'Mengirim... <i class="material-icons right">send</i>'; 
        submitReportBtn.classList.add('pulse'); 
        responseMessageDiv.textContent = 'Laporan Anda sedang dikirim...';
        responseMessageDiv.classList.add('blue-text');

        const reportDate = document.getElementById('reportDate').value;
        const storeName = document.getElementById('storeName').value;
        const spmName = document.getElementById('spmName').value;
        const notes = document.getElementById('notes').value;
        const isNoSale = noSaleCheckbox.checked;

        if (!reportDate || !storeName || !spmName) {
            M.toast({html: 'Mohon lengkapi Tanggal Laporan, Nama Toko, dan Nama SPM.', classes: 'red'});
            resetSubmitButton(); 
            responseMessageDiv.innerHTML = '';
            return;
        }

        let salesItems = [];
        if (!isNoSale) {
            const itemCards = salesItemsContainer.querySelectorAll('.sales-item-card'); 
            if (itemCards.length === 0) {
                M.toast({html: 'Mohon tambahkan setidaknya satu item penjualan atau centang "Laporan No Sale".', classes: 'red'});
                resetSubmitButton(); 
                responseMessageDiv.innerHTML = '';
                return;
            }
            try {
                itemCards.forEach(card => {
                    const category = card.querySelector('.category-select').value;
                    const model = card.querySelector('.kataban-select').value;
                    const qty = card.querySelector('.qty-input').value;

                    if (!category || !model || !qty || parseInt(qty) <= 0) {
                        M.toast({html: 'Mohon lengkapi semua detail item penjualan (Kategori, Model, Qty > 0).', classes: 'red'});
                        resetSubmitButton(); 
                        responseMessageDiv.innerHTML = '';
                        throw new Error('Incomplete sales item data'); 
                    }
                    salesItems.push({
                        category: category,
                        model: model, 
                        qty: parseInt(qty)
                    });
                });
            } catch (error) {
                console.error("Validation error:", error.message);
                return; 
            }
        }

        const reportData = {
            reportDate: reportDate,
            storeName: storeName,
            spmName: spmName,
            isNoSale: isNoSale,
            salesItems: salesItems,
            notes: notes
        };

        console.log("Data siap dikirim:", reportData); 

        try {
            const response = await fetch(WEB_APP_URL, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
                redirect: 'follow' 
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                M.toast({html: 'Laporan berhasil disimpan!', classes: 'green'});
                responseMessageDiv.innerHTML = ''; 
                
                salesReportForm.classList.add('hidden');
                successMessageSection.classList.remove('hidden');

                salesReportForm.reset();
                M.FormSelect.init(document.querySelectorAll('select')); 
                M.Datepicker.getInstance(document.getElementById('reportDate')).setDate(null); 
                salesItemsContainer.innerHTML = ''; 
                noSaleCheckbox.checked = false; 
                salesDetailSection.style.display = 'block'; 
                // addSalesItemRow(); // Ini akan dipanggil setelah fetchProdukKategoriData() di resetSubmitNewReport()

                populateStoreDropdown(); 
                populateSpmDropdown(''); 
                document.getElementById('spmName').setAttribute('disabled', 'disabled'); 

            } else {
                M.toast({html: `Gagal menyimpan laporan: ${result.message}`, classes: 'red'});
                responseMessageDiv.textContent = `Gagal: ${result.message}`;
                responseMessageDiv.classList.add('red-text');
            }
        } catch (error) {
            M.toast({html: `Kesalahan pengiriman laporan: ${error.message}`, classes: 'red'});
            responseMessageDiv.textContent = `Kesalahan: ${error.message}. Cek koneksi atau konsol browser.`;
            responseMessageDiv.classList.add('red-text');
            console.error("Fetch error during form submission:", error);
        } finally {
            resetSubmitButton(); 
        }
    });

    // ====================================================================================
    // LOGIKA UNTUK TOMBOL "Kirim Laporan Baru" & RESET TOMBOL SUBMIT
    // ====================================================================================
    submitNewReportBtn.addEventListener('click', function() {
        successMessageSection.classList.add('hidden'); 
        salesReportForm.classList.remove('hidden'); 
        responseMessageDiv.innerHTML = ''; 
        responseMessageDiv.classList.remove('green-text', 'red-text', 'blue-text');
        
        // Panggil addSalesItemRow() lagi setelah form di-reset dan data produk sudah dimuat
        if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
            addSalesItemRow();
        }
    });

    function resetSubmitButton() {
        submitReportBtn.disabled = false;
        submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
        submitReportBtn.classList.remove('pulse');
    }
});
