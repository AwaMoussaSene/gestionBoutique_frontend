const API_URL = "http://localhost:3000/produits";

let produits = [];
let editId = null;
let viewMode = "list";
let deleteId = null;
let currentImage = "";

/* ======================
   LOAD
====================== */
async function fetchProduits() {
  const res = await fetch(API_URL);
produits = (await res.json()).filter(p => p.isDelete !== true);
render();
}

/* ======================
   NEXT ID
====================== */
function nextId(list) {
  return list.reduce((max, p) => Math.max(max, Number(p.id)), 0) + 1;
}

/* ======================
   CLOUDINARY
====================== */
async function uploadImage(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "boutique_upload");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dforeshog/image/upload",
    { method: "POST", body: formData }
  );

  const data = await res.json();
  return data.secure_url || "";
}

/* ======================
   OPEN MODAL
====================== */
function openModal() {
  editId = null;

  document.getElementById("modalTitle").textContent = "Ajouter un produit";
  document.getElementById("produitForm").reset();

  document.getElementById("produitModal").classList.remove("hidden");
  document.getElementById("produitModal").classList.add("flex");
  document.getElementById("previewContainer").classList.add("hidden");
  document.getElementById("previewImage").src = "";
  document.getElementById("produitImage").value = "";
}

/* ======================
   CLOSE MODAL
====================== */
function closeModal() {
  document.getElementById("produitModal").classList.add("hidden");
  document.getElementById("produitModal").classList.remove("flex");
  document.getElementById("previewContainer").classList.add("hidden");
document.getElementById("previewImage").src = "";
document.getElementById("produitImage").value = "";
  
}

/* ======================
   EDIT
====================== */
function editProduit(id) {
  const p = produits.find(x => String(x.id) === String(id));
  if (!p) return;

  editId = id;
  currentImage = p.image;

  document.getElementById("previewImage").src = p.image;

  document
      .getElementById("previewContainer")
      .classList.remove("hidden");
  document.getElementById("modalTitle").textContent = "Modifier produit";

  document.getElementById("produitNom").value = p.nom;
  document.getElementById("produitCategorie").value = p.categorie;
  document.getElementById("produitPrix").value = p.prix;
  document.getElementById("produitStock").value = p.stock;
  document.getElementById("produitDescription").value = p.description;

  document.getElementById("produitImage").value = "";

  document.getElementById("produitModal").classList.remove("hidden");
  document.getElementById("produitModal").classList.add("flex");
}

// error
function error(field, msg) {
  const el = document.getElementById("error-" + field);
  if (el) el.textContent = msg;
}
/* ======================
   SUBMIT (ADD / EDIT)
====================== */
document.getElementById("produitForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // reset erreurs
  document.querySelectorAll("[id^='error-']").forEach(el => el.textContent = "");

  const nom = document.getElementById("produitNom").value.trim();
  const categorie = document.getElementById("produitCategorie").value;
  const prix = Number(document.getElementById("produitPrix").value);
  const stock = Number(document.getElementById("produitStock").value);
  const description = document.getElementById("produitDescription").value.trim();
  const file = document.getElementById("produitImage").files[0];

  let ok = true;

  if (!nom) {
    error("produitNom", "Nom du produit obligatoire");
    ok = false;
  }

  if (!categorie) {
    error("produitCategorie", "Catégorie obligatoire");
    ok = false;
  }

  if (!prix || prix <= 0) {
    error("produitPrix", "Prix invalide");
    ok = false;
  }

  if (!stock || stock < 0) {
    error("produitStock", "Stock invalide");
    ok = false;
  }

  if (description.length < 3) {
    error("produitDescription", "Description trop courte");
    ok = false;
  }

  if (!ok) return;

let imageUrl = currentImage;

if (file) {
  imageUrl = await uploadImage(file);
}

  const produit = {
    nom,
    categorie,
    prix,
    stock,
    description,
    image: imageUrl || "https://placehold.co/100x100",
    isDelete: false
  };

  // update produit
  if (editId !== null) {
    await fetch(`${API_URL}/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produit)
    });

    showToast("Produit modifié ✔️", "info");
  } 
  // ajouter produit
  else {
    
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nextId(produits),
        ...produit
      })
    });

    showToast("Produit ajouté ✔️", "success");
  }

  closeModal();
  fetchProduits();
});

/* ======================
   DELETE
====================== */
async function deleteProduit(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
        "Content-Type":"application/json"
    },
    body: JSON.stringify({
        ...produit,
        isDelete: true
    })
});

  showToast("Produit supprimé 🗑️", "error");
  fetchProduits();
}
// confirmation de la supression
function askDelete(id) {
  deleteId = id;

  document.getElementById("deleteModal")
    .classList.remove("hidden");

  document.getElementById("deleteModal")
    .classList.add("flex");
}
async function confirmDelete() {

  if (!deleteId) return;

  const produit = produits.find(p => p.id == deleteId);

  if (!produit) return;

  try {
    await fetch(`${API_URL}/${deleteId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...produit,
        isDelete: true
      })
    });

    closeDeleteModal();

    showToast("Produit supprimé 🗑️", "error");

    deleteId = null;

    fetchProduits();

  } catch (err) {
    showToast("Erreur lors de la suppression ❌", "error");
  }
}
function closeDeleteModal() {
  document.getElementById("deleteModal") .classList.add("hidden");
  document.getElementById("deleteModal") .classList.remove("flex");
  deleteId = null;
}
/* ======================
   TOAST
====================== */
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500"
  };

  const toast = document.createElement("div");

  toast.className = `
    ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg
    transition-all duration-500
  `;

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
  }, 4500);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

/* ======================
   RENDER (TON CODE INCHANGÉ)
====================== */
function render() {
  const tbody = document.getElementById("produitTableBody");
  const cardContainer = document.getElementById("produitCardContainer");

  if (viewMode === "list") {
    document.getElementById("produitTableWrapper").classList.remove("hidden");
    cardContainer.classList.add("hidden");

    tbody.innerHTML = "";

    if (produits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">Aucun produit</td></tr>`;
      return;
    }

    produits.forEach(p => {
      tbody.innerHTML += `
        <tr class="hover:bg-orange-50 transition">
          <td><img src="${p.image}" class="w-10 h-10 rounded"></td>
          <td>${p.nom}</td>
          <td>${p.categorie}</td>
          <td>${p.prix} FCFA</td>
          <td>${p.stock}</td>
          <td>${p.description}</td>
          <td class="text-center">
            <button onclick="editProduit('${p.id}')" class="bg-blue-100 text-blue-600 hover:bg-blue-200 px-3 py-1.5 cursor-pointer rounded-lg text-xs transition mr-1">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="askDelete('${p.id}')" class="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 cursor-pointer rounded-lg text-xs transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });

  } else {
    document.getElementById("produitTableWrapper").classList.add("hidden");
    cardContainer.classList.remove("hidden");

    cardContainer.innerHTML = "";

    if (produits.length === 0) {
      cardContainer.innerHTML = `<p class="text-center text-gray-400 py-6">Aucun produit</p>`;
      return;
    }

    produits.forEach(p => {
      cardContainer.innerHTML += `
        <div class="bg-white border border-orange-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <img src="${p.image}" class="w-full h-40 object-cover rounded">

          <h2 class="font-semibold mt-2">${p.nom}</h2>
          <p class="text-gray-500">${p.categorie}</p>
          <p>${p.prix} FCFA</p>
          <p>Stock: ${p.stock}</p>

          <div class="mt-2 text-sm text-gray-600">
            ${p.description}
          </div>

          <div class="mt-3 flex gap-2">
            <button onclick="editProduit('${p.id}')" class="flex-1 bg-blue-100 text-blue-600 hover:bg-blue-200 py-1.5 cursor-pointer rounded-lg text-xs transition">
               <i class="fa-solid fa-pen-to-square mr-1"></i> Modifier
            </button>
            <button onclick="askDelete('${p.id}')" class="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-1.5 cursor-pointer rounded-lg text-xs transition">
              <i class="fa-solid fa-trash mr-1"></i> Supprimer
            </button>
          </div>
        </div>
      `;
    });
  }
}




/* ======================
   VIEW MODE
====================== */
document.getElementById("btnProduitList").addEventListener("click", () => {
  viewMode = "list";
  render();
});

document.getElementById("btnProduitCard").addEventListener("click", () => {
  viewMode = "card";
  render();
});

// affichage de l'image dans le modal
const imageInput = document.getElementById("produitImage");

imageInput.addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        document.getElementById("previewImage").src = e.target.result;

        document
            .getElementById("previewContainer")
            .classList.remove("hidden");
    };

    reader.readAsDataURL(file);

});


/* ======================
   INIT
====================== */
fetchProduits();