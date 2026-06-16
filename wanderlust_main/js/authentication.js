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
<<<<<<< HEAD
                    createdAt: new Date(),
                    password: password
=======
                    createdAt: new Date()
>>>>>>> feature/user-pages-gavin
                });

                alert("Registration successful! Please login.");
                window.location.href = "login.html";

            } catch (error) {
<<<<<<< HEAD
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
=======
                alert("Error: " + error.message);
>>>>>>> feature/user-pages-gavin
            }
        });
    }

    // ==================== LOGIN ====================
    const loginForm = document.querySelector(".form-box.login form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

<<<<<<< HEAD
            const email = loginForm.querySelector("input[placeholder='Email']").value.trim();
=======
            const email = loginForm.querySelector("input[placeholder='Email']").value.trim(); //this should not be placeholder='Username' because we are using email to login, not username
>>>>>>> feature/user-pages-gavin
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
<<<<<<< HEAD
                alert("Password reset email sent! Check your inbox or Spam folder.");
=======
                alert("Password reset email sent! Check your inbox.");
>>>>>>> feature/user-pages-gavin
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
<<<<<<< HEAD
    }

    // 
=======
    }
>>>>>>> feature/user-pages-gavin
