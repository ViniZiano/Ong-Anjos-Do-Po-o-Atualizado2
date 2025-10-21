// ...existing code...
/*
  Renderizador dinâmico da galeria.
  Busca /api/animals e injeta elementos .galeria-item compatíveis com filtros.js
  Fallback: usa variável global `animaisDetalhes` ou elementos estáticos já existentes.
*/

document.addEventListener('DOMContentLoaded', async function () {
  const galeriaGrid = document.getElementById('galeria-grid');
  if (!galeriaGrid) return;

  // Converte pet para HTML do card compatível com o HTML existente
  function criarCardFromPet(pet) {
    const caracAttr = Array.isArray(pet.caracteristicas) ? pet.caracteristicas.join(',') : (pet.caracteristicas || '');
    const badges = [];
    if (pet.necessidades) badges.push('<span class="galeria-tag galeria-tag-especial">Necessidades Especiais</span>');
    if (pet.em_par || pet.emPar) badges.push('<span class="galeria-urgencia">Em par</span>');
    if (pet.multiplos) badges.push('<span class="galeria-urgencia">Múltiplos</span>');
    if (pet.urgente) badges.push('<span class="galeria-urgencia galeria-urgencia-alta">Urgente</span>');
    if (pet.vacinado) badges.push('<span class="galeria-tag">Vacinado</span>');
    if (pet.castrado) badges.push('<span class="galeria-tag">Castrado</span>');

    const imagem = pet.imagem || 'assets/img/foto1.jpg';
    const generoLabel = pet.genero || '';
    const idadeLabel = pet.idade || '';
    const tipoLabel = pet.tipo || '';
    const nome = pet.nome || pet.name || 'Sem nome';
    const local = pet.localizacao || pet.local || '';

    return `
      <div class="galeria-item" 
           data-id="${pet.id}"
           data-categoria="${escapeHtml(pet.categoria||'')}"
           data-nome="${escapeHtml(nome)}"
           data-idade="${escapeHtml(idadeLabel)}"
           data-genero="${escapeHtml(generoLabel)}"
           data-tamanho="${escapeHtml(pet.tamanho||'todos')}"
           data-caracteristicas="${escapeHtml(caracAttr)}"
           data-local="${escapeHtml(local)}">
        <div class="galeria-badge-container">${badges.join('')}</div>
        <div class="galeria-acoes">
          <div class="galeria-favorito" title="Adicionar aos favoritos"><i class="far fa-heart"></i></div>
          <div class="galeria-compartilhar" title="Compartilhar"><i class="fas fa-share-alt"></i></div>
        </div>
        <img src="${escapeHtml(imagem)}" alt="${escapeHtml(nome)}" class="galeria-imagem" loading="lazy">
        <div class="galeria-overlay">
          <h3 class="galeria-animal-nome">${escapeHtml(nome)}</h3>
          <p class="galeria-animal-info">${escapeHtml(idadeLabel)} • ${capitalize(generoLabel)} ${pet.vacinado ? '• Vacinado' : ''}</p>
          <div class="galeria-botoes">
            <button class="galeria-btn-info" data-animal-id="${pet.id}">Mais Detalhes</button>
            <a href="#form-adocao" class="galeria-btn">Quero Adotar</a>
          </div>
          <div class="galeria-caracteristicas">
            ${ (Array.isArray(pet.caracteristicas) ? pet.caracteristicas : caracAttr.split(',').filter(Boolean)).map(c=>`<span>${escapeHtml(c)}</span>`).join('') }
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str='') {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function capitalize(s='') { if(!s) return ''; return s.charAt(0).toUpperCase()+s.slice(1); }

  // Carrega pets da API com fallback local
  async function fetchPets() {
    try {
      const res = await fetch('/api/animals');
      if (!res.ok) throw new Error('API returned ' + res.status);
      const arr = await res.json();
      return Array.isArray(arr) ? arr : [];
    } catch (err) {
      // fallback: tenta a variável global `animaisDetalhes` usada atualmente
      if (typeof animaisDetalhes !== 'undefined') {
        // transforma objeto em array
        return Object.keys(animaisDetalhes).map(k => ({ id: k, ...animaisDetalhes[k] }));
      }
      // fallback: tenta ler do localStorage (formato admin.js)
      try {
        const raw = localStorage.getItem('pets_db_v2');
        return raw ? JSON.parse(raw) : [];
      } catch(e) {
        return [];
      }
    }
  }

  // Renderiza a galeria
  async function renderizarGaleria() {
    const pets = await fetchPets();
    if (!pets || pets.length === 0) {
      galeriaGrid.innerHTML = '<p class="galeria-vazia-mensagem">Nenhum animal disponível no momento. Tente mais tarde!</p>';
      document.dispatchEvent(new CustomEvent('galeriaRenderizada'));
      return;
    }
    const html = pets.map(criarCardFromPet).join('\n');
    galeriaGrid.innerHTML = html;
    document.dispatchEvent(new CustomEvent('galeriaRenderizada'));
  }

  // Delegação: quando clicar em "Mais Detalhes" vamos disparar evento para detalhes-animal.js
  galeriaGrid.addEventListener('click', function (e) {
    const btn = e.target.closest('.galeria-btn-info');
    if (!btn) return;
    const id = btn.getAttribute('data-animal-id');
    // disparar evento com id
    document.dispatchEvent(new CustomEvent('galeriaDetalhesPedido', { detail: { id } }));
  });

  // Inicializa
  renderizarGaleria();
});
// ...existing code...