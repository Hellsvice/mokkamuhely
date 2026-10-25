/* MOKKA MŰHELY — vanilla JavaScript: navigáció, szűrés, kávéajánló, kosár, űrlap */
"use strict";

const products = Object.freeze({
  sidama:      { name: "Sidama Bloom",         origin: "Etiópia • világos",            price: 4490, icon: "🍊" },
  huila:       { name: "Huila Harmony",        origin: "Kolumbia • közepes",           price: 4290, icon: "🍯" },
  cerrado:     { name: "Cerrado Velvet",       origin: "Brazília • sötét",             price: 3990, icon: "🍫" },
  house:       { name: "House Blend",          origin: "Saját keverék • közepes",       price: 4190, icon: "☕" },
  yirgacheffe: { name: "Ethiopia Yirgacheffe", origin: "Etiópia • világos",            price: 4390, icon: "🌼" },
  colombia:    { name: "Colombia Supremo",     origin: "Kolumbia • közepes",           price: 3990, icon: "🍎" },
  brazil:      { name: "Brazil Santos",        origin: "Brazília • közepes",           price: 3290, icon: "🥜" },
  espresso:    { name: "Espresso Blend",       origin: "Saját keverék • sötét",         price: 3490, icon: "☕" },
  vanilla:     { name: "Vanilla Hazelnut",     origin: "Ízesített kávé • közepes",      price: 3790, icon: "🍯" },
  decaf:       { name: "Decaf Comfort",        origin: "Koffeinmentes • közepes",       price: 3990, icon: "🌿" }
});

const forint = amount => `${new Intl.NumberFormat("hu-HU").format(amount)} Ft`;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

// 1. Mobilos navigáció
const menuToggle = $("#menu-toggle");
const mainNav = $("#main-nav");
function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Menü megnyitása");
  mainNav.classList.remove("is-open");
}
menuToggle.addEventListener("click", () => {
  const isOpening = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(isOpening));
  menuToggle.setAttribute("aria-label", isOpening ? "Menü bezárása" : "Menü megnyitása");
  mainNav.classList.toggle("is-open", isOpening);
});
$$(".main-nav a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("click", event => {
  if (!event.target.closest(".site-header")) closeMenu();
});

// 2. Termékek szűrése pörkölési fok szerint
const productCards = $$(".product-card");
$$(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    const activeFilter = button.dataset.filter;
    $$(".filter-button").forEach(item => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    let visibleCount = 0;
    productCards.forEach(card => {
      const show = activeFilter === "mind" || card.dataset.roast === activeFilter;
      card.hidden = !show;
      if (show) visibleCount++;
    });
    $("#filter-count").textContent = `${visibleCount} kávé`;
  });
});

// 3. Bővített, többtermékes kávéajánló
// A termékeket a már meglévő HTML-kártyákból olvassuk ki, így a leírások és
// az árak mindig megegyeznek a weboldalon megjelenő adatokkal.
let selectedPreference = null;
const choiceNames = {
  gyumolcsos: "Gyümölcsös, friss",
  lagy: "Lágy, édes",
  intenziv: "Intenzív, csokis"
};

const preferencePriorities = {
  gyumolcsos: ["sidama", "yirgacheffe", "colombia", "huila"],
  lagy: ["huila", "vanilla", "house", "brazil", "decaf", "colombia"],
  intenziv: ["cerrado", "espresso", "brazil", "house", "decaf"]
};

// További termékek későbbi hozzáadása esetén az ízjegyek is számítanak.
const tasteKeywords = {
  gyumolcsos: ["citrus", "gyümölcs", "virág", "jázmin", "bogyós", "őszibarack", "alma", "teára", "bergamott"],
  lagy: ["lágy", "édes", "karamell", "méz", "vanília", "tejcsokolád", "mogyoró", "krémes", "selymes", "koffeinmentes"],
  intenziv: ["erős", "intenzív", "étcsokolád", "csokis", "kakaó", "espresso", "sötét", "testes", "pörkölt mogyoró"]
};

function coffeeCatalog() {
  return $$("#product-grid .product-card").map(card => {
    const id = card.id.startsWith("product-") ? card.id.slice(8) : "";
    const name = card.querySelector(".product-info h3")?.textContent.trim();
    if (!id || !name) return null;
    return {
      id,
      name,
      origin: card.querySelector(".product-overline")?.textContent.replace(/\s+/g, " ").trim() || "Kézműves kávé",
      description: card.querySelector(".product-info > p")?.textContent.trim() || "Fedezd fel a kávé ízvilágát!",
      price: card.querySelector(".product-bottom > strong")?.textContent.trim() || "",
      roast: card.dataset.roast || "",
      icon: products[id]?.icon || "☕"
    };
  }).filter(Boolean);
}

function tasteScore(product, preference) {
  const priority = preferencePriorities[preference] || [];
  const rank = priority.indexOf(product.id);
  if (rank !== -1) return 100 - rank * 10;
  const text = `${product.name} ${product.description} ${product.origin}`.toLocaleLowerCase("hu");
  let score = (tasteKeywords[preference] || []).reduce((total, word) => total + (text.includes(word) ? 5 : 0), 0);
  if (preference === "gyumolcsos" && product.roast === "vilagos") score += 4;
  if (preference === "lagy" && product.roast === "kozepes") score += 4;
  if (preference === "intenziv" && product.roast === "sotet") score += 4;
  return score;
}

function finderElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function recommendedCoffeeCard(product, featured = false) {
  const card = finderElement("article", `finder-coffee-card${featured ? " finder-coffee-featured" : ""}`);
  const header = finderElement("div", "finder-coffee-header");
  const emoji = finderElement("span", "finder-coffee-icon", product.icon);
  emoji.setAttribute("aria-hidden", "true");
  const info = finderElement("div", "finder-coffee-info");
  info.append(
    finderElement("span", "finder-coffee-origin", product.origin),
    finderElement("h4", "finder-coffee-name", product.name)
  );
  header.append(emoji, info);
  if (featured) header.append(finderElement("span", "finder-best-tag", "Legjobb találat"));

  const description = finderElement("p", "finder-coffee-description", product.description);
  const footer = finderElement("div", "finder-coffee-footer");
  const price = finderElement("strong", "finder-coffee-price", product.price);
  const link = finderElement("a", "finder-coffee-link", "Megnézem ↗");
  link.href = `#product-${product.id}`;
  // A hivatkozás akkor is működjön, ha a vásárló korábban szűrt a pörkölésre.
  link.addEventListener("click", () => {
    $('.filter-button[data-filter="mind"]')?.click();
  });
  footer.append(price, link);
  card.append(header, description, footer);
  return card;
}

function renderRecommendations(preference) {
  const result = $("#finder-result");
  const available = coffeeCatalog();
  result.replaceChildren();
  if (available.length === 0) {
    result.append(finderElement("p", "finder-empty", "Jelenleg nincs megjeleníthető kávé."));
    result.hidden = false;
    return;
  }

  const scored = available.map((product, order) => ({ ...product, score: tasteScore(product, preference), order }))
    .sort((a, b) => b.score - a.score || a.order - b.order);
  const matches = scored.filter(product => product.score > 0);
  const recommended = (matches.length ? matches : scored).slice(0, 4);
  const remaining = scored.filter(product => !recommended.some(item => item.id === product.id));

  const intro = finderElement("div", "finder-results-intro");
  intro.append(
    finderElement("span", "finder-results-eyebrow", `A választásod: ${choiceNames[preference]}`),
    finderElement("h3", "finder-results-heading", "Ezeket a kávékat ajánljuk neked"),
    finderElement("p", "finder-results-count", `${available.length} kávénkból válogattunk az ízlésed alapján.`)
  );
  result.append(intro, recommendedCoffeeCard(recommended[0], true));

  if (recommended.length > 1) {
    result.append(finderElement("h4", "finder-subheading", "További kávék, amiket érdemes kipróbálnod"));
    const grid = finderElement("div", "finder-coffee-grid");
    recommended.slice(1).forEach(product => grid.append(recommendedCoffeeCard(product)));
    result.append(grid);
  }

  if (remaining.length > 0) {
    const toggle = finderElement("button", "finder-more-toggle", `Mind a ${available.length} kávé megtekintése ↓`);
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const extra = finderElement("div", "finder-other-coffees");
    extra.id = "finder-other-coffees";
    extra.hidden = true;
    toggle.setAttribute("aria-controls", extra.id);
    extra.append(finderElement("h4", "finder-subheading", "Fedezd fel a többi kávénkat is"));
    const grid = finderElement("div", "finder-coffee-grid");
    remaining.forEach(product => grid.append(recommendedCoffeeCard(product)));
    extra.append(grid);
    toggle.addEventListener("click", () => {
      const opening = extra.hidden;
      extra.hidden = !opening;
      toggle.setAttribute("aria-expanded", String(opening));
      toggle.textContent = opening ? "Kevesebb kávé mutatása ↑" : `Mind a ${available.length} kávé megtekintése ↓`;
    });
    result.append(toggle, extra);
  }
  result.hidden = false;
}

$$('.preference-option').forEach(button => {
  button.addEventListener("click", () => {
    selectedPreference = button.dataset.preference;
    $$(".preference-option").forEach(option => option.setAttribute("aria-pressed", String(option === button)));
    $("#finder-button").disabled = false;
    $("#finder-result").hidden = true;
  });
});

$("#finder-button").addEventListener("click", () => {
  if (!selectedPreference || !Object.hasOwn(choiceNames, selectedPreference)) return;
  renderRecommendations(selectedPreference);
});

// 4. Demó kosár, helyi böngészős tárolással
const storageKey = "mokka-muhely-cart-v1";
function loadCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    const sanitized = {};
    Object.keys(products).forEach(id => {
      const count = stored[id];
      if (Number.isInteger(count) && count > 0 && count <= 99) sanitized[id] = count;
    });
    return sanitized;
  } catch { return {}; }
}
let cart = loadCart();
function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* A weboldal tárolás nélkül is működik. */ }
}
const cartDrawer = $("#cart-drawer");
const cartBackdrop = $("#cart-backdrop");
let lastFocusedElement = null;
function openCart() {
  lastFocusedElement = document.activeElement;
  cartBackdrop.hidden = false;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  $("#cart-close").focus();
}
function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartBackdrop.hidden = true;
  document.body.classList.remove("cart-open");
  if (lastFocusedElement && document.contains(lastFocusedElement)) lastFocusedElement.focus();
}
$("#cart-toggle").addEventListener("click", openCart);
$("#cart-close").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeMenu(); if (cartDrawer.classList.contains("is-open")) closeCart(); }
  if (event.key !== "Tab" || !cartDrawer.classList.contains("is-open")) return;
  const focusable = $$("#cart-drawer button:not(:disabled), #cart-drawer a[href]");
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

let toastTimer;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
}
function changeQuantity(id, change) {
  if (!Object.hasOwn(products, id)) return;
  const current = cart[id] || 0;
  const next = Math.min(99, Math.max(0, current + change));
  if (next === 0) delete cart[id];
  else cart[id] = next;
  saveCart();
  renderCart();
}
function renderCart() {
  const entries = Object.entries(cart);
  const count = entries.reduce((sum, [, qty]) => sum + qty, 0);
  const total = entries.reduce((sum, [id, qty]) => sum + products[id].price * qty, 0);
  $("#cart-count").textContent = String(count);
  $("#cart-toggle").setAttribute("aria-label", `Kosár megnyitása, ${count} termék`);
  $("#cart-total").textContent = forint(total);
  $("#checkout-button").disabled = count === 0;
  const container = $("#cart-items");
  container.replaceChildren();
  if (count === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-cart";
    empty.innerHTML = '<span class="empty-cart-icon" aria-hidden="true">☕</span>Még üres a kosarad.<br>Nézz szét a kávéink között!';
    container.append(empty);
    return;
  }
  entries.forEach(([id, qty]) => {
    const product = products[id];
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row-art" aria-hidden="true">${product.icon}</div>
      <div class="cart-row-info">
        <strong>${product.name}</strong><span>${product.origin} • 250 g</span>
        <div class="cart-row-bottom"><div class="quantity-controls">
          <button type="button" data-decrease="${id}" aria-label="${product.name} mennyiség csökkentése">−</button>
          <span>${qty}</span>
          <button type="button" data-increase="${id}" aria-label="${product.name} mennyiség növelése" ${qty >= 99 ? "disabled" : ""}>+</button>
        </div><strong>${forint(product.price * qty)}</strong></div>
        <button class="remove-item" type="button" data-remove="${id}">Eltávolítás</button>
      </div>`;
    container.append(row);
  });
}
$$("[data-cart-add]").forEach(button => {
  button.addEventListener("click", () => {
    const id = button.dataset.cartAdd;
    if (!Object.hasOwn(products, id)) { showToast("Ez a termék még nem rendelhető."); return; }
    if ((cart[id] || 0) >= 99) { showToast("Egy kávéból legfeljebb 99 darab adható a kosárhoz."); return; }
    changeQuantity(id, 1);
    showToast(`${products[id].name} bekerült a kosárba ✓`);
  });
});
$("#cart-items").addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.increase) changeQuantity(button.dataset.increase, 1);
  if (button.dataset.decrease) changeQuantity(button.dataset.decrease, -1);
  if (button.dataset.remove) { delete cart[button.dataset.remove]; saveCart(); renderCart(); }
});
$("#checkout-button").addEventListener("click", () => {
  const message = $("#checkout-message");
  message.textContent = "Ez egy tanulmányi bemutató: a kosár működik, de valódi megrendelés és fizetés nem lehetséges.";
  message.style.fontWeight = "bold";
  message.hidden = false;
});
renderCart();

// 5. Kapcsolat űrlap ellenőrzése; adatot nem küldünk és nem mentünk.
$("#contact-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const name = $("#contact-name").value.trim();
  const message = $("#contact-message").value.trim();
  if (name.length < 2 || message.length < 10) {
    const feedback = $("#form-feedback");
    feedback.textContent = "Kérjük, legalább 2 karakteres nevet és 10 karakteres üzenetet adj meg.";
    feedback.hidden = false;
    return;
  }
  const feedback = $("#form-feedback");
  feedback.textContent = `Köszönjük, ${name}! A kitöltött adatok megfelelnek az ellenőrzésnek. `;

const vastag = document.createElement("strong");
vastag.textContent = "Ez demonstráció: az üzenet nem lett elküldve.";
feedback.appendChild(vastag);
  feedback.hidden = false;
  form.reset();
});
$("#current-year").textContent = String(new Date().getFullYear());
