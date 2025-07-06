async function fetchStoreSpmData() {
    try {
        const response = await fetch(`${WEB_APP_URL}?action=getStoreSpmData`);
        
        // Pastikan respons OK (status 200)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // BACA RESPON SEBAGAI TEKS (BUKAN JSON LANGSUNG)
        const htmlText = await response.text(); 
        // PARSE TEKS HTML YANG SEBENARNYA HANYA JSON
        const data = JSON.parse(htmlText); 

        if (data.success) {
            const storeSpmData = data.data;
            populateStoreSpmSelect(storeSpmData);
        } else {
            console.error('Failed to fetch store/SPM data:', data.message);
        }
    } catch (error) {
        console.error('Fetch error for store/SPM data:', error);
        // Tampilkan pesan error kepada user jika perlu
        displayMessage('Gagal memuat data toko/SPM. Silakan coba lagi.', 'error');
    }
}
