<template>
  <!-- LOCATE: 提醒中心页面，风险指数和待办列表 -->
  <div class="page-shell reminder-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 4px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>提醒中心</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="reminder-hero">
      <div class="reminder-hero__copy">
        <span class="reminder-hero__kicker">To-do Center</span>
        <h1 class="page-title">提醒中心</h1>
      </div>
      <el-button type="primary" @click="loadAll()">刷新</el-button>
    </section>

    <el-alert
      v-if="summaryLoadError"
      class="summary-alert"
      type="error"
      :closable="false"
      show-icon
      :title="summaryLoadError"
    />

    <el-card v-if="summaryLoading && !summaryLoaded" class="section-card summary-state-card">
      <el-skeleton :rows="4" animated />
    </el-card>

    <template v-if="summaryLoaded">
    <section class="risk-panel" :class="`risk-panel--${summary.riskLevel || 'low'}`">
      <div class="risk-panel__score">
        <span>风险指数</span>
        <strong>{{ summary.riskScore || 0 }}</strong>
      </div>
      <div class="risk-panel__main">
        <div class="risk-panel__head">
          <el-tag :type="riskTagType(summary.riskLevel)" effect="dark">
            {{ summary.riskLabel || "运行平稳" }}
          </el-tag>
          <span>{{ summary.riskDescription || "当前宿舍运行风险较低，暂无集中异常。" }}</span>
        </div>
        <p>{{ summary.riskAdvice || "保持常规巡检，及时处理新增提醒。" }}</p>
        <div class="risk-panel__factors">
          <span
            v-for="factor in summary.riskFactors"
            :key="factor"
          >
            {{ factor }}
          </span>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <el-card v-for="card in summaryCards" :key="card.key" class="summary-card">
        <span>{{ card.label }}</span>
        <strong>{{ summary[card.key] || 0 }}</strong>
      </el-card>
    </section>

    <el-card class="section-card monthly-report-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">Monthly Report</span>
            <h3>宿舍运行月报</h3>
          </div>
          <span class="report-month">{{ monthlyReport.reportMonth || "-" }}</span>
        </div>
      </template>
      <div class="monthly-report-grid">
        <div class="report-metric">
          <span>入住率</span>
          <strong>{{ formatPercent(monthlyReport.occupancyRate) }}</strong>
          <small>{{ monthlyReport.occupiedBeds || 0 }}/{{ monthlyReport.totalBeds || 0 }} 床</small>
        </div>
        <div class="report-metric">
          <span>维修完成率</span>
          <strong>{{ formatPercent(monthlyReport.repairCompletionRate) }}</strong>
          <small>{{ monthlyReport.repairCompleted || 0 }}/{{ monthlyReport.repairTotal || 0 }} 单</small>
        </div>
        <div class="report-metric">
          <span>卫生平均分</span>
          <strong>{{ formatScore(monthlyReport.hygieneAverageScore) }}</strong>
          <small>按本月检查后的寝室总分计算</small>
        </div>
        <div class="report-metric">
          <span>异常事件数</span>
          <strong>{{ monthlyReport.abnormalEventCount || 0 }}</strong>
          <small>维修、离校、卫生、数据巡检</small>
        </div>
      </div>
      <div class="report-breakdown">
        <span v-for="item in monthlyReport.abnormalBreakdown" :key="item">{{ item }}</span>
      </div>
      <div class="report-breakdown report-breakdown--hygiene">
        <strong>常见卫生问题</strong>
        <span v-for="item in monthlyReport.hygieneIssueBreakdown" :key="item">{{ item }}</span>
      </div>
    </el-card>

    <section class="insight-grid">
      <el-card class="section-card insight-card">
        <template #header>
          <div class="card-header">
            <div>
              <span class="card-header__kicker">Hygiene Trend</span>
              <h3>卫生趋势分析</h3>
            </div>
            <el-tag :type="summary.hygieneTrendDeclineCount ? 'warning' : 'success'">
              {{ summary.hygieneTrendDeclineCount || 0 }} 间下降
            </el-tag>
          </div>
        </template>
        <div v-if="summary.hygieneTrends?.length" class="trend-list">
          <article v-for="item in summary.hygieneTrends.slice(0, 4)" :key="`${item.dormBuildId}-${item.dormRoomId}`" class="trend-item">
            <div class="trend-item__head">
              <strong>{{ item.dormBuildId }}号楼 {{ item.dormRoomId }} 宿舍</strong>
              <el-tag :type="item.riskLevel === 'urgent' ? 'danger' : 'warning'" size="small">
                {{ item.trendLabel }}
              </el-tag>
            </div>
            <p>近几次总分：{{ (item.recentScores || []).join(" → ") }}</p>
            <small>最新 {{ item.latestScore }} 分，累计下降 {{ item.dropScore }} 分</small>
          </article>
        </div>
        <el-empty v-else :image-size="54" description="暂无持续下降宿舍" />
      </el-card>

      <el-card class="section-card insight-card">
        <template #header>
          <div class="card-header">
            <div>
              <span class="card-header__kicker">Leave Risk</span>
              <h3>离校异常预警</h3>
            </div>
            <el-tag :type="summary.leaveOverdueRiskCount ? 'danger' : 'success'">
              {{ summary.leaveOverdueRiskCount || 0 }} 条风险
            </el-tag>
          </div>
        </template>
        <div v-if="summary.leaveRisks?.length" class="leave-risk-list">
          <article v-for="item in summary.leaveRisks.slice(0, 4)" :key="`${item.studentId}-${item.returnTime}`" class="leave-risk-item">
            <div class="leave-risk-item__head">
              <strong>{{ item.studentName || item.studentId }}</strong>
              <el-tag :type="leaveRiskTagType(item.riskLevel)" size="small">{{ item.status }}</el-tag>
            </div>
            <p>{{ item.riskReason }}</p>
            <small>预计返校：{{ item.returnTime || "-" }}</small>
          </article>
        </div>
        <el-empty v-else :image-size="54" description="暂无超时未归风险" />
      </el-card>
    </section>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">提醒</span>
            <h3>提醒列表</h3>
          </div>
        </div>
      </template>

      <div v-if="summary.items?.length" class="reminder-list">
        <article v-for="(item, index) in summary.items" :key="`${item.category}-${index}`" class="reminder-item">
          <div class="reminder-item__head">
            <el-tag :type="tagType(item.level)" effect="plain">{{ levelText(item.level) }}</el-tag>
            <span>{{ item.category }}</span>
          </div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
          <div class="reminder-item__foot">
            <span>{{ item.time || item.status }}</span>
            <el-button v-if="item.routePath" type="primary" text @click="go(item.routePath)">
              {{ item.routeLabel || "查看详情" }}
            </el-button>
          </div>
        </article>
      </div>

      <el-empty v-else description="当前没有需要处理的提醒" />
    </el-card>

    </template>

    <el-card v-else-if="!summaryLoading" class="section-card summary-state-card">
      <el-empty description="提醒汇总加载失败，请稍后重试" />
    </el-card>

    <el-card class="section-card operation-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">Operation Log</span>
            <h3>最近操作</h3>
          </div>
          <el-button type="primary" text @click="loadOperationLogs()">刷新日志</el-button>
        </div>
      </template>

      <div v-if="operationLogs.length" class="operation-list">
        <article v-for="item in operationLogs" :key="item.id" class="operation-item">
          <div class="operation-item__head">
            <el-tag effect="plain">{{ item.module || "系统" }}</el-tag>
            <time>{{ item.createdTime || "刚刚" }}</time>
          </div>
          <strong>{{ item.summary || item.action }}</strong>
          <p v-if="item.detail">{{ item.detail }}</p>
          <div class="operation-item__foot">
            <span>{{ item.action || "操作" }}</span>
            <span>{{ item.actor || "系统" }}</span>
          </div>
        </article>
      </div>

      <el-empty v-else description="暂无操作记录" />
    </el-card>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const createDefaultSummary = () => ({
  totalPending: 0,
  urgentCount: 0,
  repairPending: 0,
  repairOverdue: 0,
  repairWaitConfirm: 0,
  repairReturned: 0,
  adjustPending: 0,
  leaveAwayCount: 0,
  leaveWaitConfirmCount: 0,
  leaveAbnormalCount: 0,
  leaveWarnings: 0,
  hygieneAlerts: 0,
  hygieneRecheckPendingCount: 0,
  consistencyWarnings: 0,
  recentNoticeCount: 0,
  availableBeds: 0,
  riskScore: 0,
  riskLevel: "low",
  riskLabel: "运行平稳",
  riskDescription: "当前宿舍运行风险较低，暂无集中异常。",
  riskAdvice: "保持常规巡检，及时处理新增提醒。",
  riskFactors: ["暂无明显异常，保持日常巡检"],
  hygieneTrendDeclineCount: 0,
  hygieneTrends: [],
  leaveOverdueRiskCount: 0,
  leaveRisks: [],
  monthlyReport: {
    reportMonth: "",
    totalBeds: 0,
    occupiedBeds: 0,
    occupancyRate: 0,
    repairTotal: 0,
    repairCompleted: 0,
    repairCompletionRate: 0,
    hygieneAverageScore: 0,
    abnormalEventCount: 0,
    abnormalBreakdown: [],
    hygieneIssueBreakdown: []
  },
  items: []
});

export default {
  name: "ReminderCenter",
  data() {
    return {
      summary: createDefaultSummary(),
      summaryLoading: false,
      summaryLoaded: false,
      summaryLoadError: "",
      operationLogs: [],
      refreshTimer: null
    };
  },
  computed: {
    monthlyReport() {
      return this.summary.monthlyReport || createDefaultSummary().monthlyReport;
    },
    summaryCards() {
      return [
        { key: "totalPending", label: "\u5f85\u5904\u7406\u4e8b\u9879" },
        { key: "urgentCount", label: "\u7d27\u6025\u4e8b\u9879" },
        { key: "repairPending", label: "\u7ef4\u4fee\u5f85\u529e" },
        { key: "repairOverdue", label: "\u8d85\u65f6\u5de5\u5355" },
        { key: "repairWaitConfirm", label: "\u5f85\u5b66\u751f\u786e\u8ba4" },
        { key: "repairReturned", label: "\u9000\u56de\u7ef4\u4fee" },
        { key: "adjustPending", label: "\u8c03\u5bbf\u5f85\u5904\u7406" },
        { key: "leaveAwayCount", label: "\u79bb\u6821\u4e2d" },
        { key: "leaveWaitConfirmCount", label: "\u5f85\u786e\u8ba4\u8fd4\u6821" },
        { key: "leaveAbnormalCount", label: "\u5f02\u5e38\u672a\u5f52" },
        { key: "hygieneAlerts", label: "\u536b\u751f\u9884\u8b66" },
        { key: "hygieneRecheckPendingCount", label: "\u536b\u751f\u590d\u67e5" },
        { key: "hygieneTrendDeclineCount", label: "\u536b\u751f\u4e0b\u964d" },
        { key: "leaveOverdueRiskCount", label: "\u8d85\u65f6\u672a\u5f52" },
        { key: "consistencyWarnings", label: "\u6570\u636e\u5de1\u68c0" },
        { key: "recentNoticeCount", label: "\u6700\u65b0\u516c\u544a" },
        { key: "availableBeds", label: "\u53ef\u5206\u914d\u5e8a\u4f4d" }
      ];
    }
  },
  created() {
    this.loadAll(true);
  },
  mounted() {
    this.startAutoRefresh();
    window.addEventListener("focus", this.handleWindowFocus);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  },
  beforeUnmount() {
    this.stopAutoRefresh();
    window.removeEventListener("focus", this.handleWindowFocus);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  },
  methods: {
    startAutoRefresh() {
      this.stopAutoRefresh();
      this.refreshTimer = window.setInterval(() => {
        this.loadAll(true);
      }, 120000);
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        window.clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },
    handleWindowFocus() {
      this.loadAll(true);
    },
    handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        this.loadAll(true);
      }
    },
    async loadAll(silent = false) {
      await Promise.all([
        this.loadSummary(silent),
        this.loadOperationLogs(silent)
      ]);
    },
    async loadSummary(silent = false) {
      this.summaryLoading = true;
      try {
        const res = await request.get("/reminder/summary");
        if (res.code !== "0") {
          throw new Error(res.msg || "提醒汇总加载失败");
        }
        this.summary = Object.assign(createDefaultSummary(), res.data || {});
        this.summaryLoaded = true;
        this.summaryLoadError = "";
      } catch (error) {
        this.summaryLoadError = error.message || "提醒汇总加载失败";
        if (!silent) {
          ElMessage.error(this.summaryLoadError);
        }
        console.error(error);
      } finally {
        this.summaryLoading = false;
      }
    },
    async loadOperationLogs(silent = false) {
      try {
        const res = await request.get("/operationLog/recent", {
          params: {
            limit: 8
          }
        });
        if (res.code === "0") {
          this.operationLogs = res.data || [];
        } else {
          throw new Error(res.msg || "操作日志加载失败");
        }
      } catch (error) {
        if (!silent) {
          ElMessage.error(error.message || "操作日志加载失败");
        }
        console.error(error);
      }
    },
    tagType(level) {
      if (level === "urgent") {
        return "danger";
      }
      if (level === "warning") {
        return "warning";
      }
      return "info";
    },
    levelText(level) {
      if (level === "urgent") {
        return "紧急";
      }
      if (level === "warning") {
        return "关注";
      }
      return "通知";
    },
    riskTagType(level) {
      if (level === "critical" || level === "high") {
        return "danger";
      }
      if (level === "medium") {
        return "warning";
      }
      return "success";
    },
    leaveRiskTagType(level) {
      if (level === "critical" || level === "urgent") {
        return "danger";
      }
      if (level === "warning") {
        return "warning";
      }
      return "info";
    },
    formatPercent(value) {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? `${numberValue.toFixed(1)}%` : "0.0%";
    },
    formatScore(value) {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue.toFixed(1) : "0.0";
    },
    go(path) {
      if (!path) {
        return;
      }
      this.$router.push(path);
    }
  }
};
</script>

<style scoped>
.reminder-page {
  gap: 18px;
}

.summary-alert {
  margin-top: -2px;
}

.summary-state-card {
  min-height: 180px;
}

.reminder-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0 18px;
  border-bottom: 1px solid var(--border-color);
}

.reminder-hero__kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.risk-panel {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  gap: 20px;
  align-items: stretch;
  padding: 18px 20px;
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--success-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.risk-panel--medium {
  border-left-color: #d97706;
}

.risk-panel--high,
.risk-panel--critical {
  border-left-color: #c53030;
}

.risk-panel__score {
  display: grid;
  place-items: center;
  min-height: 120px;
  border-right: 1px solid var(--border-color);
}

.risk-panel__score span {
  color: var(--text-color-muted);
  font-size: 13px;
}

.risk-panel__score strong {
  color: var(--text-color);
  font-family: "DIN Alternate", "Microsoft YaHei", sans-serif;
  font-size: 48px;
  line-height: 1;
  font-weight: 600;
}

.risk-panel__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.risk-panel__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.risk-panel__head span:last-child {
  color: var(--text-color);
  font-size: 15px;
  font-weight: 700;
}

.risk-panel__main p {
  margin: 10px 0 0;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.risk-panel__factors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.risk-panel__factors span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  text-align: center;
}

.summary-card::before {
  content: "";
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 2px;
  background: var(--border-color);
}

.summary-card span {
  display: block;
  color: var(--text-color-muted);
  font-size: 13px;
}

.summary-card strong {
  display: block;
  margin-top: 12px;
  color: var(--text-color);
  font-size: 30px;
  line-height: 1;
  font-weight: 600;
}

.monthly-report-card {
  border-radius: 8px;
}

.report-month {
  color: var(--text-color-muted);
  font-size: 13px;
  font-weight: 700;
}

.monthly-report-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.report-metric {
  min-height: 118px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.report-metric span,
.report-metric small {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.report-metric strong {
  display: block;
  margin: 12px 0 8px;
  color: var(--text-color);
  font-size: 28px;
  line-height: 1;
}

.report-breakdown,
.trend-list,
.leave-risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report-breakdown {
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 14px;
}

.report-breakdown--hygiene {
  align-items: center;
  margin-top: 10px;
}

.report-breakdown--hygiene strong {
  color: var(--text-color);
  font-size: 13px;
}

.report-breakdown span {
  min-height: 28px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-color-secondary);
  font-size: 12px;
  font-weight: 700;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.insight-card {
  min-height: 320px;
}

.trend-item,
.leave-risk-item {
  padding: 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.trend-item__head,
.leave-risk-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.trend-item strong,
.leave-risk-item strong {
  color: var(--text-color);
  font-size: 15px;
}

.trend-item p,
.leave-risk-item p {
  margin: 8px 0 0;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.trend-item small,
.leave-risk-item small {
  display: block;
  margin-top: 8px;
  color: var(--text-color-muted);
  font-size: 12px;
}

.card-header__kicker {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--text-color-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-header h3 {
  color: var(--text-color);
  font-size: 18px;
  font-weight: 700;
}

.reminder-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 540px));
  justify-content: center;
  gap: 16px;
}

.operation-card {
  margin-top: 2px;
}

.operation-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 540px));
  justify-content: center;
  gap: 14px;
}

.operation-item {
  padding: 15px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.operation-item__head,
.operation-item__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.operation-item__head {
  margin-bottom: 10px;
}

.operation-item__head time,
.operation-item__foot span {
  color: var(--text-color-muted);
  font-size: 12px;
}

.operation-item strong {
  display: block;
  color: var(--text-color);
  font-size: 15px;
}

.operation-item p {
  margin: 8px 0 0;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.65;
}

.operation-item__foot {
  margin-top: 12px;
}

.reminder-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.reminder-item__head,
.reminder-item__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.reminder-item__head {
  margin-bottom: 12px;
}

.reminder-item__head span,
.reminder-item__foot span {
  color: var(--text-color-muted);
  font-size: 12px;
}

.reminder-item strong {
  display: block;
  color: var(--text-color);
  font-size: 15px;
}

.reminder-item p {
  margin-top: 8px;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.reminder-item__foot {
  margin-top: 14px;
}

@media (max-width: 1200px) {
  .summary-grid,
  .monthly-report-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .reminder-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 0 16px;
  }

  .risk-panel {
    grid-template-columns: 1fr;
  }

  .risk-panel__score {
    min-height: auto;
    padding-bottom: 14px;
    border-right: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .summary-grid,
  .monthly-report-grid,
  .insight-grid,
  .reminder-list,
  .operation-list {
    grid-template-columns: 1fr;
  }

  .reminder-item__head,
  .reminder-item__foot {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
