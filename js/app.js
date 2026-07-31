// Live Uai Veículos App Script
document.addEventListener("DOMContentLoaded", () => {
    renderCars();
    detectUserState();
    initToastNotifications();
});

// Render 8 Car Grid
function renderCars() {
    const grid = document.getElementById("carsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    repasseCars.forEach(car => {
        const item = document.createElement("div");
        item.className = "car-item";

        if (car.isOverlay) {
            item.innerHTML = `
                <img src="${car.image}" alt="${car.name}">
                <div class="overlay-dark">
                    <span>${car.overlayText}</span>
                    <small>Clique para acessar no grupo</small>
                </div>
            `;
        } else {
            item.innerHTML = `
                <img src="${car.image}" alt="${car.name}">
                <span class="car-badge">${car.badge}</span>
                <div class="car-info-overlay">
                    <span class="car-title">${car.name}</span>
                    <span class="car-price">${car.price}</span>
                </div>
            `;
        }
        grid.appendChild(item);
    });
}

// Dynamic State Location Detection
async function detectUserState() {
    const stateElem = document.getElementById("userState");
    if (!stateElem) return;

    try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data && data.region) {
            stateElem.innerText = data.region;
        } else {
            stateElem.innerText = "Espírito Santo";
        }
    } catch (e) {
        stateElem.innerText = "Espírito Santo";
    }
}

// Live Social Proof Toast Notifications
function initToastNotifications() {
    const toast = document.getElementById("toastNotice");
    if (!toast) return;

    const names = [
        { name: "Marcos Antônio Souza", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
        { name: "Juliana Mendes", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
        { name: "Roberto Fonseca", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
        { name: "Felipe Camargo", img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80" }
    ];

    setInterval(() => {
        const randomPerson = names[Math.floor(Math.random() * names.length)];
        document.getElementById("toastName").innerText = randomPerson.name;
        document.getElementById("toastImg").src = randomPerson.img;

        toast.classList.add("active");

        setTimeout(() => {
            toast.classList.remove("active");
        }, 4000);

    }, 9000);
}
