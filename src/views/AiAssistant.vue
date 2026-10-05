<template>
  <!-- LOCATE: 智能助手完整页面 -->
  <div class="page-shell ai-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 16px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>智能助手</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="assistant-workspace">
      <aside class="assistant-side">
        <div>
          <div class="card-kicker">Ask</div>
          <h2>智能助手</h2>
          <p>我会识别你的问题类型，给出处理步骤，也可以查询实时天气。</p>
        </div>

        <div class="ability-list">
          <div class="ability-item">
            <strong>业务识别</strong>
            <span>床位、报修、调宿、请假等问题自动分类</span>
          </div>
          <div class="ability-item">
            <strong>角色提示</strong>
            <span>按学生、宿管、维修、管理员身份推荐入口</span>
          </div>
          <div class="ability-item">
            <strong>下一步</strong>
            <span>回答后可直接跳转到相关页面</span>
          </div>
          <div class="ability-item">
            <strong>上下文记忆</strong>
            <span>能理解“郑州呢”“后天呢”这类追问</span>
          </div>
          <div class="ability-item">
            <strong>天气查询</strong>
            <span>输入“上海天气”“明天杭州天气”即可查询</span>
          </div>
        </div>

        <div class="quick-list">
          <button
            v-for="item in quickQuestions"
            :key="item"
            type="button"
            class="quick-question"
            @click="askQuickQuestion(item)"
          >
            {{ item }}
          </button>
        </div>
      </aside>

      <main class="chat-panel">
        <div ref="messageList" class="message-list">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-row"
            :class="`message-row--${message.role}`"
          >
            <div class="message-bubble">
              <span class="message-role">{{ message.role === "user" ? "我" : "助手" }}</span>
              <div v-if="shouldShowMeta(message)" class="message-meta">
                <span>{{ message.category }}</span>
              </div>
              <p>{{ message.content }}</p>
              <ol v-if="message.steps && message.steps.length" class="step-list">
                <li v-for="step in message.steps" :key="step">{{ step }}</li>
              </ol>
              <button
                v-if="message.routePath"
                type="button"
                class="route-action"
                @click="goRoute(message.routePath)"
              >
                {{ message.actionText || "打开相关页面" }}
              </button>
            </div>
          </div>
          <div v-if="loading" class="message-row message-row--assistant message-row--typing">
            <div class="message-bubble">
              <span class="message-role">助手</span>
              <p class="typing-text">我想一下，马上回你。</p>
            </div>
          </div>
        </div>

        <div v-if="suggestions.length" class="suggestion-row">
          <button
            v-for="item in suggestions"
            :key="item"
            type="button"
            class="suggestion-chip"
            @click="askQuickQuestion(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="input-bar">
          <el-input
            v-model.trim="question"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            resize="none"
            placeholder="输入你的问题，例如：报修派单流程是什么？上海天气怎么样？"
            @keydown.enter.exact.prevent="sendQuestion"
          />
          <el-button type="primary" :loading="loading" @click="sendQuestion">发送</el-button>
        </div>
      </main>
    </section>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage } from "element-plus";

let messageId = 0;

export default {
  name: "AiAssistant",
  data() {
    return {
      question: "",
      loading: false,
      suggestions: [
        "怎么重新分配床位？",
        "报修派单流程是什么？",
        "学生怎么申请调宿？"
      ],
      quickQuestions: [
        "床位分配规则是什么？",
        "报修派单流程是什么？",
        "维修工作台显示哪些工单？",
        "学生怎么申请调宿？",
        "上海天气怎么样？",
        "账号无法登录怎么办？"
      ],
      messages: [
        {
          id: ++messageId,
          role: "assistant",
          category: "系统助手",
          confidence: 1,
          content: "你直接问就行。比如床位为什么这样分、报修卡在哪一步、调宿要填什么，或者明天要不要带伞，我会按你当前身份回答。",
          steps: [],
          routePath: "",
          actionText: ""
        }
      ],
      memory: {
        lastTopic: "",
        weatherLocation: "",
        weatherDayOffset: 0,
        businessCategory: ""
      }
    };
  },
  methods: {
    askQuickQuestion(question) {
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
        id: ++messageId,
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
          id: ++messageId,
          role: "assistant",
          category: res.data?.category || "通用咨询",
          confidence: res.data?.confidence || 0,
          content: this.polishAssistantText(res.data?.answer || "我暂时没有找到合适答案。"),
          steps: res.data?.steps || [],
          routePath: res.data?.routePath || "",
          actionText: res.data?.actionText || "",
          aiPowered: !!res.data?.aiPowered,
          provider: res.data?.provider || "rule"
        });
        this.rememberBusinessReply(res.data);
        this.suggestions = res.data?.suggestions || [];
      } catch (error) {
        this.messages.push({
          id: ++messageId,
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
    isWeatherQuestion(content) {
      return /天气|气温|温度|下雨|降雨|风速|冷不冷|热不热|冷吗|热吗|几度|带伞|雨伞|用伞|伞不|伞吗|伞么|带不带伞|用不用伞/.test(content);
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
      const date = daily.time?.[dayOffset] || current.time || "";
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
      let answer = "";
      if (dayOffset === 0) {
        answer = `${locationText}今天${needsUmbrella ? "建议带伞" : "一般不用带伞"}。\n\n当前${description}，气温 ${this.formatWeatherValue(current.temperature_2m)}°C，体感 ${this.formatWeatherValue(current.apparent_temperature)}°C；今天最高 ${this.formatWeatherValue(maxTemperature)}°C，最低 ${this.formatWeatherValue(minTemperature)}°C，预计降水 ${this.formatWeatherValue(precipitationSum)} mm。\n\n${advice}`;
      } else {
        answer = `${locationText}${this.weatherDayText(dayOffset)}${needsUmbrella ? "建议带伞" : "一般不用带伞"}。\n\n${date} 预报${description}，最高 ${this.formatWeatherValue(maxTemperature)}°C，最低 ${this.formatWeatherValue(minTemperature)}°C，预计降水 ${this.formatWeatherValue(precipitationSum)} mm。\n\n${advice}`;
      }

      this.messages.push({
        id: ++messageId,
        role: "assistant",
        category: "天气查询",
        confidence: 0.92,
        content: answer,
        steps: [],
        routePath: "",
        actionText: ""
      });
      this.memory.lastTopic = "weather";
      this.memory.weatherLocation = location.name || locationName;
      this.memory.weatherDayOffset = dayOffset;
      this.suggestions = [
        `${location.name}明天天气怎么样？`,
        "报修派单流程是什么？",
        "怎么重新分配床位？"
      ];
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

      if (rain >= 0.5 || this.isWetWeather(code)) {
        advice.push("有降水风险，建议带伞，路面湿滑时也要注意出行时间。");
      } else {
        advice.push("降水风险不高，正常出行基本没问题。");
      }
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
    goRoute(path) {
      if (!path || path === this.$route.path) {
        return;
      }
      this.$router.push(path);
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
.ai-page {
  gap: 18px;
  height: 100%;
  min-height: 520px;
  min-height: 0;
  overflow: hidden;
}

.assistant-workspace {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(240px, 0.32fr) minmax(0, 0.68fr);
  gap: 18px;
  min-height: 0;
  overflow: hidden;
}

.assistant-side,
.chat-panel {
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: #ffffff;
}

.assistant-side {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow-y: auto;
}

.card-kicker {
  margin-bottom: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.assistant-side h2 {
  color: var(--text-color);
  font-size: 22px;
  line-height: 1.1;
}

.assistant-side p {
  margin-top: 12px;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.ability-list {
  display: grid;
  gap: 10px;
}

.ability-item {
  padding: 12px;
  border: 1px solid rgba(36, 91, 71, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.52);
}

.ability-item strong,
.ability-item span {
  display: block;
}

.ability-item strong {
  color: var(--text-color);
  font-size: 14px;
}

.ability-item span {
  margin-top: 4px;
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.6;
}

.quick-list,
.suggestion-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-question,
.suggestion-chip {
  border: 1px solid rgba(36, 91, 71, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--text-color);
  cursor: pointer;
  font-weight: 700;
  text-align: left;
}

.quick-question {
  width: 100%;
  padding: 11px 12px;
}

.suggestion-chip {
  padding: 8px 10px;
}

.quick-question:hover,
.suggestion-chip:hover {
  background: rgba(36, 91, 71, 0.1);
  color: var(--primary-strong);
}

.chat-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 24px;
}

.message-row {
  display: flex;
  margin-bottom: 14px;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--typing .message-bubble {
  width: auto;
  min-width: 160px;
}

.message-bubble {
  width: min(78%, 680px);
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--border-color);
}

.message-row--user .message-bubble {
  background: rgba(36, 91, 71, 0.12);
  border-color: rgba(36, 91, 71, 0.18);
}

.message-role {
  display: block;
  margin-bottom: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 600;
}

.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.message-meta span {
  padding: 3px 8px;
  border: 1px solid rgba(36, 91, 71, 0.14);
  border-radius: 6px;
  background: rgba(36, 91, 71, 0.08);
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 600;
}

.message-bubble p {
  color: var(--text-color);
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.typing-text {
  color: var(--text-color-secondary) !important;
}

.step-list {
  display: grid;
  gap: 6px;
  margin: 12px 0 0 18px;
  color: var(--text-color-secondary);
  line-height: 1.65;
}

.route-action {
  margin-top: 14px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(36, 91, 71, 0.18);
  border-radius: 6px;
  background: rgba(36, 91, 71, 0.12);
  color: var(--primary-strong);
  cursor: pointer;
  font-weight: 600;
}

.route-action:hover {
  background: rgba(36, 91, 71, 0.18);
}

.suggestion-row {
  flex-shrink: 0;
  padding: 0 24px 16px;
}

.input-bar {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 18px 24px 24px;
  border-top: 1px solid var(--border-color);
}

.input-bar :deep(.el-button) {
  min-width: 92px;
  border-radius: 6px !important;
}

@media (max-width: 900px) {
  .assistant-workspace {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .ai-page { height: auto; min-height: 0; overflow: visible; }
  .ability-list { display: none; }
  .assistant-side h2 { font-size: 20px; }
  .assistant-side p { margin-top: 6px; font-size: 13px; }
  .quick-question { width: auto; padding: 7px 10px; font-size: 12px; }
  .chat-panel { height: 540px; max-height: calc(100dvh - 100px); min-height: 380px; }

  .assistant-side {
    padding: 20px;
  }

  .message-bubble {
    width: 92%;
  }
}

@media (max-width: 640px) {
  .assistant-side { padding: 16px; gap: 12px; }
  .quick-list { display: none; }
  .chat-panel { height: calc(100dvh - 275px); max-height: none; min-height: 340px; }
  .message-list { padding: 16px; }
  .suggestion-row { padding: 0 16px 12px; gap: 6px; }
  .suggestion-chip { padding: 6px 8px; font-size: 12px; }
  .input-bar { padding: 14px 16px; gap: 8px; }
  .input-bar :deep(.el-button) { min-width: 60px; }
}
</style>
