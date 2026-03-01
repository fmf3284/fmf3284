let map;
let infoWindow;
let allMarkers = [];

// ---------- DATA + CAROUSEL HELPERS ----------

// Function to generate dummy data for the carousel
function generateRandomLocations(category) {
  const locations = [];
  for (let i = 1; i <= 10; i++) {
    locations.push({
      name: `${category} Place ${i}`,
      address: `123 Main St, Anytown, USA ${10000 + i}`,
      phone: `(555) 555-${1000 + i}`,
      image: `https://picsum.photos/300/150?random=${Math.floor(
        Math.random() * 100
      )}`,
    });
  }
  return locations;
}

// Carousel state tracker
const carouselState = {
  categories: {
    currentIndex: 0,
    isScrolling: false,
  },
  locations: {
    currentIndex: 0,
    isScrolling: false,
  },
};

function getCardWidth(carousel) {
  const firstCard = carousel.querySelector(".category-tile, .location-tile");
  if (!firstCard) return 0;
  return firstCard.offsetWidth + 16; // card width + gap
}

// Scroll carousel to specific index
function scrollToIndex(carouselId, index, itemSelector, stateKey) {
  const carousel = document.getElementById(carouselId);
  if (!carousel || carouselState[stateKey].isScrolling) return;

  const items = Array.from(carousel.querySelectorAll(itemSelector));
  const totalItems = items.length;
  if (totalItems === 0) return;

  let targetIndex = ((index % totalItems) + totalItems) % totalItems;

  carouselState[stateKey].currentIndex = targetIndex;
  carouselState[stateKey].isScrolling = true;

  const cardWidth = getCardWidth(carousel);
  const targetScroll = targetIndex * cardWidth;

  carousel.scrollTo({
    left: targetScroll,
    behavior: "smooth",
  });

  setTimeout(() => {
    carouselState[stateKey].isScrolling = false;
  }, 500);
}

function snapToNearestCard(carousel, itemSelector, stateKey) {
  if (carouselState[stateKey].isScrolling) return;

  const cardWidth = getCardWidth(carousel);
  const scrollLeft = carousel.scrollLeft;
  const nearestIndex = Math.round(scrollLeft / cardWidth);

  carouselState[stateKey].currentIndex = nearestIndex;
  carousel.scrollTo({
    left: nearestIndex * cardWidth,
    behavior: "smooth",
  });
}

// Render location tiles
function renderLocationTiles(locations) {
  const carousel = document.getElementById("location-carousel");
  if (!carousel) return;

  carousel.innerHTML = "";

  if (!locations || locations.length === 0) {
    carousel.innerHTML = "<p>No locations found.</p>";
    return;
  }

  locations.forEach((location) => {
    const tile = document.createElement("div");
    tile.className = "location-tile";
    tile.innerHTML = `
      <img src="${location.image}" alt="${location.name}">
      <div class="location-tile-name">${location.name}</div>
      <div class="location-tile-details">${location.address}</div>
      <div class="location-tile-details">${location.phone}</div>
    `;
    carousel.appendChild(tile);
  });

  carouselState.locations.currentIndex = 0;
  carousel.scrollLeft = 0;
}

function navigateCarousel(carouselId, direction) {
  const itemSelector =
    carouselId === "location-carousel" ? ".location-tile" : ".category-tile";
  const stateKey = carouselId === "location-carousel" ? "locations" : "categories";

  const newIndex = carouselState[stateKey].currentIndex + direction;
  scrollToIndex(carouselId, newIndex, itemSelector, stateKey);
}

// ---------- GOOGLE MAPS ----------

function initMap() {
  const usaCenter = { lat: 39.8283, lng: -98.5795 };

  const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  map = new google.maps.Map(document.getElementById("map"), {
    center: usaCenter,
    zoom: 5,
    styles: darkMapStyles,
    mapTypeControl: false,
    streetViewControl: false,
  });

  const sampleLocations = [
    {
      lat: 40.7128,
      lng: -74.006,
      title: "New York, NY",
      info: "Sample Gym Location",
    },
    {
      lat: 34.0522,
      lng: -118.2437,
      title: "Los Angeles, CA",
      info: "Sample Fitness Studio",
    },
    {
      lat: 41.8781,
      lng: -87.6298,
      title: "Chicago, IL",
      info: "Sample Sports Club",
    },
  ];

  infoWindow = new google.maps.InfoWindow();

  sampleLocations.forEach((location) => {
    const marker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: location.title,
      animation: google.maps.Animation.DROP,
    });

    marker.addListener("click", () => {
      infoWindow.setContent(
        `
          <div style="color: #333; padding: 5px;">
            <strong>${location.title}</strong><br>
            ${location.info}
          </div>
        `
      );
      infoWindow.open(map, marker);
    });

    allMarkers.push(marker);
  });
}

// make initMap visible for Google callback
window.initMap = initMap;

// ---------- ENTRYPOINT CALLED FROM NEXT.JS ----------

function startFitnessApp() {
  const categoryTiles = document.querySelectorAll(".category-tile");
  const categoriesGrid = document.getElementById("categories-grid");
  const locationCarousel = document.getElementById("location-carousel");

  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const categoryPrevButton = document.getElementById("category-prev-button");
  const categoryNextButton = document.getElementById("category-next-button");

  if (!categoriesGrid || !locationCarousel) {
    return;
  }

  // Featured Locations arrows
  if (prevButton && nextButton) {
    prevButton.addEventListener("click", () =>
      navigateCarousel("location-carousel", -1)
    );
    nextButton.addEventListener("click", () =>
      navigateCarousel("location-carousel", 1)
    );
  }

  // Category arrows
  if (categoryPrevButton && categoryNextButton) {
    categoryPrevButton.addEventListener("click", () =>
      navigateCarousel("categories-grid", -1)
    );
    categoryNextButton.addEventListener("click", () =>
      navigateCarousel("categories-grid", 1)
    );
  }

  // Category click → load locations
  categoryTiles.forEach((tile) => {
    tile.addEventListener("click", () => {
      const category = tile.dataset.category;
      const locations = generateRandomLocations(category);
      renderLocationTiles(locations);
    });
  });

  // Default 'gym' on load
  const initialLocations = generateRandomLocations("gym");
  renderLocationTiles(initialLocations);

  // Resize + scroll snapping
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (categoriesGrid) {
        snapToNearestCard(categoriesGrid, ".category-tile", "categories");
      }
      if (locationCarousel) {
        snapToNearestCard(locationCarousel, ".location-tile", "locations");
      }
    }, 250);
  });
}

// expose entry so Next.js can call it
window.fitnessInit = startFitnessApp;
