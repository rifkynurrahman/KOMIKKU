const avatarInput = document.getElementById('avatarInput');
const avatarPreview = document.getElementById('avatarPreview');
const avatarActions = document.getElementById('avatarActions');
const clearAvatar = document.getElementById('clearAvatar');

if (avatarInput) {
  avatarInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (avatarPreview && avatarActions) {
      const reader = new FileReader();
      reader.onload = () => {
        avatarPreview.style.display = 'block';
        avatarPreview.innerHTML = `<img src="${reader.result}" alt="Preview Avatar">`;
        avatarActions.style.display = 'flex';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (clearAvatar && avatarInput) {
  clearAvatar.addEventListener('click', () => {
    avatarInput.value = '';
    if (avatarPreview) {
      avatarPreview.style.display = 'none';
      avatarPreview.innerHTML = '';
    }
    if (avatarActions) {
      avatarActions.style.display = 'none';
    }
  });
}
