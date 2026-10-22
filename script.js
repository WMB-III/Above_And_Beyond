const fleetRoot = document.getElementById("fleet-grid");
const galleryNames = {
  "volvo-s90": "Volvo S90 Sedan",
  "vehicle-40": "Mercedes CLS",
  "unresolved-46-47-2pax": "Lincoln Aviator",
  "unresolved-51-55-60-61-62-63-67-4pax": "Chevrolet Suburban",
  "unresolved-52-54-2pax": "Genesis G80",
  "cadillac-escalade": "Cadillac Escalade",
  "vehicle-66": "GMC Yukon",
  "vehicle-68": "Ford Transit",
  "mercedes-sprinter-13": "Mercedes Sprinter",
  "unresolved-69-78-14pax": "Mercedes Sprinter",
  "vehicle-72": "Mercedes Sprinter",
  "vehicle-76": "Mercedes Sprinter",
  "mini-coach-23": "23-Passenger Mini Coach",
  "vehicle-82": "28-Passenger Mini Coach",
  "mini-coach-39": "39-Passenger Mini Coach",
  "vehicle-85": "56-Passenger Motor Coach",
};
const vehicleAmenities = {
  "Volvo S90 Sedan": "A comfortable sedan cabin provides a relaxed setting for private airport transfers and business travel. Complimentary Wi-Fi keeps passengers connected throughout the journey.",
  "Mercedes CLS": "A private sedan cabin provides a comfortable setting for a couple or an individual traveler. Its compact passenger layout keeps the journey personal and relaxed.",
  "Lincoln Aviator": "A multi-row SUV cabin offers room to settle in on airport transfers and longer journeys. Complimentary Wi-Fi helps passengers stay connected along the way.",
  "Chevrolet Suburban": "A spacious SUV layout provides comfortable group seating and room for travel essentials. Complimentary Wi-Fi keeps work and entertainment within reach during the ride.",
  "Genesis G80": "A comfortable sedan cabin creates a relaxed setting for private chauffeured travel. Complimentary Wi-Fi lets passengers stay connected between destinations.",
  "Cadillac Escalade": "A roomy SUV cabin gives small groups space to relax and travel together. Complimentary Wi-Fi keeps passengers connected throughout the journey.",
  "GMC Yukon": "Multi-row seating offers a comfortable shared cabin for families and small groups. Complimentary Wi-Fi adds connectivity for airport trips, business travel and longer outings.",
  "Ford Transit": "A passenger van layout keeps your group together with space for shared travel. Complimentary Wi-Fi helps everyone stay connected on the road.",
  "Mercedes Sprinter": "A roomy passenger cabin offers a comfortable setting for group transfers and private outings. Complimentary Wi-Fi lets passengers stay connected between stops.",
  "23-Passenger Mini Coach": "A shared coach cabin brings your group together in a comfortable passenger seating layout. Complimentary Wi-Fi adds convenience for work or entertainment on the journey.",
  "28-Passenger Mini Coach": "A mid-size coach cabin offers group seating for coordinated transfers and day trips. Complimentary Wi-Fi keeps passengers connected while traveling together.",
  "39-Passenger Mini Coach": "A larger coach seating layout gives event guests and travel groups a shared space for the journey. Complimentary Wi-Fi helps passengers stay connected along the route.",
  "56-Passenger Motor Coach": "A full-size coach cabin accommodates larger groups in one shared passenger space. Complimentary Wi-Fi adds convenience during regional transfers and longer journeys.",
};
let galleries = [];
const sprinterGalleryIds = new Set([
  "mercedes-sprinter-13",
  "unresolved-69-78-14pax",
  "vehicle-72",
  "vehicle-76",
]);
let selectedSprinterId = "mercedes-sprinter-13";
let fleetFilter = "all";
function fleetType(g) {
  const n = galleryNames[g.gallery_id] || "";
  return /Coach/i.test(n)
    ? "bus"
    : /Sprinter|Transit/i.test(n)
    ? "van"
    : /Escalade|Yukon|Suburban|Aviator/i.test(n)
    ? "suv"
    : "sedan";
}
function fleetPath(path) {
  return "assets/fleet/" + path.split("/").map(encodeURIComponent).join("/");
}
function fleetPlaceholder() {
  return '<div class="fleet-no-cover" aria-label="Vehicle photo coming soon">PHOTO COMING SOON</div>';
}
function renderFleet(filter = "all") {
  if (!fleetRoot) return;
  fleetFilter = filter;
  const sprinters = galleries
    .filter((g) => sprinterGalleryIds.has(g.gallery_id))
    .sort((a, b) => a.pax_max_capacity - b.pax_max_capacity);
  fleetRoot.innerHTML = galleries
    .filter((g) => !sprinterGalleryIds.has(g.gallery_id) || g.gallery_id === "mercedes-sprinter-13")
    .filter((g) => filter === "all" || fleetType(g) === filter)
    .map((g) => {
      const isSprinter = sprinterGalleryIds.has(g.gallery_id);
      if (isSprinter) g = sprinters.find((x) => x.gallery_id === selectedSprinterId) || g;
      const selector = isSprinter
        ? `<div class="sprinter-options"><span class="sprinter-options-label" id="sprinter-passengers-label">Passenger capacity</span><div class="sprinter-passenger-buttons" role="group" aria-labelledby="sprinter-passengers-label">${sprinters.map((variant) => `<button type="button" data-sprinter-passengers="${variant.gallery_id}" aria-pressed="${variant.gallery_id === g.gallery_id}">${variant.pax_max_capacity} Passengers</button>`).join("")}</div></div>`
        : "";
      const approved = Boolean(g.website_cover_approved && g.cover_image);
      const previewImage = approved ? g.cover_image : g.gallery_image_paths[0];
      const label = galleryNames[g.gallery_id] || "Luxury vehicle";
      const picture = previewImage
        ? `<img src="${fleetPath(previewImage)}" alt="${label}${approved ? ' exterior' : ' gallery photo'}, ${
            g.pax_max_capacity
          } passenger capacity" loading="lazy">`
        : fleetPlaceholder();
      return `<article class="vehicle fleet-photo-card"><button type="button" class="fleet-card-open" data-gallery-id="${
        g.gallery_id
      }" ${g.gallery_image_paths.length ? "" : "disabled"} aria-label="${g.gallery_image_paths.length ? "View photos of" : "Photo coming soon for"} ${label}"><div class="vehicle-art fleet-cover">${picture}</div><div class="vehicle-meta"><h3>${label}</h3><p class="fleet-capacity">${g.pax_max_capacity ? `${g.pax_max_capacity} Passengers` : "Contact us for passenger capacity"}${g.gallery_image_paths.length ? ` · ${g.gallery_image_paths.length} photo${g.gallery_image_paths.length === 1 ? "" : "s"}` : ""}</p><p class="vehicle-amenities">${vehicleAmenities[label] || ""}</p>${g.gallery_image_paths.length ? '<span class="fleet-view-gallery">VIEW PHOTOS &nbsp; ↗</span>' : ""}</div></button>${selector}</article>`;
    })
    .join("");
}
function openFleetGallery(id) {
  const g = galleries.find((x) => x.gallery_id === id);
  if (!g || !g.gallery_image_paths.length) return;
  const dialog = document.getElementById("fleet-gallery-dialog");
  const title = document.getElementById("fleet-gallery-title");
  const img = document.getElementById("fleet-gallery-main");
  const thumb = document.getElementById("fleet-gallery-thumbs");
  const counter = document.getElementById("fleet-gallery-counter");
  const status = document.getElementById("fleet-gallery-status");
  let ix = 0;
  const pics = g.gallery_image_paths;
  title.textContent = `${galleryNames[g.gallery_id] || "Vehicle"} · ${
    g.pax_max_capacity
  } Passengers`;
  status.textContent = "";
  status.hidden = true;
  function show(next) {
    ix = (next + pics.length) % pics.length;
    img.src = fleetPath(pics[ix]);
    const role = pics[ix].split("-").at(-1).split(".")[0];
    img.alt = `${
      galleryNames[g.gallery_id]
    }, ${role.toLowerCase()} photograph ${ix + 1} of ${pics.length}`;
    counter.textContent = `${ix + 1} / ${pics.length} · ${role}`;
    thumb
      .querySelectorAll("button")
      .forEach((b, n) => b.setAttribute("aria-current", String(n === ix)));
  }
  thumb.innerHTML = pics
    .map(
      (path, i) =>
        `<button type="button" data-photo="${i}" aria-label="Show photo ${
          i + 1
        }"><img src="${fleetPath(path)}" alt="" loading="lazy"></button>`
    )
    .join("");
  thumb.onclick = (e) => {
    const b = e.target.closest("[data-photo]");
    if (b) show(Number(b.dataset.photo));
  };
  dialog.querySelector("[data-gallery-previous]").onclick = () => show(ix - 1);
  dialog.querySelector("[data-gallery-next]").onclick = () => show(ix + 1);
  show(0);
  dialog.showModal();
}
if (fleetRoot) {
  fetch("fleet-manifest.json")
    .then((r) => {
      if (!r.ok) throw new Error("Missing fleet manifest");
      return r.json();
    })
    .then((d) => {
      galleries = d.galleries;
      renderFleet();
    })
    .catch(() => {
      fleetRoot.innerHTML =
        "<p>Fleet images could not load. Please contact our team for vehicle details.</p>";
    });
  fleetRoot.addEventListener("click", (e) => {
    const capacityButton = e.target.closest("[data-sprinter-passengers]");
    if (capacityButton) {
      const variant = galleries.find((g) => g.gallery_id === capacityButton.dataset.sprinterPassengers);
      if (!variant) return;
      selectedSprinterId = variant.gallery_id;
      const card = capacityButton.closest(".fleet-photo-card");
      const galleryButton = card.querySelector("[data-gallery-id]");
      galleryButton.dataset.galleryId = variant.gallery_id;
      const approved = Boolean(variant.website_cover_approved && variant.cover_image);
      const image = card.querySelector(".fleet-cover img");
      image.src = fleetPath(approved ? variant.cover_image : variant.gallery_image_paths[0]);
      image.alt = `Mercedes Sprinter${approved ? " exterior" : " gallery photo"}, ${variant.pax_max_capacity} passenger capacity`;
      card.querySelector(".fleet-capacity").textContent = `${variant.pax_max_capacity} Passengers · ${variant.gallery_image_paths.length} photo${variant.gallery_image_paths.length === 1 ? "" : "s"}`;
      card.querySelectorAll("[data-sprinter-passengers]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button === capacityButton));
      });
      return;
    }
    const b = e.target.closest("[data-gallery-id]");
    if (b) openFleetGallery(b.dataset.galleryId);
  });
  document.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((x) => {
        x.classList.remove("selected");
        x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("selected");
      b.setAttribute("aria-pressed", "true");
      renderFleet(b.dataset.filter);
    })
  );
  const dialog = document.getElementById("fleet-gallery-dialog");
  dialog.querySelector("[data-close-gallery]").onclick = () => dialog.close();
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")
      dialog.querySelector("[data-gallery-previous]").click();
    if (e.key === "ArrowRight")
      dialog.querySelector("[data-gallery-next]").click();
  });
}
const toggle = document.querySelector(".menu-toggle"),
  nav = document.querySelector("#navigation");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    let open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "✕" : "☰";
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
      toggle.focus();
    }
  });
}
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();
document.querySelectorAll("[data-mailto-form]").forEach((form) =>
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const entries = [...new FormData(form).entries()];
    const body = entries
      .map(([key, value]) => `${key}: ${value || "Not provided"}`)
      .join("\n");
    const subject = form.dataset.subject || "Transportation inquiry";
    window.location.href = `mailto:info@aboveandbeyondsav.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  })
);

// Show a clear status: composing an email is not the same as successfully sending it.
