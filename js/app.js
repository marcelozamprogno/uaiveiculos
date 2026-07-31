// Application Logic & Interactivity
document.addEventListener("DOMContentLoaded", () => {
    initCatalog();
    initFilterAndSearch();
    initModal();
    initLocationAPI();
    initUrgencyToast();
    initCountdown();
});

let selectedVehicle = null;

// Format Currency
function formatCurrency(val) {
    return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Render Vehicle Catalog
function initCatalog(data = vehiclesData) {
    const grid = document.getElementById("vehicleGrid");
    grid.innerHTML = "";

    if (data.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fa-solid fa-car-tunnel" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Nenhum veículo encontrado com os filtros selecionados.</p>
            </div>
        `;
        return;
    }

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "vehicle-card";
        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <span class="discount-badge">${item.discountText}</span>
                <span class="status-badge">${item.status}</span>
            </div>
            <div class="card-content">
                <h3 class="card-title">${item.title}</h3>
                <div class="card-specs">
                    <span><i class="fa-regular fa-calendar"></i> ${item.year}</span>
                    <span><i class="fa-solid fa-gauge-high"></i> ${item.km}</span>
                    <span><i class="fa-solid fa-gas-pump"></i> ${item.fuel}</span>
                </div>
                <div class="price-box">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Tabela FIPE</div>
                        <div class="fipe-price">${formatCurrency(item.priceFipe)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 700;">Preço Repasse</div>
                        <div class="repasse-price">${formatCurrency(item.priceRepasse)}</div>
                    </div>
                </div>
                <button class="btn btn-whatsapp btn-full interest-btn" data-id="${item.id}">
                    <i class="fa-brands fa-whatsapp"></i> Tenho Interesse
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    // Attach click listeners to interest buttons
    document.querySelectorAll(".interest-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const vId = parseInt(e.currentTarget.getAttribute("data-id"));
            openProposalModal(vId);
        });
    });
}

// Filter and Search
function initFilterAndSearch() {
    const searchInput = document.getElementById("searchInput");
    const chips = document.querySelectorAll(".chip");

    let currentFilter = "all";

    const filterData = () => {
        const query = searchInput.value.toLowerCase().trim();
        const filtered = vehiclesData.filter(v => {
            const matchesCategory = currentFilter === "all" || v.category === currentFilter;
            const matchesSearch = v.title.toLowerCase().includes(query) || v.year.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
        initCatalog(filtered);
    };

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentFilter = chip.getAttribute("data-filter");
            filterData();
        });
    });

    searchInput.addEventListener("input", filterData);
}

// Modal Handling
function openProposalModal(vId) {
    selectedVehicle = vehiclesData.find(v => v.id === vId);
    if (!selectedVehicle) return;

    document.getElementById("modalVehicleTitle").innerText = selectedVehicle.title;
    document.getElementById("modalVehiclePrice").innerText = formatCurrency(selectedVehicle.priceRepasse);
    
    const modal = document.getElementById("leadModal");
    modal.classList.add("active");
}

function initModal() {
    const modal = document.getElementById("leadModal");
    const closeBtn = document.getElementById("closeModal");
    const form = document.getElementById("proposalForm");

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("userName").value;
        const phone = document.getElementById("userPhone").value;
        const city = document.getElementById("userCity").value;

        const message = `Olá! Meu nome é ${name} (${city}). Tenho interesse no veículo de repasse: *${selectedVehicle.title}* por ${formatCurrency(selectedVehicle.priceRepasse)}. Gostaria de mais informações sobre reserva!`;
        const encoded = encodeURIComponent(message);
        
        // Redirect to WhatsApp
        window.open(`https://wa.me/5531999999999?text=${encoded}`, "_blank");
        modal.classList.remove("active");
    });
}

// Location API Integration (Free Nominatim OpenStreetMap API / ViaCEP simulation)
async function initLocationAPI() {
    const addressText = document.getElementById("addressText");
    const mapBox = document.getElementById("mapBox");

    try {
        // Fetch location details from API
        const response = await fetch("https://nominatim.openstreetmap.org/search?q=Belo+Horizonte+MG&format=json&limit=1");
        const data = await response.json();

        if (data && data.length > 0) {
            const loc = data[0];
            addressText.innerText = "Av. Brasil, 1500 - Funcionários, Belo Horizonte - MG, 30140-002";
            mapBox.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    style="border:0; border-radius:14px;" 
                    loading="lazy" 
                    allowfullscreen
                    src="https://maps.google.com/maps?q=${loc.lat},${loc.lon}&z=14&output=embed">
                </iframe>
            `;
        } else {
            addressText.innerText = "Av. Brasil, 1500 - Funcionários, Belo Horizonte - MG";
        }
    } catch (err) {
        console.log("API map fetch fallback", err);
        addressText.innerText = "Av. Brasil, 1500 - Funcionários, Belo Horizonte - MG";
    }
}

// Urgency Social Proof Pop-up Toast
function initUrgencyToast() {
    const toast = document.getElementById("urgencyToast");
    const users = ["Carlos M. (Contagem)", "Ana P. (Uberlândia)", "Fernando R. (Belo Horizonte)", "Lucas S. (Juiz de Fora)"];
    const actions = [
        "acabou de solicitar proposta para Toyota Corolla 2021!",
        "garantiu reserva para Jeep Compass Limited!",
        "entrou no Grupo VIP de Repasses!"
    ];

    setInterval(() => {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];

        document.getElementById("toastUser").innerText = randomUser;
        document.getElementById("toastAction").innerText = randomAction;

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 4500);
    }, 12000);
}

// Countdown Timer
function initCountdown() {
    let duration = 4 * 3600 + 32 * 60 + 15;
    const timerElem = document.getElementById("countdown");

    setInterval(() => {
        duration--;
        if (duration <= 0) duration = 4 * 3600;

        const h = Math.floor(duration / 3600).toString().padStart(2, '0');
        const m = Math.floor((duration % 3600) / 60).toString().padStart(2, '0');
        const s = (duration % 60).toString().padStart(2, '0');

        timerElem.innerText = `${h}:${m}:${s}`;
    }, 1000);
}
