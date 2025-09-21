import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

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
const auth = getAuth(app);

// 🔹 HTML referencias
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');
const year = document.getElementById('year'); 
year.textContent = new Date().getFullYear();

// Modal producto
const modal = document.getElementById('modal');
const mTitle = document.getElementById('m-title');
const mDesc = document.getElementById('m-desc');
const mExtra = document.getElementById('m-extra');
const mPrice = document.getElementById('m-price');
const mClose = document.getElementById('m-close');
const mImage = document.getElementById('m-image');

// Login/Registro
const openLoginBtn = document.getElementById("openLoginBtn");
const loginModal = document.getElementById("loginModal");
const closeModalBtn = document.getElementById("closeModal");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const switchToLogin = document.getElementById("switchToLogin");
const switchToRegister = document.getElementById("switchToRegister");

const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const status = document.getElementById("status");

// 🔹 Botones dinámicos
let logoutBtn = document.getElementById("logoutBtn");
if(!logoutBtn){
  logoutBtn = document.createElement("button");
  logoutBtn.id = "logoutBtn";
  logoutBtn.textContent = "Cerrar sesión";
  logoutBtn.style.display = "none";
  openLoginBtn.parentNode.insertBefore(logoutBtn, openLoginBtn.nextSibling);
}

let adminBtn = document.getElementById("adminBtn");
if(!adminBtn){
  adminBtn = document.createElement("button");
  adminBtn.id = "adminBtn";
  adminBtn.textContent = "Ir a Admin";
  adminBtn.style.display = "none";
  logoutBtn.parentNode.insertBefore(adminBtn, logoutBtn.nextSibling);
}

// 🔹 Variables globales
let products = [];

// 🔹 Funciones
function formatMoney(n){
  if(!n) return '';
  return Number(n).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
}

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
        </div>
        
        <div class="price-row">
          <div class="actions">
            <button class="btn-ghost" data-id="${p.id}" aria-label="Ver">Ver</button>
            <button class="chip" data-buy="${p.id}">Comprar</button>
            <button class="chip addToCartBtn">Agregar al carrito</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // 🔹 Conectar botón "Agregar al carrito"
    const btn = card.querySelector(".addToCartBtn");
    btn.addEventListener("click", () => {
      addToCart({
        id: p.id,
        name: p.nombre,
        price: p.precio
      });
    });
  });
  countEl.textContent = list.length;
}


async function loadProducts(){
  const snapshot = await getDocs(collection(db,"products"));
  products = snapshot.docs.map(doc => ({id:doc.id,...doc.data()}));
  render(products);
}

// 🔹 Modal producto
function openProductModal(p){
  if(!p) return;

  mTitle.textContent = p.nombre || "Sin nombre";
  mDesc.textContent = p.descripcion || "Sin descripción";
  mPrice.textContent = formatMoney(p.precio);
  mImage.innerHTML = p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" style="width:100%; max-height:400px; object-fit:contain; margin-bottom:10px;">` : "";

  let extras = "";
  const keys = Object.keys(p).filter(k => !["id","nombre","descripcion","precio","imagen","categoria","createdAt"].includes(k));
  if(keys.length > 0){
    extras = "<table>";
    keys.forEach(k=>{ extras += `<tr><th>${k}</th><td>${p[k]}</td></tr>`; });
    extras += "</table>";
  }
  mExtra.innerHTML = extras;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}

function closeProductModal(){ 
  modal.classList.remove('open'); 
  modal.setAttribute('aria-hidden','true'); 
}

mClose.addEventListener('click', closeProductModal);
modal.addEventListener('click', e => { if(e.target===modal) closeProductModal(); });

// 🔹 Eventos globales
document.addEventListener('click', e => {
  if(e.target.matches('.btn-ghost[data-id]')){
    const id = e.target.dataset.id;
    openProductModal(products.find(p=>p.id===id));
  }
  if(e.target.matches('[data-buy]')){
    const id = e.target.dataset.buy;
    alert('Simulación: producto agregado al carrito -> ' + id);
  }
});

// 🔹 Buscador
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

// 🔹 Login/Registro funcional
const validarEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validarPassword = pass => pass.length >= 6;

async function procesarBoton(botón, callback){
  botón.disabled = true;
  status.textContent = "Procesando...";
  try{ await callback(); }
  catch(err){ status.textContent = `❌ ${err.message}`; }
  finally{ botón.disabled = false; }
}

// Abrir modal
openLoginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  status.textContent = "";
});
closeModalBtn.addEventListener('click', () => loginModal.classList.add('hidden'));

// Cambiar formularios
switchToLogin.addEventListener('click', () => {
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
  status.textContent = "";
});
switchToRegister.addEventListener('click', () => {
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
  status.textContent = "";
});

// Registro
registerBtn.addEventListener('click', () => {
  procesarBoton(registerBtn, async () => {
    if(!validarEmail(regEmail.value)) throw new Error("Correo inválido");
    if(!validarPassword(regPassword.value)) throw new Error("Contraseña mínima 6 caracteres");
    const userCredential = await createUserWithEmailAndPassword(auth, regEmail.value.trim(), regPassword.value.trim());
    status.textContent = `✅ Registrado: ${userCredential.user.email}`;
    loginModal.classList.add('hidden');
  });
});

// Login
loginBtn.addEventListener('click', () => {
  procesarBoton(loginBtn, async () => {
    if(!validarEmail(loginEmail.value)) throw new Error("Correo inválido");
    if(!validarPassword(loginPassword.value)) throw new Error("Contraseña mínima 6 caracteres");
    const userCredential = await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value.trim());
    status.textContent = `✅ Bienvenido: ${userCredential.user.email}`;
    loginModal.classList.add('hidden');
  });
});

// Escuchar sesión y controlar visibilidad de botones
onAuthStateChanged(auth, async user => {
  if(user){
    // Ocultar botón de login/registro
    openLoginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // Revisar si es admin
    const token = await user.getIdTokenResult();
    if(token.claims.admin){
      adminBtn.style.display = "inline-block";
    } else {
      adminBtn.style.display = "none";
    }

  } else {
    openLoginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    adminBtn.style.display = "none";
  }
});

// 🔹 Cerrar sesión
logoutBtn.addEventListener('click', async () => {
  try{
    await signOut(auth);
    status.textContent = "✅ Sesión cerrada";
  }catch(err){
    status.textContent = `❌ Error cerrando sesión: ${err.message}`;
  }
});

// 🔹 Ir a Admin
adminBtn.addEventListener('click', () => {
  window.location.href = "/admin.html";
});

// 🔹 Inicializar productos
loadProducts();


// --- Carrito ---
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const openCartBtn = document.getElementById("openCart");
const cartModal = document.getElementById("cartModal");
const cartClose = document.getElementById("cartClose");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

// Mostrar carrito
function renderCart() {
  cartItems.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Tu carrito está vacío</p>";
  } else {
    cart.forEach((item, index) => {
      total += item.price * item.qty;
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.margin = "4px 0";
      div.innerHTML = `
        <span>${item.name} (x${item.qty})</span>
        <span>$${(item.price * item.qty).toFixed(2)}</span>
        <button data-index="${index}" class="removeItem">❌</button>
      `;
      cartItems.appendChild(div);
    });
  }

  cartTotal.textContent = total.toFixed(2);
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Agregar producto al carrito
function addToCart(product) {
  const existing = cart.find(p => p.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  renderCart();
}

// Eventos abrir/cerrar carrito
openCartBtn.addEventListener("click", () => {
  renderCart();
  cartModal.classList.remove("hidden");
});
cartClose.addEventListener("click", () => {
  cartModal.classList.add("hidden");
});

// Eliminar producto
cartItems.addEventListener("click", (e) => {
  if (e.target.classList.contains("removeItem")) {
    const index = e.target.dataset.index;
    cart.splice(index, 1);
    renderCart();
  }
});

// Checkout
checkoutBtn.addEventListener("click", () => {
  alert("Aquí luego integramos el pago 💳");
});
