
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

    // 🔹 Configuración Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyAkLs4ELe3gxOgvJMt8vc7itOtCBZj8lvg",
      authDomain: "lunasbazar-74f55.firebaseapp.com",
      projectId: "lunasbazar-74f55",
      storageBucket: "lunasbazar-74f55",
      messagingSenderId: "763016537053",
      appId: "1:763016537053:web:e70d665b9713bfef1b0c34",
      measurementId: "G-YP77MN7G6D"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const grid = document.getElementById('grid');
    const countEl = document.getElementById('count');
    const year = document.getElementById('year'); 
    year.textContent = new Date().getFullYear();

    function formatMoney(n){
      if(!n) return '';
      return Number(n).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
    }

    // Render cards
    function render(list){
      grid.innerHTML = '';
      list.forEach(p => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
          <div class="media">
            ${p.imagen 
              ? `<img src="${p.imagen}" alt="${p.nombre}" style="max-width:100%;max-height:100%"/>` 
              : '<svg width="42" height="42" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#c7d2fe" stroke-width="1.6"/><path d="M7 14h10" stroke="#c7d2fe" stroke-width="1.2" stroke-linecap="round"/></svg>'}
          </div>
          <div class="meta">
            <div style="display:flex;justify-content:space-between;align-items:start">
              <div style="flex:1">
                <h3 class="title">${p.nombre || "Sin nombre"}</h3>
                <p class="desc">${p.descripcion || "Sin descripción"}</p>
                <small class="muted">${p.categoria || ""}</small>
              </div>
            </div>
            <div class="price-row">
              <div class="price">${formatMoney(p.precio)}</div>
              <div class="actions">
                <button class="btn-ghost" data-id="${p.id}" aria-label="Ver">Ver</button>
                <button class="chip" data-buy="${p.id}">Comprar</button>
              </div>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
      countEl.textContent = list.length;
    }

    // 🔹 Cargar productos desde Firestore
    let products = [];
    async function loadProducts(){
      const snapshot = await getDocs(collection(db,"products"));
      products = snapshot.docs.map(doc => ({id:doc.id,...doc.data()}));
      render(products);
    }
    loadProducts();

    // Modal
    const modal = document.getElementById('modal');
    const mTitle = document.getElementById('m-title');
    const mDesc = document.getElementById('m-desc');
    const mExtra = document.getElementById('m-extra');
    const mPrice = document.getElementById('m-price');
    const mClose = document.getElementById('m-close');

    function openModal(p){
      if(!p) return;
      mTitle.textContent = p.nombre || "Sin nombre";
      mDesc.textContent = p.descripcion || "Sin descripción disponible";
      mPrice.textContent = formatMoney(p.precio);

      // 🔹 Mostrar detalles adicionales como tabla
      let extras = "";
      const keys = Object.keys(p).filter(k => 
        !["id","nombre","descripcion","precio","imagen","categoria"].includes(k)
      );
      if(keys.length > 0){
        extras = "<table>";
        keys.forEach(k=>{
          extras += `<tr><th>${k}</th><td>${p[k]}</td></tr>`;
        });
        extras += "</table>";
      }
      mExtra.innerHTML = extras;

      modal.classList.add('open');
      modal.setAttribute('aria-hidden','false');
    }
    function closeModal(){ 
      modal.classList.remove('open'); 
      modal.setAttribute('aria-hidden','true'); 
    }
    mClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(); });

    document.addEventListener('click', e=>{
      if(e.target.matches('.btn-ghost[data-id]')){
        const id = e.target.dataset.id;
        openModal(products.find(p=>p.id===id));
      }
      if(e.target.matches('[data-buy]')){
        const id = e.target.dataset.buy;
        alert('Simulación: producto agregado al carrito -> ' + id);
      }
    });

    const searchInput = document.getElementById('q');
    searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = products.filter(p =>
        (p.nombre || "").toLowerCase().includes(query) ||
        (p.descripcion || "").toLowerCase().includes(query) ||
        (p.categoria || "").toLowerCase().includes(query)
    );
    render(filtered);
    });