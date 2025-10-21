// ...existing code...
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('admin-login-form');
  const input = document.getElementById('adm-password');
  const msg = document.getElementById('login-msg');
  const btnCancel = document.getElementById('btn-cancel');
  const remember = document.getElementById('remember');

  // Senha temporária client-side para dev — trocar por backend em produção
  const SECRET = 'unibra@123';

  btnCancel.addEventListener('click', () => {
    window.location.href = 'galeria.html';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';

    const value = input.value || '';
    if (!value.trim()) {
      msg.textContent = 'Informe a senha.';
      return;
    }

    // Autenticação client-side (temporária)
    if (value === SECRET) {
      sessionStorage.setItem('adm_autenticado', '1');
      if (remember.checked) localStorage.setItem('adm_remember', '1'); // opcional
      // limpar senha por segurança local
      input.value = '';
      // redirecionar ao admin
      window.location.href = 'admin.html';
      return;
    }

    msg.textContent = 'Senha incorreta.';
  });

  // se já tiver "remember" (dev), reautenticar automaticamente
  if (localStorage.getItem('adm_remember') === '1') {
    sessionStorage.setItem('adm_autenticado', '1');
    window.location.href = 'admin.html';
  }
});
// ...existing code...