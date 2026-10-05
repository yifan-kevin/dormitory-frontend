<template>
  <div class="weather-card">
    <div class="weather-toolbar">
      <div>
        <span class="weather-kicker">Weather</span>
        <h4>城市天气</h4>
      </div>

      <el-select
        v-model="selectedCityCode"
        class="weather-select"
        filterable
        placeholder="选择地区"
        @change="handleCityChange"
      >
        <el-option-group v-for="group in cityGroups" :key="group.label" :label="group.label">
          <el-option
            v-for="item in group.options"
            :key="item.code"
            :label="item.label"
            :value="item.code"
          />
        </el-option-group>
      </el-select>
    </div>

    <div class="weather-panel" v-loading="loading">
      <template v-if="weather">
        <div class="weather-main">
          <div>
            <div class="weather-city">{{ currentCity.label }}</div>
            <div class="weather-desc">{{ weatherDescription }}</div>
          </div>
          <div class="weather-temp">{{ Math.round(weather.temperature) }}°</div>
        </div>

        <div class="weather-stats">
          <div class="weather-stat">
            <span>体感温度</span>
            <strong>{{ Math.round(weather.apparentTemperature) }}°C</strong>
          </div>
          <div class="weather-stat">
            <span>相对湿度</span>
            <strong>{{ weather.humidity }}%</strong>
          </div>
          <div class="weather-stat">
            <span>风速</span>
            <strong>{{ weather.windSpeed }} km/h</strong>
          </div>
          <div class="weather-stat">
            <span>更新时间</span>
            <strong>{{ weather.timeText }}</strong>
          </div>
        </div>
      </template>

      <div v-else class="weather-empty">
        <strong>天气暂时未加载成功</strong>
        <p>可以重新切换一次城市，或者稍后再试。</p>
      </div>
    </div>
  </div>
</template>

<script>
const WEATHER_STORAGE_KEY = "selected_weather_city";

const cityGroups = [
  {
    label: "华北",
    options: [
      { code: "beijing", label: "北京", latitude: 39.9042, longitude: 116.4074 },
      { code: "tianjin", label: "天津", latitude: 39.3434, longitude: 117.3616 },
      { code: "shijiazhuang", label: "石家庄", latitude: 38.0428, longitude: 114.5149 },
      { code: "taiyuan", label: "太原", latitude: 37.8706, longitude: 112.5489 },
      { code: "hohhot", label: "呼和浩特", latitude: 40.8426, longitude: 111.7492 }
    ]
  },
  {
    label: "东北",
    options: [
      { code: "shenyang", label: "沈阳", latitude: 41.8057, longitude: 123.4315 },
      { code: "changchun", label: "长春", latitude: 43.8171, longitude: 125.3235 },
      { code: "harbin", label: "哈尔滨", latitude: 45.8038, longitude: 126.5349 }
    ]
  },
  {
    label: "华东",
    options: [
      { code: "shanghai", label: "上海", latitude: 31.2304, longitude: 121.4737 },
      { code: "nanjing", label: "南京", latitude: 32.0603, longitude: 118.7969 },
      { code: "hangzhou", label: "杭州", latitude: 30.2741, longitude: 120.1551 },
      { code: "hefei", label: "合肥", latitude: 31.8206, longitude: 117.2272 },
      { code: "fuzhou", label: "福州", latitude: 26.0745, longitude: 119.2965 },
      { code: "nanchang", label: "南昌", latitude: 28.6829, longitude: 115.8582 },
      { code: "jinan", label: "济南", latitude: 36.6512, longitude: 117.1201 },
      { code: "qingdao", label: "青岛", latitude: 36.0671, longitude: 120.3826 }
    ]
  },
  {
    label: "华中",
    options: [
      { code: "zhengzhou", label: "郑州", latitude: 34.7466, longitude: 113.6254 },
      { code: "wuhan", label: "武汉", latitude: 30.5928, longitude: 114.3055 },
      { code: "changsha", label: "长沙", latitude: 28.2282, longitude: 112.9388 }
    ]
  },
  {
    label: "华南",
    options: [
      { code: "guangzhou", label: "广州", latitude: 23.1291, longitude: 113.2644 },
      { code: "shenzhen", label: "深圳", latitude: 22.5431, longitude: 114.0579 },
      { code: "nanning", label: "南宁", latitude: 22.817, longitude: 108.3669 },
      { code: "haikou", label: "海口", latitude: 20.044, longitude: 110.1999 }
    ]
  },
  {
    label: "西南",
    options: [
      { code: "chengdu", label: "成都", latitude: 30.5728, longitude: 104.0668 },
      { code: "chongqing", label: "重庆", latitude: 29.563, longitude: 106.5516 },
      { code: "guiyang", label: "贵阳", latitude: 26.647, longitude: 106.6302 },
      { code: "kunming", label: "昆明", latitude: 25.0389, longitude: 102.7183 }
    ]
  },
  {
    label: "西北",
    options: [
      { code: "xian", label: "西安", latitude: 34.3416, longitude: 108.9398 },
      { code: "lanzhou", label: "兰州", latitude: 36.0611, longitude: 103.8343 },
      { code: "xining", label: "西宁", latitude: 36.6171, longitude: 101.7782 },
      { code: "urumqi", label: "乌鲁木齐", latitude: 43.8256, longitude: 87.6168 }
    ]
  }
];

const weatherCodeMap = {
  0: "晴朗",
  1: "大部晴朗",
  2: "局部多云",
  3: "阴天",
  45: "有雾",
  48: "冻雾",
  51: "小毛雨",
  53: "毛雨",
  55: "强毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "强阵雨",
  82: "暴雨阵雨",
  95: "雷暴"
};

export default {
  name: "weather",
  data() {
    return {
      cityGroups,
      selectedCityCode: "zhengzhou",
      loading: false,
      weather: null
    };
  },
  computed: {
    flatCityOptions() {
      return this.cityGroups.flatMap((group) => group.options);
    },
    currentCity() {
      return this.flatCityOptions.find((item) => item.code === this.selectedCityCode) || this.flatCityOptions[0];
    },
    weatherDescription() {
      return weatherCodeMap[this.weather?.weatherCode] || "天气未知";
    }
  },
  mounted() {
    const cachedCity = window.localStorage.getItem(WEATHER_STORAGE_KEY);
    if (cachedCity && this.flatCityOptions.some((item) => item.code === cachedCity)) {
      this.selectedCityCode = cachedCity;
    }
    this.loadWeather();
  },
  methods: {
    handleCityChange(value) {
      window.localStorage.setItem(WEATHER_STORAGE_KEY, value);
      this.loadWeather();
    },
    async loadWeather() {
      this.loading = true;
      this.weather = null;

      try {
        const city = this.currentCity;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        const response = await fetch(url);
        const data = await response.json();
        const current = data?.current;

        if (!current) {
          throw new Error("天气数据为空");
        }

        this.weather = {
          temperature: current.temperature_2m,
          apparentTemperature: current.apparent_temperature,
          humidity: current.relative_humidity_2m,
          weatherCode: current.weather_code,
          windSpeed: current.wind_speed_10m,
          timeText: current.time ? current.time.replace("T", " ") : "-"
        };
      } catch (error) {
        console.error(error);
        this.weather = null;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.weather-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.weather-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.weather-kicker {
  display: inline-flex;
  color: #b7791f;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.weather-toolbar h4 {
  margin-top: 8px;
  color: #1d1d1f;
  font-size: 20px;
  line-height: 1.15;
  font-weight: 900;
}

.weather-select {
  width: 148px;
}

.weather-panel {
  min-height: 168px;
}

.weather-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.weather-city {
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 900;
}

.weather-desc {
  margin-top: 6px;
  color: #86868b;
  font-size: 13px;
}

.weather-temp {
  color: #1d1d1f;
  font-size: 42px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.06em;
  text-shadow: 0 14px 34px rgba(183, 121, 31, 0.12);
}

.weather-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.weather-stat {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 1);
}

.weather-stat span {
  display: block;
  color: #86868b;
  font-size: 12px;
}

.weather-stat strong {
  display: block;
  margin-top: 6px;
  color: #1d1d1f;
  font-size: 13px;
  word-break: break-word;
}

.weather-empty {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.58);
  color: #86868b;
}

.weather-empty strong {
  display: block;
  color: #1d1d1f;
  font-size: 15px;
}

.weather-empty p {
  margin-top: 8px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .weather-toolbar,
  .weather-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .weather-select {
    width: 100%;
  }

  .weather-stats {
    grid-template-columns: 1fr;
  }
}
</style>
