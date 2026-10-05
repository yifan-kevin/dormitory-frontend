<template>
  <!-- LOCATE: 床位分配中心页面，自动分配和分配概况 -->
  <div class="page-shell assign-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 16px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>床位分配中心</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card assign-hero">
      <div class="assign-hero__copy">
        <h1 class="page-title">床位分配中心</h1>
      </div>

    </section>

    <section class="assign-layout">
      <el-card class="section-card assign-control">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Control</div>
              <h3>一键分配</h3>
            </div>
            <div class="assign-control__actions">
              <el-button plain @click="loadSummary">刷新概况</el-button>
              <el-button type="primary" :loading="submitting" @click="handleAutoAssign">按性别一键分配</el-button>
            </div>
          </div>
        </template>

        <div class="assign-toggle">
          <div>
            <strong>先清空现有床位再重排</strong>
            <p>适合导入新生后一次性重新整理整个住宿分布。</p>
          </div>
          <el-switch v-model="clearExisting" />
        </div>

        <div class="assign-summary">
          <div class="summary-chip">
            <span>学生总数</span>
            <strong>{{ summary.totalStudents || 0 }}</strong>
          </div>
          <div class="summary-chip">
            <span>男生已分配</span>
            <strong>{{ summary.maleAssignedCount || 0 }}</strong>
          </div>
          <div class="summary-chip">
            <span>女生已分配</span>
            <strong>{{ summary.femaleAssignedCount || 0 }}</strong>
          </div>
          <div class="summary-chip">
            <span>可分配床位</span>
            <strong>{{ summary.availableBeds || 0 }}</strong>
          </div>
        </div>

        <el-alert
          v-if="summary.genderMismatchCount > 0"
          title="检测到部分住宿记录不符合奇数楼男生、偶数楼女生的分配规则。"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-card>

      <el-card class="section-card assign-rule">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Rule</div>
              <h3>当前规则</h3>
            </div>
          </div>
        </template>

        <div class="rule-list">
          <div class="rule-item">
            <span class="rule-item__index">01</span>
            <p>男生默认分配到奇数楼，女生默认分配到偶数楼。</p>
          </div>
          <div class="rule-item">
            <span class="rule-item__index">02</span>
            <p>系统会按楼宇、楼层、房间号顺序寻找空床位，并优先填满已有可住床位。</p>
          </div>
          <div class="rule-item">
            <span class="rule-item__index">03</span>
            <p>如果勾选“先清空现有床位再重排”，系统会先清除当前床位信息，再重新统一分配。</p>
          </div>
        </div>
      </el-card>
    </section>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-kicker">Recent Assignments</div>
            <h3>最近分配结果</h3>
          </div>
          <el-button type="primary" text @click="$router.push('/roomInfo')">查看房间信息</el-button>
        </div>
      </template>

      <el-table :data="summary.records || []" border style="width: 100%">
        <el-table-column prop="username" label="学号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="gender" label="性别" width="90" />
        <el-table-column prop="dormBuildId" label="楼宇号" width="100" />
        <el-table-column prop="dormRoomId" label="房间号" width="110" />
        <el-table-column prop="bedNo" label="床位号" width="100" />
      </el-table>

      <el-empty v-if="!(summary.records || []).length" description="当前还没有可展示的分配记录" />
    </el-card>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage, ElMessageBox } from "element-plus";

const createDefaultSummary = () => ({
  totalStudents: 0,
  assignedCount: 0,
  unassignedCount: 0,
  maleAssignedCount: 0,
  femaleAssignedCount: 0,
  availableBeds: 0,
  clearedCount: 0,
  genderMismatchCount: 0,
  records: []
});

export default {
  name: "BedAssignCenter",
  data() {
    return {
      clearExisting: false,
      submitting: false,
      summary: createDefaultSummary()
    };
  },
  created() {
    this.loadSummary();
  },
  methods: {
    async loadSummary() {
      try {
        const res = await request.get("/room/assignmentSummary");
        if (res.code !== "0") {
          throw new Error(res.msg || "分配概况加载失败");
        }
        this.summary = Object.assign(createDefaultSummary(), res.data || {});
      } catch (error) {
        ElMessage.error(error.message || "分配概况加载失败");
      }
    },
    async handleAutoAssign() {
      try {
        if (this.clearExisting) {
          await ElMessageBox.confirm("这会先清空当前床位信息，再重新统一分配。确定继续吗？", "提示", {
            type: "warning",
            confirmButtonText: "确定重排",
            cancelButtonText: "取消"
          });
        }

        this.submitting = true;
        const res = await request.post("/room/autoAssign", {
          clearExisting: this.clearExisting
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "一键分配失败");
        }
        this.summary = Object.assign(createDefaultSummary(), res.data || {});
        ElMessage.success(this.clearExisting ? "床位已重新分配" : "空床位分配完成");
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "一键分配失败");
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.assign-page {
  gap: 18px;
}

.assign-hero {
  padding: 28px;
}

.assign-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.assign-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
  gap: 18px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-kicker {
  margin-bottom: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-header h3 {
  font-size: 18px;
  line-height: 1.5;
  letter-spacing: 0;
}

.assign-control__actions {
  display: flex;
  gap: 12px;
}

.assign-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0 20px;
}

.assign-toggle strong {
  display: block;
  font-size: 16px;
}

.assign-toggle p {
  margin-top: 6px;
  color: var(--text-color-secondary);
}

.assign-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-chip {
  padding: 18px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
}

.summary-chip span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.summary-chip strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
}

.assign-rule {
  overflow: hidden;
  border-radius: 8px !important;
  background: var(--surface-color) !important;
}

.assign-rule :deep(.el-card__header) {
  padding: 26px 28px 0 !important;
}

.assign-rule :deep(.el-card__body) {
  padding: 22px 28px 28px !important;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rule-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.rule-item__index {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary-strong);
  font-weight: 800;
}

.rule-item p {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.75;
  letter-spacing: 0;
  text-align: left;
  word-break: normal;
  overflow-wrap: anywhere;
}

@media (max-width: 1200px) {
  .assign-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .assign-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .assign-hero {
    padding: 20px;
  }

  .assign-rule :deep(.el-card__header) {
    padding: 22px 20px 0 !important;
  }

  .assign-rule :deep(.el-card__body) {
    padding: 18px 20px 22px !important;
  }

  .assign-control__actions {
    flex-wrap: wrap;
  }

  .assign-toggle {
    align-items: flex-start;
    flex-direction: column;
  }

  .rule-item {
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 10px;
  }

  .rule-item__index {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
}
</style>
