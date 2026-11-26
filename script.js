// =========================================================================
// 1. KONFIGURASI TOKO (MUDAH DIUBAH DI SINI)
// =========================================================================

// Nomor WhatsApp Penjual (Gunakan format kode negara 62 tanpa tanda + atau spasi)
const SELLER_WHATSAPP = "6285770838109";

// Informasi Rekening / QRIS Tujuan Pembayaran
const PAYMENT_INFO = {
  bank: "BCA",
  accountNumber: "1234-5678-90",
  accountName: "TamanKopi Indonesia",
  ewallet: "DANA / GoPay / OVO: 0857-7083-8109",
  qrisNote: "Tersedia pembayaran QRIS atas nama TamanKopi"
};

// Daftar Menu Kopi (Ubah nama, harga dalam angka, atau path gambar di sini)
const COFFEE_MENU = [
  {
    id: 1,
    name: "Kopi Americano",
    price: 15000,
    image: "img/Menu/1.jpg"
  },
  {
    id: 2,
    name: "Kopi Good Day",
    price: 12000,
    image: "img/Products/good day.jpg"
  },
  {
    id: 3,
    name: "Kopi Latte",
    price: 20000,
    image: "img/Menu/latte.jpg"
  },
  {
    id: 4,
    name: "Kopi Susu Gula Aren",
    price: 18000,
    image: "img/Products/creamylatte.jpg"
  },
  {
    id: 5,
    name: "Cappuccino",
    price: 22000,
    image: "img/Menu/hazelnut.jpg"
  }
];

// Helper untuk format angka ke Rupiah (Contoh: 15000 -> Rp 15.000)
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

// =========================================================================
// 2. RENDER DAFTAR MENU & INFO REKENING KE HALAMAN
// =========================================================================

const menuContainer = document.getElementById("menu-container");
const paymentInfoContainer = document.getElementById("payment-info-container");

// Menampilkan kartu menu secara otomatis
function renderMenuCards() {
  if (!menuContainer) return;
  menuContainer.innerHTML = "";

  COFFEE_MENU.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="menu-card-img" onerror="this.src='img/Menu/1.jpg'" />
      <h3 class="menu-card-title">${item.name}</h3>
      <p class="menu-card-price">${formatRupiah(item.price)}</p>
      <button type="button" class="btn btn-order-card" data-id="${item.id}">
        <i data-feather="shopping-bag"></i> Pesan Sekarang
      </button>
    `;
    menuContainer.appendChild(card);
  });

  // Render ulang ikon Feather setelah elemen ditambahkan
  if (typeof feather !== "undefined") {
    feather.replace();
  }

  // Pasang event listener untuk setiap tombol "Pesan Sekarang"
  document.querySelectorAll(".btn-order-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      const coffeeId = parseInt(btn.getAttribute("data-id"));
      openOrderModal(coffeeId);
    });
  });
}

// Menampilkan info rekening di dalam modal pemesanan
function renderPaymentInfo() {
  if (!paymentInfoContainer) return;
  paymentInfoContainer.innerHTML = `
    <h4>💳 Tujuan Pembayaran</h4>
    <p><strong>Bank ${PAYMENT_INFO.bank}:</strong> ${PAYMENT_INFO.accountNumber} (a.n. ${PAYMENT_INFO.accountName})</p>
    <p><strong>E-Wallet:</strong> ${PAYMENT_INFO.ewallet}</p>
    <span class="qris-badge">QRIS: ${PAYMENT_INFO.qrisNote}</span>
  `;
}

// =========================================================================
// 3. LOGIKA FORM PEMESANAN, VALIDASI, PRATINJAU & WHATSAPP
// =========================================================================

const orderModal = document.getElementById("order-modal");
const closeOrderModalBtn = document.getElementById("close-order-modal");
const orderForm = document.getElementById("order-form");

const inputCoffeeName = document.getElementById("order-coffee-name");
const inputQty = document.getElementById("order-qty");
const totalDisplay = document.getElementById("order-total-display");
const inputCustomerName = document.getElementById("order-customer-name");
const inputCustomerWa = document.getElementById("order-customer-wa");
const inputNotes = document.getElementById("order-notes");
const inputProof = document.getElementById("order-proof");
const errorMsg = document.getElementById("order-error-msg");

const previewContainer = document.getElementById("proof-preview-container");
const previewImg = document.getElementById("proof-preview-img");

const successModal = document.getElementById("success-modal");
const closeSuccessModalBtn = document.getElementById("close-success-modal");
const doneOrderBtn = document.getElementById("done-order-btn");
const reopenWaLink = document.getElementById("reopen-wa-link");

let selectedCoffee = null;

// Membuka modal pemesanan dan mengisi otomatis nama kopi & harga
function openOrderModal(coffeeId) {
  selectedCoffee = COFFEE_MENU.find((item) => item.id === coffeeId);
  if (!selectedCoffee) return;

  // Reset form sebelum dibuka
  orderForm.reset();
  errorMsg.textContent = "";
  previewContainer.style.display = "none";
  previewImg.src = "";

  // Isi otomatis data kopi
  inputCoffeeName.value = `${selectedCoffee.name} (${formatRupiah(selectedCoffee.price)})`;
  inputQty.value = 1;
  updateTotalPrice();

  orderModal.style.display = "flex";
}

// Menghitung total harga otomatis (Harga x Jumlah)
function updateTotalPrice() {
  if (!selectedCoffee) return;
  const qty = parseInt(inputQty.value) || 0;
  const total = selectedCoffee.price * Math.max(qty, 0);
  totalDisplay.textContent = formatRupiah(total);
}

inputQty.addEventListener("input", updateTotalPrice);

// Pratinjau gambar bukti pembayaran sebelum dikirim
inputProof.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) {
    previewContainer.style.display = "none";
    previewImg.src = "";
    return;
  }

  // Pastikan file yang dipilih benar-benar gambar
  if (!file.type.startsWith("image/")) {
    errorMsg.textContent = "File harus berupa gambar (JPG, PNG, JPEG).";
    this.value = "";
    previewContainer.style.display = "none";
    return;
  }

  errorMsg.textContent = "";
  const reader = new FileReader();
  reader.onload = function (e) {
    previewImg.src = e.target.result;
    previewContainer.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// Validasi dan pengiriman pesanan ke WhatsApp
orderForm.addEventListener("submit", function (e) {
  e.preventDefault();
  errorMsg.textContent = "";

  const customerName = inputCustomerName.value.trim();
  const customerWa = inputCustomerWa.value.trim();
  const qty = parseInt(inputQty.value);
  const notes = inputNotes.value.trim() || "-";
  const proofFile = inputProof.files[0];

  // Validasi input
  if (!customerName) {
    errorMsg.textContent = "Nama customer wajib diisi.";
    inputCustomerName.focus();
    return;
  }

  if (!customerWa) {
    errorMsg.textContent = "Nomor WhatsApp customer wajib diisi.";
    inputCustomerWa.focus();
    return;
  }

  // Validasi nomor WA hanya boleh angka
  if (!/^\d+$/.test(customerWa)) {
    errorMsg.textContent = "Nomor WhatsApp hanya boleh berisi angka (contoh: 08123456789).";
    inputCustomerWa.focus();
    return;
  }

  if (isNaN(qty) || qty < 1) {
    errorMsg.textContent = "Jumlah pesanan minimal 1.";
    inputQty.focus();
    return;
  }

  if (!proofFile) {
    errorMsg.textContent = "Silakan upload gambar bukti pembayaran terlebih dahulu.";
    inputProof.focus();
    return;
  }

  const totalPrice = selectedCoffee.price * qty;

  // Format pesan otomatis untuk WhatsApp
  const message =
    `Halo *TamanKopi*, saya ingin memesan kopi:\n\n` +
    `*Nama Customer:* ${customerName}\n` +
    `*No. WhatsApp:* ${customerWa}\n` +
    `*Pesanan:* ${selectedCoffee.name}\n` +
    `*Jumlah:* ${qty} cup\n` +
    `*Total Harga:* ${formatRupiah(totalPrice)}\n` +
    `*Catatan:* ${notes}\n` +
    `*Status Pembayaran:* Bukti pembayaran sudah diupload di web (foto bukti transfer akan saya kirimkan manual di chat ini).\n\n` +
    `Terima kasih!`;

  const waUrl = `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(message)}`;

  // Simpan link ke tombol cadangan di modal sukses & buka WhatsApp di tab baru
  reopenWaLink.href = waUrl;
  window.open(waUrl, "_blank");

  // Tutup modal form, lalu tampilkan modal instruksi upload manual
  orderModal.style.display = "none";
  successModal.style.display = "flex";
});

// Tutup modal pemesanan & modal sukses
closeOrderModalBtn.onclick = (e) => {
  e.preventDefault();
  orderModal.style.display = "none";
};

closeSuccessModalBtn.onclick = (e) => {
  e.preventDefault();
  successModal.style.display = "none";
};

doneOrderBtn.onclick = () => {
  successModal.style.display = "none";
};

// =========================================================================
// 4. INTERAKSI NAVBAR, SEARCH, CART & MODAL PRODUK BAWAAN
// =========================================================================

const navbarNav = document.querySelector(".navbar-nav");
const searchForm = document.querySelector(".search-form");
const searchBox = document.querySelector("#search-box");
const shoppingCart = document.querySelector(".shopping-cart");

document.querySelector("#hamburger-menu").onclick = (e) => {
  navbarNav.classList.toggle("active");
  e.preventDefault();
};

document.querySelector("#search-button").onclick = (e) => {
  searchForm.classList.toggle("active");
  searchBox.focus();
  e.preventDefault();
};

document.querySelector("#shopping-cart-button").onclick = (e) => {
  shoppingCart.classList.toggle("active");
  e.preventDefault();
};

// Fitur pencarian menu langsung dari search bar
searchBox.addEventListener("input", function () {
  const keyword = this.value.toLowerCase();
  const cards = document.querySelectorAll(".menu-card");
  cards.forEach((card) => {
    const title = card.querySelector(".menu-card-title").textContent.toLowerCase();
    card.style.display = title.includes(keyword) ? "flex" : "none";
  });
});

// Klik di luar elemen navigasi
const hm = document.querySelector("#hamburger-menu");
const sb = document.querySelector("#search-button");
const sc = document.querySelector("#shopping-cart-button");

document.addEventListener("click", function (e) {
  if (!hm.contains(e.target) && !navbarNav.contains(e.target)) {
    navbarNav.classList.remove("active");
  }
  if (!sb.contains(e.target) && !searchForm.contains(e.target)) {
    searchForm.classList.remove("active");
  }
  if (!sc.contains(e.target) && !shoppingCart.contains(e.target)) {
    shoppingCart.classList.remove("active");
  }
});

// Modal Box Detail Produk
const itemDetailModal = document.querySelector("#item-detail-modal");
document.querySelectorAll(".item-detail-button").forEach((btn) => {
  btn.onclick = (e) => {
    itemDetailModal.style.display = "flex";
    e.preventDefault();
  };
});

document.querySelector("#close-detail-modal").onclick = (e) => {
  itemDetailModal.style.display = "none";
  e.preventDefault();
};

// Tutup modal jika area gelap di luar kotak diklik
window.onclick = (e) => {
  if (e.target === itemDetailModal) itemDetailModal.style.display = "none";
  if (e.target === orderModal) orderModal.style.display = "none";
  if (e.target === successModal) successModal.style.display = "none";
};

// Jalankan render awal saat halaman dimuat
renderMenuCards();
renderPaymentInfo();
