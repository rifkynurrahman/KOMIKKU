// data/dummyData.js — Dummy data untuk semua halaman Guest

const GENRE_COLORS = {
  'Action':       '#ef4444',
  'Romance':      '#ec4899',
  'Fantasy':      '#a855f7',
  'Horror':       '#f97316',
  'Comedy':       '#eab308',
  'Sci-Fi':       '#06b6d4',
  'Slice of Life':'#22c55e',
  'Thriller':     '#f43f5e',
};

const GENRES = Object.keys(GENRE_COLORS);

// Placeholder covers (warna blok, bisa diganti URL asli)
const COVERS = [
  'https://placehold.co/300x420/1a0a2e/1a0a2e',
  'https://placehold.co/300x420/0d1b2e/0d1b2e',
  'https://placehold.co/300x420/0a1a0a/0a1a0a',
  'https://placehold.co/300x420/1a0505/1a0505',
  'https://placehold.co/300x420/1a1205/1a1205',
  'https://placehold.co/300x420/051a1a/051a1a',
  'https://placehold.co/300x420/1a0510/1a0510',
  'https://placehold.co/300x420/0d0d1a/0d0d1a',
  'https://placehold.co/300x420/1a1a05/1a1a05',
  'https://placehold.co/300x420/0a0a1a/0a0a1a',
  'https://placehold.co/300x420/1a0a0a/1a0a0a',
  'https://placehold.co/300x420/051205/051205',
];

const PAGES = Array.from({ length: 8 }, (_, i) =>
  `https://placehold.co/800x1200/111111/111111`
);

const comics = [
  {
    id: 1, title: 'Bayangan Arya', genre: 'Action', genreColor: GENRE_COLORS['Action'],
    author: 'Rendra K.', cover: COVERS[1], views: '1.2JT', rating: '4.8',
    latestChapter: 48, updatedAt: '2 jam lalu', badge: 'HOT', status: 'Ongoing',
    description: 'Arya, seorang pemuda biasa, menemukan bahwa dirinya adalah penerus klan bayangan kuno yang telah lama punah. Kini ia harus berjuang mempertahankan keseimbangan dunia dari ancaman kegelapan yang bangkit kembali.',
    chapters: [
      { number: 1, title: 'Awal Mula', date: '1 bulan lalu' },
      { number: 2, title: 'Kekuatan Tersembunyi', date: '3 minggu lalu' },
      { number: 3, title: 'Musuh Pertama', date: '2 minggu lalu' },
      { number: 4, title: 'Klan Bayangan', date: '1 minggu lalu' },
      { number: 5, title: 'Pertempuran Malam', date: '3 hari lalu' },
    ],
  },
  {
    id: 2, title: 'Bintang di Langit Jakarta', genre: 'Romance', genreColor: GENRE_COLORS['Romance'],
    author: 'Sari W.', cover: COVERS[6], views: '890K', rating: '4.9',
    latestChapter: 32, updatedAt: '5 jam lalu', badge: 'HOT', status: 'Ongoing',
    description: 'Dua jiwa yang bertemu di bawah langit Jakarta — seorang arsitek ambisius dan seorang seniman jalanan. Kisah cinta yang lahir dari perbedaan, diuji oleh mimpi dan jarak.',
    chapters: [
      { number: 1, title: 'Pertemuan Tak Terduga', date: '2 bulan lalu' },
      { number: 2, title: 'Sketsa Pertama', date: '6 minggu lalu' },
      { number: 3, title: 'Malam di Blok M', date: '1 bulan lalu' },
    ],
  },
  {
    id: 3, title: 'Negeri Tanpa Nama', genre: 'Fantasy', genreColor: GENRE_COLORS['Fantasy'],
    author: 'Dika F.', cover: COVERS[0], views: '2.1JT', rating: '4.7',
    latestChapter: 120, updatedAt: '1 hari lalu', badge: 'HOT', status: 'Ongoing',
    description: 'Sebuah dunia paralel tersembunyi di balik kabut mistis pegunungan Jawa. Seorang gadis remaja terpilih menjadi penjaga gerbang antar dimensi dan harus menghadapi ancaman dari dalam maupun luar negeri tersembunyi itu.',
    chapters: [
      { number: 1, title: 'Gerbang Kabut', date: '6 bulan lalu' },
      { number: 2, title: 'Penjaga Pertama', date: '5 bulan lalu' },
      { number: 3, title: 'Musuh dari Timur', date: '4 bulan lalu' },
      { number: 4, title: 'Rahasia Kerajaan', date: '3 bulan lalu' },
    ],
  },
  {
    id: 4, title: 'Hantu Kos 13', genre: 'Horror', genreColor: GENRE_COLORS['Horror'],
    author: 'Anisa P.', cover: COVERS[3], views: '654K', rating: '4.5',
    latestChapter: 15, updatedAt: '3 hari lalu', badge: 'NEW', status: 'Ongoing',
    description: 'Lima mahasiswa baru tinggal di kos tua nomor 13. Satu per satu mereka mulai melihat hal-hal yang tidak bisa dijelaskan. Apakah hantu itu nyata, atau hanya pikiran mereka yang kelelahan?',
    chapters: [
      { number: 1, title: 'Malam Pertama', date: '3 minggu lalu' },
      { number: 2, title: 'Suara di Dinding', date: '2 minggu lalu' },
      { number: 3, title: 'Penghuni Lama', date: '1 minggu lalu' },
    ],
  },
  {
    id: 5, title: 'Warung Pak Budi', genre: 'Comedy', genreColor: GENRE_COLORS['Comedy'],
    author: 'Hendra S.', cover: COVERS[4], views: '445K', rating: '4.6',
    latestChapter: 60, updatedAt: '1 hari lalu', badge: 'UP', status: 'Ongoing',
    description: 'Warung nasi Pak Budi yang sederhana menjadi magnet bagi pelanggan unik dari berbagai kalangan. Komedi sehari-hari yang hangat dan menghibur tentang persahabatan dan keberagaman.',
    chapters: [
      { number: 1, title: 'Pembukaan Warung', date: '4 bulan lalu' },
      { number: 2, title: 'Pelanggan Pertama', date: '3.5 bulan lalu' },
      { number: 3, title: 'Kompetisi Warung', date: '3 bulan lalu' },
    ],
  },
  {
    id: 6, title: 'Antariksa 2099', genre: 'Sci-Fi', genreColor: GENRE_COLORS['Sci-Fi'],
    author: 'Rizal M.', cover: COVERS[5], views: '320K', rating: '4.4',
    latestChapter: 25, updatedAt: '6 hari lalu', badge: 'NEW', status: 'Ongoing',
    description: 'Tahun 2099, umat manusia telah menjajah tata surya. Seorang pilot muda dari Indonesia memimpin misi berbahaya ke asteroid misterius yang mengeluarkan sinyal aneh.',
    chapters: [
      { number: 1, title: 'Launch Day', date: '2 bulan lalu' },
      { number: 2, title: 'Sinyal Asing', date: '1.5 bulan lalu' },
    ],
  },
  {
    id: 7, title: 'Hari-Hari di Jogja', genre: 'Slice of Life', genreColor: GENRE_COLORS['Slice of Life'],
    author: 'Putri D.', cover: COVERS[2], views: '287K', rating: '4.7',
    latestChapter: 44, updatedAt: '2 hari lalu', badge: null, status: 'Completed',
    description: 'Catatan harian seorang mahasiswi seni dari Surabaya yang merantau ke Jogjakarta. Kisah sederhana tentang tumbuh dewasa, menemukan diri sendiri, dan keajaiban kota istimewa.',
    chapters: [
      { number: 1, title: 'Pertama Kali di Jogja', date: '5 bulan lalu' },
      { number: 2, title: 'Malioboro Pagi', date: '4.5 bulan lalu' },
    ],
  },
  {
    id: 8, title: 'Konspirasi Merah', genre: 'Thriller', genreColor: GENRE_COLORS['Thriller'],
    author: 'Bagas N.', cover: COVERS[7], views: '512K', rating: '4.8',
    latestChapter: 38, updatedAt: '4 jam lalu', badge: 'HOT', status: 'Ongoing',
    description: 'Seorang jurnalis investigasi muda menemukan dokumen rahasia yang mengungkap konspirasi besar di balik pembangunan ibu kota baru. Nyawanya segera terancam.',
    chapters: [
      { number: 1, title: 'Dokumen Bocor', date: '3 bulan lalu' },
      { number: 2, title: 'Dikejar', date: '2.5 bulan lalu' },
      { number: 3, title: 'Pelindung Misterius', date: '2 bulan lalu' },
    ],
  },
  {
    id: 9, title: 'Pedang Sang Raja', genre: 'Fantasy', genreColor: GENRE_COLORS['Fantasy'],
    author: 'Fajar L.', cover: COVERS[9], views: '198K', rating: '4.3',
    latestChapter: 18, updatedAt: '1 minggu lalu', badge: 'NEW', status: 'Ongoing',
    description: 'Legenda pedang keramat yang hilang selama seribu tahun ditemukan kembali oleh seorang pandai besi muda. Kini kerajaan-kerajaan berseteru memperebutkannya.',
    chapters: [
      { number: 1, title: 'Temuan di Sungai', date: '6 minggu lalu' },
    ],
  },
  {
    id: 10, title: 'Si Jojon & Kawan', genre: 'Comedy', genreColor: GENRE_COLORS['Comedy'],
    author: 'Citra K.', cover: COVERS[8], views: '411K', rating: '4.5',
    latestChapter: 77, updatedAt: '5 hari lalu', badge: 'UP', status: 'Ongoing',
    description: 'Petualangan kocak Jojon dan gengnya di SMA Nusantara. Dari drama percintaan, lomba antar kelas, hingga persaingan dengan sekolah tetangga.',
    chapters: [
      { number: 1, title: 'Hari Pertama Sekolah', date: '7 bulan lalu' },
      { number: 2, title: 'Geng Baru', date: '6.5 bulan lalu' },
    ],
  },
  {
    id: 11, title: 'Virus Nol', genre: 'Sci-Fi', genreColor: GENRE_COLORS['Sci-Fi'],
    author: 'Rendy H.', cover: COVERS[10], views: '156K', rating: '4.2',
    latestChapter: 9, updatedAt: '2 minggu lalu', badge: 'NEW', status: 'Ongoing',
    description: 'Sebuah virus digital menginfeksi sistem AI seluruh dunia. Hanya seorang hacker remaja dari Bandung yang bisa menghentikannya sebelum menyebabkan kekacauan global.',
    chapters: [
      { number: 1, title: 'Infeksi Pertama', date: '5 minggu lalu' },
    ],
  },
  {
    id: 12, title: 'Rindu Kampung', genre: 'Slice of Life', genreColor: GENRE_COLORS['Slice of Life'],
    author: 'Dewi S.', cover: COVERS[11], views: '234K', rating: '4.6',
    latestChapter: 55, updatedAt: '3 hari lalu', badge: null, status: 'Completed',
    description: 'Mengisahkan pemuda yang kembali ke kampung halaman setelah 10 tahun merantau. Ia menemukan banyak yang berubah, namun kehangatan desa tetap ada dalam setiap sudutnya.',
    chapters: [
      { number: 1, title: 'Pulang', date: '4 bulan lalu' },
    ],
  },
];

function getComicById(id) {
  return comics.find(c => c.id === parseInt(id)) || null;
}

function getChapterPages() {
  return PAGES;
}

function getSimilarComics(comic, limit = 4) {
  return comics
    .filter(c => c.id !== comic.id && c.genre === comic.genre)
    .slice(0, limit)
    .concat(comics.filter(c => c.id !== comic.id && c.genre !== comic.genre))
    .slice(0, limit);
}

function filterComics(genre, query) {
  let result = [...comics];
  if (genre) result = result.filter(c => c.genre === genre);
  if (query) result = result.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
  return result;
}

module.exports = { comics, GENRES, getComicById, getChapterPages, getSimilarComics, filterComics };