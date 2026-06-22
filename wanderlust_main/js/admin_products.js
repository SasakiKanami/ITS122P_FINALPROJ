import { auth, db } from "./firebase-config.js";
import {
    collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_EMAILS = ['admin@wanderlust.com', 'karlkenn1012@gmail.com', 'kianaaronrivera@gmail.com'];
const CLOUDINARY_CLOUD = 'dupigtgx6';
const CLOUDINARY_PRESET = 'WanderLustBagsPH';

// ==================== CLOUDINARY UPLOAD ====================
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!data.secure_url) throw new Error('Image upload failed.');
    return data.secure_url;
}

// ==================== AUTH CHECK ====================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'admin_login.html';
        return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true || ADMIN_EMAILS.includes(user.email);

    if (!isAdmin) {
        window.location.href = 'admin_login.html';
        return;
    }

    document.getElementById('adminName').textContent = userData?.username || 'Admin';
    loadProducts();
    setupForm();
});

// ==================== IMAGE PREVIEW ====================
function setupImagePreview() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImage = document.getElementById('removeImage');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) showPreview(file);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.background = '#f0ebe0';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.background = '#fffef8';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.background = '#fffef8';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            showPreview(file);
        } else {
            alert('Please drop an image file.');
        }
    });

    function showPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    removeImage.addEventListener('click', () => {
        fileInput.value = '';
        previewImg.src = '';
        imagePreview.style.display = 'none';
        dropZone.style.display = 'block';
    });
}

// ==================== RESET FORM ====================
function resetForm() {
    const addProductForm = document.getElementById('addProductForm');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    addProductForm.reset();
    addProductForm.onsubmit = null;
    submitBtn.textContent = 'Add Product';
    cancelBtn.style.display = 'none';
    document.getElementById('formTitle').textContent = 'Add New Product';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('dropZone').style.display = 'block';
    document.getElementById('previewImg').src = '';
}

// ==================== ADD PRODUCT ====================
function setupForm() {
    const addProductForm = document.getElementById('addProductForm');
    setupImagePreview();

    document.getElementById('cancelBtn').addEventListener('click', () => {
        resetForm();
        addProductForm.style.display = 'none';
    });

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (addProductForm.onsubmit) return;

        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const stock = parseInt(document.getElementById('productStock').value);
        const description = document.getElementById('productDescription').value.trim();
        const imageFile = document.getElementById('productImage').files[0];

        if (!name || !price) {
            alert('Product name and price are required.');
            return;
        }

        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadToCloudinary(imageFile);
            }

            await addDoc(collection(db, "products"), {
                name,
                price,
                category,
                stock,
                description,
                image: imageUrl,
                createdAt: new Date()
            });

            alert('Product added successfully!');
            resetForm();

        } catch (error) {
            alert('Error adding product: ' + error.message);
        }
    });
}

// ==================== LOAD PRODUCTS ====================
function loadProducts() {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('productsTableBody');
        const productCount = document.getElementById('productCount');

        productCount.textContent = snapshot.size + ' products';

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888;">No products yet</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const product = docSnap.data();
            const productId = docSnap.id;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    ${product.image
                        ? `<img src="${product.image}" class="product-img" alt="${product.name}" onerror="this.style.display='none'">`
                        : `<div class="product-img" style="background:#f0ebe0; display:flex; align-items:center; justify-content:center; font-size:11px; color:#aaa;">No Image</div>`}
                </td>
                <td><strong>${product.name}</strong><br><small style="color:#888;">${product.description || ''}</small></td>
                <td>${product.category || 'N/A'}</td>
                <td>₱${(product.price || 0).toLocaleString()}</td>
                <td>${product.stock || 0}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${productId}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${productId}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        attachActionListeners();
    });
}

// ==================== DELETE & EDIT LISTENERS ====================
function attachActionListeners() {
    const addProductForm = document.getElementById('addProductForm');

    // DELETE
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.dataset.id;
            if (confirm('Are you sure you want to delete this product?')) {
                try {
                    await deleteDoc(doc(db, "products", productId));
                    alert('Product deleted successfully!');
                } catch (error) {
                    alert('Error deleting product: ' + error.message);
                }
            }
        });
    });

    // EDIT
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const productId = btn.dataset.id;
            const productDoc = await getDoc(doc(db, "products", productId));
            const product = productDoc.data();

            // Fill form with existing data
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productPrice').value = product.price || '';
            document.getElementById('productCategory').value = product.category || 'Bags';
            document.getElementById('productStock').value = product.stock || 0;
            document.getElementById('productDescription').value = product.description || '';

            // Show existing image preview if available
            if (product.image) {
                document.getElementById('previewImg').src = product.image;
                document.getElementById('imagePreview').style.display = 'block';
                document.getElementById('dropZone').style.display = 'none';
            }

            // Change form title and buttons
            document.getElementById('formTitle').textContent = 'Editing Product';
            const submitBtn = document.getElementById('submitBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            submitBtn.textContent = 'Update Product';
            cancelBtn.style.display = 'block';

            // Show form and scroll to it
            addProductForm.style.display = 'block';
            addProductForm.scrollIntoView({ behavior: 'smooth' });

            // Override submit to update
            addProductForm.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    const imageFile = document.getElementById('productImage').files[0];
                    let imageUrl = product.image || '';

                    if (imageFile) {
                        imageUrl = await uploadToCloudinary(imageFile);
                    }

                    await updateDoc(doc(db, "products", productId), {
                        name: document.getElementById('productName').value.trim(),
                        price: parseFloat(document.getElementById('productPrice').value),
                        category: document.getElementById('productCategory').value,
                        stock: parseInt(document.getElementById('productStock').value),
                        description: document.getElementById('productDescription').value.trim(),
                        image: imageUrl,
                        updatedAt: new Date()
                    });

                    alert('Product updated successfully!');
                    resetForm();

                } catch (error) {
                    alert('Error updating product: ' + error.message);
                }
            };
        });
    });
}