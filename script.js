// script.js FINAL REVISI + Validasi PIN Sebelum Submit

document.addEventListener('DOMContentLoaded', function () {
  // Inisialisasi Materialize CSS pertama kali
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Datepicker.init(document.querySelectorAll('.datepicker'), {
    format: 'yyyy-mm-dd',
    autoClose: true,
  });
  // Pastikan inisialisasi modal Materialize juga dilakukan di awal
  M.Modal.init(document.querySelectorAll('.modal')); // Pindahkan ini ke atas

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

  // AMBIL INSTANCE MODAL SETELAH M.Modal.init() DIPANGGIL
  const pinModalInstance = M.Modal.getInstance(pinModal); // Pindahkan atau pastikan ini dijalankan setelah inisialisasi global

  let storeSpmData = [];
  let productCategoryData = [];
  let categoryToKatabanMap = {};
  let latestSubmitPayload = null; // Variabel untuk menyimpan payload sebelum PIN

  // ... (kode fetchStoreSpmData, fetchProdukKategoriData, populateStoreDropdown, populateSpmDropdown, checkIfAlreadyReported, checkAndShowRevisiWarning, addSalesItemRow, event listener change untuk storeName, spmName, reportDate, noSaleCheckbox tetap sama) ...

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

      // Pastikan pinModalInstance terdefinisi sebelum mencoba membukanya
      if (pinModalInstance) {
          pinModalInstance.open();
      } else {
          console.error("Modal PIN belum diinisialisasi.");
          M.toast({ html: 'Terjadi kesalahan pada modal PIN. Silakan refresh halaman.', classes: 'red' });
      }


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
      return;
    }

    if (!latestSubmitPayload) {
      M.toast({ html: 'Terjadi kesalahan, data laporan tidak ditemukan.', classes: 'red' });
      if (pinModalInstance) pinModalInstance.close();
      return;
    }

    const { reportDate, storeName, spmName, isNoSale, notes, salesItems } = latestSubmitPayload;

    if (pinModalInstance) pinModalInstance.close();


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
        body: JSON.stringify({ reportDate, storeName, spmName, isNoSale, notes, salesItems: reportItems, pin }),
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
        pinInput.value = '';
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
  // Tidak perlu lagi memanggil M.Modal.init di sini karena sudah dipindahkan ke atas
});
