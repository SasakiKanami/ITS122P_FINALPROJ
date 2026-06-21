document.addEventListener("DOMContentLoaded", () => {
    // 1. THE GATEKEEPER
    const loggedInUser = sessionStorage.getItem("currentUser");
    if (sessionStorage.getItem("isLoggedIn") !== "true" || !loggedInUser) {
        alert("You must log in to view this page.");
        window.location.href = "login.html";
        return;
    }

    // 2. THE DYNAMIC DATA LOADER
    fetch('users.xml')
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(str, "text/xml");
            const users = xmlDoc.getElementsByTagName("user");
            let targetUser = null;

            // Find the user node that matches the logged-in email
            for (let user of users) {
                // Assuming your XML has an email tag
                const userEmail = user.getElementsByTagName("email")[0];
                if (userEmail && userEmail.textContent === loggedInUser) {
                    targetUser = user;
                    break;
                }
            }

            if (targetUser) {
                const update = (id, tag) => {
                    const element = document.getElementById(id);
                    const node = targetUser.getElementsByTagName(tag)[0];
                    if (element && node) {
                        element.innerText = node.textContent;
                    }
                };

                update('user-name', 'username');
                update('user-fullname', 'fullname');
                update('user-email', 'email');
                update('user-contact', 'contact');
                update('user-address', 'address');
                update('user-city', 'city');
                update('user-country', 'country');
            } else {
                console.error("User not found in XML");
                // Optionally display a message or use fallback data
            }
        })
        .catch(err => console.error("Error loading XML:", err));
});

function logout() {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("currentUser");
    window.location.href = "login.html";
}