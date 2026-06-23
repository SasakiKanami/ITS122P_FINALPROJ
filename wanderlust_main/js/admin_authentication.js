import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { isAdminUser } from "./admin_security.js";

const adminForm = document.getElementById('admin-login-form');

adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('admin-login-error');

    errorDiv.textContent = '';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const isAdmin = await isAdminUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!isAdmin) {
            errorDiv.textContent = 'Access denied. You are not authorized as admin.';
            return;
        }

        // Save admin session
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminEmail', email);
        sessionStorage.setItem('adminName', userData?.username || 'Admin');

        window.location.href = 'admin_dashboard.html';

    } catch (error) {
        switch (error.code) {
            case 'auth/invalid-credential':
                errorDiv.textContent = 'Invalid email or password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorDiv.textContent = 'Please enter a valid email address.';
                break;
            default:
                errorDiv.textContent = 'Error: ' + error.message;
        }
    }
});