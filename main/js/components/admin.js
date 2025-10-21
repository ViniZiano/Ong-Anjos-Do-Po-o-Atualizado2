// ...existing code...
/*
  admin.js - painel ADMIN sincronizado com filtros/galeria.
  Campos sincronizados: categoria, tipo, idade, genero, tamanho, local, caracteristicas (array),
  necessidades, emPar, multiplos, urgente, vacinado, castrado.
  Substitua API_URL para conectar ao backend.
*/

document.addEventListener('DOMContentLoaded', () => {
  // CONFIG
  const API_URL = '/api/animals'; // trocar para '/api/animals' quando tiver backend
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
  const searchInput = document.getElementById('search');
  const sortSelect = document.getElementById('sort');
  const preview = document.getElementById('image-preview');
  const btnLogout = document.getElementById('btn-logout');
  const btnNew = document.getElementById('btn-new');
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const fileImport = document.getElementById('file-import');
  const pageInfo = document.getElementById('page-info');
  const prevPage = document.getElementById('prev-page');
  const nextPage = document.getElementById('next-page');
  const btnBulkDelete = document.getElementById('btn-bulk-delete');

  // Confirm modal
  const confirmModal = document.getElementById('confirm-modal');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');

  // STATE
  let data = [];
  let filtered = [];
  let page = 1;
  let selectedIds = new Set();

  // Utils
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
  function showToast(msg, type='info') {
    const t = document.createElement('div');
    t.className = `admin-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('show'), 10);
    setTimeout(()=> t.classList.remove('show'), 3500);
    setTimeout(()=> t.remove(), 3900);
  }

  // Persistence layer
  async function getPets() {
    if (API_URL) {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
    const raw = localStorage.getItem('pets_db_v2');
    return raw ? JSON.parse(raw) : [];
  }

  async function saveLocal(pets) {
    localStorage.setItem('pets_db_v2', JSON.stringify(pets));
  }

  async function createPet(payload) {
    if (API_URL) {
      const res = await fetch(API_URL, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao criar');
      return res.json();
    }
    const pets = await getPets();
    const item = { id: uid(), createdAt: new Date().toISOString(), ...payload };
    pets.unshift(item);
    await saveLocal(pets);
    return item;
  }

  async function updatePet(id, payload) {
    if (API_URL) {
      const res = await fetch(`${API_URL}/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Erro ao atualizar');
      return res.json();
    }
    const pets = await getPets();
    const idx = pets.findIndex(p=>p.id===id);
    if (idx === -1) throw new Error('Not found');
    pets[idx] = { ...pets[idx], ...payload, updatedAt: new Date().toISOString() };
    await saveLocal(pets);
    return pets[idx];
  }

  async function deletePet(id) {
    if (API_URL) {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ao deletar');
      return true;
    }
    let pets = await getPets();
    pets = pets.filter(p=>p.id!==id);
    await saveLocal(pets);
    return true;
  }

  // UI helpers
  function escapeHtml(str='') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function renderRow(p) {
    const tr = document.createElement('tr');
    tr.dataset.id = p.id;

    // badges compatible with gallery filters/classes
    const badges = [];
    if (p.necessidades) badges.push('<span class="galeria-tag galeria-tag-especial">Necessidades</span>');
    if (p.urgente) badges.push('<span class="galeria-urgencia galeria-urgencia-alta">Urgente</span>');
    if (p.emPar) badges.push('<span class="galeria-urgencia">Em par</span>');
    if (p.multiplos) badges.push('<span class="galeria-urgencia">Múltiplos</span>');
    if (p.vacinado) badges.push('<span class="galeria-tag">Vacinado</span>');
    if (p.castrado) badges.push('<span class="galeria-tag">Castrado</span>');

    const caracText = (p.caracteristicas || []).join(', ');

    tr.innerHTML = `
      <td class="td-preview"><img src="${escapeHtml(p.imagem || '')}" alt="${escapeHtml(p.nome||'')}" onerror="this.src='assets/img/foto1.jpg'"></td>
      <td>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;gap:8px;align-items:center;">
            <strong>${escapeHtml(p.nome||'')}</strong>
            <small style="color:#666;">${escapeHtml(p.genero||'')}</small>
          </div>
          <div class="admin-badges">${badges.join(' ')}</div>
          <div style="font-size:0.9rem;color:#666;">${escapeHtml(caracText)}</div>
        </div>
      </td>
      <td>${escapeHtml(p.tipo||'')}</td>
      <td>${escapeHtml(p.idade||'')}</td>
      <td>${escapeHtml(p.local||'')}</td>
      <td class="td-actions">
        <input type="checkbox" class="select-row" data-id="${p.id}" ${selectedIds.has(p.id)?'checked':''}>
        <button class="btn btn-secondary btn-edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-outline-danger btn-delete" data-id="${p.id}">Excluir</button>
      </td>`;
    return tr;
  }

  function applySearchSortAndPaginate() {
    const q = (searchInput.value||'').trim().toLowerCase();
    filtered = data.filter(item => {
      if(!q) return true;
      const s = `${item.nome} ${item.tipo} ${item.local} ${item.categoria} ${(item.caracteristicas||[]).join(' ')}`.toLowerCase();
      return s.includes(q);
    });

    const sort = sortSelect.value;
    if (sort==='nome_asc') filtered.sort((a,b)=> (a.nome||'').localeCompare(b.nome||''));
    else if (sort==='nome_desc') filtered.sort((a,b)=> (b.nome||'').localeCompare(a.nome||''));
    else filtered.sort((a,b)=> new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;

    const start = (page-1)*PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    tblBody.innerHTML = '';
    pageItems.forEach(p => tblBody.appendChild(renderRow(p)));
    pageInfo.textContent = `${page} / ${totalPages}`;
  }

  // events
  searchInput.addEventListener('input', () => { page = 1; applySearchSortAndPaginate(); });
  sortSelect.addEventListener('change', () => { page = 1; applySearchSortAndPaginate(); });

  prevPage.addEventListener('click', ()=> { if (page>1) { page--; applySearchSortAndPaginate(); } });
  nextPage.addEventListener('click', ()=> { const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE)); if (page<totalPages) { page++; applySearchSortAndPaginate(); } });

  btnLogout.addEventListener('click', ()=> { sessionStorage.removeItem('adm_autenticado'); window.location.href='galeria.html'; });
  if (btnNew) btnNew.addEventListener('click', clearForm);

  // Delegated events for table actions
  tblBody.addEventListener('click', async (e) => {
    const edit = e.target.closest('.btn-edit');
    const del = e.target.closest('.btn-delete');
    const checkbox = e.target.closest('.select-row');
    if (checkbox) {
      const id = checkbox.dataset.id;
      if (checkbox.checked) selectedIds.add(id); else selectedIds.delete(id);
      return;
    }
    if (edit) {
      const id = edit.dataset.id;
      loadToForm(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (del) {
      const id = del.dataset.id;
      confirmAction('Excluir registro', 'Deseja realmente excluir este animal?', async () => {
        try { await deletePet(id); await refreshData(); showToast('Registro excluído', 'success'); } catch(err){ console.error(err); showToast('Erro ao excluir','danger'); }
      });
    }
  });

  btnBulkDelete.addEventListener('click', () => {
    if (selectedIds.size === 0) { showToast('Nenhum item selecionado','info'); return; }
    confirmAction('Excluir selecionados', `Excluir ${selectedIds.size} itens?`, async () => {
      try {
        for (const id of Array.from(selectedIds)) { await deletePet(id); }
        selectedIds.clear();
        await refreshData();
        showToast('Itens excluídos', 'success');
      } catch(err) { console.error(err); showToast('Erro ao excluir em lote','danger'); }
    });
  });

  // import/export
  btnExport.addEventListener('click', async () => {
    const arr = await getPets();
    const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pets-export.json'; a.click();
    URL.revokeObjectURL(url);
  });
  btnImport.addEventListener('click', ()=> fileImport.click());
  fileImport.addEventListener('change', async (e) => {
    const f = e.target.files[0]; if(!f) return;
    const text = await f.text();
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('Invalid JSON');
      await saveLocal(arr);
      await refreshData();
      showToast('Importado com sucesso', 'success');
    } catch(err) { console.error(err); showToast('Erro ao importar', 'danger'); }
    fileImport.value = '';
  });

  // confirm modal helper
  function confirmAction(title, message, onYes) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.setAttribute('aria-hidden', 'false');
    confirmModal.classList.add('visible');
    function cleanup() {
      confirmModal.setAttribute('aria-hidden', 'true');
      confirmModal.classList.remove('visible');
      confirmYes.removeEventListener('click', yesFn);
      confirmNo.removeEventListener('click', noFn);
    }
    function yesFn(){ cleanup(); onYes(); }
    function noFn(){ cleanup(); }
    confirmYes.addEventListener('click', yesFn);
    confirmNo.addEventListener('click', noFn);
  }

  // form image preview
  inputs.imagem.addEventListener('input', () => {
    const url = inputs.imagem.value.trim();
    if (!url) { preview.innerHTML = ''; preview.setAttribute('aria-hidden','true'); return; }
    const img = new Image();
    img.onload = () => { preview.innerHTML = ''; preview.appendChild(img); preview.setAttribute('aria-hidden','false'); };
    img.onerror = () => { preview.innerHTML = '<div class="img-error">Imagem inválida</div>'; preview.setAttribute('aria-hidden','false'); };
    img.src = url;
  });

  // submit handler: include new fields
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!inputs.nome.value.trim()) { showToast('Nome é obrigatório','warning'); inputs.nome.focus(); return; }

    const payload = {
      nome: inputs.nome.value.trim(),
      categoria: inputs.categoria.value.trim(),
      tipo: inputs.tipo.value.trim(),
      idade: inputs.idade.value.trim(),
      genero: inputs.genero.value.trim(),
      tamanho: inputs.tamanho.value.trim(),
      local: inputs.local.value.trim(),
      imagem: inputs.imagem.value.trim(),
      descricao: inputs.descricao.value.trim(),
      caracteristicas: inputs.carac.value ? inputs.carac.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      necessidades: !!inputs.necessidades.checked,
      emPar: !!inputs.emPar.checked,
      multiplos: !!inputs.multiplos.checked,
      urgente: !!inputs.urgente.checked,
      vacinado: !!inputs.vacinado.checked,
      castrado: !!inputs.castrado
    };

    try {
      if (inputs.id.value) {
        await updatePet(inputs.id.value, payload);
        showToast('Atualizado com sucesso','success');
      } else {
        await createPet(payload);
        showToast('Criado com sucesso','success');
      }
      clearForm(); await refreshData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar','danger');
    }
  });

  function loadToForm(id) {
    const p = data.find(x=>x.id===id);
    if (!p) return;
    inputs.id.value = p.id;
    inputs.nome.value = p.nome || '';
    inputs.categoria.value = p.categoria || '';
    inputs.tipo.value = p.tipo || '';
    inputs.idade.value = p.idade || '';
    inputs.genero.value = p.genero || '';
    inputs.tamanho.value = p.tamanho || 'todos';
    inputs.local.value = p.local || '';
    inputs.imagem.value = p.imagem || '';
    inputs.descricao.value = p.descricao || '';
    inputs.carac.value = (p.caracteristicas || []).join(',');
    inputs.necessidades.checked = !!p.necessidades;
    inputs.emPar.checked = !!p.emPar;
    inputs.multiplos.checked = !!p.multiplos;
    inputs.urgente.checked = !!p.urgente;
    inputs.vacinado.checked = !!p.vacinado;
    inputs.castrado.checked = !!p.castrado;
    document.getElementById('form-title').textContent = 'Editar Animal';
    inputs.imagem.dispatchEvent(new Event('input'));
  }

  function clearForm() {
    inputs.id.value = '';
    inputs.nome.value = '';
    inputs.categoria.value = '';
    inputs.tipo.value = '';
    inputs.idade.value = '';
    inputs.genero.value = '';
    inputs.tamanho.value = 'todos';
    inputs.local.value = '';
    inputs.imagem.value = '';
    inputs.descricao.value = '';
    inputs.carac.value = '';
    inputs.necessidades.checked = false;
    inputs.emPar.checked = false;
    inputs.multiplos.checked = false;
    inputs.urgente.checked = false;
    inputs.vacinado.checked = false;
    inputs.castrado.checked = false;
    document.getElementById('form-title').textContent = 'Criar Animal';
    preview.innerHTML = ''; preview.setAttribute('aria-hidden','true');
  }

  async function refreshData() {
    try {
      data = await getPets();
      data = data.map(d => ({ createdAt: d.createdAt || new Date().toISOString(), ...d }));
      page = 1;
      applySearchSortAndPaginate();
    } catch(err) {
      console.error(err);
      showToast('Erro ao carregar dados','danger');
    }
  }

  // initial load + auth check
  (async () => {
    if (sessionStorage.getItem('adm_autenticado') !== '1') {
      alert('Área restrita. Redirecionando...');
      window.location.href = 'galeria.html';
      return;
    }
    await refreshData();
  })();
});
// ...existing code...