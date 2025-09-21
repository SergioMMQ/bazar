import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// 🔹 Referencias HTML
const form = document.getElementById("productForm");
const status = document.getElementById("status");
const categorySelect = document.getElementById("category");
const extraFieldsDiv = document.getElementById("extraFields");
const productsTable = document.getElementById("productsTable");
const productsTableBody = document.querySelector("#productsTable tbody");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");

let editingId = null;
let products = [];

// 🔹 Autologout por inactividad (15 min)
let logoutTimer;
const INACTIVITY_TIME = 15 * 60 * 1000;
function resetLogoutTimer() {
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(async () => {
    alert("Por seguridad, tu sesión ha expirado.");
    await auth.signOut();
    window.location.href = "/index.html";
  }, INACTIVITY_TIME);
}
["click","mousemove","keydown","scroll","touchstart"].forEach(evt => {
  document.addEventListener(evt, resetLogoutTimer);
});

// 🔹 Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "/";
  } catch (err) {
    status.textContent = "❌ Error cerrando sesión: " + err.message;
  }
});

// 🔹 Verificar admin y cargar página
onAuthStateChanged(auth, async (user) => {
  if(user){
    const token = await user.getIdTokenResult();
    if(token.claims.admin){
      status.textContent = "✅ Acceso concedido como admin";
      form.classList.remove("hidden");
      productsTable.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      userEmail.textContent = `Logueado como: ${user.email}`;
      resetLogoutTimer(); // iniciar temporizador
      loadProducts();
    }else{
      alert("No tienes permisos de administrador.");
      window.location.href = "/";
    }
  }else{
    window.location.href = "/";
  }
});

// 🔹 Campos adicionales según categoría
categorySelect.addEventListener("change", () => {
  const cat = categorySelect.value;
  extraFieldsDiv.innerHTML = "";
  let fields = [];
  if(cat === "ropa") fields = ["talla","cantidad","colores","marca","nuevoUsado"];
  else if(cat === "zapatos") fields = ["talla","marca"];
  else if(cat === "cosmetica") fields = ["gramos","marca","ingredientes"];
  else if(cat === "vintage") fields = ["nuevoUsado"];
  fields.forEach(f => {
    const label = document.createElement("label");
    label.textContent = f.charAt(0).toUpperCase() + f.slice(1);
    const input = document.createElement("input");
    input.type = "text";
    input.id = f;
    extraFieldsDiv.appendChild(label);
    extraFieldsDiv.appendChild(input);
  });
});

// 🔹 Cargar productos
async function loadProducts(){
  const snapshot = await getDocs(collection(db,"products"));
  products = snapshot.docs.map(docSnap => ({id: docSnap.id, ...docSnap.data()}));
  renderProducts();
}

function renderProducts(){
  productsTableBody.innerHTML = "";
  products.forEach(p=>{
    const tr = document.createElement("tr");
    const extras = Object.keys(p).filter(k=>!["nombre","precio","categoria","descripcion","imagen","createdAt"].includes(k))
                          .map(k=>`${k}: ${p[k]}`).join(", ");
    tr.innerHTML = `
      <td>${p.imagen?`<img src="${p.imagen}" alt="${p.nombre}"/>`:""}</td>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>${p.precio}</td>
      <td>${extras}</td>
      <td>
        <button data-edit="${p.id}">Editar</button>
        <button data-delete="${p.id}">Eliminar</button>
      </td>
    `;
    productsTableBody.appendChild(tr);
  });
}

// 🔹 Editar y eliminar
productsTableBody.addEventListener("click", async e=>{
  const editId = e.target.dataset.edit;
  const deleteId = e.target.dataset.delete;
  if(editId){
    const p = products.find(x=>x.id===editId);
    if(!p) return;
    editingId = p.id;
    document.getElementById("name").value = p.nombre;
    document.getElementById("price").value = p.precio;
    document.getElementById("desc").value = p.descripcion || "";
    categorySelect.value = p.categoria;
    categorySelect.dispatchEvent(new Event("change"));
    for(const key in p){
      const input = document.getElementById(key);
      if(input) input.value = p[key];
    }
    status.textContent = `✏️ Editando producto "${p.nombre}"`;
    window.scrollTo(0,0);
  }
  if(deleteId){
    if(confirm("¿Eliminar este producto?")){
      await deleteDoc(doc(db,"products",deleteId));
      await loadProducts();
      status.textContent = "Producto eliminado ✅";
    }
  }
});

// 🔹 Guardar producto
form.addEventListener("submit", async e=>{
  e.preventDefault();
  status.textContent = "Subiendo...";
  const name = document.getElementById("name").value;
  const price = Number(document.getElementById("price").value);
  const desc = document.getElementById("desc").value;
  const cat = categorySelect.value;
  const file = document.getElementById("fileInput").files[0];

  const extras = {};
  extraFieldsDiv.querySelectorAll("input").forEach(input=>{
    if(input.value) extras[input.id]=input.value;
  });

  try{
    let imageUrl = null;
    if(file){
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef,file);
      imageUrl = await getDownloadURL(storageRef);
    }

    if(editingId){
      const updateData = { nombre: name, precio: price, descripcion: desc, categoria: cat, ...extras };
      if(imageUrl) updateData.imagen = imageUrl;
      await updateDoc(doc(db,"products",editingId), updateData);
      status.textContent = "✅ Producto actualizado";
      editingId = null;
    }else{
      await addDoc(collection(db,"products"), { nombre: name, precio: price, descripcion: desc, categoria: cat, imagen: imageUrl, ...extras, createdAt: new Date() });
      status.textContent = "✅ Producto guardado";
    }

    form.reset();
    extraFieldsDiv.innerHTML = "";
    await loadProducts();
  }catch(err){
    console.error(err);
    status.textContent = "❌ Error: "+err.message;
  }
});
