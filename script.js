// script.js FINAL REVISI + Validasi PIN Sebelum Submit

document.addEventListener('DOMContentLoaded', function () {
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Datepicker.init(document.querySelectorAll('.datepicker'), {
    format: 'yyyy-mm-dd',
    autoClose: true,
  });

  const WEB_APP_URL = 'https://spm-middleware.onrender.com/proxy'; // Ganti dengan middleware kamu

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

  // --- Elemen Modal PIN ---
  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput');
  const confirmPinBtn = document.getElementById('confirmPinBtn');
  const pinModalInstance = M.Modal.getInstance(pinModal); // Dapatkan instance modal setelah diinisialisasi

  let storeSpmData = [];
  let productCategoryData = [];
  let categoryToKatabanMap = {};
  let latestSubmitPayload = null; // Variabel untuk menyimpan payload sebelum PIN

  async function fetchStoreSpmData() {
    const response = await fetch(WEB_APP_URL + '?action=getStoreSpmData');
    const data = await response.json();
    if (data.success) {
      storeSpmData = data.data;
      populateStoreDropdown();
    }
  }

  async function fetchProdukKategoriData() {
    const response = await fetch(WEB_APP_URL + '?action=getProdukKategoriData');
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
    }
  }

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
    const params = new URLSearchParams({
      action: 'getRekapExists',
      date,
      store,
      spm
    });
    const response = await fetch(WEB_APP_URL + '?' + params.toString());
    const result = await response.json();
    return result.exists;
  }

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
    const warningRevisiDiv = document.getElementById('warningRevisi');
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
    M.updateTextFields();

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

  // --- MODIFIKASI DIMULAI DI SINI ---

  // Event listener untuk tombol "Kirim Laporan" (submitReportBtn)
  submitReportBtn.addEventListener('click', function (e) {
    e.preventDefault();

    const reportDate = document.getElementById('reportDate').value;
    const storeName = document.getElementById('storeName').value;
    const spmName = document.getElementById('spmName').value;
    const notes = document.getElementById('notes').value;
    const isNoSale = noSaleCheckbox.checked;
    const reportItems = [];
    const itemCards = salesItemsContainer.querySelectorAll('.sales-item-card');

    if (!reportDate || !storeName || !spmName) {
      return M.toast({ html: 'Lengkapi data wajib!', classes: 'red' });
    }
    if (!isNoSale && itemCards.length === 0) {
      return M.toast({ html: 'Tambahkan minimal 1 item atau centang No Sale', classes: 'red' });
    }

    try {
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
      pinModalInstance.open();

    } catch (err) {
      M.toast({ html: '⚠️ ' + err.message, classes: 'red' });
    }
  });

  // Event listener untuk tombol "Kirim" di dalam Modal PIN (confirmPinBtn)
  confirmPinBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const pin = pinInput.value;
    if (!pin) {
      M.toast({ html: 'PIN wajib diisi', classes: 'red' });
      return; // Jangan menutup modal jika PIN kosong
    }

    // Pastikan latestSubmitPayload sudah ada
    if (!latestSubmitPayload) {
      M.toast({ html: 'Terjadi kesalahan, data laporan tidak ditemukan.', classes: 'red' });
      pinModalInstance.close(); // Tutup modal jika payload tidak ada
      return;
    }

    // Ekstrak data dari latestSubmitPayload
    const { reportDate, storeName, spmName, isNoSale, notes, salesItems } = latestSubmitPayload;

    // Tutup modal PIN untuk memberikan feedback ke form utama
    pinModalInstance.close(); // Tutup modal segera setelah PIN diambil

    // Tampilkan feedback loading di tombol utama
    submitReportBtn.disabled = true;
    submitReportBtn.innerHTML = 'Mengirim... <i class="material-icons right">send</i>';
    submitReportBtn.classList.add('pulse');
    responseMessageDiv.textContent = 'Mengirim laporan...';
    responseMessageDiv.className = 'blue-text center-align';

    try {
      M.toast({ html: 'Verifikasi sedang berlangsung...', classes: 'blue lighten-2' });

      const exists = await checkIfAlreadyReported(reportDate, storeName, spmName);
      if (exists && !notes.trim().toLowerCase().includes('revisi')) {
        throw new Error('Data sudah pernah dikirim. Tambahkan kata "Revisi" pada catatan.');
      }

      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportDate, storeName, spmName, isNoSale, notes, salesItems, pin }),
      });

      const result = await res.json();

      if (result.success) {
        M.toast({ html: 'Laporan berhasil!', classes: 'green' });
        salesReportForm.classList.add('hidden');
        successMessageSection.classList.remove('hidden');
        salesReportForm.reset();
        salesItemsContainer.innerHTML = '';
        noSaleCheckbox.checked = false;
        salesDetailSection.style.display = 'block';
        warningRevisiDiv.style.display = 'none';
        pinInput.value = ''; // Kosongkan input PIN setelah berhasil
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      M.toast({ html: '⚠️ ' + err.message, classes: 'red' });
      responseMessageDiv.textContent = 'Gagal mengirim laporan';
      responseMessageDiv.className = 'red-text center-align';
    } finally {
      submitReportBtn.disabled = false;
      submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
      submitReportBtn.classList.remove('pulse');
      // Tidak perlu menutup modal di sini lagi karena sudah ditutup di awal 'confirmPinBtn' handler
      // Tapi jika ada kebutuhan untuk membuka kembali modal jika ada error spesifik PIN, bisa ditambahkan logika
    }
  });


  submitNewReportBtn.addEventListener('click', () => {
    successMessageSection.classList.add('hidden');
    salesReportForm.classList.remove('hidden');
    responseMessageDiv.textContent = '';
    warningRevisiDiv.style.display = 'none';
    if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) addSalesItemRow();
  });

  if (!window.__dataLoadedOnce) {
    window.__dataLoadedOnce = true;
    document.getElementById('loadingSection').style.display = 'block';
    salesReportForm.classList.add('hidden');
    const delayTimer = setTimeout(() => {
      const delayNotice = document.createElement('p');
      delayNotice.id = 'delayNotice';
      delayNotice.className = 'orange-text text-darken-3';
      delayNotice.style.marginTop = '12px';
      delayNotice.textContent = 'Mohon tunggu, kemungkinan traffic server sedang tinggi...';
      document.getElementById('loadingSection').appendChild(delayNotice);
    }, 4000);
    Promise.all([fetchStoreSpmData(), fetchProdukKategoriData()]).then(() => {
      clearTimeout(delayTimer);
      document.getElementById('loadingSection').style.display = 'none';
      salesReportForm.classList.remove('hidden');
    });
  }
  M.Modal.init(document.querySelectorAll('.modal')); // Pastikan ini tetap ada untuk inisialisasi modal
});
