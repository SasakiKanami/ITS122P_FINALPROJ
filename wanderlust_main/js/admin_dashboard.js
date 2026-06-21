import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Check if admin is logged in
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'admin_login.html';
        return;
    }

    // Check if user has admin privileges
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true || 
                    ['admin@wanderlust.com', 'marvin@wanderlust.com'].includes(user.email);

    if (!isAdmin) {
        window.location.href = 'admin_login.html';
        return;
    }

    // Display admin name
    document.getElementById('adminName').textContent = userData?.username || 'Admin';
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Get products count
        const productsSnapshot = await getDocs(collection(db, "products"));
        const totalProducts = productsSnapshot.size;
        document.getElementById('totalProducts').textContent = totalProducts;

        // Get orders count
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const totalOrders = ordersSnapshot.size;
        document.getElementById('totalOrders').textContent = totalOrders;

        // Calculate total revenue
        let totalRevenue = 0;
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            totalRevenue += order.total || 0;
        });
        document.getElementById('totalRevenue').textContent = '₱' + totalRevenue.toLocaleString();

        // Get users count
        const usersSnapshot = await getDocs(collection(db, "users"));
        document.getElementById('totalUsers').textContent = usersSnapshot.size;

        // Load recent orders
        const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
        const recentOrdersSnapshot = await getDocs(ordersQuery);
        const ordersBody = document.getElementById('recentOrders');
        
        if (recentOrdersSnapshot.empty) {
            ordersBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#888;">No orders yet</td></tr>';
        } else {
            ordersBody.innerHTML = '';
            recentOrdersSnapshot.forEach(doc => {
                const order = doc.data();
                const statusClass = order.status === 'pending' ? 'pending' : 
                                   order.status === 'on-way' ? 'active' : 'inactive';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${doc.id.slice(0, 8)}</td>
                    <td>${order.customerName || 'Guest'}</td>
                    <td>₱${(order.total || 0).toLocaleString()}</td>
                    <td><span class="badge-status ${statusClass}">${order.status || 'pending'}</span></td>
                    <td>${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                `;
                ordersBody.appendChild(tr);
            });
        }

        // Load low stock products
        const lowStockQuery = query(collection(db, "products"), where("stock", "<=", 5));
        const lowStockSnapshot = await getDocs(lowStockQuery);
        const lowStockBody = document.getElementById('lowStockProducts');

        if (lowStockSnapshot.empty) {
            lowStockBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No low stock products</td></tr>';
        } else {
            lowStockBody.innerHTML = '';
            lowStockSnapshot.forEach(doc => {
                const product = doc.data();
                const tr = document.createElement('tr');
                const statusClass = product.stock > 0 ? 'active' : 'inactive';
                const statusText = product.stock > 0 ? 'In Stock' : 'Out of Stock';
                tr.innerHTML = `
                    <td>${product.name}</td>
                    <td>₱${(product.price || 0).toLocaleString()}</td>
                    <td style="color:${product.stock <= 2 ? '#dc3545' : '#ffc107'}; font-weight:600;">${product.stock || 0}</td>
                    <td><span class="badge-status ${statusClass}">${statusText}</span></td>
                `;
                lowStockBody.appendChild(tr);
            });
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}