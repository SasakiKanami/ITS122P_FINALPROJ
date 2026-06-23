import { auth, db } from "./firebase-config.js";
import { 
    doc, getDoc, updateDoc, deleteDoc, 
    collection, addDoc, getDocs, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
    onAuthStateChanged, 
    deleteUser, 
    reauthenticateWithCredential, 
    EmailAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const CLOUDINARY_CLOUD = 'dupigtgx6';
const CLOUDINARY_PRESET = 'WanderLustBagsPH';

// ==================== CLOUDINARY UPLOAD ====================
async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!data.secure_url) throw new Error('Avatar upload failed.');
    return { url: data.secure_url, public_id: data.public_id };
}

// ==================== DELETE FROM CLOUDINARY ====================
async function deleteFromCloudinary(public_id) {
    if (!public_id) return;
        const endpoints = ['/deleteCloudinaryImage', '/.netlify/functions/delete-cloudinary'];
        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ public_id })
                });
                if (res.ok) return await res.json();
                if (res.status >= 400) continue;
            } catch (error) {
                continue;
            }
        }
        console.error('Error deleting from Cloudinary: all endpoints failed');
}

// ==================== AUTH CHECK ====================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("You must log in to view this page.");
        window.location.href = "login.html";
        return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    if (!userData) return;

    // ==================== DISPLAY PROFILE ====================
    function displayProfile(data) {
        const setField = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.innerText = value || 'N/A';
        };

        setField('user-name', data.username);
        setField('user-fullname', data.fullname);
        setField('user-email', data.email || user.email);
        setField('user-contact', data.contact);

        const avatar = document.getElementById('user-avatar');
        if (avatar && !data.avatarUrl) {
            avatar.innerHTML = (data.username || 'U')[0].toUpperCase();
        }

        const createdAt = document.getElementById('user-created');
        if (createdAt && data.createdAt) {
            createdAt.innerText = new Date(data.createdAt.toDate()).toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }

    displayProfile(userData);

    // Load existing avatar if available
    if (userData.avatarUrl) {
        setAvatarImage(userData.avatarUrl);
    }

    // ==================== AVATAR ====================
    function setAvatarImage(url) {
        const avatar = document.getElementById('user-avatar');
        if (avatar) {
            avatar.innerHTML = `<img src="${url}" alt="Profile Photo" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        }
    }

    async function handleAvatarUpload(file) {
        const avatar = document.getElementById('user-avatar');
        avatar.innerHTML = '<i class="bx bx-loader-alt" style="animation:spin 1s linear infinite; font-size:30px;"></i>';

        try {
            // Delete old avatar from Cloudinary if exists
            const freshDoc = await getDoc(userDocRef);
            const existingData = freshDoc.data();
            if (existingData.avatarPublicId) {
                await deleteFromCloudinary(existingData.avatarPublicId);
            }

            const uploaded = await uploadAvatar(file);

            await updateDoc(userDocRef, {
                avatarUrl: uploaded.url,
                avatarPublicId: uploaded.public_id
            });

            setAvatarImage(uploaded.url);
            alert('Profile photo updated successfully!');

        } catch (error) {
            alert('Error uploading photo: ' + error.message);
            const freshDoc = await getDoc(userDocRef);
            const d = freshDoc.data();
            if (!d.avatarUrl) {
                avatar.innerHTML = (d.username || 'U')[0].toUpperCase();
            }
        }
    }

    // Click camera icon to browse
    document.getElementById('avatarDropZone').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });

    // Click avatar to browse
    document.getElementById('user-avatar').addEventListener('click', () => {
        document.getElementById('avatarInput').click();
    });

    // File input change
    document.getElementById('avatarInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) await handleAvatarUpload(file);
    });

    // Drag over entire page
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.getElementById('avatarDragOverlay').style.display = 'flex';
    });

    document.addEventListener('dragleave', (e) => {
        if (e.relatedTarget === null) {
            document.getElementById('avatarDragOverlay').style.display = 'none';
        }
    });

    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        document.getElementById('avatarDragOverlay').style.display = 'none';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            await handleAvatarUpload(file);
        } else {
            alert('Please drop an image file.');
        }
    });

    // ==================== EDIT PROFILE ====================
    const editBtn = document.getElementById('editProfileBtn');
    const editForm = document.getElementById('editProfileForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    editBtn.addEventListener('click', () => {
        document.getElementById('edit-fullname').value = userData.fullname || '';
        document.getElementById('edit-contact').value = userData.contact || '';
        editForm.style.display = 'block';
        editBtn.style.display = 'none';
    });

    cancelEditBtn.addEventListener('click', () => {
        editForm.style.display = 'none';
        editBtn.style.display = 'inline-block';
    });

    saveProfileBtn.addEventListener('click', async () => {
        const fullname = document.getElementById('edit-fullname').value.trim();
        const contact = document.getElementById('edit-contact').value.trim();

        if (!fullname) {
            alert('Full name cannot be empty.');
            return;
        }

        try {
            await updateDoc(userDocRef, { fullname, contact });
            userData.fullname = fullname;
            userData.contact = contact;
            displayProfile(userData);
            editForm.style.display = 'none';
            editBtn.style.display = 'inline-block';
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        }
    });

    // ==================== ADDRESSES ====================
    const addressesRef = collection(db, "users", user.uid, "addresses");

    async function loadAddresses() {
        const addressList = document.getElementById('addressList');
        addressList.innerHTML = '';

        const snapshot = await getDocs(query(addressesRef, orderBy("createdAt", "desc")));

        if (snapshot.empty) {
            addressList.innerHTML = '<p style="color:#797259;">No addresses added yet.</p>';
            return;
        }

        snapshot.forEach(docSnap => {
            const address = docSnap.data();
            const addressId = docSnap.id;

            const div = document.createElement('div');
            div.style.cssText = `
                background: #faf9f5;
                border: 1px solid #dad6c2;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 12px;
                position: relative;
            `;

            div.innerHTML = `
                ${address.isDefault ? `<span style="
                    background: #7c6c3f;
                    color: #fffef8;
                    font-size: 11px;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    display: inline-block;
                ">Default</span>` : ''}
                <p style="font-weight:600; color:#5c491f;">${address.street}</p>
                <p style="color:#797259;">${address.city}, ${address.province} ${address.zip}</p>
                <p style="color:#797259;">${address.country}</p>
                <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                    ${!address.isDefault ? `<button class="set-default-btn secondary-btn" data-id="${addressId}" style="font-size:12px; padding:6px 12px;">Set as Default</button>` : ''}
                    <button class="edit-address-btn secondary-btn" data-id="${addressId}" style="font-size:12px; padding:6px 12px;">Edit</button>
                    <button class="delete-address-btn secondary-btn" data-id="${addressId}" style="font-size:12px; padding:6px 12px; background:#dc3545;">Delete</button>
                </div>
            `;

            addressList.appendChild(div);
        });

        // Set Default
        document.querySelectorAll('.set-default-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const addressId = btn.dataset.id;
                const allDocs = await getDocs(addressesRef);
                for (const d of allDocs.docs) {
                    await updateDoc(doc(db, "users", user.uid, "addresses", d.id), {
                        isDefault: d.id === addressId
                    });
                }
                loadAddresses();
            });
        });

        // Edit Address
        document.querySelectorAll('.edit-address-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const addressId = btn.dataset.id;
                const addressDoc = await getDoc(doc(db, "users", user.uid, "addresses", addressId));
                const address = addressDoc.data();

                document.getElementById('addr-street').value = address.street || '';
                document.getElementById('addr-city').value = address.city || '';
                document.getElementById('addr-province').value = address.province || '';
                document.getElementById('addr-zip').value = address.zip || '';
                document.getElementById('addr-country').value = address.country || '';

                const addressForm = document.getElementById('addressForm');
                addressForm.style.display = 'block';
                document.getElementById('addressFormTitle').textContent = 'Edit Address';

                document.getElementById('saveAddressBtn').onclick = async () => {
                    try {
                        await updateDoc(doc(db, "users", user.uid, "addresses", addressId), {
                            street: document.getElementById('addr-street').value.trim(),
                            city: document.getElementById('addr-city').value.trim(),
                            province: document.getElementById('addr-province').value.trim(),
                            zip: document.getElementById('addr-zip').value.trim(),
                            country: document.getElementById('addr-country').value.trim(),
                        });
                        alert('Address updated successfully!');
                        resetAddressForm();
                        loadAddresses();
                    } catch (error) {
                        alert('Error updating address: ' + error.message);
                    }
                };
            });
        });

        // Delete Address
        document.querySelectorAll('.delete-address-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const addressId = btn.dataset.id;
                if (confirm('Are you sure you want to delete this address?')) {
                    try {
                        await deleteDoc(doc(db, "users", user.uid, "addresses", addressId));
                        loadAddresses();
                    } catch (error) {
                        alert('Error deleting address: ' + error.message);
                    }
                }
            });
        });
    }

    loadAddresses();

    // Add Address
    document.getElementById('addAddressBtn').addEventListener('click', () => {
        resetAddressForm();
        document.getElementById('addressFormTitle').textContent = 'Add New Address';
        document.getElementById('addressForm').style.display = 'block';

        document.getElementById('saveAddressBtn').onclick = async () => {
            const street = document.getElementById('addr-street').value.trim();
            const city = document.getElementById('addr-city').value.trim();
            const province = document.getElementById('addr-province').value.trim();
            const zip = document.getElementById('addr-zip').value.trim();
            const country = document.getElementById('addr-country').value.trim();

            if (!street || !city || !province || !zip || !country) {
                alert('Please fill in all address fields.');
                return;
            }

            try {
                const allDocs = await getDocs(addressesRef);
                const isFirst = allDocs.empty;

                await addDoc(addressesRef, {
                    street, city, province, zip, country,
                    isDefault: isFirst,
                    createdAt: new Date()
                });

                alert('Address added successfully!');
                resetAddressForm();
                loadAddresses();
            } catch (error) {
                alert('Error adding address: ' + error.message);
            }
        };
    });

    function resetAddressForm() {
        document.getElementById('addressForm').style.display = 'none';
        document.getElementById('addr-street').value = '';
        document.getElementById('addr-city').value = '';
        document.getElementById('addr-province').value = '';
        document.getElementById('addr-zip').value = '';
        document.getElementById('addr-country').value = '';
    }

    document.getElementById('cancelAddressBtn').addEventListener('click', resetAddressForm);

    // ==================== DELETE ACCOUNT ====================
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const confirmed = confirm("Are you sure you want to delete your account? This cannot be undone.");
            if (!confirmed) return;

            const password = prompt("Please enter your password to confirm:");
            if (!password) return;

            try {
                const credential = EmailAuthProvider.credential(user.email, password);
                await reauthenticateWithCredential(user, credential);

                // Delete avatar from Cloudinary if exists
                const freshDoc = await getDoc(userDocRef);
                const existingData = freshDoc.data();
                if (existingData.avatarPublicId) {
                    await deleteFromCloudinary(existingData.avatarPublicId);
                }

                // Delete all addresses
                const addressSnap = await getDocs(addressesRef);
                for (const d of addressSnap.docs) {
                    await deleteDoc(doc(db, "users", user.uid, "addresses", d.id));
                }

                // Delete Firestore record
                await deleteDoc(userDocRef);

                // Delete Firebase Auth account
                await deleteUser(user);

                sessionStorage.clear();
                alert("Your account has been deleted successfully.");
                window.location.href = "login.html";

            } catch (error) {
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    alert("Incorrect password. Account deletion cancelled.");
                } else {
                    alert("Error deleting account: " + error.message);
                }
            }
        });
    }
});

// ==================== LOGOUT ====================
window.logout = async function () {
    await signOut(auth);
    sessionStorage.clear();
    window.location.href = "login.html";
}