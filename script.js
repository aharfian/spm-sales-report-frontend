document.addEventListener('DOMContentLoaded', function() {
    // Materialize CSS Initializations
    M.FormSelect.init(document.querySelectorAll('select'));
    M.Datepicker.init(document.querySelectorAll('.datepicker'), {
        format: 'yyyy-mm-dd',
        autoClose: true,
        // Set first day of week to Monday if needed
        // firstDay: 1, 
        // i18n: { /* You can add Indonesian locale here if needed */ }
    });
    M.textareaAutoResize(document.getElementById('notes'));

    const salesReportForm = document.getElementById('salesReportForm');
    const salesItemsTableBody = document.getElementById('salesItemsTableBody');
    const noSaleCheckbox = document.getElementById('noSaleCheckbox');
    const salesDetailSection = document.getElementById('salesDetailSection');
    const addSalesItemBtn = document.getElementById('addSalesItemBtn');
    const responseMessageDiv = document.getElementById('responseMessage');

    // --- DUMMY DATA UNTUK DEMONSTRASI FRONTEND DINAMIS ---
    // Di backend nyata, data ini akan diambil dari Google Sheet
    const categoryToKatabanMap = {
        "Handphone": ["iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra", "Xiaomi 14", "Oppo Find X7"],
        "Aksesoris": ["Earphone Bluetooth", "Power Bank 10000mAh", "Case HP", "Charger Fast Charging"],
        "Laptop": ["MacBook Air M3", "Dell XPS 15", "HP Spectre x360"],
        "Smartwatch": ["Apple Watch Series 9", "Samsung Galaxy Watch 6", "Huawei Watch GT 4"]
    };
    // --- AKHIR DUMMY DATA ---

    // Function to add a new sales item row
    function addSalesItemRow() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="category-select">
                    <option value="" disabled selected>Pilih Kategori</option>
                    ${Object.keys(categoryToKatabanMap).map(category => `<option value="${category}">${category}</option>`).join('')}
                </select>
            </td>
            <td>
                <select class="kataban-select" disabled>
                    <option value="" disabled selected>Pilih Model</option>
                </select>
            </td>
            <td>
                <div class="input-field">
                    <input type="number" class="qty-input" min="1" value="1">
                </div>
            </td>
            <td>
                <button type="button" class="btn-floating waves-effect waves-light red remove-item-btn">
                    <i class="material-icons">remove</i>
                </button>
            </td>
        `;
        salesItemsTableBody.appendChild(row);

        // Re-initialize Materialize selects for the new row
        M.FormSelect.init(row.querySelectorAll('select'));

        // Add event listener for category select change
        row.querySelector('.category-select').addEventListener('change', function() {
            const selectedCategory = this.value;
            const katabanSelect = this.closest('tr').querySelector('.kataban-select');
            
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
        row.querySelector('.remove-item-btn').addEventListener('click', function() {
            row.remove();
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
            salesItemsTableBody.innerHTML = ''; 
        } else {
            salesDetailSection.style.display = 'block';
            // Add one default row if re-enabled and no rows exist
            if (salesItemsTableBody.children.length === 0) {
                addSalesItemRow();
            }
        }
    });

    // Form Submission Listener
    salesReportForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent default form submission

        responseMessageDiv.innerHTML = ''; // Clear previous messages
        responseMessageDiv.classList.remove('green-text', 'red-text');

        const reportDate = document.getElementById('reportDate').value;
        const storeName = document.getElementById('storeName').value;
        const spmName = document.getElementById('spmName').value;
        const notes = document.getElementById('notes').value;
        const isNoSale = noSaleCheckbox.checked;

        if (!reportDate || !storeName || !spmName) {
            M.toast({html: 'Mohon lengkapi Tanggal Laporan, Nama Toko, dan Nama SPM.', classes: 'red'});
            return;
        }

        let salesItems = [];
        if (!isNoSale) {
            const rows = salesItemsTableBody.querySelectorAll('tr');
            if (rows.length === 0) {
                M.toast({html: 'Mohon tambahkan setidaknya satu item penjualan atau centang "Laporan No Sale".', classes: 'red'});
                return;
            }
            rows.forEach(row => {
                const category = row.querySelector('.category-select').value;
                const model = row.querySelector('.kataban-select').value;
                const qty = row.querySelector('.qty-input').value;

                if (!category || !model || !qty || parseInt(qty) <= 0) {
                    M.toast({html: 'Mohon lengkapi semua detail item penjualan (Kategori, Model, Qty > 0).', classes: 'red'});
                    throw new Error('Incomplete sales item data'); // Stop processing
                }
                salesItems.push({
                    category: category,
                    model: model,
                    qty: parseInt(qty)
                });
            });
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
        responseMessageDiv.textContent = 'Laporan Anda sedang diproses (simulasi)...';
        responseMessageDiv.classList.add('blue-text');

        // Simulasi proses async
        setTimeout(() => {
            if (isNoSale) {
                M.toast({html: 'Laporan No Sale berhasil disimpan (simulasi)!', classes: 'green'});
                responseMessageDiv.textContent = 'Laporan No Sale berhasil disimpan (simulasi)!';
            } else {
                M.toast({html: 'Laporan penjualan berhasil disimpan (simulasi)!', classes: 'green'});
                responseMessageDiv.textContent = 'Laporan penjualan berhasil disimpan (simulasi)!';
            }
            responseMessageDiv.classList.add('green-text');
            
            // Reset form
            salesReportForm.reset();
            M.FormSelect.init(document.querySelectorAll('select')); // Re-init selects
            M.Datepicker.getInstance(document.getElementById('reportDate')).setDate(null); // Clear datepicker
            salesItemsTableBody.innerHTML = ''; // Clear sales items
            salesDetailSection.style.display = 'block'; // Ensure sales section is visible
            addSalesItemRow(); // Add one initial row
        }, 1500); // Simulasi delay 1.5 detik
        // --- AKHIR SIMULASI ---

        // Di sini nanti Anda akan mengganti bagian setTimeout ini dengan panggilan AJAX (fetch API atau Axios)
        // ke endpoint backend perantara Anda yang baru, yang akan mengirim data ke Google Sheets.
        // Contoh:
        /*
        fetch('URL_BACKEND_PERANTARA_ANDA', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                M.toast({html: data.message, classes: 'green'});
                responseMessageDiv.textContent = data.message;
                responseMessageDiv.classList.add('green-text');
                // Reset form
                salesReportForm.reset();
                M.FormSelect.init(document.querySelectorAll('select'));
                M.Datepicker.getInstance(document.getElementById('reportDate')).setDate(null);
                salesItemsTableBody.innerHTML = '';
                salesDetailSection.style.display = 'block';
                addSalesItemRow();
            } else {
                M.toast({html: 'Gagal menyimpan laporan: ' + data.message, classes: 'red'});
                responseMessageDiv.textContent = 'Gagal menyimpan laporan: ' + data.message;
                responseMessageDiv.classList.add('red-text');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            M.toast({html: 'Terjadi kesalahan jaringan atau server: ' + error.message, classes: 'red'});
            responseMessageDiv.textContent = 'Terjadi kesalahan jaringan atau server.';
            responseMessageDiv.classList.add('red-text');
        });
        */
    });
});
