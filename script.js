// Replace with your own API keys
const OPENWEATHER_API_KEY = "30c0c3679d488d2c91027f61cecc6e14";
const UNSPLASH_ACCESS_KEY = "Ue3wucwsRJWTyNTL9-zLu4frPszTKyNggjzdaqfty3c";

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const cityImageDiv = document.getElementById('city-image');
const weatherInfoDiv = document.getElementById('weather-info');
const forecastSection = document.getElementById('forecast-section');

// Custom animated cursor
const cursor = document.querySelector('.custom-cursor');
let cursorVisible = true;

const weatherContainer = document.querySelector('.weather-container');

function formatTime(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

async function fetchCityImage(city) {
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(city)}&client_id=${UNSPLASH_ACCESS_KEY}&orientation=landscape&per_page=1`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
  } catch {}
  return null;
}

async function fetchWeather(city) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`);
  if (!res.ok) throw new Error("City not found");
  return res.json();
}

async function fetchForecast(city) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`);
  if (!res.ok) throw new Error("Failed to fetch forecast");
  return res.json();
}

function showCityImage(url) {
  if (url) {
    cityImageDiv.innerHTML = `<img src="${url}" alt="City view" />`;
    cityImageDiv.style.display = 'block';
  } else {
    cityImageDiv.innerHTML = '';
    cityImageDiv.style.display = 'none';
  }
}

function showWeatherInfo(data) {
  const { name, main, weather, wind, sys, timezone } = data;
  weatherInfoDiv.innerHTML = `
    <div class="city-name">${name}</div>
    <img class="weather-icon" src="https://openweathermap.org/img/wn/${weather[0].icon}@4x.png" alt="${weather[0].description}" />
    <div class="temp">${Math.round(main.temp)}°C</div>
    <div class="desc">${weather[0].description}</div>
    <div class="details">
      <span class="badge">💧 Humidity: ${main.humidity}%</span>
      <span class="badge">💨 Wind: ${wind.speed} m/s</span>
      <span class="badge">🌅 Sunrise: ${formatTime(sys.sunrise, timezone)}</span>
      <span class="badge">🌇 Sunset: ${formatTime(sys.sunset, timezone)}</span>
    </div>
  `;
  weatherInfoDiv.style.display = 'flex';
}

function showForecast(forecastData) {
  // Group by day, pick the forecast at 12:00 each day (or closest)
  const daily = {};
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const hour = date.getHours();
    if (!daily[day] || Math.abs(hour - 12) < Math.abs(daily[day].hour - 12)) {
      daily[day] = { ...item, hour };
    }
  });
  const days = Object.values(daily).slice(0, 5);
  if (days.length === 0) {
    forecastSection.style.display = 'none';
    return;
  }
  forecastSection.innerHTML = `
    <div class="forecast-title">5-Day Forecast</div>
    <div class="forecast-cards">
      ${days.map(item => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        return `
          <div class="forecast-card">
            <div class="day">${day}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="${item.weather[0].description}" />
            <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
            <div class="forecast-desc">${item.weather[0].description}</div>
            <div class="forecast-humidity">💧 ${item.main.humidity}%</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  forecastSection.style.display = 'block';
}

function showError(msg) {
  weatherInfoDiv.innerHTML = `<div style="color:#e53e3e;font-weight:600;font-size:1.1rem;">${msg}</div>`;
  weatherInfoDiv.style.display = 'flex';
  cityImageDiv.style.display = 'none';
  forecastSection.style.display = 'none';
}

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  weatherInfoDiv.style.display = 'none';
  forecastSection.style.display = 'none';
  cityImageDiv.style.display = 'none';
  showError('Loading...');
  try {
    const [weather, forecast, cityImg] = await Promise.all([
      fetchWeather(city),
      fetchForecast(city),
      fetchCityImage(city)
    ]);
    showCityImage(cityImg);
    showWeatherInfo(weather);
    showForecast(forecast);
  } catch (err) {
    showError(err.message || 'Failed to fetch weather data.');
  }
});

function moveCursor(e) {
  if (!cursorVisible) return;
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  cursor.classList.add('pop');
  clearTimeout(cursor._popTimeout);
  cursor._popTimeout = setTimeout(() => {
    cursor.classList.remove('pop');
  }, 120);
}

function hideCursor() {
  cursor.style.display = 'none';
  cursorVisible = false;
}

function showCursor() {
  cursor.style.display = 'block';
  cursorVisible = true;
}

// Hide cursor on mobile
function isMobile() {
  return window.innerWidth <= 600;
}

if (!isMobile()) {
  document.addEventListener('mousemove', moveCursor);
  document.addEventListener('mouseenter', showCursor);
  document.addEventListener('mouseleave', hideCursor);
} else {
  hideCursor();
}

window.addEventListener('resize', () => {
  if (isMobile()) {
    hideCursor();
  } else {
    showCursor();
  }
});

function popWeatherContainer() {
  if (isMobile()) return;
  weatherContainer.classList.add('pop-effect');
  clearTimeout(weatherContainer._popTimeout);
  weatherContainer._popTimeout = setTimeout(() => {
    weatherContainer.classList.remove('pop-effect');
  }, 180);
}

if (!isMobile()) {
  weatherContainer.addEventListener('mouseenter', popWeatherContainer);
  weatherContainer.addEventListener('mousemove', popWeatherContainer);
  weatherContainer.addEventListener('mouseleave', () => {
    weatherContainer.classList.remove('pop-effect');
  });
}