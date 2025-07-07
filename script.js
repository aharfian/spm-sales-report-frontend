// script.js FINAL REVISI dengan validasi data sudah pernah input

document.addEventListener('DOMContentLoaded', function () {
  // Materialize CSS Init
  // M.FormSelect.init(document.querySelectorAll('select')); // BARIS INI DIHAPUS/DIKOMENTARI
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
  const warningRevisiDiv = document.getElementById('warningRevisi'); // Pastikan elemen ini ada di HTML

  let storeSpmData = [];
  let productCategoryData = [];
  let categoryToKatabanMap = {};

  // Fungsi untuk mengambil data toko dan SPM
  async function fetchStoreSpmData() {
    try {
      const response = await fetch(WEB_APP_URL + '?action=getStoreSpmData');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        storeSpmData = data.data;
        populateStoreSpmSelects(storeSpmData);
      } else {
        console.error('Failed to fetch store and SPM data:', data.message);
        responseMessageDiv.textContent = 'Gagal memuat data toko dan SPM: ' + data.message;
        responseMessageDiv.className = 'red-text center-align';
      }
    } catch (error) {
      console.error('Error fetching store and SPM data:', error);
      responseMessageDiv.textContent = 'Error koneksi saat memuat data toko dan SPM. Coba refresh halaman.';
      responseMessageDiv.className = 'red-text center-align';
    }
  }

  // Fungsi untuk mengisi dropdown Toko dan SPM
  function populateStoreSpmSelects(data) {
    const storeSelect = document.getElementById('storeSelect');
    const spmSelect = document.getElementById('spmSelect');

    // Kosongkan opsi yang ada kecuali placeholder
    storeSelect.innerHTML = '<option value="" disabled selected>Pilih Toko</option>';
    spmSelect.innerHTML = '<option value="" disabled selected>Pilih SPM</option>';

    data.forEach(item => {
      // Tambah opsi toko
      let storeOption = document.createElement('option');
      storeOption.value = item.Nama_Toko;
      storeOption.textContent = item.Nama_Toko;
      storeSelect.appendChild(storeOption);

      // Tambah opsi SPM
      let spmOption = document.createElement('option');
      spmOption.value = item.Nama_SPM;
      spmOption.textContent = item.Nama_SPM;
      spmSelect.appendChild(spmOption);
    });

    // Inisialisasi ulang Materialize Select setelah opsi ditambahkan
    M.FormSelect.init(document.querySelectorAll('select')); // BARIS INI PENTING, HANYA DISINI
  }

  // Fungsi untuk mengambil data Produk dan Kategori
  async function fetchProdukKategoriData() {
    try {
      const response = await fetch(WEB_APP_URL + '?action=getProductCategoryData');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        productCategoryData = data.data;
        // Bangun map categoryToKatabanMap
        productCategoryData.forEach(item => {
          if (!categoryToKatabanMap[item.Nama_Kategori]) {
            categoryToKatabanMap[item.Nama_Kategori] = [];
          }
          categoryToKatabanMap[item.Nama_Kategori].push(item.Nama_Produk);
        });
      } else {
        console.error('Failed to fetch product and category data:', data.message);
        responseMessageDiv.textContent = 'Gagal memuat data produk dan kategori: ' + data.message;
        responseMessageDiv.className = 'red-text center-align';
      }
    } catch (error) {
      console.error('Error fetching product and category data:', error);
      responseMessageDiv.textContent = 'Error koneksi saat memuat data produk dan kategori. Coba refresh halaman.';
      responseMessageDiv.className = 'red-text center-align';
    }
  }

  // Fungsi untuk mengisi dropdown Kategori Produk
  function populateProductCategorySelect(selectElement) {
    selectElement.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
    Object.keys(categoryToKatabanMap).forEach(category => {
      let option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      selectElement.appendChild(option);
    });
    M.FormSelect.init(selectElement); // Inisialisasi ulang hanya select ini
  }

  // Fungsi untuk mengisi dropdown Produk berdasarkan Kategori
  function populateProductSelect(productSelectElement, category) {
    productSelectElement.innerHTML = '<option value="" disabled selected>Pilih Produk</option>';
    if (category && categoryToKatabanMap[category]) {
      categoryToKatabanMap[category].forEach(product => {
        let option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productSelectElement.appendChild(option);
      });
    }
    M.FormSelect.init(productSelectElement); // Inisialisasi ulang hanya select ini
  }

  // Fungsi untuk menambahkan baris item penjualan baru
  function addSalesItemRow() {
    const newItemIndex = salesItemsContainer.children.length; // Dapatkan index untuk ID unik
    const newSalesItemCard = document.createElement('div');
    newSalesItemCard.className = 'sales-item-card card';
    newSalesItemCard.innerHTML = `
      <div class="card-content">
        <span class="card-title">Item Penjualan Baru #${newItemIndex + 1}</span>
        <div class="input-field">
          <select id="categorySelect-${newItemIndex}" required>
            <option value="" disabled selected>Pilih Kategori</option>
          </select>
          <label>Kategori Produk</label>
        </div>
        <div class="input-field">
          <select id="productSelect-${newItemIndex}" required>
            <option value="" disabled selected>Pilih Produk</option>
          </select>
          <label>Nama Produk</label>
        </div>
        <div class="input-field">
          <input type="number" id="qty-${newItemIndex}" min="1" required />
          <label for="qty-${newItemIndex}">Jumlah</label>
        </div>
        <button type="button" class="btn waves-effect waves-light red darken-1 remove-item-btn">
          Hapus Item
          <i class="material-icons right">delete</i>
        </button>
      </div>
    `;
    salesItemsContainer.appendChild(newSalesItemCard);

    // Dapatkan elemen select yang baru ditambahkan
    const categorySelect = document.getElementById(`categorySelect-${newItemIndex}`);
    const productSelect = document.getElementById(`productSelect-${newItemIndex}`);

    // Isi kategori produk
    populateProductCategorySelect(categorySelect);

    // Tambahkan event listener untuk perubahan kategori
    categorySelect.addEventListener('change', function () {
      populateProductSelect(productSelect, this.value);
    });

    // Inisialisasi Materialize select untuk elemen yang baru ditambahkan
    M.FormSelect.init(categorySelect);
    M.FormSelect.init(productSelect);

    // Tambahkan event listener untuk tombol hapus
    newSalesItemCard.querySelector('.remove-item-btn').addEventListener('click', function () {
      newSalesItemCard.remove();
      // Pastikan ada setidaknya satu item jika noSaleCheckbox tidak dicentang
      if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
        addSalesItemRow();
      }
    });

    // Re-initialize all Materialize form select elements (important for newly added items)
    M.FormSelect.init(document.querySelectorAll('select'));
  }


  // Event Listener untuk Checkbox "Laporan No Sale?"
  noSaleCheckbox.addEventListener('change', function () {
    if (this.checked) {
      salesDetailSection.style.display = 'none';
      salesItemsContainer.innerHTML = ''; // Kosongkan item jika No Sale
    } else {
      salesDetailSection.style.display = 'block';
      if (salesItemsContainer.children.length === 0) {
        addSalesItemRow(); // Tambah satu baris jika kosong dan bukan No Sale
      }
    }
  });


  // Event Listener untuk tombol "Tambah Item"
  addSalesItemBtn.addEventListener('click', addSalesItemRow);


  // Submit Form Handler
  salesReportForm.addEventListener('submit', async function (event) {
    event.preventDefault(); // Mencegah form submit secara default

    submitReportBtn.disabled = true;
    submitReportBtn.innerHTML = 'Mengirim... <i class="material-icons right">send</i>';
    submitReportBtn.classList.add('pulse');
    responseMessageDiv.textContent = '';
    responseMessageDiv.className = '';

    // Kumpulkan data utama
    const reportDate = document.getElementById('reportDate').value;
    const storeName = document.getElementById('storeSelect').value;
    const spmName = document.getElementById('spmSelect').value;
    const isNoSale = noSaleCheckbox.checked;
    const notes = document.getElementById('notes').value;

    let salesItems = [];
    if (!isNoSale) {
      // Kumpulkan data item penjualan
      for (let i = 0; i < salesItemsContainer.children.length; i++) {
        const category = document.getElementById(`categorySelect-${i}`).value;
        const product = document.getElementById(`productSelect-${i}`).value;
        const qty = document.getElementById(`qty-${i}`).value;

        // Basic validation
        if (!category || !product || !qty || parseInt(qty) <= 0) {
          responseMessageDiv.textContent = 'Semua field Kategori, Produk, dan Jumlah harus diisi dengan benar untuk setiap item penjualan.';
          responseMessageDiv.className = 'red-text center-align';
          submitReportBtn.disabled = false;
          submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
          submitReportBtn.classList.remove('pulse');
          return;
        }

        salesItems.push({
          kategori_produk: category,
          nama_produk: product,
          jumlah: parseInt(qty)
        });
      }
    }

    const reportData = {
      tanggal_laporan: reportDate,
      nama_toko: storeName,
      nama_spm: spmName,
      no_sale: isNoSale,
      catatan: notes,
      items: salesItems
    };

    try {
      const response = await fetch(WEB_APP_URL + '?action=submitReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        responseMessageDiv.textContent = result.message;
        responseMessageDiv.className = 'green-text center-align';

        // Tampilkan pesan sukses dan tombol kirim laporan baru
        salesReportForm.classList.add('hidden');
        successMessageSection.classList.remove('hidden');

        // Reset form setelah berhasil
        salesReportForm.reset();
        salesItemsContainer.innerHTML = '';
        noSaleCheckbox.checked = false;
        salesDetailSection.style.display = 'block'; // Pastikan kembali terlihat

        // Kosongkan dan inisialisasi ulang select toko/spm
        populateStoreSpmSelects(storeSpmData);
        M.FormSelect.init(document.querySelectorAll('select')); // Re-init all selects after form reset

      } else {
        responseMessageDiv.textContent = 'Gagal menyimpan laporan: ' + result.message;
        responseMessageDiv.className = 'red-text center-align';
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      responseMessageDiv.textContent = 'Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.';
      responseMessageDiv.className = 'red-text center-align';
    } finally {
      submitReportBtn.disabled = false;
      submitReportBtn.innerHTML = 'Kirim Laporan <i class="material-icons right">send</i>';
      submitReportBtn.classList.remove('pulse');
    }
  });

  // Event Listener untuk tombol "Kirim Laporan Baru"
  submitNewReportBtn.addEventListener('click', () => {
    successMessageSection.classList.add('hidden');
    salesReportForm.classList.remove('hidden');
    responseMessageDiv.textContent = '';
    warningRevisiDiv.style.display = 'none'; // Sembunyikan pesan revisi
    // Pastikan ada setidaknya satu item jika noSaleCheckbox tidak dicentang saat memulai laporan baru
    if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
      addSalesItemRow();
    }
    // Re-initialize materialize components for the form after showing it
    M.Datepicker.init(document.querySelectorAll('.datepicker'), { format: 'yyyy-mm-dd', autoClose: true });
    M.FormSelect.init(document.querySelectorAll('select'));
    M.textareaAutoResize(document.getElementById('notes'));
  });

  // Logika Spinner dan loading data awal
  if (!window.__dataLoadedOnce) {
    window.__dataLoadedOnce = true; // Tandai bahwa data sudah dicoba dimuat
    document.getElementById('loadingSection').style.display = 'block'; // Tampilkan loading screen
    salesReportForm.classList.add('hidden'); // Sembunyikan form

    const delayTimer = setTimeout(() => {
      const delayNotice = document.getElementById('delayNotice'); // Ambil elemen yang sudah ada
      if (delayNotice) { // Pastikan elemen ditemukan sebelum memodifikasi
        delayNotice.classList.remove('hidden'); // Tampilkan pesan delay
        delayNotice.textContent = 'Mohon tunggu, kemungkinan traffic server sedang tinggi atau data sedang dimuat...';
      }
    }, 4000); // Tampilkan pesan setelah 4 detik

    // Muat data toko/SPM dan produk/kategori secara paralel
    Promise.all([fetchStoreSpmData(), fetchProdukKategoriData()])
      .then(() => {
        clearTimeout(delayTimer); // Hentikan timer pesan delay
        document.getElementById('loadingSection').style.display = 'none'; // Sembunyikan loading screen
        salesReportForm.classList.remove('hidden'); // Tampilkan form
        // Tambahkan satu baris item penjualan default jika bukan no-sale
        if (!noSaleCheckbox.checked && salesItemsContainer.children.length === 0) {
          addSalesItemRow();
        }
      })
      .catch(error => {
        console.error('Error fetching initial data:', error);
        clearTimeout(delayTimer); // Hentikan timer pesan delay
        document.getElementById('loadingSection').style.display = 'none'; // Sembunyikan loading screen
        responseMessageDiv.textContent = 'Gagal memuat data awal. Silakan coba refresh halaman. Error: ' + error.message;
        responseMessageDiv.className = 'red-text center-align';
        // Biarkan form tersembunyi atau tampilkan dengan pesan error
      });
  }
});
