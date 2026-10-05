<template>
  <div class="festival-calendar">
    <el-calendar v-model="selectedDate">
      <template #header>
        <div class="calendar-toolbar">
          <strong>{{ panelTitle }}</strong>
          <div class="calendar-toolbar__actions">
            <el-button text @click="shiftMonth(-1)">上月</el-button>
            <el-button type="primary" plain @click="goToday">今天</el-button>
            <el-button text @click="shiftMonth(1)">下月</el-button>
          </div>
        </div>
      </template>

      <template #date-cell="{ data }">
        <button
          type="button"
          class="calendar-cell"
          :class="{ 'is-selected': data.isSelected, 'is-event': getDateEntries(data.day).length }"
          @click="openDateDetail(data.day)"
        >
          <span class="calendar-cell__day">{{ getDayNumber(data.day) }}</span>
          <span v-if="getPrimaryCellEntry(data.day)" class="calendar-cell__label">
            {{ getPrimaryCellEntry(data.day).name }}
          </span>
        </button>
      </template>
    </el-calendar>

    <section class="festival-list">
      <div class="festival-list__header">
        <strong>本月节日与安排</strong>
        <el-tag type="primary" effect="plain">{{ monthlyHighlights.length }} 项</el-tag>
      </div>

      <div v-if="monthlyHighlights.length" class="festival-list__items">
        <button
          v-for="item in monthlyHighlights"
          :key="item.id"
          type="button"
          class="festival-list__item"
          @click="openDateDetail(item.date)"
        >
          <div class="festival-list__main">
            <strong>{{ item.name }}</strong>
            <span>{{ item.dateLabel }}</span>
          </div>
          <el-tag :type="item.tagType" effect="plain">{{ item.category }}</el-tag>
        </button>
      </div>

      <div v-else class="festival-list__empty">
        这个月暂时没有节日或假期安排，仍然可以点击日历里的日期查看详情。
      </div>
    </section>

    <el-dialog v-model="dialogVisible" title="日期详情" width="500px" append-to-body destroy-on-close>
      <div class="detail-panel">
        <div class="detail-panel__head">
          <div>
            <div class="detail-panel__date">{{ activeDetail.displayDate }}</div>
            <strong>{{ activeDetail.primaryLabel }}</strong>
          </div>
          <el-tag :type="activeDetail.tagType" effect="plain">{{ activeDetail.tagText }}</el-tag>
        </div>

        <div class="detail-panel__meta">
          <span>星期：{{ activeDetail.weekday }}</span>
          <span>类型：{{ activeDetail.category }}</span>
        </div>

        <div v-if="activeDetail.entries.length" class="detail-panel__list">
          <article
            v-for="entry in activeDetail.entries"
            :key="`${activeDetail.date}-${entry.name}`"
            class="detail-panel__item"
          >
            <div class="detail-panel__item-head">
              <strong>{{ entry.name }}</strong>
              <el-tag :type="entry.tagType" effect="plain">{{ entry.category }}</el-tag>
            </div>
            <p>{{ entry.description }}</p>
            <span v-if="entry.note" class="detail-panel__note">{{ entry.note }}</span>
          </article>
        </div>

        <div v-else class="detail-panel__empty">
          这一天没有录入节日或假期安排，可以按普通日期查看。
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
const WEEKDAY_NAMES = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

const FESTIVAL_MAP = {
  "2026-01-01": [{ name: "元旦", category: "法定节日", description: "新年第一天。", note: "2026 年元旦放假安排以实际通知为准。" }],
  "2026-02-17": [{ name: "春节", category: "法定节日", description: "农历新年。", note: "春节前后通常会有连续假期安排。" }],
  "2026-03-08": [{ name: "妇女节", category: "纪念日", description: "国际妇女节。", note: "" }],
  "2026-03-12": [{ name: "植树节", category: "纪念日", description: "倡导植树和环境保护。", note: "" }],
  "2026-04-05": [{ name: "清明", category: "节气/节日", description: "清明节。", note: "部分年份会结合放假安排。" }],
  "2026-05-01": [{ name: "劳动节", category: "法定节日", description: "劳动节。", note: "" }],
  "2026-06-19": [{ name: "端午节", category: "法定节日", description: "传统节日。", note: "" }],
  "2026-09-10": [{ name: "教师节", category: "纪念日", description: "教师节。", note: "" }],
  "2026-09-25": [{ name: "中秋节", category: "法定节日", description: "传统团圆节日。", note: "" }],
  "2026-10-01": [{ name: "国庆节", category: "法定节日", description: "国庆节。", note: "国庆前后通常会有连续假期安排。" }],
  "2026-12-25": [{ name: "圣诞节", category: "纪念日", description: "常见节日节点。", note: "" }]
};

const pad = (value) => String(value).padStart(2, "0");

const normalizeDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const tagTypeForCategory = (category) => {
  if (category.includes("法定")) {
    return "danger";
  }
  if (category.includes("节气")) {
    return "warning";
  }
  return "primary";
};

export default {
  name: "Calendar",
  data() {
    return {
      selectedDate: new Date(),
      dialogVisible: false,
      activeDetail: {
        date: "",
        displayDate: "",
        weekday: "",
        primaryLabel: "普通日期",
        category: "日历日期",
        tagText: "普通",
        tagType: "info",
        entries: []
      }
    };
  },
  computed: {
    panelTitle() {
      const current = this.selectedDate instanceof Date ? this.selectedDate : new Date();
      return `${current.getFullYear()} 年 ${current.getMonth() + 1} 月`;
    },
    monthlyHighlights() {
      const current = this.selectedDate instanceof Date ? this.selectedDate : new Date();
      const monthPrefix = `${current.getFullYear()}-${pad(current.getMonth() + 1)}`;
      return Object.keys(FESTIVAL_MAP)
        .filter((date) => date.startsWith(monthPrefix))
        .sort()
        .flatMap((date) =>
          FESTIVAL_MAP[date].map((entry) => ({
            id: `${date}-${entry.name}`,
            date,
            dateLabel: date,
            name: entry.name,
            category: entry.category,
            tagType: tagTypeForCategory(entry.category)
          }))
        );
    }
  },
  methods: {
    shiftMonth(offset) {
      const current = this.selectedDate instanceof Date ? new Date(this.selectedDate) : new Date();
      current.setMonth(current.getMonth() + offset);
      this.selectedDate = current;
    },
    goToday() {
      this.selectedDate = new Date();
    },
    getDayNumber(day) {
      return day.split("-")[2];
    },
    getDateEntries(day) {
      return FESTIVAL_MAP[day] || [];
    },
    getPrimaryCellEntry(day) {
      return this.getDateEntries(day)[0] || null;
    },
    openDateDetail(day) {
      const entries = this.getDateEntries(day);
      const date = new Date(`${day}T00:00:00`);
      const primary = entries[0];
      this.activeDetail = {
        date: day,
        displayDate: day,
        weekday: WEEKDAY_NAMES[date.getDay()],
        primaryLabel: primary ? primary.name : "普通日期",
        category: primary ? primary.category : "日历日期",
        tagText: primary ? primary.category : "普通",
        tagType: primary ? tagTypeForCategory(primary.category) : "info",
        entries: entries.map((entry) => ({
          ...entry,
          tagType: tagTypeForCategory(entry.category)
        }))
      };
      this.dialogVisible = true;
    }
  }
};
</script>

<style scoped>
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calendar-toolbar strong {
  color: var(--text-color);
  font-size: 18px;
}

.calendar-toolbar__actions {
  display: flex;
  gap: 8px;
}

.calendar-cell {
  width: 100%;
  min-height: 88px;
  padding: 8px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
}

.calendar-cell.is-selected {
  border-color: rgba(183, 121, 31, 0.42);
}

.calendar-cell.is-event {
  background: #eff6ff;
}

.calendar-cell__day {
  display: block;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 700;
}

.calendar-cell__label {
  display: block;
  margin-top: 8px;
  color: var(--primary-strong);
  font-size: 12px;
  line-height: 1.4;
}

.festival-list {
  margin-top: 14px;
}

.festival-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.festival-list__header strong {
  color: var(--text-color);
  font-size: 16px;
}

.festival-list__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.festival-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.festival-list__main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.festival-list__main strong {
  color: var(--text-color);
  font-size: 14px;
}

.festival-list__main span {
  color: var(--text-color-muted);
  font-size: 12px;
}

.festival-list__empty,
.detail-panel__empty {
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.detail-panel__date {
  color: var(--text-color-muted);
  font-size: 13px;
}

.detail-panel__head strong {
  display: block;
  margin-top: 4px;
  color: var(--text-color);
  font-size: 18px;
}

.detail-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-color-muted);
  font-size: 13px;
}

.detail-panel__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-panel__item {
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 10px;
  background: #f8fafc;
}

.detail-panel__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-panel__item-head strong {
  color: var(--text-color);
  font-size: 14px;
}

.detail-panel__item p {
  margin-top: 8px;
  color: var(--text-color-secondary);
  line-height: 1.7;
}

.detail-panel__note {
  display: inline-block;
  margin-top: 8px;
  color: var(--text-color-muted);
  font-size: 12px;
}
</style>
