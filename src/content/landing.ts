export const LANDING = {
  brand: 'BloodLink',
  nav: [
    { href: '#cara-kerja', label: 'Cara kerja' },
    { href: '#untuk-donor', label: 'Untuk donor' },
    { href: '#untuk-fasilitas', label: 'Untuk rumah sakit' },
  ],
  hero: {
    title: 'Stok darah yang bisa dipercaya, antar fasilitas',
    subtitle:
      'Rumah sakit dan bank darah sering kehilangan waktu berharga hanya untuk memastikan stok yang benar-benar ada. BloodLink menyatukan data stok darah antar fasilitas secara real-time, supaya keputusan diambil dari angka yang benar, bukan telepon dan tebakan.',
    ctaPrimary: { href: '#untuk-donor', label: 'Saya ingin jadi donor' },
    ctaSecondary: { href: '#untuk-fasilitas', label: 'Untuk rumah sakit & bank darah' },
  },
  howItWorks: [
    {
      step: '01',
      title: 'Fasilitas mencatat stok',
      body: 'Setiap kantong darah dicatat sejak diterima, lengkap dengan status dan masa berlakunya, langsung dari fasilitas yang menyimpannya.',
    },
    {
      step: '02',
      title: 'Data tersinkron antar fasilitas',
      body: 'Status stok terlihat oleh fasilitas lain yang berwenang, tanpa perlu telepon atau menunggu laporan manual.',
    },
    {
      step: '03',
      title: 'Permintaan dijawab lebih cepat',
      body: 'Saat stok dibutuhkan mendesak, petugas langsung tahu fasilitas mana yang punya kantong yang cocok dan siap dipakai.',
    },
  ] as ReadonlyArray<{ step: string; title: string; body: string }>,
  donor: {
    title: 'Untuk calon donor',
    body: 'Donor darahmu berarti lebih besar ketika catatannya jelas. Sistem ini membantu fasilitas melacak setiap kantong donor sampai ke pasien yang membutuhkannya.',
    points: [
      'Riwayat donor tersimpan rapi di fasilitas tempatmu mendonor',
      'Stok darah golonganmu terlihat oleh fasilitas yang butuh sewaktu-waktu',
      'Tidak ada pendaftaran akun di halaman ini — datang langsung ke fasilitas terdekat',
    ] as readonly string[],
  },
  facility: {
    title: 'Untuk rumah sakit & bank darah',
    body: 'Kelola stok kantong darah fasilitasmu dan lihat ketersediaan di fasilitas mitra, supaya permintaan mendesak tidak lagi bergantung pada telepon dan tebakan.',
    points: [
      'Status tiap kantong darah terlacak dari masuk sampai dipakai atau kedaluwarsa',
      'Permintaan antar fasilitas tercatat dan bisa ditelusuri',
      'Akses dibatasi per fasilitas — data yang terlihat hanya yang berwenang dilihat',
    ] as readonly string[],
  },
  footer: {
    tagline: 'BloodLink — stok darah antar fasilitas, satu sumber data.',
    note: 'Dibangun untuk rumah sakit, bank darah, dan unit donor darah.',
  },
} as const;
