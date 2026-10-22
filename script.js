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
        ? `<div class="sprinter-options"><label for="sprinter-passengers">Passenger capacity</label><select id="sprinter-passengers" data-sprinter-passengers>${sprinters.map((variant) => `<option value="${variant.gallery_id}" ${variant.gallery_id === g.gallery_id ? "selected" : ""}>${variant.pax_max_capacity} Passengers</option>`).join("")}</select><p>Choose a capacity to see its photos.</p></div>`
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
      }" ${g.gallery_image_paths.length ? "" : "disabled"} aria-label="${g.gallery_image_paths.length ? "View photos of" : "Photo coming soon for"} ${label}"><div class="vehicle-art fleet-cover">${picture}</div><div class="vehicle-meta"><h3>${label}</h3><p>${g.pax_max_capacity ? `Up to ${g.pax_max_capacity} passengers` : "Contact us for passenger capacity"}${g.gallery_image_paths.length ? ` · ${g.gallery_image_paths.length} photo${g.gallery_image_paths.length === 1 ? "" : "s"}` : ""}</p><p class="vehicle-amenities">${vehicleAmenities[label] || ""}</p>${g.gallery_image_paths.length ? '<span class="fleet-view-gallery">VIEW PHOTOS &nbsp; ↗</span>' : ""}</div></button>${selector}</article>`;
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
  fleetRoot.addEventListener("change", (e) => {
    if (!e.target.matches("[data-sprinter-passengers]")) return;
    selectedSprinterId = e.target.value;
    renderFleet(fleetFilter);
    fleetRoot.querySelector("[data-sprinter-passengers]").focus();
  });
  fleetRoot.addEventListener("click", (e) => {
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
