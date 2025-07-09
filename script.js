// script.js - VERSI FINAL TANPA ERROR "undefined" dan "ReferenceError"

document.addEventListener('DOMContentLoaded', function () {
  // --- Inisialisasi Materialize CSS ---
  // Pastikan semua inisialisasi dilakukan di awal DOMContentLoaded
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Datepicker.init(document.querySelectorAll('.datepicker'), {
    format: 'yyyy-mm-dd',
    autoClose: true,
  });
  M.Modal.init(document.querySelectorAll('.modal')); // Penting: Inisialisasi modal di sini

  const WEB_APP_URL = 'https://spm-middleware.onrender.com/proxy'; // Ganti dengan URL middleware kamu

  // --- Ambil Referensi Elemen DOM ---
  const salesReportForm = document.getElementById('salesReportForm');
  const salesItemsContainer = document.getElementById('salesItemsContainer');
  const noSaleCheckbox = document.getElementById('noSaleCheckbox');
  const salesDetailSection = document.getElementById('salesDetailSection');
  const addSalesItemBtn = document.getElementById('addSalesItemBtn');
  const responseMessageDiv = document.getElementById('responseMessage');
  const submitReportBtn = document.getElementById('submitReportBtn');
  const successMessageSection = document.getElementById('successMessageSection');
  const submitNewReportBtn = document.getElementById('submitNewReportBtn');
  const warningRevisiDiv = document.getElementById('warningRevisi');
  const loadingSection = document.getElementById('loadingSection');

  // --- Elemen Modal PIN ---
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput');
  const confirmPinBtn = document.getElementById('confirmPinBtn');
  // Pastikan mendapatkan instance modal SETELAH M.Modal.init() dipanggil
  const pinModalInstance = M.Modal.getInstance(pinModal);

  // --- Variabel Data Global ---
  let storeSpmData = [];
  let productCategoryData = [];
  let categoryToKatabanMap = {};
  let latestSubmitPayload = null; // Variabel untuk menyimpan payload sebelum verifikasi PIN

  // --- Fungsi-fungsi Asinkron untuk Fetch Data ---
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
        throw new Error(data.message || 'Gagal memuat data toko/SPM.');
      }
    } catch (error) {
      console.error('Error fetching store/SPM data:', error);
      M.toast({ html: 'Gagal memuat data toko/SPM. Cek koneksi atau server.', classes: 'red' });
      // Mungkin juga menyembunyikan form dan menampilkan pesan error
      salesReportForm.classList.add('hidden');
      responseMessageDiv.textContent = 'Gagal memuat data utama. Silakan refresh halaman.';
      responseMessageDiv.className = 'red-text center-align';
    }
  }

  async function fetchProdukKategoriData() {
    try {
      const response = await fetch(WEB_APP_URL + '?action=getProdukKategoriData');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        productCategoryData = data.data;
        categoryToKatabanMap = productCategoryData.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item.kataban);
          return acc;
        }, {});
        // Tambahkan baris item penjualan jika belum ada dan tidak dalam mode No Sale
        if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
          addSalesItemRow();
        }
      } else {
        throw new Error(data.message || 'Gagal memuat data produk/kategori.');
      }
    } catch (error) {
      console.error('Error fetching produk/kategori data:', error);
      M.toast({ html: 'Gagal memuat data produk/kategori. Cek koneksi atau server.', classes: 'red' });
       // Mungkin juga menyembunyikan form dan menampilkan pesan error
      salesReportForm.classList.add('hidden');
      responseMessageDiv.textContent = 'Gagal memuat data utama. Silakan refresh halaman.';
      responseMessageDiv.className = 'red-text center-align';
    }
  }

  // --- Fungsi Helper untuk Dropdown dan Item Penjualan ---
  function populateStoreDropdown() {
    const storeSelect = document.getElementById('storeName');
    storeSelect.innerHTML = '<option value="" disabled selected>Pilih Toko</option>';
    const uniqueStores = [...new Set(storeSpmData.map((item) => item.storeName))];
    uniqueStores.forEach((store) => {
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
      const filtered = storeSpmData.filter((i) => i.storeName === selectedStore);
      const uniqueSpms = [...new Set(filtered.map((i) => i.spmName))];
      uniqueSpms.forEach((spm) => {
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

  async function checkIfAlreadyReported(date, store, spm) {
    try {
      const params = new URLSearchParams({
        action: 'getRekapExists',
        date,
        store,
        spm
      });
      const response = await fetch(WEB_APP_URL + '?' + params.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.exists;
    } catch (error) {
      console.error('Error checking if already reported:', error);
      M.toast({ html: 'Gagal mengecek duplikasi laporan. Cek koneksi.', classes: 'red' });
      // Asumsi tidak ada duplikat jika pengecekan gagal untuk menghindari pemblokiran
      return false;
    }
  }

  // --- Event Listener untuk Perubahan Dropdown & Datepicker ---
  document.getElementById('storeName').addEventListener('change', async function () {
    populateSpmDropdown(this.value);
    await checkAndShowRevisiWarning();
  });

  document.getElementById('spmName').addEventListener('change', checkAndShowRevisiWarning);
  document.getElementById('reportDate').addEventListener('change', checkAndShowRevisiWarning);

  async function checkAndShowRevisiWarning() {
    const date = document.getElementById('reportDate').value;
    const store = document.getElementById('storeName').value;
    const spm = document.getElementById('spmName').value;
    const loaderDiv = document.getElementById('checkRevisiLoader');

    if (!date || !store || !spm) {
      warningRevisiDiv.style.display = 'none';
      loaderDiv.style.display = 'none';
      return;
    }

    loaderDiv.style.display = 'block';
    loaderDiv.innerHTML = `
      <div class="preloader-wrapper small active" style="vertical-align: middle;">
        <div class="spinner-layer spinner-blue-only">
          <div class="circle-clipper left"><div class="circle"></div></div>
          <div class="gap-patch"><div class="circle"></div></div>
          <div class="circle-clipper right"><div class="circle"></div></div>
        </div>
      </div>
      <span class="grey-text text-darken-2" style="margin-left: 8px;">Memeriksa duplikasi...</span>
    `;

    try {
      const response = await fetch(`${WEB_APP_URL}?action=getRekapExists&date=${date}&store=${store}&spm=${spm}`);
      const data = await response.json();

      if (data.exists) {
        warningRevisiDiv.style.display = 'block';
        loaderDiv.style.display = 'none';
      } else {
        warningRevisiDiv.style.display = 'none';
        loaderDiv.innerHTML = `<i class="material-icons green-text">check_circle</i>`;
        setTimeout(() => loaderDiv.style.display = 'none', 1500);
      }
    } catch (err) {
      console.error("Error checking duplikat:", err);
      loaderDiv.innerHTML = `<span class="red-text text-darken-2">⚠ Gagal cek duplikat</span>`;
      setTimeout(() => loaderDiv.style.display = 'none', 3000);
    }
  }

  function addSalesItemRow() {
    const uniqueId = `qty-${Date.now()}`;
    const itemCard = document.createElement('div');
    itemCard.classList.add('sales-item-card', 'card', 'mb-3');
    itemCard.innerHTML = `
      <div class="card-content">
        <span class="card-title" style="font-size: 1.2rem;">Item Penjualan Baru</span>
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
            <input type="number" class="qty-input validate" min="1" value="1" id="${uniqueId}">
            <label for="${uniqueId}">Qty</label>
          </div>
        </div>
        <div class="row">
          <div class="col s12 right-align">
            <button type="button" class="btn red lighten-1 waves-effect waves-light remove-item-btn">
              Hapus Item <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
      </div>
    `;
    salesItemsContainer.appendChild(itemCard);
    M.FormSelect.init(itemCard.querySelectorAll('select'));
    M.updateTextFields(); // Perbarui label untuk input qty

    itemCard.querySelector('.category-select').addEventListener('change', function () {
      const selectedCategory = this.value;
      const katabanSelect = itemCard.querySelector('.kataban-select');
      katabanSelect.innerHTML = '<option value="" disabled selected>Pilih Model</option>';
      if (selectedCategory && categoryToKatabanMap[selectedCategory]) {
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

    itemCard.querySelector('.remove-item-btn').addEventListener('click', function () {
      itemCard.remove();
    });
  }

  addSalesItemBtn.addEventListener('click', addSalesItemRow);

  noSaleCheckbox.addEventListener('change', function () {
    salesDetailSection.style.display = this.checked ? 'none' : 'block';
    if (this.checked) salesItemsContainer.innerHTML = '';
    else if (salesItemsContainer.children.length === 0) addSalesItemRow();
  });

  // --- Event Listener Tombol "Kirim Laporan" ---
  submitReportBtn.addEventListener('click', function (e) {
    e.preventDefault();

    const reportDate = document.getElementById('reportDate').value;
    const storeName = document.getElementById('storeName').value;
    const spmName = document.getElementById('spmName').value;
    const notes = document.getElementById('notes').value;
    const isNoSale = noSaleCheckbox.checked;
    const reportItems = [];
    const itemCards = salesItemsContainer.querySelectorAll('.sales-item-card');

    // Validasi input wajib
    if (!reportDate || !storeName || !spmName) {
      return M.toast({ html: 'Lengkapi data wajib!', classes: 'red' });
    }
    if (!isNoSale && itemCards.length === 0) {
      return M.toast({ html: 'Tambahkan minimal 1 item atau centang No Sale', classes: 'red' });
    }

    try {
      // Kumpulkan data item penjualan jika bukan No Sale
      if (!isNoSale) {
        for (const card of itemCards) {
          const category = card.querySelector('.category-select').value;
          const model = card.querySelector('.kataban-select').value;
          const qty = card.querySelector('.qty-input').value;
          if (!category || !model || qty <= 0) {
            throw new Error('Lengkapi semua item penjualan dengan benar');
          }
          reportItems.push({ category, model, qty: parseInt(qty) });
        }
      }

      // Simpan semua payload untuk nanti digunakan setelah PIN dimasukkan
      latestSubmitPayload = {
        reportDate,
        storeName,
        spmName,
        isNoSale,
        notes,
        salesItems: reportItems
      };

      // Reset input PIN dan buka modal PIN
      pinInput.value = ''; // Kosongkan input PIN setiap kali modal dibuka
      M.updateTextFields(); // Update label input PIN

      // Pastikan pinModalInstance terdefinisi sebelum mencoba membukanya
      if (pinModalInstance) {
          pinModalInstance.open();
      } else {
          console.error("Modal PIN belum diinisialisasi dengan benar.");
          M.toast({ html: 'Terjadi kesalahan pada modal PIN. Silakan refresh halaman.', classes: 'red' });
      }

    } catch (err) {
      M.toast({ html: '⚠️ ' + err.message, classes: 'red' });
    }
  });

  // --- Event Listener Tombol "Kirim" di dalam Modal PIN ---
  confirmPinBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const pin = pinInput.value;
    if (!pin) {
      M.toast({ html: 'PIN wajib diisi', classes: 'red' });
      return; // Jangan melanjutkan jika PIN kosong
    }

    // Pastikan latestSubmitPayload sudah ada sebelum mencoba mengirim
    if (!latestSubmitPayload) {
      M.toast({ html: 'Terjadi kesalahan, data laporan tidak ditemukan. Silakan coba lagi.', classes: 'red' });
      if (pinModalInstance) pinModalInstance.close();
      return;
    }

    // Ekstrak data dari latestSubmitPayload
    const { reportDate, storeName, spmName, isNoSale, notes, salesItems } = latestSubmitPayload;

    // Tutup modal PIN untuk memberikan feedback ke form utama
    if (pinModalInstance) pinModalInstance.close();


    // Tampilkan feedback loading di tombol utama
    submitReportBtn.disabled = true;
    submitReportBtn.innerHTML = 'Mengirim... <i class="material-icons right">send</i>';
    submitReportBtn.classList.add('pulse');
    responseMessageDiv.textContent = 'Mengirim laporan...';
    responseMessageDiv.className = 'blue-text center-align';

    try {
      M.toast({ html: 'Verifikasi sedang berlangsung...', classes: 'blue lighten-2' });

      // Cek duplikasi laporan
      const exists = await checkIfAlreadyReported(reportDate, storeName, spmName);
      if (exists && !notes.trim().toLowerCase().includes('revisi')) {
        throw new Error('Data sudah pernah dikirim. Tambahkan kata "Revisi" pada catatan.');
      }

      // Kirim data laporan ke middleware
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportDate, storeName, spmName, isNoSale, notes, salesItems: salesItems, pin }),
      });

      // Periksa apakah respons dari server valid
      if (!res.ok) {
        // Coba baca respons sebagai teks jika bukan JSON
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const result = await res.json();

      // Tangani hasil pengiriman
      if (result.success) {
        M.toast({ html: 'Laporan berhasil!', classes: 'green' });
        salesReportForm.classList.add('hidden');
        successMessageSection.classList.remove('hidden');
        // Reset form dan UI setelah berhasil
        salesReportForm.reset();
        salesItemsContainer.innerHTML = '';
        noSaleCheckbox.checked = false;
        salesDetailSection.style.display = 'block'; // Pastikan section detail penjualan kembali terlihat
        warningRevisiDiv.style.display = 'none';
        pinInput.value = ''; // Kosongkan input PIN setelah berhasil
      } else {
        throw new Error(result.message || 'Gagal mengirim laporan. Pesan dari server tidak jelas.');
      }
    } catch (err) {
      M.toast({ html: '⚠️ ' + err.message, classes: 'red' });
      responseMessageDiv.textContent = 'Gagal mengirim laporan';
      responseMessageDiv.className = 'red-text center-align';
    } finally {
      // Kembalikan tombol ke kondisi semula, baik berhasil maupun gagal
      submitReportBtn.disabled = false;
      submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
      submitReportBtn.classList.remove('pulse');
    }
  });

  // --- Event Listener Tombol "Kirim Laporan Baru" ---
  submitNewReportBtn.addEventListener('click', () => {
    successMessageSection.classList.add('hidden');
    salesReportForm.classList.remove('hidden');
    responseMessageDiv.textContent = '';
    warningRevisiDiv.style.display = 'none';
    // Tambahkan baris item penjualan jika belum ada dan tidak dalam mode No Sale
    if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) addSalesItemRow();
  });

  // --- Logika Pemmuatan Data Awal (saat halaman dimuat) ---
  if (!window.__dataLoadedOnce) {
    window.__dataLoadedOnce = true;
    loadingSection.style.display = 'block';
    salesReportForm.classList.add('hidden');
    const delayTimer = setTimeout(() => {
      const delayNotice = document.createElement('p');
      delayNotice.id = 'delayNotice';
      delayNotice.className = 'orange-text text-darken-3';
      delayNotice.style.marginTop = '12px';
      delayNotice.textContent = 'Mohon tunggu, kemungkinan traffic server sedang tinggi atau server sedang bangun...';
      loadingSection.appendChild(delayNotice);
    }, 4000);
    Promise.all([fetchStoreSpmData(), fetchProdukKategoriData()]).then(() => {
      clearTimeout(delayTimer);
      loadingSection.style.display = 'none';
      salesReportForm.classList.remove('hidden');
    }).catch(error => {
      // Tangani error jika Promise.all gagal (misal salah satu fetch gagal)
      console.error("Gagal memuat data awal:", error);
      clearTimeout(delayTimer);
      loadingSection.style.display = 'none';
      salesReportForm.classList.add('hidden'); // Pastikan form tetap tersembunyi
      responseMessageDiv.textContent = 'Gagal memuat data awal aplikasi. Silakan periksa koneksi internet Anda atau coba lagi nanti.';
      responseMessageDiv.className = 'red-text center-align';
    });
  }
});
