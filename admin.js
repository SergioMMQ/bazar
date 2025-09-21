const admin = require("firebase-admin");
const serviceAccount = require("./functions/lunasbazar-74f55-firebase-adminsdk-fbsvc-a67127761a.json"); // Ruta a tu archivo JSON

// 🔹 Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log("Firebase Admin inicializado correctamente");

// 🔹 Función para listar usuarios
async function listarUsuarios() {
  try {
    const list = await admin.auth().listUsers(100); // Lista los primeros 100 usuarios
    console.log("Usuarios registrados:");
    list.users.forEach(u => console.log(`- ${u.email} (UID: ${u.uid})`));
  } catch (error) {
    console.error("Error al listar usuarios:", error);
  }
}

// 🔹 Función para asignar admin
async function makeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`${email} ahora es admin`);
  } catch (error) {
    console.error("Error asignando admin:", error);
  }
}

// 🔹 Ejecutar pruebas
(async () => {
  await listarUsuarios(); // Primero lista todos los usuarios
  await makeAdmin("quetzal.mq97@gmail.com"); // Descomenta y reemplaza para asignar admin
})();
