const form = document.getElementById('uploadForm');
    const coverInput = document.getElementById('coverImage');
    const coverZone = document.getElementById('coverZone');
    const coverPreviewImage = document.getElementById('coverPreviewImage');
    const coverMeta = document.getElementById('coverMeta');
    const chapterList = document.getElementById('chapterList');
    const chapterCount = document.getElementById('chapterCount');
    const addChapterBtn = document.getElementById('addChapterBtn');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');

    let chapterIndex = 0;

    function formatSize(bytes) {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    }

    function showMessage(type, message) {
      const target = type === 'success' ? successMsg : errorMsg;
      const other = type === 'success' ? errorMsg : successMsg;
      other.style.display = 'none';
      target.textContent = message;
      target.style.display = 'block';
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function fileKey(file) {
      return `${file.name}-${file.size}-${file.lastModified}`;
    }

    function mergeInputFiles(input, newFiles) {
      const dataTransfer = new DataTransfer();
      const existingKeys = new Set();
      const existingFiles = input.selectedChapterFiles || [];

      existingFiles.forEach((file) => {
        dataTransfer.items.add(file);
        existingKeys.add(fileKey(file));
      });

      Array.from(newFiles || []).forEach((file) => {
        const key = fileKey(file);
        if (!existingKeys.has(key)) {
          dataTransfer.items.add(file);
          existingKeys.add(key);
        }
      });

      input.files = dataTransfer.files;
      input.selectedChapterFiles = Array.from(dataTransfer.files);
    }

    function attachDropZone(zone, input, callback, options = {}) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        zone.addEventListener(eventName, (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      });

      ['dragenter', 'dragover'].forEach((eventName) => {
        zone.addEventListener(eventName, () => zone.classList.add('active'));
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        zone.addEventListener(eventName, () => zone.classList.remove('active'));
      });

      zone.addEventListener('drop', (event) => {
        if (options.appendFiles) {
          mergeInputFiles(input, event.dataTransfer.files);
        } else {
          input.files = event.dataTransfer.files;
        }
        callback();
      });
    }

    function updateCoverPreview() {
      const file = coverInput.files && coverInput.files[0];
      if (!file) {
        coverZone.classList.remove('has-file');
        coverPreviewImage.removeAttribute('src');
        coverMeta.textContent = '';
        return;
      }

      coverZone.classList.add('has-file');
      coverPreviewImage.src = URL.createObjectURL(file);
      coverMeta.textContent = `${file.name} - ${formatSize(file.size)}`;
    }

    function updateChapterCount() {
      const count = chapterList.querySelectorAll('.chapter-item').length;
      chapterCount.textContent = `${count} chapter`;
    }

    function updateChapterPreview(item) {
      const input = item.querySelector('.chapter-pages-input');
      const preview = item.querySelector('.pages-preview');
      const files = Array.from(input.files || []);

      if (files.length === 0) {
        preview.textContent = 'Belum ada gambar halaman.';
        return;
      }

      const names = files.slice(0, 4).map((file, index) => `${index + 1}. ${file.name}`).join('<br>');
      const extra = files.length > 4 ? `<br>+ ${files.length - 4} file lainnya` : '';
      preview.innerHTML = `<strong>${files.length} halaman dipilih</strong><br>${names}${extra}`;
    }

    function createChapter() {
      chapterIndex += 1;
      const key = String(chapterIndex);
      const item = document.createElement('div');
      item.className = 'chapter-item';
      item.innerHTML = `
        <input type="hidden" name="chapterKeys" value="${key}">
        <div class="chapter-head">
          <div class="form-group" style="margin-bottom: 0;">
            <label for="chapterNumber_${key}">Nomor</label>
            <input type="number" id="chapterNumber_${key}" name="chapterNumber_${key}" min="1" required value="${chapterIndex}">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label for="chapterTitle_${key}">Judul chapter</label>
            <input type="text" id="chapterTitle_${key}" name="chapterTitle_${key}" required value="Chapter ${chapterIndex}">
          </div>
          <button type="button" class="button button-danger remove-chapter" title="Hapus chapter">Hapus</button>
        </div>
        <div class="pages-zone">
          <input class="chapter-pages-input" type="file" id="chapterPages_${key}" name="chapterPages_${key}" accept="image/jpeg,image/jpg,image/png,image/webp" multiple required>
          <label class="pages-label" for="chapterPages_${key}">Pilih gambar halaman chapter</label>
        </div>
        <div class="pages-preview">Belum ada gambar halaman.</div>
      `;

      const zone = item.querySelector('.pages-zone');
      const input = item.querySelector('.chapter-pages-input');
      const removeButton = item.querySelector('.remove-chapter');

      input.addEventListener('change', () => {
        mergeInputFiles(input, input.files);
        updateChapterPreview(item);
      });
      attachDropZone(zone, input, () => updateChapterPreview(item), { appendFiles: true });

      removeButton.addEventListener('click', () => {
        item.remove();
        updateChapterCount();
      });

      chapterList.appendChild(item);
      updateChapterCount();
    }

    coverInput.addEventListener('change', updateCoverPreview);
    attachDropZone(coverZone, coverInput, updateCoverPreview);
    addChapterBtn.addEventListener('click', createChapter);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMsg.style.display = 'none';
      successMsg.style.display = 'none';

      if (chapterList.querySelectorAll('.chapter-item').length === 0) {
        showMessage('error', 'Tambahkan minimal satu chapter.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          credentials: 'same-origin',
          body: new FormData(form)
        });

        const data = await response.json();

        if (response.status === 401) {
          showMessage('error', data.error || 'Sesi login berakhir. Silakan login ulang.');
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 900);
          return;
        }

        if (!response.ok || !data.success) {
          showMessage('error', data.error || 'Upload gagal.');
          return;
        }

        showMessage('success', data.message || 'Komik berhasil disimpan.');
        setTimeout(() => {
          window.location.href = data.redirectTo || '/profile';
        }, 1000);
      } catch (err) {
        showMessage('error', 'Terjadi kesalahan saat upload.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Komik';
      }
    });

    createChapter();
