// Popup elements
const popupOverlay = document.getElementById("popupOverlay");
const openPopupBtn = document.getElementById("openPopupBtn"); // "View Live Traffic Map"
const openPopupNav = document.getElementById("openPopupNav"); // Navbar "Live Map"
const closePopup = document.getElementById("closePopup");
const searchBtn = document.querySelector(".popup-btn");

// Input fields
const inputs = document.querySelectorAll(".popup-input");
const fromInput = inputs[0];
const toInput = inputs[1];

// Function to open popup
function openPopup() {
  popupOverlay.style.display = "flex";
}

// Function to close popup
function closePopupBox() {
  popupOverlay.style.display = "none";
}

// Event listeners
openPopupBtn.addEventListener("click", openPopup);
openPopupNav.addEventListener("click", openPopup);
closePopup.addEventListener("click", closePopupBox);

// When search button clicked
searchBtn.addEventListener("click", () => {
  const from = fromInput.value.trim();
  const to = toInput.value.trim();

  if (from && to) {
    // Redirect to map page with query
    window.location.href = `map.html?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  } else {
    alert("Please enter both From and To locations!");
  }
});


// ------- Discover Data Insights (Compact Dashboard) --------
const dataPopup = document.getElementById('dataPopupOverlay');
const openDataPopup = document.getElementById('openDataPopup');
const closeDataPopup = document.getElementById('closeDataPopup');
const dataContent = document.getElementById('dataContent');

// Open popup
openDataPopup.addEventListener('click', (e) => {
  e.preventDefault();
  dataPopup.style.display = 'flex';
  showDataInsights();
});

// Close popup
closeDataPopup.addEventListener('click', () => {
  dataPopup.style.display = 'none';
});

// Function to load CSV & show total + small bar chart
function showDataInsights() {
  const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCarTd8RZMJ4XgphmAP0_kZdI-i-1TnwdO3iH008faFd7fVQhHJY3fEVsVpa3xz368yvEEOIS8-ScT/pub?output=csv";

  dataContent.innerHTML = "<p style='color:white;'>Loading insights...</p>";

  fetch(csvUrl)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.trim().split("\n").filter(r => r.trim() !== "");
      const totalResponses = Math.max(0, rows.length - 1); // minus header row (safe)

      // Example labels and data (replace with real counts if you parse columns)
      const labels = ["Morning", "Afternoon", "Evening"];
      const data = [41.2,11.8,9.8]; // Example — replace with actual counts if parsed

      dataContent.innerHTML = `
        <div style="color:white; text-align:center;">
          <h3 style="margin:6px 0 12px 0;">Total Responses: ${totalResponses}</h3>
          <canvas id="barChart" width="600" height="340"></canvas>
          <p style="font-size:13px; margin-top:8px; color:#cfe;">Traffic activity preference (sample view)</p>
        </div>
      `;

      // Draw chart — y-axis numbers hidden
      const ctx = document.getElementById('barChart').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Responses',
            data: data,
            backgroundColor: ['#2ecc71', '#f1c40f', '#3498db'],
            barPercentage:0.6,
            categoryPercentage:0.8,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              titleColor: '#fff',
              bodyColor: '#fff',
              backgroundColor: 'rgba(0,0,0,0.8)'
            }
          },
          scales: {
            y: {
              display: false   // <-- y-axis numbers hidden
            },
            x: {
              ticks: {
                color: '#e6fefd',
                font: { size: 14 }   // x-label font bigger
              },
              grid: { display: false }
            }
          }
        }
      });
    })
    .catch(err => {
      dataContent.innerHTML = "<p style='color:red;'>Failed to load data!</p>";
      console.error(err);
    });
}
setInterval(showDataInsights, 60000);


// ----- Morning Rush Hour Impact -----
const morningBtn = document.querySelector(".morning-rush .Explore-insight");

// Create popup
const morningPopup = document.createElement("div");
morningPopup.className = "popup-overlay";
morningPopup.innerHTML = `
  <div class="popup-box data-box" 
       style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:25px; flex-wrap:wrap;">
       
    <!-- Left: Chart -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <h2 style="color:white;">Morning Rush Hour Impact</h2>
      <canvas id="morningMeter" width="280" height="280" style="margin:auto;"></canvas>
      <p id="morningAvgWait" style="color:white; text-align:center; margin-top:10px; font-size:15px;"></p>
      <button id="closeMorningPopup" class="popup-close">×</button>
    </div>

    <!-- Right: Live Suggestion Box -->
    <div style="color:white; width:270px; text-align:left; background:rgba(255,255,255,0.1);
                border-radius:12px; padding:15px; box-shadow:0 0 8px rgba(0,0,0,0.3);">
      <h3 style="margin-bottom:10px; color:#03a9f4;">Morning Rush Suggestion </h3>
      <p id="morningSuggestion" style="line-height:1.6;">Fetching latest morning rush info...</p>
    </div>
  </div>
`;
document.body.appendChild(morningPopup);

const closeMorningPopup = morningPopup.querySelector("#closeMorningPopup");
let morningChartInstance = null;
let morningInterval;

// ✅ Tumhara Google Sheet CSV Link
const morningCsvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCarTd8RZMJ4XgphmAP0_kZdI-i-1TnwdO3iH008faFd7fVQhHJY3fEVsVpa3xz368yvEEOIS8-ScT/pub?output=csv";

morningBtn.addEventListener("click", (e) => {
  e.preventDefault();
  morningPopup.style.display = "flex";
  showMorningChart();
  clearInterval(morningInterval);
  morningInterval = setInterval(showMorningChart, 30000);
});

closeMorningPopup.addEventListener("click", () => {
  morningPopup.style.display = "none";
  clearInterval(morningInterval);
});

function showMorningChart() {
  fetch(morningCsvUrl)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.split("\n").slice(1);
      const counts = {
        "Early morning (6 AM – 9 AM)": 0,
        "Midday (9 AM – 12 PM)": 0,
        "Afternoon (12 PM – 4 PM)": 0,
        "Evening peak (4 PM – 8 PM)": 0,
        "Night (8 PM onwards)": 0
      };
      let routeCounts = {};

      rows.forEach(row => {
        const cols = row.split(",");
        const time = cols[1]?.trim();  // Q2: Time of day
        const route = cols[3]?.trim(); // Q4: Route
        if (counts[time] !== undefined) counts[time]++;
        if (time === "Early morning (6 AM – 9 AM)" && route) {
          routeCounts[route] = (routeCounts[route] || 0) + 1;
        }
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const morning = counts["Early morning (6 AM – 9 AM)"];
      let avgWait = total > 0 ? (morning / total * 40).toFixed(1) : "20";
      if (isNaN(avgWait)) avgWait = "20";

      // ✅ Find most frequent morning rush route
      let suggestionText = "No major rush routes detected.";
      if (Object.keys(routeCounts).length > 0) {
        const [topRoute] = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
        suggestionText = `Heavy rush observed between <b>${topRoute}</b> during morning hours.`;
      }

      document.getElementById("morningSuggestion").innerHTML = suggestionText;

      document.getElementById("morningAvgWait").innerHTML = `
        Average Waiting Time: ${avgWait} mins<br>
        <span style="color:#03a9f4;"> Auto-refreshing every 30s</span>
      `;

      const ctx = document.getElementById("morningMeter").getContext("2d");

      // Destroy previous chart before new one
      if (morningChartInstance) morningChartInstance.destroy();

      morningChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["High", "Moderate", "Low"],
          datasets: [{
            data: [41.2, 19, 10],
            backgroundColor: ["#F44336","#FFC107", "#4CAF50"],
            borderWidth: 0,
            cutout: "70%"
          }]
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { color: "white", font: { size: 13 } } },
            title: { display: true, text: "Traffic Level Indicator", color: "white", font: { size: 18 } }
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
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${avgWait} min`, x, y);
          }
        }]
      });
    })
    .catch(() => {
      document.getElementById("morningSuggestion").textContent = "⚠️ Could not load live routes.";
      document.getElementById("morningAvgWait").textContent = "Failed to load morning traffic data.";
    });
}

// ----- Night Rush Hour Impact -----
const nightBtn = document.querySelector(".Night-rush .Explore-insight");

// Create popup
const nightPopup = document.createElement("div");
nightPopup.className = "popup-overlay";
nightPopup.innerHTML = `
  <div class="popup-box data-box" 
       style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:25px; flex-wrap:wrap;">
       
    <!-- Left: Chart -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <h2 style="color:white;">Night Rush Hour Impact</h2>
      <canvas id="nightMeter" width="280" height="280" style="margin:auto;"></canvas>
      <p id="nightAvgWait" style="color:white; text-align:center; margin-top:10px; font-size:15px;"></p>
      <button id="closeNightPopup" class="popup-close">×</button>
    </div>

    <!-- Right: Live Suggestion Box -->
    <div style="color:white; width:270px; text-align:left; background:rgba(255,255,255,0.1);
                border-radius:12px; padding:15px; box-shadow:0 0 8px rgba(0,0,0,0.3);">
      <h3 style="margin-bottom:10px; color:#03a9f4;">Night Rush Suggestion </h3>
      <p id="nightSuggestion" style="line-height:1.6;">Fetching latest night rush info...</p>
    </div>
  </div>
`;
document.body.appendChild(nightPopup);

const closeNightPopup = nightPopup.querySelector("#closeNightPopup");

let nightChartInstance = null;
let nightInterval;

// ✅ Tumhara Google Sheet CSV Link
const nightCsvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCarTd8RZMJ4XgphmAP0_kZdI-i-1TnwdO3iH008faFd7fVQhHJY3fEVsVpa3xz368yvEEOIS8-ScT/pub?output=csv";

nightBtn.addEventListener("click", (e) => {
  e.preventDefault();
  nightPopup.style.display = "flex";
  showNightChart();
  clearInterval(nightInterval);
  nightInterval = setInterval(showNightChart, 30000);
});

closeNightPopup.addEventListener("click", () => {
  nightPopup.style.display = "none";
  clearInterval(nightInterval);
});

function showNightChart() {
  fetch(nightCsvUrl)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.split("\n").slice(1);
      const counts = {
        "Early morning (6 AM – 9 AM)": 0,
        "Midday (9 AM – 12 PM)": 0,
        "Afternoon (12 PM – 4 PM)": 0,
        "Evening peak (4 PM – 8 PM)": 0,
        "Night (8 PM onwards)": 0
      };
      let routeCounts = {};

      rows.forEach(row => {
        const cols = row.split(",");
        const time = cols[1]?.trim();  // Q2: Time of the day
        const route = cols[3]?.trim(); // Q4: Route
        if (counts[time] !== undefined) counts[time]++;
        if (time === "Night (8 PM onwards)" && route) {
          routeCounts[route] = (routeCounts[route] || 0) + 1;
        }
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const night = counts["Night (8 PM onwards)"];
      let avgWait = total > 0 ? (night / total * 35).toFixed(1) : "15";
      if (isNaN(avgWait)) avgWait = "15";

      // ✅ Find most frequent rush route
      let suggestionText = "No major rush routes detected.";
      if (Object.keys(routeCounts).length > 0) {
        const [topRoute] = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
        suggestionText = ` Heavy rush observed between <b>${topRoute}</b> during night hours.`;
      }

      document.getElementById("nightSuggestion").innerHTML = suggestionText;

      document.getElementById("nightAvgWait").innerHTML = `
        Average Waiting Time: ${avgWait} mins<br>
        <span style="color:#03a9f4;"> Auto-refreshing every 30s</span>
      `;

      const ctx = document.getElementById("nightMeter").getContext("2d");

      // Destroy previous chart before new one
      if (nightChartInstance) nightChartInstance.destroy();

      nightChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["High","Moderate","Low"],
          datasets: [{
            data: [17.6, 12, 6],
            backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
            borderWidth: 0,
            cutout: "70%"
          }]
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { color: "white", font: { size: 13 } } },
            title: { display: true, text: "Traffic Level Indicator", color: "white", font: { size: 18 } }
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
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${avgWait} min`, x, y);
          }
        }]
      });
    })
    .catch(() => {
      document.getElementById("nightSuggestion").textContent = " Could not load live routes.";
      document.getElementById("nightAvgWait").textContent = "Failed to load night traffic data.";
    });
}

// ----- Public Transport Ridership -----
const transportBtn = document.querySelector(".public-transport .Explore-insight");

// Create popup
const transportPopup = document.createElement("div");
transportPopup.className = "popup-overlay";
transportPopup.innerHTML = `
 <div class="popup-box data-box" 
       style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:25px; flex-wrap:wrap;">
       
    <!-- Left: Chart -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <h2 style="color:white;">Public Transport Ridership</h2>
      <canvas id="transportMeter" width="280" height="280" style="margin:auto;"></canvas>
      <p id="transportUsage" style="color:white; text-align:center; margin-top:10px; font-size:15px;"></p>
      <button id="closeTransportPopup" class="popup-close">×</button>
    </div>

    <!-- Right: Live Mode Insights -->
    <div style="color:white; width:270px; text-align:left; background:rgba(255,255,255,0.1);
                border-radius:12px; padding:15px; box-shadow:0 0 8px rgba(0,0,0,0.3);">
      <h3 style="margin-bottom:10px; color:#03a9f4;"> Live Mode Insights</h3>
      <p id="modeInsights" style="line-height:1.6;">Loading live transport data...</p>
    </div>
  </div>
`;
document.body.appendChild(transportPopup);

const closeTransportPopup = transportPopup.querySelector("#closeTransportPopup");

// Real-time CSV link (same sheet as others)
const transportCsvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRCarTd8RZMJ4XgphmAP0_kZdI-i-1TnwdO3iH008faFd7fVQhHJY3fEVsVpa3xz368yvEEOIS8-ScT/pub?output=csv";

let transportChartInstance = null;
let transportInterval;

transportBtn.addEventListener("click", (e) => {
  e.preventDefault();
  transportPopup.style.display = "flex";
  showTransportChart();
  clearInterval(transportInterval);
  transportInterval = setInterval(showTransportChart, 30000); // Auto-refresh every 30s
});

closeTransportPopup.addEventListener("click", () => {
  transportPopup.style.display = "none";
  clearInterval(transportInterval);
});

function showTransportChart() {
  fetch(transportCsvUrl)
    .then(res => res.text())
    .then(csv => {
      const rows = csv.split("\n").slice(1);
      const modeCounts = {
        Car: 0,
        "Two-wheeler": 0,
        "Public transport": 0,
        Bicycle: 0,
        Walking: 0,
        Other: 0
      };

      rows.forEach(row => {
        const cols = row.split(",");
        const mode = cols[0]?.trim(); // Q1: Transport mode
        if (modeCounts[mode] !== undefined) modeCounts[mode]++;
      });

      const total = Object.values(modeCounts).reduce((a, b) => a + b, 0);
      const publicUsers = modeCounts["Public transport"];
      const publicPercent = total > 0 ? ((publicUsers / total) * 100).toFixed(1) : 0;

      // 🟢 Calculate Most & Least Used Transport Mode
      let sortedModes = Object.entries(modeCounts).sort((a, b) => b[1] - a[1]);
      let mostUsed = sortedModes[0] ? sortedModes[0][0] : "N/A";
      let leastUsed = sortedModes[sortedModes.length - 1] ? sortedModes[sortedModes.length - 1][0] : "N/A";

      document.getElementById("transportUsage").innerHTML = `
        Usage Level: Moderate <br>
        Public transport share: ${publicPercent}%<br>
        <span style="color:#03a9f4;">Auto-refreshing every 30s</span>
      `;

      document.getElementById("modeInsights").innerHTML = `
         <b>Most used mode:</b> ${mostUsed}<br>
         <b>Least used mode:</b> ${leastUsed}
      `;

      const ctx = document.getElementById('transportMeter').getContext('2d');

      // Destroy old chart if exists
      if (transportChartInstance) transportChartInstance.destroy();

      transportChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Low', 'Moderate', 'High'],
          datasets: [{
            data: [0,39.2,0],
            backgroundColor: ['#4CAF50', '#FFC107', '#F44336'],
            borderWidth: 0,
            cutout: '70%'
          }]
        },
        options: {
          layout: { padding: 10 },
          plugins: {
            legend: { position: 'bottom', labels: { color: 'white', font: { size: 13 } } },
            title: { display: true, text: 'Ridership Load Indicator', color: 'white', font: { size: 18 } }
          }
        },
        plugins: [{
          id: 'centerText',
          afterDraw(chart) {
            const { ctx, chartArea: { left, right, top, bottom } } = chart;
            const x = (left + right) / 2;
            const y = (top + bottom) / 2;
            ctx.save();
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${publicPercent}%`, x, y);
          }
        }]
      });
    })
    .catch(() => {
      document.getElementById("transportUsage").textContent = "Failed to load transport data.";
      document.getElementById("modeInsights").textContent = "⚠️ Could not load mode insights.";
    });
}

// =====  Parking Spot Popup Script (Final Stable Version) =====
document.addEventListener("DOMContentLoaded", () => {
  const openParkingBtn = document.querySelector(".parking .Explore-insight");
  const parkingPopup = document.getElementById("parkingPopupOverlay");
  const closeParkingBtn = document.getElementById("closeParkingPopup");
  const notifyBtn = document.getElementById("notifyParking");
  const parkingAlert = document.getElementById("parkingAlert");

  if (openParkingBtn && parkingPopup) {
    // Open popup
    openParkingBtn.addEventListener("click", (e) => {
      e.preventDefault();
      parkingPopup.style.display = "flex";
    });

    // Close popup
    closeParkingBtn.addEventListener("click", () => {
      parkingPopup.style.display = "none";
    });

    // Click outside closes popup
    parkingPopup.addEventListener("click", (e) => {
      if (e.target === parkingPopup) parkingPopup.style.display = "none";
    });

    // Notify Me button click (no "From-To" alert)
    notifyBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // prevent mixing with map popup
      parkingAlert.style.display = "block";
      setTimeout(() => {
        parkingAlert.style.display = "none";
      }, 3000);
    });
  }
});


// ===== FAQ Toggle (Short Answer on Click) =====
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(q => {
  q.addEventListener('click', () => {
    const answer = q.nextElementSibling;
    
    // Close others when one is opened
    document.querySelectorAll('.faq-answer').forEach(a => {
      if (a !== answer) a.style.display = 'none';
    });
    
    // Toggle selected answer
    answer.style.display = (answer.style.display === 'block') ? 'none' : 'block';
  });
});



// Scroll-to-Top Button Logic
const scrollTopBtn = document.getElementById("scrollTopBtn");

window.onscroll = function() {
  if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    scrollTopBtn.style.display = "block";
  } else {
    scrollTopBtn.style.display = "none";
  }
};

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});


