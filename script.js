// script.js FINAL REVISI dengan validasi data sudah pernah input

document.addEventListener('DOMContentLoaded', function () {
  // Materialize CSS Init
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
  const warningRevisiDiv = document.getElementById('warningRevisi');

  let storeSpmData = [];
  let productCategoryData = [];
  let categoryToKatabanMap = {};

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
      token: 'RAHASIA',
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
    if (date && store && spm) {
      const exists = await checkIfAlreadyReported(date, store, spm);
      warningRevisiDiv.style.display = exists ? 'block' : 'none';
    } else {
      warningRevisiDiv.style.display = 'none';
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
              Hapus Item <i class="material-icons right">delete</i>
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

  submitReportBtn.addEventListener('click', async function (e) {
    e.preventDefault();
    const reportDate = document.getElementById('reportDate').value;
    const storeName = document.getElementById('storeName').value;
    const spmName = document.getElementById('spmName').value;
    const notes = document.getElementById('notes').value;
    const isNoSale = noSaleCheckbox.checked;
    const reportItems = [];
    const itemCards = salesItemsContainer.querySelectorAll('.sales-item-card');

    if (!reportDate || !storeName || !spmName) return M.toast({ html: 'Lengkapi data wajib!', classes: 'red' });
    if (!isNoSale && itemCards.length === 0) return M.toast({ html: 'Tambahkan minimal 1 item atau centang No Sale', classes: 'red' });

    const alreadyReported = await checkIfAlreadyReported(reportDate, storeName, spmName);
    if (alreadyReported && !notes.toLowerCase().includes('revisi')) {
      return M.toast({ html: 'Karena ini revisi, wajib isi catatan dengan kata "revisi"', classes: 'orange darken-3' });
    }

    if (!isNoSale) {
      for (const card of itemCards) {
        const category = card.querySelector('.category-select').value;
        const model = card.querySelector('.kataban-select').value;
        const qty = card.querySelector('.qty-input').value;
        if (!category || !model || qty <= 0) return M.toast({ html: 'Lengkapi semua item dengan benar', classes: 'red' });
        reportItems.push({ category, model, qty: parseInt(qty) });
      }
    }

    submitReportBtn.disabled = true;
    submitReportBtn.innerHTML = 'Mengirim... <i class="material-icons right">send</i>';
    submitReportBtn.classList.add('pulse');
    responseMessageDiv.textContent = 'Mengirim laporan...';
    responseMessageDiv.className = 'blue-text center-align';

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportDate, storeName, spmName, isNoSale, notes, salesItems: reportItems }),
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
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      M.toast({ html: 'Error: ' + err.message, classes: 'red' });
      responseMessageDiv.textContent = 'Gagal mengirim laporan';
      responseMessageDiv.className = 'red-text center-align';
    } finally {
      submitReportBtn.disabled = false;
      submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
      submitReportBtn.classList.remove('pulse');
    }
  });

  submitNewReportBtn.addEventListener('click', () => {
    successMessageSection.classList.add('hidden');
    salesReportForm.classList.remove('hidden');
    responseMessageDiv.textContent = '';
    warningRevisiDiv.style.display = 'none';
    if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) addSalesItemRow();
  });

  // Spinner saat load awal dan delay text
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
});
