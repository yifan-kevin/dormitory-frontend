<template>
  <!-- LOCATE: 右下角智能助手悬浮窗口 -->
  <div
    class="mini-assistant"
    :class="{ 'mini-assistant--open': open, 'mini-assistant--dragging': dragState.active }"
    :style="assistantPositionStyle"
  >
    <button v-if="!open" type="button" class="mini-assistant__toggle" @click="openPanel">
      <el-icon><Message /></el-icon>
      <span>智能助手</span>
    </button>

    <section v-else class="mini-assistant__panel">
      <header
        class="mini-assistant__header"
        title="拖动可移动窗口，双击恢复位置"
        @pointerdown="startDrag"
        @dblclick="resetAssistantPosition"
      >
        <div>
          <h3>智能助手</h3>
        </div>
        <div class="mini-assistant__tools" @pointerdown.stop>
          <button type="button" @click="goFullAssistant">完整页</button>
          <button type="button" @click="open = false">收起</button>
        </div>
      </header>

      <div ref="messageList" class="mini-assistant__messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="mini-assistant__message"
          :class="`mini-assistant__message--${message.role}`"
        >
          <strong>{{ message.role === "user" ? "我" : "助手" }}</strong>
          <div v-if="shouldShowMeta(message)" class="mini-assistant__meta">
            <span>{{ message.category }}</span>
          </div>
          <p>{{ message.content }}</p>
        </div>
        <div v-if="loading" class="mini-assistant__message mini-assistant__message--typing">
          <strong>助手</strong>
          <p>查询中…</p>
        </div>
      </div>

      <div class="mini-assistant__chips">
        <button
          v-for="item in suggestions"
          :key="item"
          type="button"
          @click="askQuickQuestion(item)"
        >
          {{ item }}
        </button>
      </div>

      <form class="mini-assistant__input" @submit.prevent="sendQuestion">
        <input
          v-model.trim="question"
          type="text"
          placeholder="输入报修、床位或天气问题"
          aria-label="向助手提问"
        />
        <button type="submit" :disabled="loading">{{ loading ? "发送中" : "发送" }}</button>
      </form>
    </section>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage } from "element-plus";

let miniMessageId = 0;

export default {
  name: "AssistantMini",
  data() {
    return {
      open: false,
      question: "",
      loading: false,
      position: null,
      suggestions: ["报修派单流程是什么？", "维修工作台显示哪些工单？", "上海天气怎么样？"],
      messages: [
        {
          id: ++miniMessageId,
          role: "assistant",
          category: "首页助手",
          content: "可以查询报修、床位、调宿等业务流程，也可以查询天气。"
        }
      ],
      memory: {
        lastTopic: "",
        weatherLocation: "",
        weatherDayOffset: 0,
        businessCategory: ""
      },
      dragState: {
        active: false,
        startX: 0,
        startY: 0,
        startLeft: 0,
        startTop: 0,
        userSelect: ""
      }
    };
  },
  computed: {
    assistantPositionStyle() {
      if (!this.position) {
        return {};
      }
      return {
        left: `${this.position.left}px`,
        top: `${this.position.top}px`,
        right: "auto",
        bottom: "auto"
      };
    }
  },
  watch: {
    "$route.path"() {
      this.open = false;
    }
  },
  mounted() {
    window.addEventListener("resize", this.keepAssistantInViewport);
  },
  beforeUnmount() {
    this.stopDrag();
    window.removeEventListener("resize", this.keepAssistantInViewport);
  },
  methods: {
    openPanel() {
      this.open = true;
      this.$nextTick(this.keepAssistantInViewport);
    },
    startDrag(event) {
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      if (event.target.closest("button, input")) {
        return;
      }

      const rect = this.$el.getBoundingClientRect();
      const bounds = this.dragBounds(rect.width, rect.height);
      const left = this.clamp(rect.left, bounds.minLeft, bounds.maxLeft);
      const top = this.clamp(rect.top, bounds.minTop, bounds.maxTop);

      this.position = { left, top };
      this.dragState.active = true;
      this.dragState.startX = event.clientX;
      this.dragState.startY = event.clientY;
      this.dragState.startLeft = left;
      this.dragState.startTop = top;
      this.dragState.userSelect = document.body.style.userSelect;
      document.body.style.userSelect = "none";

      window.addEventListener("pointermove", this.onDrag);
      window.addEventListener("pointerup", this.stopDrag);
      window.addEventListener("pointercancel", this.stopDrag);
      event.preventDefault();
    },
    onDrag(event) {
      if (!this.dragState.active) {
        return;
      }
      const rect = this.$el.getBoundingClientRect();
      const bounds = this.dragBounds(rect.width, rect.height);
      const nextLeft = this.dragState.startLeft + event.clientX - this.dragState.startX;
      const nextTop = this.dragState.startTop + event.clientY - this.dragState.startY;
      this.position = {
        left: this.clamp(nextLeft, bounds.minLeft, bounds.maxLeft),
        top: this.clamp(nextTop, bounds.minTop, bounds.maxTop)
      };
      event.preventDefault();
    },
    stopDrag() {
      if (!this.dragState.active) {
        return;
      }
      this.dragState.active = false;
      document.body.style.userSelect = this.dragState.userSelect || "";
      window.removeEventListener("pointermove", this.onDrag);
      window.removeEventListener("pointerup", this.stopDrag);
      window.removeEventListener("pointercancel", this.stopDrag);
    },
    keepAssistantInViewport() {
      if (!this.position || !this.$el) {
        return;
      }
      const rect = this.$el.getBoundingClientRect();
      const bounds = this.dragBounds(rect.width, rect.height);
      this.position = {
        left: this.clamp(this.position.left, bounds.minLeft, bounds.maxLeft),
        top: this.clamp(this.position.top, bounds.minTop, bounds.maxTop)
      };
    },
    resetAssistantPosition() {
      this.position = null;
    },
    dragBounds(width, height) {
      const margin = 12;
      return {
        minLeft: margin,
        minTop: margin,
        maxLeft: Math.max(margin, window.innerWidth - width - margin),
        maxTop: Math.max(margin, window.innerHeight - height - margin)
      };
    },
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
    askQuickQuestion(question) {
      if (question === "打开完整助手") {
        this.goFullAssistant();
        return;
      }
      this.question = question;
      this.sendQuestion();
    },
    async sendQuestion() {
      const content = this.question.trim();
      if (!content) {
        ElMessage.warning("请输入问题");
        return;
      }
      if (this.loading) {
        return;
      }

      this.messages.push({
        id: ++miniMessageId,
        role: "user",
        content
      });
      this.question = "";
      this.loading = true;
      this.scrollToBottom();

      try {
        const resolvedContent = this.resolveContextualQuestion(content);
        if (this.isWeatherQuestion(resolvedContent)) {
          await this.answerWeatherQuestion(resolvedContent);
          return;
        }
        const res = await request.post("/assistant/ask", {
          question: resolvedContent,
          role: this.getCurrentRole(),
          pagePath: this.$route.path,
          currentUsername: this.getCurrentUser().username || "",
          currentName: this.getCurrentUser().name || "",
          history: this.buildHistory()
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "智能助手暂时无法回答");
        }
        this.messages.push({
          id: ++miniMessageId,
          role: "assistant",
          category: res.data?.category || "通用咨询",
          content: this.polishAssistantText(res.data?.answer || "我暂时没有找到合适答案。"),
          aiPowered: !!res.data?.aiPowered
        });
        this.rememberBusinessReply(res.data);
        this.suggestions = (res.data?.suggestions || []).slice(0, 3);
      } catch (error) {
        this.messages.push({
          id: ++miniMessageId,
          role: "assistant",
          content: this.polishAssistantText(error.message || "智能助手暂时无法回答，请稍后再试。")
        });
      } finally {
        this.loading = false;
        this.scrollToBottom();
      }
    },
    shouldShowMeta(message) {
      return !!(
        message &&
        message.role === "assistant" &&
        message.category &&
        !["系统助手", "首页助手", "AI 助手", "通用咨询"].includes(message.category)
      );
    },
    polishAssistantText(text) {
      return String(text || "")
        .replace(/^\s*(系统已知规则|规则兜底回答|本地兜底建议|核心判断|核心说明|具体处理|处理建议|注意事项|下一步|结论|回答)\s*[：:]\s*/gm, "")
        .replace(/^\s*(根据你提供的信息|结合系统规则来看|从系统规则看|按照系统规则)\s*[，,：:]?\s*/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    resolveContextualQuestion(content) {
      if (this.isWeatherQuestion(content)) {
        return content;
      }
      if (this.memory.lastTopic === "weather" && this.isWeatherFollowUp(content)) {
        const location = this.extractWeatherFollowUpLocation(content) || this.memory.weatherLocation || "上海";
        const dayOffset = this.resolveDayOffset(content, this.memory.weatherDayOffset);
        return `${this.weatherDayText(dayOffset)}${location}天气怎么样`;
      }
      if (this.memory.lastTopic === "business" && this.isBusinessFollowUp(content)) {
        return `${this.memory.businessCategory} ${content}`;
      }
      return content;
    },
    isWeatherQuestion(content) {
      return /天气|气温|温度|下雨|降雨|风速|冷不冷|热不热|冷吗|热吗|几度|带伞|雨伞|用伞|伞不|伞吗|伞么|带不带伞|用不用伞/.test(content);
    },
    isWeatherFollowUp(content) {
      const compact = content.replace(/\s/g, "");
      if (!compact || compact.length > 14 || this.isLikelyBusinessQuestion(compact)) {
        return false;
      }
      if (/^(那|那么|这个|这边|那边)?(今天|明天|后天)?(呢|吗|怎么样|咋样|如何)?$/.test(compact)) {
        return true;
      }
      return !!this.extractWeatherFollowUpLocation(compact);
    },
    isBusinessFollowUp(content) {
      const compact = content.replace(/\s/g, "");
      return compact.length <= 18 && /^(那|那么|如果|比如|工人端|学生端|管理员|宿管|怎么|为什么|可以|需要|还有|呢|吗)/.test(compact);
    },
    isLikelyBusinessQuestion(content) {
      return /床位|报修|维修|调宿|请假|离校|访客|卫生|账号|登录|公告|学生|宿舍|房间|楼宇|工单|预约|派单|完工|评价/.test(content);
    },
    async answerWeatherQuestion(content) {
      const locationName = this.extractWeatherLocation(content, this.memory.weatherLocation || "上海");
      const dayOffset = this.resolveDayOffset(content);
      const location = await this.resolveWeatherLocation(locationName);

      const forecastUrl = [
        "https://api.open-meteo.com/v1/forecast",
        `?latitude=${location.latitude}`,
        `&longitude=${location.longitude}`,
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
        "&timezone=auto&forecast_days=3"
      ].join("");
      const forecastRes = await window.fetch(forecastUrl);
      if (!forecastRes.ok) {
        throw new Error("天气数据获取失败");
      }
      const forecast = await forecastRes.json();
      const daily = forecast.daily || {};
      const current = forecast.current || {};
      const code = dayOffset === 0 ? current.weather_code : daily.weather_code?.[dayOffset];
      const description = this.weatherCodeText(code);
      const locationText = [location.name, location.admin1, location.country].filter(Boolean).join("，");
      const maxTemperature = daily.temperature_2m_max?.[dayOffset];
      const minTemperature = daily.temperature_2m_min?.[dayOffset];
      const precipitationSum = daily.precipitation_sum?.[dayOffset];
      const advice = this.buildWeatherAdvice({
        code,
        precipitation: precipitationSum,
        windSpeed: dayOffset === 0 ? current.wind_speed_10m : null,
        temperature: dayOffset === 0 ? current.temperature_2m : maxTemperature
      });

      const rainValue = Number(precipitationSum || 0);
      const needsUmbrella = rainValue >= 0.5 || this.isWetWeather(code);
      const answer = dayOffset === 0
        ? `${locationText}今天${needsUmbrella ? "建议带伞" : "一般不用带伞"}。\n\n当前${description}，气温 ${this.formatWeatherValue(current.temperature_2m)}°C，体感 ${this.formatWeatherValue(current.apparent_temperature)}°C；今天最高 ${this.formatWeatherValue(maxTemperature)}°C，最低 ${this.formatWeatherValue(minTemperature)}°C，预计降水 ${this.formatWeatherValue(precipitationSum)} mm。\n\n${advice}`
        : `${locationText}${this.weatherDayText(dayOffset)}${needsUmbrella ? "建议带伞" : "一般不用带伞"}。\n\n${daily.time?.[dayOffset] || ""} 预报${description}，最高 ${this.formatWeatherValue(maxTemperature)}°C，最低 ${this.formatWeatherValue(minTemperature)}°C，预计降水 ${this.formatWeatherValue(precipitationSum)} mm。\n\n${advice}`;

      this.messages.push({
        id: ++miniMessageId,
        role: "assistant",
        category: "天气查询",
        content: answer
      });
      this.memory.lastTopic = "weather";
      this.memory.weatherLocation = location.name || locationName;
      this.memory.weatherDayOffset = dayOffset;
      this.suggestions = [`${location.name}明天天气怎么样？`, "报修派单流程是什么？", "打开完整助手"];
    },
    async resolveWeatherLocation(locationName) {
      const localLocation = this.resolveLocalWeatherLocation(locationName);
      try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=zh&format=json`;
        const geoRes = await window.fetch(geoUrl);
        if (!geoRes.ok) {
          throw new Error("天气地点查询失败");
        }
        const geoData = await geoRes.json();
        const location = geoData.results?.[0];
        if (location) {
          return location;
        }
      } catch (error) {
        if (!localLocation) {
          throw new Error("天气地点查询失败");
        }
      }
      if (localLocation) {
        return localLocation;
      }
      throw new Error(`没有找到“${locationName}”的天气地点`);
    },
    resolveLocalWeatherLocation(locationName) {
      const normalized = String(locationName || "")
        .replace(/市|县|区|天气/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
      const cityMap = {
        上海: { name: "上海", admin1: "上海市", country: "中国", latitude: 31.2304, longitude: 121.4737 },
        北京: { name: "北京", admin1: "北京市", country: "中国", latitude: 39.9042, longitude: 116.4074 },
        郑州: { name: "郑州", admin1: "河南", country: "中国", latitude: 34.7466, longitude: 113.6254 },
        安阳: { name: "安阳", admin1: "河南", country: "中国", latitude: 36.0996, longitude: 114.3925 },
        漯河: { name: "漯河", admin1: "河南", country: "中国", latitude: 33.5815, longitude: 114.0168 },
        开封: { name: "开封", admin1: "河南", country: "中国", latitude: 34.7973, longitude: 114.3073 },
        洛阳: { name: "洛阳", admin1: "河南", country: "中国", latitude: 34.6197, longitude: 112.4540 },
        平顶山: { name: "平顶山", admin1: "河南", country: "中国", latitude: 33.7662, longitude: 113.1924 },
        鹤壁: { name: "鹤壁", admin1: "河南", country: "中国", latitude: 35.7470, longitude: 114.2973 },
        新乡: { name: "新乡", admin1: "河南", country: "中国", latitude: 35.3030, longitude: 113.9268 },
        焦作: { name: "焦作", admin1: "河南", country: "中国", latitude: 35.2159, longitude: 113.2418 },
        濮阳: { name: "濮阳", admin1: "河南", country: "中国", latitude: 35.7618, longitude: 115.0293 },
        许昌: { name: "许昌", admin1: "河南", country: "中国", latitude: 34.0357, longitude: 113.8525 },
        三门峡: { name: "三门峡", admin1: "河南", country: "中国", latitude: 34.7726, longitude: 111.2001 },
        南阳: { name: "南阳", admin1: "河南", country: "中国", latitude: 32.9907, longitude: 112.5285 },
        商丘: { name: "商丘", admin1: "河南", country: "中国", latitude: 34.4143, longitude: 115.6563 },
        信阳: { name: "信阳", admin1: "河南", country: "中国", latitude: 32.1470, longitude: 114.0913 },
        周口: { name: "周口", admin1: "河南", country: "中国", latitude: 33.6258, longitude: 114.6969 },
        驻马店: { name: "驻马店", admin1: "河南", country: "中国", latitude: 32.9773, longitude: 114.0250 },
        济源: { name: "济源", admin1: "河南", country: "中国", latitude: 35.0671, longitude: 112.6027 },
        luohe: { name: "漯河", admin1: "河南", country: "中国", latitude: 33.5815, longitude: 114.0168 },
        anyang: { name: "安阳", admin1: "河南", country: "中国", latitude: 36.0996, longitude: 114.3925 },
        zhengzhou: { name: "郑州", admin1: "河南", country: "中国", latitude: 34.7466, longitude: 113.6254 }
      };
      return cityMap[normalized] || null;
    },
    buildWeatherAdvice({ code, precipitation, windSpeed, temperature }) {
      const advice = [];
      const rain = Number(precipitation || 0);
      const wind = Number(windSpeed || 0);
      const temp = Number(temperature);

      advice.push(rain >= 0.5 || this.isWetWeather(code) ? "有降水风险，建议带伞。" : "降水风险不高，正常出行基本没问题。");
      if (!Number.isNaN(temp)) {
        if (temp <= 8) {
          advice.push("气温偏低，外出建议加外套。");
        } else if (temp >= 30) {
          advice.push("气温偏高，注意补水和防晒。");
        } else if (temp >= 18 && temp <= 26) {
          advice.push("温度比较舒服，轻便穿着就行。");
        }
      }
      if (wind >= 20) {
        advice.push("风偏大，骑车或晾晒衣物要留意。");
      }
      return advice.join("");
    },
    isWetWeather(code) {
      return [51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99].includes(Number(code));
    },
    extractWeatherFollowUpLocation(content) {
      return this.cleanWeatherLocationText(content, "");
    },
    extractWeatherLocation(content, fallback = "上海") {
      return this.cleanWeatherLocationText(content, fallback);
    },
    cleanWeatherLocationText(content, fallback = "") {
      const cleaned = String(content || "")
        .replace(/[，。！？,.!?\s]/g, "")
        .replace(/^(我想问一下|我想问|想问一下|想问|麻烦帮我|麻烦|给我|那|那么|然后|还有|再看看|再查查|查询|帮我看看|帮我查查|帮我查|请问|看一下|查一下)/g, "")
        .replace(/今天|明天|后天|现在|当前|实时/g, "")
        .replace(/天气怎么样|天气咋样|天气如何|天气|气温|温度|会不会下雨|会下雨吗|下雨吗|下不下雨|下雨|降雨概率|降雨|风速|冷不冷|热不热|冷吗|热吗|多少度|几度|用不用带伞|用不用伞|用带伞么|用带伞吗|用伞吗|用伞么|用伞不|用伞|要不要带伞|需不需要带伞|需要带伞吗|需要带伞么|需要带伞|需要伞吗|需要伞么|需要伞不|需要伞|带不带伞|带伞吗|带伞么|带伞不|带伞|雨伞|伞吗|伞么|伞不|咋么样|怎么样|咋样|怎样|什么样|如何|多少/g, "")
        .replace(/出门|出行|外出|建议|给我|需要|用不用|要不要|需不需要|不用|用|要|该|应该|是否|会|能|可以|我们|我|咱们|咱|本人|么|吗|呢|啊|呀|吧|的/g, "")
        .trim();
      return cleaned || fallback;
    },
    resolveDayOffset(content, fallback = 0) {
      if (content.includes("后天")) {
        return 2;
      }
      if (content.includes("明天")) {
        return 1;
      }
      if (content.includes("今天") || content.includes("现在") || content.includes("当前")) {
        return 0;
      }
      return fallback;
    },
    weatherDayText(dayOffset) {
      return ["今天", "明天", "后天"][dayOffset] || "今天";
    },
    weatherCodeText(code) {
      const map = {
        0: "晴",
        1: "大部晴朗",
        2: "局部多云",
        3: "阴",
        45: "有雾",
        48: "雾凇",
        51: "小毛毛雨",
        53: "中等毛毛雨",
        55: "较强毛毛雨",
        61: "小雨",
        63: "中雨",
        65: "大雨",
        71: "小雪",
        73: "中雪",
        75: "大雪",
        80: "小阵雨",
        81: "中等阵雨",
        82: "强阵雨",
        95: "雷暴",
        96: "雷暴伴小冰雹",
        99: "雷暴伴大冰雹"
      };
      return map[code] || "天气状况未知";
    },
    formatWeatherValue(value) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "-";
      }
      return Number(value).toFixed(1).replace(".0", "");
    },
    rememberBusinessReply(data) {
      if (!data?.category || data.category === "通用咨询") {
        return;
      }
      this.memory.lastTopic = "business";
      this.memory.businessCategory = data.category;
    },
    buildHistory() {
      return this.messages
        .slice(-8)
        .map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content
        }))
        .filter((message) => message.content);
    },
    getCurrentRole() {
      try {
        return JSON.parse(window.sessionStorage.getItem("identity") || "\"\"");
      } catch (error) {
        return "";
      }
    },
    getCurrentUser() {
      try {
        return JSON.parse(window.sessionStorage.getItem("user") || "{}") || {};
      } catch (error) {
        return {};
      }
    },
    goFullAssistant() {
      this.$router.push("/aiAssistant");
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const list = this.$refs.messageList;
        if (list) {
          list.scrollTop = list.scrollHeight;
        }
      });
    }
  }
};
</script>

<style scoped>
.mini-assistant {
  position: fixed;
  right: 28px;
  top: auto;
  bottom: 24px;
  z-index: 1900;
  color: #26332d;
  pointer-events: none;
}


.mini-assistant__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #d0dbcc;
  border-radius: 20px;
  background: #fff;
  color: #245b47;
  font-size: 12px;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 4px 18px rgba(27, 39, 31, .09);
}
.mini-assistant__toggle:hover { border-color: #8da995; color: #245b47; }
.mini-assistant__toggle .el-icon { font-size: 15px; }
.mini-assistant__panel {
  width: min(380px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid #e2e7e2;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 10px 32px rgba(27, 39, 31, .12);
  max-height: calc(100dvh - 90px);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.mini-assistant__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid #dce4d7;
  background: #f4f6ee;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.mini-assistant--dragging .mini-assistant__header {
  cursor: grabbing;
}

.mini-assistant__header span {
  color: #245b47;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mini-assistant__header h3 {
  margin-top: 3px;
  color: #26332d;
  font-size: 17px;
  font-weight: 500;
}

.mini-assistant__tools {
  display: flex;
  gap: 6px;
}

.mini-assistant__tools button,
.mini-assistant__chips button,
.mini-assistant__input button {
  border: 1px solid #edf4ef;
  border-radius: 6px;
  background: #edf4ef;
  color: #245b47;
  cursor: pointer;
  font-weight: 500;
}

.mini-assistant__tools button {
  min-height: 30px;
  padding: 0 9px;
}

.mini-assistant__messages {
  max-height: 300px;
  min-height: 40px;
  overflow-y: auto;
  padding: 12px 14px;
}

.mini-assistant__message {
  width: 88%;
  margin-bottom: 10px;
  padding: 10px 11px;
  border: 1px solid #e2e7e2;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
}

.mini-assistant__message--user {
  margin-left: auto;
  background: #edf4ef;
}

.mini-assistant__message--typing {
  width: auto;
  display: inline-block;
}

.mini-assistant__message strong {
  display: block;
  margin-bottom: 5px;
  color: #66736b;
  font-size: 12px;
}

.mini-assistant__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.mini-assistant__meta span {
  padding: 2px 6px;
  border-radius: 6px;
  background: #edf4ef;
  color: #245b47;
  font-size: 12px;
  font-weight: 500;
}

.mini-assistant__message p {
  margin: 0;
  color: #26332d;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.mini-assistant__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 0 14px 12px;
}

.mini-assistant__chips button {
  min-height: 30px;
  padding: 0 8px;
  font-size: 12px;
}

.mini-assistant__input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 12px 14px 14px;
  border-top: 1px solid #e2e7e2;
}

.mini-assistant__input input {
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #e2e7e2;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.78);
  color: #26332d;
  outline: none;
}

.mini-assistant__input input:focus {
  border-color: #245b47;
  box-shadow: 0 0 0 2px #edf4ef;
}

.mini-assistant__input button {
  min-width: 64px;
  height: 36px;
  padding: 0 10px;
}

.mini-assistant__input button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@media (max-width: 760px) {
  .mini-assistant {
    right: 12px;
    bottom: 12px;
  }

  .mini-assistant__panel {
    width: calc(100vw - 24px);
  }

  .mini-assistant__messages {
    max-height: 260px;
  }
}
</style>
