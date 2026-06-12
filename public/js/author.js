document.querySelectorAll('.delete-comic-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const confirmed = confirm('Hapus komik ini? Semua data chapter dan gambar upload milik komik ini akan dihapus.');
    if (!confirmed) {
      event.preventDefault();
    }
  });
});

document.querySelectorAll('.toggle-chapter-form').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.author-comic-card');
    const form = card.querySelector('.add-chapter-form');
    const isOpen = form.classList.toggle('is-open');
    button.textContent = isOpen ? 'Tutup Form' : 'Tambah Chapter';
  });
});

document.querySelectorAll('.chapter-pages-input').forEach((input) => {
  input.addEventListener('change', () => {
    const preview = input.closest('.author-field').querySelector('.chapter-pages-preview');
    const files = Array.from(input.files || []);

    if (files.length === 0) {
      preview.textContent = 'Belum ada gambar dipilih.';
      return;
    }

    const names = files.slice(0, 4).map((file, index) => `${index + 1}. ${file.name}`).join('<br>');
    const extra = files.length > 4 ? `<br>+ ${files.length - 4} file lainnya` : '';
    preview.innerHTML = `<strong>${files.length} halaman dipilih</strong><br>${names}${extra}`;
  });
});
