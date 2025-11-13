const apiKey = "VGHUlSNnpoN6kFw1SzrpfbZzCFrPWUsO";

const map = tt.map({
  key: apiKey,
  container: "map",
  center: [72.8777, 19.0760],
  zoom: 10,
});
map.addControl(new tt.NavigationControl());

let biasLat = null;
let biasLon = null;

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    pos => {
      biasLat = pos.coords.latitude;
      biasLon = pos.coords.longitude;
      console.log("Using user location bias:", biasLat, biasLon);
    },
    err => {
      console.warn("Geolocation not allowed / failed — continuing without proximity bias.", err);
    },
    { timeout: 5000 }
  );
}

const params = new URLSearchParams(window.location.search);
const fromPlace = params.get("from");
const toPlace = params.get("to");

async function geocodeAddress(address) {
  async function callGeocode(query, options = {}) {
    const qs = new URLSearchParams();
    if (options.countrySet) qs.set("countrySet", options.countrySet);
    if (options.limit) qs.set("limit", options.limit);
    if (options.lat) qs.set("lat", options.lat);
    if (options.lon) qs.set("lon", options.lon);
    qs.set("key", apiKey);

    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?${qs.toString()}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Geocode fetch failed:", e);
      return null;
    }
  }

  let data = await callGeocode(address, {
    countrySet: "IN",
    limit: 5,
    lat: biasLat,
    lon: biasLon
  });

  if (data && data.results && data.results.length > 0) {
    return data.results[0].position;
  }

  data = await callGeocode(address, {
    limit: 3,
    lat: biasLat,
    lon: biasLon
  });

  if (data && data.results && data.results.length > 0) {
    return data.results[0].position;
  }

  console.warn("No geocode results for:", address);
  return null;
}

function addTrafficLayers() {
  if (!map.getLayer("traffic-flow")) {
    map.addLayer({
      id: "traffic-flow",
      type: "raster",
      source: {
        type: "raster",
        tiles: [
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${apiKey}`
        ],
        tileSize: 256
      },
      layout: { visibility: "visible" }
    });
  }
}

async function addRoute(fromPlace, toPlace) {
  const fromPos = await geocodeAddress(fromPlace);
  const toPos = await geocodeAddress(toPlace);

  console.log("From:", fromPos);
  console.log("To:", toPos);

  if (!fromPos || !toPos) {
    alert("Could not find one or both locations.");
    return;
  }

  if (map.getLayer("route")) {
    try {
      map.removeLayer("route");
      map.removeSource("route");
    } catch (e) {}
  }

  new tt.Marker().setLngLat([fromPos.lon, fromPos.lat]).addTo(map);
  new tt.Marker().setLngLat([toPos.lon, toPos.lat]).addTo(map);

  const bounds = new tt.LngLatBounds();
  bounds.extend([fromPos.lon, fromPos.lat]);
  bounds.extend([toPos.lon, toPos.lat]);
  map.fitBounds(bounds, { padding: 50 });

  try {
    const routeRes = await fetch(
      `https://api.tomtom.com/routing/1/calculateRoute/${fromPos.lat},${fromPos.lon}:${toPos.lat},${toPos.lon}/json?key=${apiKey}&traffic=true`
    );

    const routeData = await routeRes.json();
    console.log("Route Data:", routeData);

    if (!routeData.routes || routeData.routes.length === 0) {
      alert("No route found between the specified places.");
      return;
    }

    const points = routeData.routes[0].legs[0].points.map(p => [p.lon, p.lat]);
    map.addLayer({
      id: "route",
      type: "line",
      source: {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: points } }
      },
      paint: { "line-color": "#0074D9", "line-width": 5 }
    });

    const summary = routeData.routes[0].summary || {};
    const noTrafficTime = summary.noTrafficTravelTimeInSeconds
      ? (summary.noTrafficTravelTimeInSeconds / 60).toFixed(2)
      : 0;
    const trafficTime = summary.travelTimeInSeconds
      ? (summary.travelTimeInSeconds / 60).toFixed(2)
      : 0;

    // ✅ Delay Calculation
    const delayMinutes = (trafficTime - noTrafficTime).toFixed(2);

    // ===== Update Main Graph (already on page) =====
    const ctx = document.querySelector("#trafficChart").getContext("2d");
    if (window.trafficChartInstance) window.trafficChartInstance.destroy();
    window.trafficChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["No Traffic", "With Traffic", "Delay"],
        datasets: [
          {
            label: "Time (mins)",
            data: [noTrafficTime, trafficTime, delayMinutes],
            backgroundColor: ["#2ecc71", "#e74c3c", "#f1c40f"]
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    const message = `Showing route from ${fromPlace} to ${toPlace}.`;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);

    // ✅ Now update Peak Hour chart in real-time too
    updatePeakHourChart(noTrafficTime, trafficTime, delayMinutes);

  } catch (err) {
    console.error("Routing API error:", err);
    alert("Routing error occurred. Check console for details.");
  }
}

map.on("load", () => {
  addTrafficLayers();
  addRoute(fromPlace, toPlace);
});

// ===================== 🚦 PEAK HOUR REAL-TIME DONUT + ROUTE SUGGESTION =====================
function updatePeakHourChart(noTraffic, withTraffic, delay) {
  const ctxDonut = document.getElementById("peakDonut")?.getContext("2d");
  const avgText = document.getElementById("peakAvg");
  const suggestionBox = document.getElementById("routeSuggestionBox");

  if (!ctxDonut || !avgText || !suggestionBox) return;

  const delayNum = parseFloat(delay);
  let level = "";
  let suggestion = "";
  let color = "";

  if (delayNum > 10) {
    level = "High ";
    suggestion = " Heavy congestion detected! Try an alternate route or delay your travel by 15–20 mins.";
    color = "rgba(255, 0, 0, 0.1)";
  } else if (delayNum > 5) {
    level = "Moderate ";
    suggestion = " Moderate traffic ahead. Prefer side roads or avoid peak areas if possible.";
    color = "rgba(255, 193, 7, 0.1)";
  } else {
    level = "Low ";
    suggestion = " Smooth traffic flow — you can take this route without delay.";
    color = "rgba(76, 175, 80, 0.1)";
  }

  // Update UI text + box
  avgText.textContent = `Average Delay: ${delayNum} mins (${level})`;
  suggestionBox.style.background = color;
  suggestionBox.innerHTML = `<p style="margin:0;">${suggestion}</p>`;

  // Destroy old chart if exists
  if (window.peakDonutInstance) window.peakDonutInstance.destroy();

  // Draw donut chart
  window.peakDonutInstance = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: ["Low", "Moderate", "High"],
      datasets: [{
        data: [30, 40, 30],
        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
        borderWidth: 0,
        cutout: "70%"
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: "black" } },
        title: { display: true, text: "Traffic Level Indicator", color: "black" }
      }
    },
    plugins: [{
      id: "centerText",
      afterDraw(chart) {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const x = (left + right) / 2;
        const y = (top + bottom) / 2;
        ctx.save();
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${delayNum} min`, x, y);
      }
    }]
  });
}


function goToHome() {
  // Redirect to index.html
  window.location.href = "index.html";
}