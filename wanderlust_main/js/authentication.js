import { auth, db } from "./firebase-config.js";
import {
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut,
        sendPasswordResetEmail
    } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
    import {
        doc,
        setDoc
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
                    createdAt: new Date()
                });

                alert("Registration successful! Please login.");
                window.location.href = "login.html";

            } catch (error) {
                alert("Error: " + error.message);
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
                await signInWithEmailAndPassword(auth, email, password);
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
                alert("Password reset email sent! Check your inbox.");
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
