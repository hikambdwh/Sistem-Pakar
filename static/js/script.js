// Data gejala akan diambil dari backend
let gejala = [];

// Opsi CF yang tersedia
const cfOptions = [
  { value: 1.0, label: "Sangat Yakin" },
  { value: 0.75, label: "Cukup Yakin" },
  { value: 0.5, label: "Yakin" },
  { value: 0.25, label: "Tidak Yakin" },
  { value: 0.0, label: "Sangat Tidak Yakin" },
];

// Fungsi untuk mengambil data gejala dari backend
async function loadGejala() {
  try {
    const response = await fetch("/api/gejala");
    if (!response.ok) {
      throw new Error("Gagal mengambil data gejala");
    }
    const data = await response.json();
    gejala = data.gejala;
    initSymptoms();
  } catch (error) {
    console.error("Error loading gejala:", error);
    alert("Gagal memuat data gejala. Pastikan backend berjalan dengan baik.");
  }
}

// Fungsi untuk menginisialisasi gejala di UI
function initSymptoms() {
  const container = document.getElementById("symptoms-container");
  container.innerHTML = ""; // Kosongkan container

  gejala.forEach((symptom) => {
    const symptomItem = document.createElement("div");
    symptomItem.className = "symptom-item";

    // Buat opsi untuk dropdown CF
    let optionsHTML = "";
    cfOptions.forEach((option) => {
      optionsHTML += `<option value="${option.value}">${option.label}</option>`;
    });

    symptomItem.innerHTML = `
      <div class="symptom-header">
        <span class="symptom-name">${symptom.nama}</span>
        <span class="symptom-code">${symptom.kode}</span>
      </div>
      <div class="cf-select-container">
        <select class="cf-select" data-kode="${symptom.kode}">
          <option value="">Pilih tingkat keyakinan</option>
          ${optionsHTML}
        </select>
      </div>
    `;
    container.appendChild(symptomItem);
  });
}

// Fungsi untuk mengumpulkan data CF dari dropdown
function getCFData() {
  const cfData = {};
  const selects = document.querySelectorAll(".cf-select");

  selects.forEach((select) => {
    const kode = select.getAttribute("data-kode");
    const value = select.value;

    // Jika user memilih opsi, gunakan nilainya, jika tidak gunakan 0
    cfData[kode] = value ? parseFloat(value) : 0;
  });

  return cfData;
}

// Fungsi untuk menampilkan hasil diagnosa
function displayResults(results) {
  const container = document.getElementById("results-container");
  const list = document.getElementById("results-list");

  // Kosongkan daftar hasil sebelumnya
  list.innerHTML = "";

  if (results.length === 0) {
    list.innerHTML =
      "<p>Tidak ada hasil diagnosa yang ditemukan. Silakan periksa gejala yang Anda pilih.</p>";
    container.style.display = "block";
    return;
  }

  results.forEach((result) => {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";
    resultItem.innerHTML = `
      <div class="result-disease">${result.penyakit}</div>
      <div class="result-cf">${result.cf}%</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${result.cf}%"></div>
      </div>
    `;
    list.appendChild(resultItem);
  });

  container.style.display = "block";
}

// Event listener untuk tombol diagnosa
document
  .getElementById("diagnose-btn")
  .addEventListener("click", async function () {
    const loading = document.getElementById("loading");
    const resultsContainer = document.getElementById("results-container");

    // Tampilkan loading
    loading.style.display = "block";
    resultsContainer.style.display = "none";

    // Dapatkan data CF
    const cfData = getCFData();

    try {
      // Kirim request ke backend
      const response = await fetch("/infer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cf_user: cfData }),
      });

      if (!response.ok) {
        throw new Error("Terjadi kesalahan saat memproses data");
      }

      const data = await response.json();
      displayResults(data.hasil);
    } catch (error) {
      console.error("Error:", error);
      alert(
        "Terjadi kesalahan saat menghubungi server. Pastikan backend berjalan dengan baik."
      );
    } finally {
      // Sembunyikan loading
      loading.style.display = "none";
    }

    // Scroll ke hasil
    resultsContainer.scrollIntoView({ behavior: "smooth" });
  });

// Event listener untuk tombol reset
document.getElementById("reset-btn").addEventListener("click", function () {
  const selects = document.querySelectorAll(".cf-select");
  selects.forEach((select) => {
    select.value = "";
  });

  document.getElementById("results-container").style.display = "none";
});

// Inisialisasi UI saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  loadGejala(); // Ambil data gejala dari backend
});
