/* =====================================================
   GRIYA PALU PROPERTI — script.js
   Includes: navbar scroll, mobile menu, hero load,
             simulasi KPR (anuitas), FAQ accordion,
             form → WhatsApp, smooth scroll
   ===================================================== */

(function () {
  'use strict';

  /* ── 1. HELPERS ───────────────────────────────────── */

  /**
   * Format angka ke format Rupiah tanpa simbol.
   * Contoh: 1582000 → "1.582.000"
   */
  function formatRp(num) {
    if (!isFinite(num) || isNaN(num)) return '0';
    return Math.round(num).toLocaleString('id-ID');
  }

  /**
   * Parse input teks berformat Rupiah ke angka.
   * "250.000.000" → 250000000
   */
  function parseRp(str) {
    return Number(String(str).replace(/\./g, '').replace(/,/g, '.'));
  }

  /**
   * Hitung cicilan bulanan dengan rumus anuitas.
   * @param {number} pokok   - Pokok pinjaman (Rp)
   * @param {number} bunga   - Suku bunga tahunan (%)
   * @param {number} tenor   - Tenor dalam tahun
   * @returns {number} Cicilan per bulan
   */
  function hitungAnnuitas(pokok, bunga, tenor) {
    if (pokok <= 0 || tenor <= 0) return 0;
    if (bunga === 0) return pokok / (tenor * 12);
    const r = bunga / 100 / 12;           // bunga bulanan
    const n = tenor * 12;                  // total bulan
    return pokok * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  /* ── 2. NAVBAR ────────────────────────────────────── */
  const navbar   = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu  = document.getElementById('navMenu');

  // Tambah class 'scrolled' saat user scroll
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Mobile hamburger toggle
  hamburger.addEventListener('click', function () {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Tutup menu saat klik link
  navMenu.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ── 3. HERO LOAD ANIMATION ───────────────────────── */
  document.querySelector('.hero').classList.add('loaded');

  /* ── 4. SMOOTH SCROLL untuk anchor links ─────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const targetY = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  });

  /* ── 5. SIMULASI KPR ──────────────────────────────── */
  const elHargaRumah = document.getElementById('hargaRumah');
  const elDpPersen   = document.getElementById('dpPersen');
  const elDpNominal  = document.getElementById('dpNominal');
  const elTenor      = document.getElementById('tenor');
  const elBunga      = document.getElementById('bunga');
  const elHasil      = document.getElementById('hasilCicilan');
  const elBrHarga    = document.getElementById('brHarga');
  const elBrDP       = document.getElementById('brDP');
  const elBrPokok    = document.getElementById('brPokok');
  const elBrTenor    = document.getElementById('brTenor');
  const elBrBunga    = document.getElementById('brBunga');

  // Toggle mode DP: persen / nominal
  var dpMode = 'persen';
  document.querySelectorAll('.dp-mode').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.dp-mode').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      dpMode = this.dataset.mode;
      if (dpMode === 'persen') {
        document.getElementById('dpPersenWrap').classList.remove('hidden');
        document.getElementById('dpNominalWrap').classList.add('hidden');
      } else {
        document.getElementById('dpPersenWrap').classList.add('hidden');
        document.getElementById('dpNominalWrap').classList.remove('hidden');
        // Sinkronkan nilai
        var harga = parseRp(elHargaRumah.value);
        var pct   = parseFloat(elDpPersen.value) || 20;
        elDpNominal.value = formatRp(harga * pct / 100);
      }
      hitungDanTampilkan();
    });
  });

  // Preset bunga
  document.querySelectorAll('.bunga-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.bunga-preset').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      elBunga.value = this.dataset.bunga;
      hitungDanTampilkan();
    });
  });

  // Format input harga rumah saat mengetik
  elHargaRumah.addEventListener('input', function () {
    var raw = parseRp(this.value);
    if (raw > 0) this.value = formatRp(raw);
    hitungDanTampilkan();
  });
  elDpNominal.addEventListener('input', function () {
    var raw = parseRp(this.value);
    if (raw > 0) this.value = formatRp(raw);
    hitungDanTampilkan();
  });
  elDpPersen.addEventListener('input', hitungDanTampilkan);
  elTenor.addEventListener('change', hitungDanTampilkan);
  elBunga.addEventListener('input', function () {
    // Hapus preset aktif jika angka diubah manual
    document.querySelectorAll('.bunga-preset').forEach(function (b) {
      b.classList.toggle('active', parseFloat(b.dataset.bunga) === parseFloat(elBunga.value));
    });
    hitungDanTampilkan();
  });

  function hitungDanTampilkan() {
    var harga  = parseRp(elHargaRumah.value) || 0;
    var tenor  = parseInt(elTenor.value) || 15;
    var bunga  = parseFloat(elBunga.value) || 0;
    var dp;

    if (dpMode === 'persen') {
      var pct = Math.max(0, Math.min(parseFloat(elDpPersen.value) || 0, 99));
      dp = harga * pct / 100;
    } else {
      dp = parseRp(elDpNominal.value) || 0;
    }

    dp = Math.max(0, Math.min(dp, harga));
    var pokok = harga - dp;
    var cicilan = hitungAnnuitas(pokok, bunga, tenor);

    elHasil.textContent  = 'Rp ' + formatRp(cicilan);
    elBrHarga.textContent = 'Rp ' + formatRp(harga);
    elBrDP.textContent    = 'Rp ' + formatRp(dp);
    elBrPokok.textContent = 'Rp ' + formatRp(pokok);
    elBrTenor.textContent = tenor + ' Tahun (' + (tenor * 12) + ' bulan)';
    elBrBunga.textContent = bunga + '% per tahun';
  }

  // Hitung langsung saat halaman pertama dibuka
  hitungDanTampilkan();

  /* ── 6. FAQ ACCORDION ─────────────────────────────── */
  document.querySelectorAll('.faq__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = this.closest('.faq__item');
      var isOpen = item.classList.contains('open');

      // Tutup semua item lain
      document.querySelectorAll('.faq__item').forEach(function (el) {
        el.classList.remove('open');
        el.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });

      // Toggle item yang diklik
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        // Scroll ringan agar item tidak tertutup navbar
        setTimeout(function () {
          var navH = navbar.offsetHeight;
          var rect = item.getBoundingClientRect();
          if (rect.top < navH + 16) {
            window.scrollBy({ top: rect.top - navH - 16, behavior: 'smooth' });
          }
        }, 50);
      }
    });
  });

  /* ── 7. FORM → WHATSAPP ───────────────────────────── */
  var submitBtn = document.getElementById('submitForm');
  var formError = document.getElementById('formError');

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var nama  = (document.getElementById('fNama').value  || '').trim();
      var wa    = (document.getElementById('fWA').value    || '').trim();
      var tipe  = (document.getElementById('fTipe').value  || '').trim();
      var pesan = (document.getElementById('fPesan').value || '').trim();

      // Validasi minimal
      if (!nama) {
        formError.textContent = 'Nama lengkap wajib diisi.';
        document.getElementById('fNama').focus();
        return;
      }
      if (!wa || wa.replace(/\D/g, '').length < 9) {
        formError.textContent = 'Nomor WhatsApp tidak valid.';
        document.getElementById('fWA').focus();
        return;
      }
      formError.textContent = '';

      // Susun pesan WA
      var waMsg = '🏡 *Formulir Minat — Griya Palu Properti*\n\n';
      waMsg += '*Nama:* ' + nama + '\n';
      waMsg += '*No. WA:* ' + wa + '\n';
      if (tipe) waMsg += '*Tipe Rumah Diminati:* ' + tipe + '\n';
      if (pesan) waMsg += '*Pesan:* ' + pesan + '\n';
      waMsg += '\nMohon info lebih lanjut. Terima kasih!';

      // GANTI: Ambil nomor WA dari data-attribute tombol
      var noWA = submitBtn.dataset.wa || '628123456789';
      var url  = 'https://wa.me/' + noWA + '?text=' + encodeURIComponent(waMsg);
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

  /* ── 8. INTERSECTION OBSERVER — reveal on scroll ─── */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll(
      '.keunggulan__card, .rumah-card, .testi-card, .faq__item, .lokasi__item'
    ).forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity .45s ease, transform .45s ease';
      observer.observe(el);
    });
  }

})();
