const tabs = document.querySelectorAll(".tab");
const days = document.querySelectorAll(".day");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.day;

    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", String(selected));
    });

    days.forEach((day) => {
      const selected = day.id === target;
      day.classList.toggle("is-active", selected);
      day.hidden = !selected;
    });
  });
});

const krwInput = document.querySelector("#krwInput");
const rateInput = document.querySelector("#rateInput");
const twdResult = document.querySelector("#twdResult");
const rateStatus = document.querySelector("#rateStatus");
const weatherGrid = document.querySelector("#weatherGrid");
const weatherStatus = document.querySelector("#weatherStatus");
const countdownOutput = document.querySelector("#gatheringCountdown");
const transferTimeText = "去程機場接送時間：2026/07/09 21:00";

function renderTransferPickupTime() {
  const firstFlightItem = document.querySelector(".flight-card .compact-list li:first-child");
  const countdownLabel = document.querySelector(".countdown__label");
  const countdownTarget = document.querySelector(".countdown__target");

  if (firstFlightItem) {
    firstFlightItem.innerHTML = `<strong>接送</strong><span>${transferTimeText}</span>`;
  }

  if (countdownLabel) {
    countdownLabel.textContent = "距離去程接送還有";
  }

  if (countdownTarget) {
    countdownTarget.textContent = "目標：115/07/09 21:00（台灣時間）";
  }
}

renderTransferPickupTime();

function formatTwd(value) {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function updateConversion() {
  const krw = Number(krwInput.value);
  const rate = Number(rateInput.value);
  twdResult.textContent = formatTwd(krw * rate);
}

async function loadRate() {
  const endpoints = [
    "https://latest.currency-api.pages.dev/v1/currencies/krw.json",
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/krw.json"
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) continue;

      const data = await response.json();
      const rate = Number(data?.krw?.twd);
      if (!rate) continue;

      rateInput.value = rate.toFixed(5);
      rateStatus.textContent = `即時匯率 ${data.date || ""}`;
      updateConversion();
      return;
    } catch {
      // Try the next public endpoint before using the editable fallback rate.
    }
  }

  rateStatus.textContent = "使用預設匯率，可自行修改";
  updateConversion();
}

[krwInput, rateInput].forEach((input) => {
  input.addEventListener("input", updateConversion);
});

updateConversion();
loadRate();

const weatherLabels = new Map([
  [0, "晴朗"],
  [1, "大致晴朗"],
  [2, "局部多雲"],
  [3, "陰天"],
  [45, "霧"],
  [48, "霧淞"],
  [51, "毛毛雨"],
  [53, "毛毛雨"],
  [55, "較強毛毛雨"],
  [61, "小雨"],
  [63, "降雨"],
  [65, "大雨"],
  [71, "小雪"],
  [73, "降雪"],
  [75, "大雪"],
  [80, "短暫陣雨"],
  [81, "陣雨"],
  [82, "強陣雨"],
  [95, "雷雨"],
  [96, "雷雨冰雹"],
  [99, "強雷雨冰雹"]
]);

function formatWeatherDate(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function renderWeather(data) {
  const daily = data.daily;
  weatherGrid.innerHTML = daily.time.map((date, index) => {
    const max = Math.round(daily.temperature_2m_max[index]);
    const min = Math.round(daily.temperature_2m_min[index]);
    const code = daily.weather_code[index];
    const rain = daily.precipitation_probability_max[index];
    const desc = weatherLabels.get(code) || "天氣資訊";

    return `
      <article class="weather-card">
        <span class="weather-card__date">${formatWeatherDate(date)}</span>
        <strong class="weather-card__main">${min}-${max}°C</strong>
        <span class="weather-card__desc">${desc}</span>
        <span class="weather-card__rain">降雨機率 ${rain ?? "--"}%</span>
      </article>
    `;
  }).join("");
}

async function loadWeather() {
  const endpoint = "https://api.open-meteo.com/v1/forecast?latitude=35.1796&longitude=129.0756&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul&forecast_days=3";

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    if (!response.ok) throw new Error("weather unavailable");

    const data = await response.json();
    renderWeather(data);
    weatherStatus.textContent = "已更新";
  } catch {
    weatherStatus.textContent = "無法自動讀取";
    weatherGrid.innerHTML = `
      <a class="weather-card weather-card--loading" href="https://www.kma.go.kr/eng/index.jsp" target="_blank" rel="noopener">
        天氣連線暫時失敗，點此開啟韓國氣象廳查詢釜山天氣。
      </a>
    `;
  }
}

loadWeather();

function setupGatheringCountdown() {
  const target = new Date("2026-07-09T21:00:00+08:00").getTime();

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function renderCountdown() {
    const diff = target - Date.now();

    if (diff <= 0) {
      countdownOutput.textContent = "接送時間已到";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const countdownDays = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownOutput.textContent = `${countdownDays} 天 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  renderCountdown();
  setInterval(renderCountdown, 1000);
}

setupGatheringCountdown();
