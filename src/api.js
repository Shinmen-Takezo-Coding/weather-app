const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function getWeatherData(location) {
    try {
        const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
        const encodedLocation = encodeURIComponent(location);
        const response = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodedLocation}?unitGroup=metric&key=${WEATHER_API_KEY}`);

        if(!response.ok) {
            throw new Error(`Location not found (${response.status})`);
        }

        const rawData = await response.json();

        // 1. Pass a loading string directly to processWeatherData
        const cleanData = processWeatherData(rawData, "✨ Generating AI summary..."); 
        
        // 2. Tack on the raw description so we can pass it to Gemini in the next step
        cleanData.todayDescription = rawData.days[0].description; 

        return cleanData;

    } catch (error) {
        console.error(error);
    }
}

export function processWeatherData(rawData, summary) {
    const current = rawData.currentConditions;
    const today = rawData.days[0];

    // Map over ALL 24 hours without filtering
    const allHourlyForecast = today.hours.map(hour => ({
        time: hour.datetime,
        temp: Math.round(hour.temp),
        conditions: hour.conditions,
        icon: hour.icon,
        precipProb: hour.precipprob // bonus if you want rain chance per hour
    }));

    const weeklyForecast = rawData.days.slice(0, 7).map((day, index) => ({
        date: day.datetime,
        tempMax: Math.round(day.tempmax), 
        tempMin: Math.round(day.tempmin),
        conditions: day.conditions,
        icon: day.icon,
        isToday: index === 0, 
        // THIS LINE IS MANDATORY FOR THE DOT TO RENDER:
        currentTemp: index === 0 ? Math.round(rawData.currentConditions.temp) : null 
    }));

    return {
        location: rawData.resolvedAddress,
        currentTemp: Math.round(current.temp),
        highTemp: Math.round(today.tempmax),
        lowTemp: Math.round(today.tempmin),
        conditions: current.conditions,
        icon: current.icon,
        hourly: allHourlyForecast,
        weekly: weeklyForecast,
        summary: summary
    };
}

// Make sure this is exported so main.js can use it!
export async function generateWeatherSummary(data) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`; 

  // Updated to map to the cleanData object properties
  const prompt = `Write a crisp, single sentence weather summary (maximum 15 words) for a mobile UI header based on this weather data:
  Location: ${data.location}
  Current Temp: ${data.currentTemp}°C
  Condition: ${data.conditions}
  High/Low: ${data.highTemp}°C / ${data.lowTemp}°C
  Overview: ${data.todayDescription}
  
  Do not include introductory words or quotes. Return only the summary text.`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

    const resData = await response.json();
    return resData.candidates[0].content.parts[0].text.trim();

  } catch (error) {
    console.error("Failed to generate AI summary:", error);
    return "Conditions continuing through the day.";
  }
}