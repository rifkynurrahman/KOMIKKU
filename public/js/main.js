// Genre pill filter (fallback if not using server-side)
document.querySelectorAll('.pill').forEach(p => {
  if (!p.getAttribute('href')) {
    p.addEventListener('click', function() {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
    });
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});
