/*
  admin.js - painel ADMIN sincronizado com filtros/galeria.
  Atualizado: suporte a upload local de imagem e salvamento na galeria localStorage.
*/

document.addEventListener('DOMContentLoaded', () => {
  // CONFIG
  const PAGE_SIZE = 8;

  // DOM
  const tblBody = document.querySelector('#tbl-animals tbody');
  const form = document.getElementById('animal-form');
  const inputs = {
    id: document.getElementById('animal-id'),
    nome: document.getElementById('animal-nome'),
    categoria: document.getElementById('animal-categoria'),
    tipo: document.getElementById('animal-tipo'),
    idade: document.getElementById('animal-idade'),
    genero: document.getElementById('animal-genero'),
    tamanho: document.getElementById('animal-tamanho'),
    local: document.getElementById('animal-local'),
    imagem: document.getElementById('animal-imagem'),
    descricao: document.getElementById('animal-descricao'),
    carac: document.getElementById('animal-carac'),
    necessidades: document.getElementById('flag-necessidades'),
    emPar: document.getElementById('flag-empar'),
    multiplos: document.getElementById('flag-multiplos'),
    urgente: document.getElementById('flag-urgente'),
    vacinado: document.getElementById('flag-vacinado'),
    castrado: document.getElementById('flag-castrado')
  };
  const preview = document.getElementById('image-preview');
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const pageInfo = document.getElementById('page-info');
  const prevPage = document.getElementById('prev-page');
  const nextPage = document.getElementById('next-page');
  const btnNew = document.getElementById('btn-new');
  const btnBulkDelete = document.getElementById('btn-bulk-delete');

  // STATE
  let data = [];
  let filtered = [];
  let page = 1;
  let selectedIds = new Set();

  // Utils
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const showToast = (msg, type = 'info') => {
    const t = document.createElement('div');
    t.className = `admin-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => t.classList.remove('show'), 3500);
    setTimeout(() => t.remove(), 3900);
  };

  // Local persistence
  const getPets = async () => JSON.parse(localStorage.getItem('pets_db_v2') || '[]');
  const saveLocal = async (pets) => localStorage.setItem('pets_db_v2', JSON.stringify(pets));

  const createPet = async (payload) => {
    const pets = await getPets();
    const item = { id: uid(), createdAt: new Date().toISOString(), ...payload };
    pets.unshift(item);
    await saveLocal(pets);
    return item;
  };

  const updatePet = async (id, payload) => {
    const pets = await getPets();
    const idx = pets.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Not found');
    pets[idx] = { ...pets[idx], ...payload, updatedAt: new Date().toISOString() };
    await saveLocal(pets);
    return pets[idx];
  };

  const deletePet = async (id) => {
    let pets = await getPets();
    pets = pets.filter(p => p.id !== id);
    await saveLocal(pets);
    return true;
  };

  // GALERIA: também salva os animais com imagem
  const salvarNaGaleria = (animal) => {
    let galeria = JSON.parse(localStorage.getItem('galeria')) || [];
    galeria.push(animal);
    localStorage.setItem('galeria', JSON.stringify(galeria));
  };

  // PREVIEW DE IMAGEM
  inputs.imagem.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        preview.innerHTML = `<img src="${evt.target.result}" style="max-width:150px;border-radius:8px;">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = '';
    }
  });

  // FORM SUBMIT
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!inputs.nome.value.trim()) {
      showToast('Nome é obrigatório', 'warning');
      return;
    }

    const file = inputs.imagem.files[0];
    let imgDataUrl = '';

    const payloadBase = {
      nome: inputs.nome.value.trim(),
      categoria: inputs.categoria.value.trim(),
      tipo: inputs.tipo.value.trim(),
      idade: inputs.idade.value.trim(),
      genero: inputs.genero.value.trim(),
      tamanho: inputs.tamanho.value.trim(),
      local: inputs.local.value.trim(),
      descricao: inputs.descricao.value.trim(),
      caracteristicas: inputs.carac.value
        ? inputs.carac.value.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      necessidades: inputs.necessidades.checked,
      emPar: inputs.emPar.checked,
      multiplos: inputs.multiplos.checked,
      urgente: inputs.urgente.checked,
      vacinado: inputs.vacinado.checked,
      castrado: inputs.castrado.checked
    };

    const salvarAnimal = async (img) => {
      const payload = { ...payloadBase, imagem: img || '' };
      let result;
      if (inputs.id.value) {
        result = await updatePet(inputs.id.value, payload);
        showToast('Atualizado com sucesso', 'success');
      } else {
        result = await createPet(payload);
        showToast('Criado com sucesso', 'success');
      }
      if (payload.imagem) salvarNaGaleria(payload);
      clearForm();
      await refreshData();
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        imgDataUrl = evt.target.result;
        await salvarAnimal(imgDataUrl);
      };
      reader.readAsDataURL(file);
    } else {
      await salvarAnimal('');
    }
  });

  // CARREGAR / ATUALIZAR
  async function refreshData() {
    try {
      data = await getPets();
      data = data.map(d => ({ createdAt: d.createdAt || new Date().toISOString(), ...d }));
      page = 1;
      applySearchSortAndPaginate();
    } catch (err) {
      console.error(err);
      showToast('Erro ao carregar dados', 'danger');
    }
  }

  // RENDER TABLE
  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"']/g, s => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]
    ));
  }

  function renderRow(p) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;
    tr.innerHTML = `
      <td class="td-preview"><img src="${escapeHtml(p.imagem || '')}" alt="${escapeHtml(p.nome || '')}" onerror="this.src='assets/img/foto1.jpg'"></td>
      <td><strong>${escapeHtml(p.nome || '')}</strong><br><small>${escapeHtml(p.tipo || '')}</small></td>
      <td>${escapeHtml(p.idade || '')}</td>
      <td>${escapeHtml(p.local || '')}</td>
      <td><button class="btn btn-secondary btn-edit" data-id="${p.id}">Editar</button>
      <button class="btn btn-outline-danger btn-delete" data-id="${p.id}">Excluir</button></td>`;
    return tr;
  }

  function applySearchSortAndPaginate() {
    const q = (searchInput.value || '').toLowerCase();
    filtered = data.filter(p => !q || `${p.nome} ${p.tipo} ${p.local}`.toLowerCase().includes(q));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    const items = filtered.slice(start, start + PAGE_SIZE);
    tblBody.innerHTML = '';
    items.forEach(p => tblBody.appendChild(renderRow(p)));
    pageInfo.textContent = `${page} / ${totalPages}`;
  }

  searchInput.addEventListener('input', () => { page = 1; applySearchSortAndPaginate(); });
  sortSelect.addEventListener('change', () => { page = 1; applySearchSortAndPaginate(); });
  prevPage.addEventListener('click', () => { if (page > 1) { page--; applySearchSortAndPaginate(); } });
  nextPage.addEventListener('click', () => { const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); if (page < totalPages) { page++; applySearchSortAndPaginate(); } });

  // limpar formulário
  function clearForm() {
    form.reset();
    inputs.id.value = '';
    preview.innerHTML = '';
    document.getElementById('form-title').textContent = 'Criar Animal';
  }

  // iniciar
  (async () => {
    if (sessionStorage.getItem('adm_autenticado') !== '1') {
      alert('Área restrita. Redirecionando...');
      window.location.href = 'galeria.html';
      return;
    }
    await refreshData();
  })();
});
