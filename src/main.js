import './style.css';
import { getWeatherData, generateWeatherSummary } from './api'; // Import both!
import { renderWeatherUI } from './dom';

const form = document.getElementById("weather-form");
const input = document.getElementById("location-input");

export async function loadCityWeather(location) {
  if (!location) return;

  // 1. Fetch Visual Crossing and render the UI instantly
  const cleanData = await getWeatherData(location);
  renderWeatherUI(cleanData); 

  // 2. Ping Gemini in the background using the data we just rendered
  const aiSummaryText = await generateWeatherSummary(cleanData);

  // 3. Swap out the temporary loading text once Gemini returns
  const summaryElement = document.querySelector(".hourly-summary");
  if (summaryElement) {
    summaryElement.textContent = aiSummaryText;
  }
}

export async function handleSearch(e) {
  e.preventDefault();
  const location = input.value.trim();
  await loadCityWeather(location);
  input.value = ""; 
}

form.addEventListener("submit", handleSearch);

// Instant load
loadCityWeather("Ulaanbaatar");