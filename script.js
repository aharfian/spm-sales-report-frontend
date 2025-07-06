document.addEventListener('DOMContentLoaded', function() {
    // Materialize CSS Initializations
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
        format: 'yyyy-mm-dd',
        autoClose: true,
    });
    M.textareaAutoResize(document.getElementById('notes'));

    const salesReportForm = document.getElementById('salesReportForm');
    // GANTI: salesItemsTableBody menjadi salesItemsContainer
    const salesItemsContainer = document.getElementById('salesItemsContainer'); 
    const noSaleCheckbox = document.getElementById('noSaleCheckbox');
    const salesDetailSection = document.getElementById('salesDetailSection');
    const addSalesItemBtn = document.getElementById('addSalesItemBtn');
    const responseMessageDiv = document.getElementById('responseMessage');
    const submitReportBtn = document.getElementById('submitReportBtn'); // Tombol submit
    const successMessageSection = document.getElementById('successMessageSection'); // Bagian pesan sukses
    const submitNewReportBtn = document.getElementById('submitNewReportBtn'); // Tombol Kirim Laporan Baru

    // --- DUMMY DATA UNTUK DEMONSTRASI FRONTEND DINAMIS ---
    const categoryToKatabanMap = {
        "Handphone": ["iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra", "Xiaomi 14", "Oppo Find X7"],
        "Aksesoris": ["Earphone Bluetooth", "Power Bank 10000mAh", "Case HP", "Charger Fast Charging"],
        "Laptop": ["MacBook Air M3", "Dell XPS 15", "HP Spectre x360"],
        "Smartwatch": ["Apple Watch Series 9", "Samsung Galaxy Watch 6", "Huawei Watch GT 4"]
    };
    // --- AKHIR DUMMY DATA ---

    // Function to add a new sales item row (DIUBAH TOTAL UNTUK LAYOUT DIV)
    function addSalesItemRow() {
        const itemCard = document.createElement('div');
        itemCard.classList.add('sales-item-card', 'card', 'mb-3'); // Tambahkan kelas card untuk styling seperti kartu
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
        salesItemsContainer.appendChild(itemCard); // Append ke container baru

        // Re-initialize Materialize selects for the new item card
        M.FormSelect.init(itemCard.querySelectorAll('select'));
        M.updateTextFields(); // Perbarui tampilan input fields

        // Add event listener for category select change
        itemCard.querySelector('.category-select').addEventListener('change', function() {
            const selectedCategory = this.value;
            const katabanSelect = itemCard.querySelector('.kataban-select');
            
            // Clear existing options
            katabanSelect.innerHTML = '<option value="" disabled selected>Pilih Model</option>';
            
            if (selectedCategory && categoryToKatabanMap[selectedCategory]) {
                categoryToKatabanMap[selectedCategory].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    katabanSelect.appendChild(option);
                });
                katabanSelect.removeAttribute('disabled'); // Enable kataban select
            } else {
                katabanSelect.setAttribute('disabled', 'disabled'); // Disable if no category selected
            }
            // Re-initialize Materialize select after updating options
            M.FormSelect.init(katabanSelect);
        });

        // Add event listener for remove button
        itemCard.querySelector('.remove-item-btn').addEventListener('click', function() {
            itemCard.remove();
        });
    }

    // Initial row for sales items if not "No Sale"
    if (!noSaleCheckbox.checked) {
        addSalesItemRow();
    }

    // Add Sales Item Button Listener
    addSalesItemBtn.addEventListener('click', addSalesItemRow);

    // No Sale Checkbox Listener
    noSaleCheckbox.addEventListener('change', function() {
        if (this.checked) {
            salesDetailSection.style.display = 'none';
            // Clear existing rows if no sale is checked
            salesItemsContainer.innerHTML = ''; // Ganti ke salesItemsContainer
        } else {
            salesDetailSection.style.display = 'block';
            // Add one default row if re-enabled and no rows exist
            if (salesItemsContainer.children.length === 0) { // Ganti ke salesItemsContainer
                addSalesItemRow();
            }
        }
    });

    // Form Submission Listener
    salesReportForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        responseMessageDiv.innerHTML = ''; // Clear previous messages
        responseMessageDiv.classList.remove('green-text', 'red-text');

        // --- MENCEGAH DOUBLE SUBMISSION & TAMPILKAN LOADING ---
        submitReportBtn.disabled = true; // Nonaktifkan tombol
        submitReportBtn.innerHTML = 'Memproses... <i class="material-icons right">sync</i>'; // Ubah teks tombol
        submitReportBtn.classList.add('pulse'); // Tambahkan animasi (dari style.css)
        responseMessageDiv.textContent = 'Laporan Anda sedang diproses (simulasi)...';
        responseMessageDiv.classList.add('blue-text');
        // --- AKHIR PENCEGAHAN DOUBLE SUBMISSION ---

        const reportDate = document.getElementById('reportDate').value;
        const storeName = document.getElementById('storeName').value;
        const spmName = document.getElementById('spmName').value;
        const notes = document.getElementById('notes').value;
        const isNoSale = noSaleCheckbox.checked;

        if (!reportDate || !storeName || !spmName) {
            M.toast({html: 'Mohon lengkapi Tanggal Laporan, Nama Toko, dan Nama SPM.', classes: 'red'});
            resetSubmitButton(); // Aktifkan kembali tombol jika ada validasi error
            responseMessageDiv.innerHTML = '';
            return;
        }

        let salesItems = [];
        if (!isNoSale) {
            // GANTI: rows dari tr menjadi sales-item-card div
            const itemCards = salesItemsContainer.querySelectorAll('.sales-item-card'); 
            if (itemCards.length === 0) {
                M.toast({html: 'Mohon tambahkan setidaknya satu item penjualan atau centang "Laporan No Sale".', classes: 'red'});
                resetSubmitButton(); // Aktifkan kembali tombol jika ada validasi error
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
                        resetSubmitButton(); // Aktifkan kembali tombol jika ada validasi error
                        responseMessageDiv.innerHTML = '';
                        throw new Error('Incomplete sales item data'); // Hentikan pemrosesan
                    }
                    salesItems.push({
                        category: category,
                        model: model,
                        qty: parseInt(qty)
                    });
                });
            } catch (error) {
                console.error("Validation error:", error.message);
                return; // Stop execution if validation fails
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

        console.log("Data siap dikirim (simulasi):", reportData);

        // --- SIMULASI PENGIRIMAN DATA (GANTI DENGAN FETCH/AJAX KE BACKEND BARU NANTI) ---
        setTimeout(() => {
            M.toast({html: 'Laporan berhasil disimpan (simulasi)!', classes: 'green'});
            responseMessageDiv.innerHTML = ''; // Hapus pesan proses
            
            // Sembunyikan form dan tampilkan pesan sukses
            salesReportForm.classList.add('hidden');
            successMessageSection.classList.remove('hidden');

            // Reset form untuk penggunaan selanjutnya
            salesReportForm.reset();
            M.FormSelect.init(document.querySelectorAll('select')); // Re-init selects
            M.Datepicker.getInstance(document.getElementById('reportDate')).setDate(null); // Clear datepicker
            salesItemsContainer.innerHTML = ''; // Ganti ke salesItemsContainer
            noSaleCheckbox.checked = false; // Uncheck no sale
            salesDetailSection.style.display = 'block'; // Ensure sales section is visible
            addSalesItemRow(); // Add one initial row

            resetSubmitButton(); // Kembalikan tombol submit ke keadaan semula
        }, 1500); // Simulasi delay 1.5 detik
        // --- AKHIR SIMULASI ---

        // Di sini nanti Anda akan mengganti bagian setTimeout ini dengan panggilan AJAX (fetch API atau Axios)
        // ke endpoint backend perantara Anda yang baru. Pastikan untuk memanggil resetSubmitButton()
        // dan mengelola visibility salesReportForm/successMessageSection baik dalam .then() maupun .catch().
    });

    // Listener untuk tombol "Kirim Laporan Baru"
    submitNewReportBtn.addEventListener('click', function() {
        successMessageSection.classList.add('hidden'); // Sembunyikan pesan sukses
        salesReportForm.classList.remove('hidden'); // Tampilkan form kembali
        responseMessageDiv.innerHTML = ''; // Hapus pesan apa pun
        responseMessageDiv.classList.remove('green-text', 'red-text', 'blue-text');
        // Form sudah di-reset dari logic submit sebelumnya
    });

    // Fungsi helper untuk mereset tombol submit
    function resetSubmitButton() {
        submitReportBtn.disabled = false;
        submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
        submitReportBtn.classList.remove('pulse');
    }
});
