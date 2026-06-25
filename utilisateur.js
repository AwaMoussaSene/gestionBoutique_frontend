let viewMode = "list";
let users = JSON.parse(localStorage.getItem("users")) || [];
let editIndex = null;

const selectBtn = document.getElementById("selectBtn");
const dropdownMetier = document.getElementById("dropdownMetier");

// dropdown
selectBtn.addEventListener("click", () => {
  dropdownMetier.classList.toggle("hidden");
});

// update bouton métiers
document.querySelectorAll(".metier").forEach((cb) => {
  cb.addEventListener("change", () => {
    const values = Array.from(document.querySelectorAll(".metier:checked")).map(
      (c) => c.value,
    );

    selectBtn.textContent = values.length
      ? values.join(", ")
      : "Sélectionner métiers";
  });
});

// affichage des donnee
document.getElementById("btnList").addEventListener("click", () => {
  viewMode = "list";
  renderTable();
});

document.getElementById("btnCard").addEventListener("click", () => {
  viewMode = "card";
  renderTable();
});

// submit
document.getElementById("userForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const prenom = document.getElementById("prenom").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const adresse = document.getElementById("adresse").value.trim();
  const tel = document.getElementById("tel").value.trim();
  const sexe = document.querySelector('input[name="sexe"]:checked');

  const metiers = Array.from(document.querySelectorAll(".metier:checked")).map(
    (cb) => cb.value,
  );

  const prefixes = ["77", "78", "70", "71", "76", "75"];
 
  // reset erreurs
  document
    .querySelectorAll("p[id^='error']")
    .forEach((e) => (e.textContent = ""));

  let isValid = true;

  if (!prenom) {
    error("prenom", "le prenom est obligatoire");
    isValid = false;
  }
  if (!nom) {
    error("nom", "obligatoire");
    isValid = false;
  }
  if (!adresse) {
    error("adresse", "obligatoire");
    isValid = false;
  }

  if (!sexe) {
    document.getElementById("error-sexe").textContent = "obligatoire";
    isValid = false;
  }

  if (!tel) {
    error("tel", "obligatoire");
    isValid = false;
  } else if (!/^\d{9}$/.test(tel)) {
    error("tel", "9 chiffres requis");
    isValid = false;
  } else if (!prefixes.includes(tel.substring(0, 2))) {
    error("tel", "mauvais préfixe(77 | 78 | 76 |.....)");
    isValid = false;
  }else {
  const telExiste = users.some((u, index) => {
    return u.tel === tel && index !== editIndex;
  });

  if (telExiste) {
    error("tel", "ce numéro existe déjà");
    isValid = false;
  }
}

  if (metiers.length < 2) {
    document.getElementById("error-metier").textContent = "min 2 métiers";
    isValid = false;
  }

  if (!isValid) return;

  const user = { prenom, nom, adresse, tel, sexe: sexe.value, metiers };

  if (editIndex === null) {
    users.push(user);
    saveToLocalStorage();
  } else {
    users[editIndex] = user;
    saveToLocalStorage();
    editIndex = null;
  }

  renderTable();
  this.reset();
  selectBtn.textContent = "Sélectionner métiers";
});

// render table
function renderTable() {

  const tbody = document.getElementById("tableBody");
  const cardContainer = document.getElementById("cardContainer");

  // ======================
  // MODE LISTE (TABLE)
  // ======================
  if (viewMode === "list") {

    document.querySelector("table").classList.remove("hidden");
    cardContainer.classList.add("hidden");

    tbody.innerHTML = "";

    users.forEach((u, i) => {

      let badges = "";
      u.metiers.forEach((m) => {
        badges += `<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1">${m}</span>`;
      });

      tbody.innerHTML += `
        <tr class="border">
          <td class="p-2">${u.prenom}</td>
          <td class="p-2">${u.nom}</td>
          <td class="p-2">${u.adresse}</td>
          <td class="p-2">${u.tel}</td>
          <td class="p-2">${u.sexe}</td>
          <td class="p-2">${badges}</td>
          <td class="p-2 text-center">
            <button onclick="editUser(${i})" class="text-blue-600">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>

            <button onclick="deleteUser(${i})" class="text-red-600">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  }

  // ======================
  // MODE CARDS
  // ======================
  else {

    document.querySelector("table").classList.add("hidden");
    cardContainer.classList.remove("hidden");

    cardContainer.innerHTML = "";

    users.forEach((u, i) => {

      cardContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow border">

          <h2 class="font-bold text-lg">${u.prenom} ${u.nom}</h2>

          <p class="text-gray-600">${u.adresse}</p>
          <p class="text-gray-600">${u.tel}</p>
          <p class="text-gray-600">${u.sexe}</p>

          <div class="mt-2">
            ${u.metiers.map(m =>
              `<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1">${m}</span>`
            ).join("")}
          </div>

          <div class="mt-3 flex gap-3">
            <button onclick="editUser(${i})" class="text-blue-600">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>

            <button onclick="deleteUser(${i})" class="text-red-600">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>

        </div>
      `;
    });
  }
}

function saveToLocalStorage() {
  localStorage.setItem("users", JSON.stringify(users));
}

// edit
function editUser(i) {
  const u = users[i];

  document.getElementById("prenom").value = u.prenom;
  document.getElementById("nom").value = u.nom;
  document.getElementById("adresse").value = u.adresse;
  document.getElementById("tel").value = u.tel;

  document.querySelector(`input[name="sexe"][value="${u.sexe}"]`).checked =
    true;

  document.querySelectorAll(".metier").forEach((cb) => {
    cb.checked = u.metiers.includes(cb.value);
  });

  selectBtn.textContent = u.metiers.join(", ");
  editIndex = i;
}

// delete
function deleteUser(i) {
  users.splice(i, 1);
  saveToLocalStorage();
  renderTable();
}

// helper error
function error(field, msg) {
  document.getElementById("error-" + field).textContent = msg;
}

renderTable();