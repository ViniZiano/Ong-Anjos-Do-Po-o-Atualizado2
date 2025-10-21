// ...existing code...
document.addEventListener('DOMContentLoaded', function() {
  const modalOverlay = document.getElementById('animal-modal-overlay');
  const modalContent = document.querySelector('.animal-modal-content');
  const closeBtn = document.querySelector('.animal-modal-fechar');

  // Função que renderiza modal a partir de um objeto pet
  function renderModal(pet) {
    if (!pet) return;
    modalContent.innerHTML = `
      <div class="animal-modal-grid">
        <div class="animal-modal-imagem"><img src="${pet.imagem || 'assets/img/foto1.jpg'}" alt="${pet.nome || pet.name}"></div>
        <div class="animal-modal-info">
          <h2>${pet.nome || pet.name}</h2>
          <div class="animal-modal-badges">
            <span class="animal-badge">${pet.tipo || ''}</span>
            <span class="animal-badge">${pet.idade || ''}</span>
            <span class="animal-badge">${pet.genero || ''}</span>
            <span class="animal-badge">${pet.tamanho || ''}</span>
            <span class="animal-badge-local"><i class="fas fa-map-marker-alt"></i> ${pet.localizacao || pet.local || ''}</span>
          </div>
          <p>${pet.descricao || ''}</p>
        </div>
      </div>
    `;
    modalOverlay.classList.add('ativo');
    modalOverlay.setAttribute('aria-hidden','false');
  }

  // Fecha modal
  if (closeBtn) closeBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('ativo');
    modalOverlay.setAttribute('aria-hidden','true');
  });

  // Escuta evento disparado por galeria-render.js
  document.addEventListener('galeriaDetalhesPedido', async (ev) => {
    const id = ev.detail && ev.detail.id;
    if (!id) return;
    // tenta buscar na API (recomendado)
    try {
      const res = await fetch(`/api/animals/${id}`);
      if (!res.ok) throw new Error('Pet não encontrado na API');
      const pet = await res.json();
      renderModal(pet);
      return;
    } catch (err) {
      // fallback: procura em animaisDetalhes global (caso exista)
      if (typeof animaisDetalhes !== 'undefined' && animaisDetalhes[id]) {
        renderModal(animaisDetalhes[id]);
      } else {
        console.warn('Detalhes não encontrados para', id);
      }
    }
  });

  // Fechar clicando no overlay
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('ativo');
      modalOverlay.setAttribute('aria-hidden','true');
    }
  });
});
// ...existing code...