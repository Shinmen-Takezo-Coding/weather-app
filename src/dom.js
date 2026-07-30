// =========================================
// 1. HELPERS & ASSETS
// =========================================

// Convert "01:00:00" to "1AM"
function formatHour(timeString) {
  const hour = parseInt(timeString.split(':')[0], 10);
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

// Bulletproof, premium external icons via Phosphor
const weatherIcons = {
  "clear-day": `<i class="ph ph-sun"></i>`,
  "clear-night": `<i class="ph ph-moon"></i>`,
  "partly-cloudy-day": `<i class="ph ph-cloud-sun"></i>`,
  "partly-cloudy-night": `<i class="ph ph-cloud-moon"></i>`,
  "cloudy": `<i class="ph ph-cloud"></i>`,
  "rain": `<i class="ph ph-cloud-rain"></i>`,
  "snow": `<i class="ph ph-cloud-snow"></i>`,
  "wind": `<i class="ph ph-wind"></i>`,
  "fog": `<i class="ph ph-cloud-fog"></i>`
};

// Fallback
const defaultIcon = `<i class="ph ph-cloud"></i>`;

// =========================================
// 2. COMPONENTS
// =========================================

function createHeaderHTML(data) {
  return `
    <div class="weather-header">
      <h2 class="city-name">${data.location}</h2>
      <h1 class="current-temp">${data.currentTemp}°</h1>
      <p class="condition">${data.conditions}</p>
      <div class="high-low">
        <span>H: ${data.highTemp}°</span>
        <span>L: ${data.lowTemp}°</span>
      </div>
    </div>
  `;
}

function createHourlyHTML(hourlyData, summaryText = "Conditions continuing through the day.") {
  if (!hourlyData || hourlyData.length === 0) return '';

  const hourlyCards = hourlyData.map(hour => {
    // Look up the SVG string by key, fallback to default if missing
    const iconSVG = weatherIcons[hour.icon] || defaultIcon;

    return `
      <div class="hourly-card">
        <p class="hour-time">${formatHour(hour.time)}</p>
        <div class="hour-icon">${iconSVG}</div> 
        <p class="hour-temp">${Math.round(hour.temp)}°</p>
      </div>
    `;
  }).join('');

  return `
    <div class="hourly-container">
      <p class="hourly-summary">${summaryText}</p>
      <div class="hourly-scroll">
        ${hourlyCards}
      </div>
    </div>
  `;
}

function createDailyHTML(dailyData) {
  if (!dailyData || dailyData.length === 0) return '';

  // 1. Calculate the Global Weekly Scale
  const weeklyMin = Math.min(...dailyData.map(d => d.tempMin));
  const weeklyMax = Math.max(...dailyData.map(d => d.tempMax));
  const weeklyRange = weeklyMax - weeklyMin;

  const dailyRows = dailyData.map((day, index) => {
    const iconHTML = weatherIcons[day.icon] || defaultIcon;

    // 2. Calculate bounds for the clip-path mask
    const leftPercent = weeklyRange === 0 ? 0 : ((day.tempMin - weeklyMin) / weeklyRange) * 100;
    const widthPercent = weeklyRange === 0 ? 100 : ((day.tempMax - day.tempMin) / weeklyRange) * 100;
    const rightPercent = 100 - (leftPercent + widthPercent);

    // 3. Fix the current temperature indicator (The White Dot)
    let indicatorHTML = '';
    if (day.isToday && day.currentTemp !== undefined && day.currentTemp !== null) {
      // Pinpoint the dot on the exact same global scale
      let dotPercent = weeklyRange === 0 ? 50 : ((day.currentTemp - weeklyMin) / weeklyRange) * 100;
      dotPercent = Math.max(0, Math.min(100, dotPercent)); // Lock it inside the bounds
      
      indicatorHTML = `<div class="current-indicator" style="left: ${dotPercent}%;"></div>`;
    }

    return `
      <div class="daily-row">
        <p class="day-name">${formatDay(day.date, index)}</p>
        <div class="day-icon">${iconHTML}</div>
        <div class="day-temps">
          <span class="day-low">${day.tempMin}°</span>
          <div class="temp-bar-container">
            <div class="temp-bar" style="clip-path: inset(0 ${rightPercent}% 0 ${leftPercent}% round 4px);"></div>
            ${indicatorHTML}
          </div>
          <span class="day-high">${day.tempMax}°</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="daily-container">
      <div class="daily-label">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>FORECAST</span>
      </div>
      <div class="daily-list">
        ${dailyRows}
      </div>
    </div>
  `;
}

function formatDay(dateString, index) {
  if (index === 0) return 'Today';
  
  // Split the string to avoid Javascript timezone shifting issues
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// =========================================
// 3. MASTER EXPORT
// =========================================

export function renderWeatherUI(cleanData) {
  const container = document.getElementById('weather-display');
  if (!container) return;

  container.innerHTML = `
    ${createHeaderHTML(cleanData)}
    ${createHourlyHTML(cleanData.hourly, cleanData.summary)}
    ${createDailyHTML(cleanData.weekly)}
  `;
}