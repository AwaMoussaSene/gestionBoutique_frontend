const API_URL = "http://localhost:3000/produits";

let produits = [];
let editId = null;
let viewMode = "list";

/* ======================
   ID GENERATOR (INT)
====================== */
function nextId(list) {
  const max = list.reduce((m, x) => (Number(x.id) > m ? Number(x.id) : m), 0);
  return max + 1;
}

/* ======================
   LOAD PRODUITS
====================== */
async function fetchProduits() {
  const res = await fetch(API_URL);
  produits = await res.json();
  render();
}

/* ======================
   CLOUDINARY UPLOAD
====================== */
async function uploadImage(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "boutique_upload"); // ⚠️ à changer

  const res = await fetch("https://api.cloudinary.com/v1_1/dforeshog/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

/* ======================
   SUBMIT (CREATE / UPDATE)
====================== */
document.getElementById("produitForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nom = document.getElementById("produitNom").value.trim();
  const categorie = document.getElementById("produitCategorie").value;
  const prix = document.getElementById("produitPrix").value.trim();
  const stock = document.getElementById("produitStock").value.trim();
  const description = document.getElementById("produitDescription").value.trim();
  const imageFile = document.getElementById("produitImage").files[0];

  // reset errors
  document.querySelectorAll("p[id^='error']").forEach(e => e.textContent = "");

  let ok = true;

  if (!nom) { error("produitNom", "obligatoire"); ok = false; }
  if (!categorie) { error("produitCategorie", "obligatoire"); ok = false; }
  if (!prix || isNaN(prix) || Number(prix) <= 0) { error("produitPrix", "prix invalide"); ok = false; }
  if (!stock || isNaN(stock) || Number(stock) < 0) { error("produitStock", "stock invalide"); ok = false; }
  if (description.length < 5) { error("produitDescription", "min 5 caractères"); ok = false; }

  if (!ok) return;

  // IMAGE CLOUDINARY
  let imageUrl = "";

  if (imageFile) {
    imageUrl = await uploadImage(imageFile);
  }

  const produit = {
    nom,
    categorie,
    prix: Number(prix),
    stock: Number(stock),
    description,
    image: imageUrl || "https://via.placeholder.com/100"
  };

  /* ======================
     UPDATE
  ====================== */
  if (editId !== null) {
    await fetch(`${API_URL}/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produit)
    });

    editId = null;
  }

  /* ======================
     CREATE
  ====================== */
  else {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: nextId(produits),
        ...produit
      })
    });
  }

  e.target.reset();
  fetchProduits();
});

/* ======================
   DELETE
====================== */
async function deleteProduit(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });

  fetchProduits();
}

/* ======================
   EDIT
====================== */
function editProduit(id) {
  const p = produits.find(x => Number(x.id) === Number(id));
  if (!p) return;

  editId = id;

  document.getElementById("produitNom").value = p.nom;
  document.getElementById("produitCategorie").value = p.categorie;
  document.getElementById("produitPrix").value = p.prix;
  document.getElementById("produitStock").value = p.stock;
  document.getElementById("produitDescription").value = p.description;
}

/* ======================
   RENDER (LIST + CARD STYLE USER)
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
            <button onclick="editProduit('${p.id}')" class="text-blue-600">✏️</button>
            <button onclick="deleteProduit('${p.id}')" class="text-red-600">🗑️</button>
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
            <button onclick="editProduit('${p.id}')" class="text-blue-600">✏️ Modifier</button>
            <button onclick="deleteProduit('${p.id}')" class="text-red-600">🗑️ Supprimer</button>
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

/* ======================
   ERROR
====================== */
function error(field, msg) {
  document.getElementById("error-" + field).textContent = msg;
}

/* ======================
   INIT
====================== */
fetchProduits();