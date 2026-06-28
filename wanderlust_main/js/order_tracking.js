import { db } from "./firebase-config.js";
import { auth } from "./firebase-config.js";
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let userOrders = [];

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'pending';
        case 'confirmed': return 'confirmed';
        case 'on-way': return 'on-way';
        case 'delivered': return 'delivered';
        default: return 'pending';
    }
}

function getProgressSteps(status) {
    const steps = ['Order Placed', 'Confirmed', 'On the Way', 'Received'];
    let statusIndex = 0;
    switch (status) {
        case 'pending': statusIndex = 0; break;
        case 'confirmed': statusIndex = 1; break;
        case 'on-way': statusIndex = 2; break;
        case 'delivered': statusIndex = 3; break;
    }
    return steps.map((step, index) => {
        if (index <= statusIndex) {
            return `<div class="step active">${step}</div>`;
        }
        return `<div class="step">${step}</div>`;
    }).join('');
}

function formatTime12(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function renderOrderCard(order) {
    const statusClass = getStatusClass(order.status);
    const statusLabel = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'on-way': 'On the Way',
        'delivered': 'Delivered'
    }[order.status] || 'Pending';

    const itemsList = (order.items || []).map(item => `${item.name} x${item.quantity}`).join(', ');

    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <h2>Order #${order.id.slice(0, 8)}</h2>
                    <p>Date Ordered: ${formatDate(order.createdAt)}</p>
                </div>
                <span class="status ${statusClass}">${statusLabel}</span>
            </div>

            <div class="order-content">
                <p><strong>Items:</strong> ${itemsList || 'N/A'}</p>
                ${order.label ? `<p><strong>Label:</strong> ${order.label.toUpperCase()}</p>` : ''}
                ${order.availableTimeStart ? `<p><strong>Delivery Time:</strong> ${formatTime12(order.availableTimeStart)}${order.availableTimeEnd ? ' - ' + formatTime12(order.availableTimeEnd) : ''}</p>` : ''}
                <p><strong>Total Amount:</strong> ₱${(order.total || 0).toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
                <p><strong>Delivery Address:</strong> ${order.address || 'N/A'}</p>
                <p><strong>Contact:</strong> ${order.contact || 'N/A'}</p>
            </div>

            <div class="tracking-progress">
                ${getProgressSteps(order.status)}
            </div>
        </div>
    `;
}

function renderOrders(orders, searchTerm = '') {
    const container = document.querySelector('.orders-section') || document.body;
    const existingCards = document.querySelectorAll('.order-card');
    existingCards.forEach(card => card.remove());

    let filteredOrders = orders;
    if (searchTerm) {
        filteredOrders = orders.filter(order => 
            order.id.slice(0, 8).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    const ordersSection = document.querySelector('.orders-section');
    if (!ordersSection) return;

    if (filteredOrders.length === 0) {
        ordersSection.innerHTML = `
            <h1>Order Tracking</h1>
            <p class="orders-description">View your order history and check the current status of your purchases.</p>
            <div class="empty-orders">
                <p>No orders found.</p>
            </div>
        `;
        return;
    }

    const html = `
        <h1>Order Tracking</h1>
        <p class="orders-description">View your order history and check the current status of your purchases.</p>

        <div class="search-order">
            <input type="text" id="searchOrderInput" placeholder="Enter order number..." value="${searchTerm}">
            <button id="searchOrderBtn">Search Order</button>
        </div>

        ${filteredOrders.map(order => renderOrderCard(order)).join('')}
    `;
    ordersSection.innerHTML = html;

    const searchInput = document.getElementById('searchOrderInput');
    const searchBtn = document.getElementById('searchOrderBtn');
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', () => {
            renderOrders(userOrders, searchInput.value.trim());
        });
        searchInput.addEventListener('input', (e) => {
            renderOrders(userOrders, e.target.value.trim());
        });
    }
}

function loadOrders() {
    const user = auth.currentUser;
    if (!user) {
        const ordersSection = document.querySelector('.orders-section');
        if (ordersSection) {
            ordersSection.innerHTML = `
                <h1>Order Tracking</h1>
                <p class="orders-description">View your order history and check the current status of your purchases.</p>
                <div class="empty-orders">
                    <p>Please login to view your orders.</p>
                    <a href="login.html" class="shop-now-btn">Login</a>
                </div>
            `;
        }
        return;
    }

    const ordersRef = collection(db, "orders");

    // Query by customerId (what checkout.js saves)
    const q = query(
        ordersRef,
        where("customerId", "==", user.uid),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        userOrders = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        renderOrders(userOrders);
    }, (error) => {
        console.error('Error loading orders:', error);
        const ordersSection = document.querySelector('.orders-section');
        if (ordersSection) {
            ordersSection.innerHTML = `
                <h1>Order Tracking</h1>
                <p class="orders-description">View your order history and check the current status of your purchases.</p>
                <div class="empty-orders">
                    <p>Error loading orders. Please try again later.</p>
                </div>
            `;
        }
    });
}

// ==================== LOGOUT ====================
window.logout = async function() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

const user = auth.currentUser;
if (user) {
    loadOrders();
} else {
    onAuthStateChanged(auth, (u) => {
        if (u) loadOrders();
    });
}