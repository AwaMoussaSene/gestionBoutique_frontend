const API_URL = "http://localhost:3000/users";

let users = [];
let viewMode = "list";
let editId = null;

/* ======================
   ID GENERATOR
====================== */
function nextId(list) {
  const max = list.reduce((m, x) => (x.id > m ? x.id : m), 0);
  return max + 1;
}
/* ======================
   LOAD USERS
====================== */
async function loadUsers() {
  const res = await fetch(API_URL);
  users = await res.json();
  renderTable();
}

/* ======================
   DROPDOWN METIERS
====================== */
const selectBtn = document.getElementById("selectBtn");
const dropdownMetier = document.getElementById("dropdownMetier");

let isOpen = false;

// ouvrir
selectBtn.addEventListener("click", () => {
  isOpen = true;
  dropdownMetier.classList.remove("hidden");
});

// fermer quand on sort du menu
dropdownMetier.addEventListener("mouseleave", () => {
  isOpen = false;
  dropdownMetier.classList.add("hidden");
});

// fermer si on quitte aussi le bouton
selectBtn.addEventListener("mouseleave", () => {
  setTimeout(() => {
    if (!dropdownMetier.matches(":hover")) {
      dropdownMetier.classList.add("hidden");
      isOpen = false;
    }
  }, 150);
});
/* ======================
   SWITCH VIEW
====================== */
document.getElementById("btnList").addEventListener("click", () => {
  viewMode = "list";
  renderTable();
});

document.getElementById("btnCard").addEventListener("click", () => {
  viewMode = "card";
  renderTable();
});

/* ======================
   SUBMIT CREATE / UPDATE
====================== */
document.getElementById("userForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const prenom = document.getElementById("prenom").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const adresse = document.getElementById("adresse").value.trim();
  const tel = document.getElementById("tel").value.trim();
  const sexe = document.querySelector('input[name="sexe"]:checked');
  const metiers = Array.from(document.querySelectorAll(".metier:checked"))
    .map(cb => cb.value);

  document.querySelectorAll("p[id^='error']").forEach(e => e.textContent = "");

  let isValid = true;
  const prefixes = ["77", "78", "70", "71", "76", "75"];

  if (!prenom) { error("prenom", "obligatoire"); isValid = false; }
  if (!nom) { error("nom", "obligatoire"); isValid = false; }
  if (!adresse) { error("adresse", "obligatoire"); isValid = false; }
  if (!sexe) { error("sexe", "obligatoire"); isValid = false; }

  if (!tel) {
    error("tel", "obligatoire");
    isValid = false;
  } else if (!/^\d{9}$/.test(tel)) {
    error("tel", "9 chiffres requis");
    isValid = false;
  } else if (!prefixes.includes(tel.substring(0, 2))) {
    error("tel", "mauvais préfixe");
    isValid = false;
  } else {
    const telExiste = users.some(u => u.tel === tel && u.id !== editId);
    if (telExiste) {
      error("tel", "numéro existe déjà");
      isValid = false;
    }
  }

  if (metiers.length < 2) {
    error("metier", "min 2 métiers");
    isValid = false;
  }

  if (!isValid) return;

  const user = {
    prenom,
    nom,
    adresse,
    tel,
    sexe: sexe.value,
    metiers
  };

  // UPDATE
  if (editId) {
    await fetch(`${API_URL}/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });

    editId = null;
  }

  // CREATE
  else {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nextId(users),
        ...user
      })
    });
  }

  e.target.reset();
  selectBtn.textContent = "Sélectionner métiers";

  loadUsers();
});

/* ======================
   DELETE
====================== */
async function deleteUser(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  loadUsers();
}

/* ======================
   EDIT
====================== */
function editUser(id) {
  const u = users.find(user => Number(user.id) === Number(id));
  if (!u) return;

  editId = id;

  document.getElementById("prenom").value = u.prenom || "";
  document.getElementById("nom").value = u.nom || "";
  document.getElementById("adresse").value = u.adresse || "";
  document.getElementById("tel").value = u.tel || "";

  document.querySelectorAll('input[name="sexe"]').forEach(radio => {
    radio.checked = radio.value === u.sexe;
  });

  document.querySelectorAll(".metier").forEach(cb => {
    cb.checked = (u.metiers || []).includes(cb.value);
  });

  selectBtn.textContent = (u.metiers || []).join(", ");
}
/* ======================
   RENDER TABLE / CARDS
====================== */
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const cardContainer = document.getElementById("cardContainer");

  if (viewMode === "list") {
    document.querySelector("table").classList.remove("hidden");
    cardContainer.classList.add("hidden");
    tbody.innerHTML = "";

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400 italic">Aucune donnée enregistrée</td></tr>`;
      return;
    }

    users.forEach(u => {
      const badges = (u.metiers || []).map(m =>
        `<span class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded mr-1">${m}</span>`
      ).join("");

      tbody.innerHTML += `
        <tr class="hover:bg-orange-50 transition">
          <td class="px-4 py-3">${u.prenom}</td>
          <td class="px-4 py-3">${u.nom}</td>
          <td class="px-4 py-3">${u.adresse}</td>
          <td class="px-4 py-3">${u.tel}</td>
          <td class="px-4 py-3">${u.sexe}</td>
          <td class="px-4 py-3">${badges}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="editUser('${u.id}')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 cursor-pointer rounded-lg text-xs transition mr-1">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteUser('${u.id}')" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 cursor-pointer rounded-lg text-xs transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>`;
    });

  } else {
    document.querySelector("table").classList.add("hidden");
    cardContainer.classList.remove("hidden");
    cardContainer.innerHTML = "";

    if (users.length === 0) {
      cardContainer.innerHTML = `<p class="text-center text-gray-400 italic col-span-3 py-8">Aucune donnée enregistrée</p>`;
      return;
    }

    users.forEach(u => {
      const badges = (u.metiers || []).map(m =>
        `<span class="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">${m}</span>`
      ).join("");

      cardContainer.innerHTML += `
        <div class="bg-white border border-orange-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <h2 class="font-semibold text-gray-800 mb-2">${u.prenom} ${u.nom}</h2>
          <p class="text-sm text-gray-500"><i class="fas fa-map-marker-alt text-orange-400 mr-1"></i>${u.adresse}</p>
          <p class="text-sm text-gray-500"><i class="fas fa-phone text-orange-400 mr-1"></i>${u.tel}</p>
          <p class="text-sm text-gray-500"><i class="fas fa-venus-mars text-orange-400 mr-1"></i>${u.sexe}</p>
          <div class="mt-2 flex flex-wrap gap-1">${badges}</div>
          <div class="mt-3 flex gap-2">
            <button onclick="editUser('${u.id}')" class="flex-1 bg-blue-100 text-blue-600 hover:bg-blue-200 py-1.5 cursor-pointer rounded-lg text-xs transition">
              <i class="fa-solid fa-pen-to-square mr-1"></i> Modifier
            </button>
            <button onclick="deleteUser('${u.id}')" class="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-1.5 cursor-pointer rounded-lg text-xs transition">
              <i class="fa-solid fa-trash mr-1"></i> Supprimer
            </button>
          </div>
        </div>`;
    });
  }
}

/* ======================
   ERROR HELPER
====================== */
function error(field, msg) {
  document.getElementById("error-" + field).textContent = msg;
}

/* ======================
   INIT
====================== */
loadUsers();