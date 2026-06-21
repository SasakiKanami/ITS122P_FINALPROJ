import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc  // <-- Add this import
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

    // ==================== REGISTER ====================
    const registerForm = document.querySelector(".form-box.register form");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = registerForm.querySelector("input[placeholder='Username']").value.trim();
            const email = registerForm.querySelector("input[placeholder='Email']").value.trim();
            const password = registerForm.querySelector("input[placeholder='Password']").value;

            try {
                // Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save extra info (username) in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    createdAt: new Date(),
                    password: password
                });

                alert("Registration successful! Please login.");
                window.location.href = "login.html";

            } catch (error) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        alert("This email is already registered! Please login instead.");
                        break;
                    case 'auth/invalid-email':
                        alert("Please enter a valid email address.");
                        break;
                    case 'auth/weak-password':
                        alert("Password must be at least 6 characters.");
                        break;
                    default:
                        alert("Error: " + error.message);
                }
            }
        });
    }

// ==================== LOGIN ====================
const loginForm = document.querySelector(".form-box.login form");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = loginForm.querySelector("input[placeholder='Email']").value.trim();
        const password = loginForm.querySelector("input[placeholder='Password']").value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get the username from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();
            
            // Mark the user as logged in for pages that check sessionStorage
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("currentUser", userData.username || email); // Store username or email as fallback
            
            alert("Login successful! Welcome back!");
            window.location.href = "shop.html";

        } catch (error) {
            alert("Error: " + error.message);
        }
    });
}

    // ==================== FORGOT PASSWORD ====================
    const forgotForm = document.querySelector("#forgot-form");

    if (forgotForm) {
        forgotForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = forgotForm.querySelector("input[type='email']").value.trim();

            try {
                await sendPasswordResetEmail(auth, email);
                alert("Password reset email sent! Check your inbox or Spam folder.");
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    }

    // ==================== LOGOUT ====================
    const logoutBtn = document.querySelector("#logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "login.html";
        });
    }

    // 
