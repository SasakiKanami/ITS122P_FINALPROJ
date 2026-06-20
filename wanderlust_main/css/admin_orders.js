import { auth, db } from "./firebase-config.js";
import { 
    collection, getDocs, doc, updateDoc, 
    onSnapshot, query, orderBy, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Check admin auth
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'admin_login.html';
        return;
    }
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    const isAdmin = userData?.isAdmin === true || 
                    ['admin@wanderlust.com', 'marvin@wanderlust.com'].includes(user.email);
    if (!isAdmin) {
        window.location.href = 'admin_login.html';
        return;
    }
    document.getElementById('adminName').textContent = userData?.username || 'Admin';
    loadOrders();
});

// Load orders with real-time updates
function loadOrders() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const tbody = document.getElementById('ordersTableBody');
        const orderCount = document.getElementById('orderCount');

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">No orders yet</td></tr>';
            orderCount.textContent = '0 orders';
            return;
        }

        orderCount.textContent = snapshot.size + ' orders';
        tbody.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const order = docSnap.data();
            const orderId = docSnap.id;

            const statusClass = order.status === 'pending' ? 'pending' : 
                               order.status === 'on-way' ? 'active' : 'inactive';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>#${orderId.slice(0, 8)}</strong></td>
                <td>${order.customerName || 'Guest'}</td>
                <td>${order.items ? order.items.length : 'N/A'} items</td>
                <td>₱${(order.total || 0).toLocaleString()}</td>
                <td>
                    <select class="order-status-select" data-order-id="${orderId}" style="padding:5px 10px; border-radius:4px; border:1px solid #ddd;">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="on-way" ${order.status === 'on-way' ? 'selected' : ''}>On the Way</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                </td>
                <td>${order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-success btn-sm update-status-btn" data-order-id="${orderId}">Update</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Add event listeners for status updates
        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = btn.dataset.orderId;
                const select = document.querySelector(`.order-status-select[data-order-id="${orderId}"]`);
                const newStatus = select.value;

                try {
                    await updateDoc(doc(db, "orders", orderId), {
                        status: newStatus,
                        updatedAt: new Date()
                    });
                    alert('Order status updated successfully!');
                } catch (error) {
                    alert('Error updating order: ' + error.message);
                }
            });
        });
    });
}