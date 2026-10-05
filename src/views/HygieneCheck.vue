<template>
  <!-- LOCATE: 卫生检查页面，登记扣分和复查 -->
  <div class="page-shell hygiene-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>卫生检查</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="hygiene-hero glass-card">
      <div class="hygiene-hero__copy">
        <div class="page-eyebrow">Hygiene Check</div>
        <h1 class="page-title">{{ isReadonlyView ? "卫生检查结果" : "卫生检查管理" }}</h1>
        <p class="page-subtitle">
          {{
            isStudentView
              ? "学生端只展示自己宿舍的卫生检查记录，方便直接查看近期检查结果和备注。"
              : isReadonlyView
                ? "查看宿舍卫生检查结果、扣分和备注信息。"
                : "统一完成卫生检查登记、编辑和结果回看，避免表单打开和重置时出现异常。"
          }}
        </p>
      </div>

      <div class="hygiene-hero__stats">
        <div class="stat-pill">
          <span class="stat-pill__label">检查记录</span>
          <strong class="stat-pill__value">{{ checkResults.length }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">合格记录</span>
          <strong class="stat-pill__value">{{ qualifiedCount }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">需关注</span>
          <strong class="stat-pill__value">{{ unqualifiedCount }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">当前均分</span>
          <strong class="stat-pill__value">{{ averageTotalScore }}</strong>
        </div>
      </div>
    </section>

    <el-card class="section-card score-summary-card">
      <template #header>
        <div class="panel-header">
          <div>
            <div class="panel-header__eyebrow">Score Summary</div>
            <h3>{{ isStudentView ? "本寝室卫生总分统计" : "所有已住人宿舍卫生分数" }}</h3>
          </div>
        </div>
      </template>

      <div class="score-summary-overview">
        <div class="score-summary-metric">
          <span>{{ isStudentView ? "统计寝室" : "已住人宿舍" }}</span>
          <strong>{{ roomScoreSummary.length }}</strong>
        </div>
        <div class="score-summary-metric">
          <span>当前平均分</span>
          <strong>{{ averageTotalScore }}</strong>
        </div>
        <div class="score-summary-metric">
          <span>低于 80 分</span>
          <strong>{{ attentionRoomCount }}</strong>
        </div>
      </div>

      <div v-if="scoreSummaryRows.length" class="score-room-grid">
        <article
          v-for="item in scoreSummaryRows"
          :key="`${item.dormBuildId}-${item.dormRoomId}`"
          class="score-room-item"
        >
          <div>
            <span class="score-room-item__label">{{ formatRoomName(item) }}</span>
            <strong :class="scoreClass(getRoomCurrentScore(item))">{{ formatScore(getRoomCurrentScore(item)) }} 分</strong>
          </div>
          <p>
            检查 {{ item.checkCount }} 次，累计扣分 {{ formatScore(item.totalDeduction || 0) }} 分
            <span v-if="item.latestCheckDate"> · {{ formatDisplayTime(item.latestCheckDate) }}</span>
          </p>
        </article>
      </div>

      <el-empty v-else description="暂无已住人宿舍卫生总分数据" />
    </el-card>

    <el-card class="section-card">
      <template #header>
        <div class="panel-header">
          <div>
            <div class="panel-header__eyebrow">{{ isReadonlyView ? "Results" : "Records" }}</div>
            <h3>{{ isReadonlyView ? "卫生检查结果列表" : "卫生检查记录" }}</h3>
          </div>
          <el-button v-if="!isReadonlyView" type="primary" @click="openCreateDialog">
            新增检查
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="isStudentView && currentRoom"
        class="room-alert"
        type="info"
        :closable="false"
        show-icon
        :title="`当前仅展示 ${currentRoom.dormBuildId} 栋 ${currentRoom.dormRoomId} 室的卫生检查记录`"
      />

      <el-table v-loading="loading" :data="checkResults" border style="width: 100%">
        <el-table-column label="检查日期" prop="checkDate" width="180">
          <template #default="scope">
            {{ formatDisplayTime(scope.row.checkDate) }}
          </template>
        </el-table-column>
        <el-table-column label="楼宇号" prop="dormBuildId" width="100" />
        <el-table-column label="房间号" prop="dormRoomId" width="100" />
        <el-table-column label="检查人员" prop="checker" width="120" />
        <el-table-column label="检查结果" prop="result" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.result === '合格' ? 'success' : 'danger'">
              {{ scope.row.result }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="扣分" prop="score" width="90" />
        <el-table-column label="卫生总分" prop="totalScore" width="120">
          <template #default="scope">
            <strong class="table-score" :class="scoreClass(getTotalScore(scope.row))">
              {{ getTotalScore(scope.row) }} 分
            </strong>
          </template>
        </el-table-column>
        <el-table-column label="问题分类" prop="issueCategory" width="110">
          <template #default="scope">
            {{ scope.row.issueCategory || "无" }}
          </template>
        </el-table-column>
        <el-table-column label="复查状态" prop="recheckStatus" width="120">
          <template #default="scope">
            <el-tag :type="recheckTagType(scope.row.recheckStatus)">
              {{ scope.row.recheckStatus || "无需复查" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
        <el-table-column v-if="!isReadonlyView" label="操作" width="220">
          <template #default="scope">
            <div class="action-group">
              <el-button v-if="canRecheck(scope.row)" type="warning" size="small" @click="openRecheckDialog(scope.row)">
                复查
              </el-button>
              <el-button circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button circle type="danger" @click="handleDelete(scope.row.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="!loading && !checkResults.length"
        :description="isStudentView ? '当前宿舍还没有卫生检查记录' : '暂无卫生检查记录'"
      />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="judgeOption ? '编辑检查' : '新增检查'"
      width="680px"
      @closed="handleDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="hygiene-form">
        <div class="hygiene-form__grid">
          <el-form-item label="楼宇号" prop="dormBuildId">
            <el-input
              v-model.number="form.dormBuildId"
              placeholder="请输入楼宇号"
              @change="validateDormLocationFields"
              @blur="validateDormLocationFields"
            />
          </el-form-item>

          <el-form-item label="房间号" prop="dormRoomId">
            <el-input
              v-model.number="form.dormRoomId"
              placeholder="请输入房间号"
              @change="validateDormLocationFields"
              @blur="validateDormLocationFields"
            />
          </el-form-item>

          <el-form-item label="检查结果" prop="result">
            <el-radio-group v-model="form.result" @change="handleResultChange">
              <el-radio label="合格">合格</el-radio>
              <el-radio label="不合格">不合格</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="扣分" prop="score">
            <el-input v-model.number="form.score" placeholder="请输入扣分" />
          </el-form-item>

          <el-form-item label="扣分分类" prop="issueCategory">
            <el-select v-model="form.issueCategory" placeholder="请选择扣分原因" style="width: 100%">
              <el-option
                v-for="item in issueCategoryOptions"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="检查类型">
            <el-tag :type="form.checkType === '复查' ? 'warning' : 'info'">
              {{ form.checkType || "常规检查" }}
            </el-tag>
          </el-form-item>

          <el-form-item label="检查人员" prop="checker">
            <el-input v-model="form.checker" placeholder="请输入检查人员" />
          </el-form-item>

          <el-form-item label="检查日期" prop="checkDate">
            <el-date-picker
              v-model="form.checkDate"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择检查日期"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" rows="4" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitCheck">
            {{ judgeOption ? "保存修改" : "提交检查" }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage, ElMessageBox } from "element-plus";

const createDefaultForm = () => ({
  id: null,
  dormBuildId: null,
  dormRoomId: null,
  checkDate: new Date(),
  result: "合格",
  score: 0,
  issueCategory: "无",
  checkType: "常规检查",
  recheckStatus: "无需复查",
  recheckSourceId: null,
  recheckFinishTime: "",
  checker: "管理员",
  remark: ""
});

export default {
  name: "HygieneCheck",
  data() {
    const hasValue = (value) => value !== null && value !== undefined && value !== "";
    const toPositiveInteger = (value) => {
      const numberValue = Number(value);
      return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
    };
    const validateDormBuildId = async (rule, value, callback) => {
      if (!hasValue(value)) {
        callback(new Error("请输入楼宇号"));
        return;
      }

      const dormBuildId = toPositiveInteger(value);
      if (!dormBuildId) {
        callback(new Error("请输入有效楼宇号"));
        return;
      }

      try {
        const dormRoomId = toPositiveInteger(this.form.dormRoomId);
        const res = dormRoomId
          ? await request.get(`/hygiene/check/validate-room/${dormBuildId}/${dormRoomId}`)
          : await request.get(`/hygiene/check/validate-building/${dormBuildId}`);
        if (res.code !== "0") {
          callback(new Error(res.msg || "楼宇号不存在或与房间号不对应"));
          return;
        }
        callback();
      } catch (error) {
        callback(new Error(error.message || "楼宇号校验失败"));
      }
    };
    const validateDormRoomId = async (rule, value, callback) => {
      if (!hasValue(value)) {
        callback(new Error("请输入房间号"));
        return;
      }

      const dormRoomId = toPositiveInteger(value);
      if (!dormRoomId) {
        callback(new Error("请输入有效房间号"));
        return;
      }

      try {
        const dormBuildId = toPositiveInteger(this.form.dormBuildId);
        const res = dormBuildId
          ? await request.get(`/hygiene/check/validate-room/${dormBuildId}/${dormRoomId}`)
          : await request.get(`/hygiene/check/validate-room-id/${dormRoomId}`);
        if (res.code !== "0") {
          callback(new Error(res.msg || "房间号不存在或与楼宇号不对应"));
          return;
        }
        callback();
      } catch (error) {
        callback(new Error(error.message || "房间号校验失败"));
      }
    };

    return {
      currentIdentity: "",
      currentUser: {},
      currentRoom: null,
      form: createDefaultForm(),
      rules: {
        dormBuildId: [{ validator: validateDormBuildId, trigger: ["blur", "change"] }],
        dormRoomId: [{ validator: validateDormRoomId, trigger: ["blur", "change"] }],
        result: [{ required: true, message: "请选择检查结果", trigger: "change" }],
        score: [
          { required: true, message: "请输入扣分", trigger: "blur" },
          { type: "number", message: "请输入数字", trigger: "blur" }
        ],
        checker: [{ required: true, message: "请输入检查人员", trigger: "blur" }],
        checkDate: [{ required: true, message: "请选择检查日期", trigger: "change" }]
      },
      loading: false,
      submitting: false,
      checkResults: [],
      roomScoreSummary: [],
      issueCategoryOptions: ["无", "地面", "垃圾", "床铺", "桌面", "阳台", "卫生间", "门窗", "其他"],
      dialogVisible: false,
      judgeOption: false
    };
  },
  computed: {
    isReadonlyView() {
      return this.currentIdentity === "stu" || this.currentIdentity === "worker";
    },
    isStudentView() {
      return this.currentIdentity === "stu";
    },
    qualifiedCount() {
      return this.checkResults.filter((item) => item.result === "合格").length;
    },
    unqualifiedCount() {
      return this.checkResults.filter((item) => item.result !== "合格").length;
    },
    averageTotalScore() {
      if (this.roomScoreSummary.length) {
        const total = this.roomScoreSummary.reduce((sum, item) => sum + this.getRoomCurrentScore(item), 0);
        return this.formatScore(total / this.roomScoreSummary.length);
      }
      if (this.checkResults.length) {
        const total = this.checkResults.reduce((sum, item) => sum + this.getTotalScore(item), 0);
        return this.formatScore(total / this.checkResults.length);
      }
      return 0;
    },
    scoreSummaryRows() {
      return this.roomScoreSummary;
    },
    attentionRoomCount() {
      return this.roomScoreSummary.filter((item) => this.getRoomCurrentScore(item) < 80).length;
    }
  },
  created() {
    this.initSession();
    this.loadCheckResults();
  },
  methods: {
    initSession() {
      try {
        this.currentIdentity = JSON.parse(sessionStorage.getItem("identity") || "\"\"");
        this.currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      } catch (error) {
        this.currentIdentity = "";
        this.currentUser = {};
      }
    },
    formatDateTime(dateValue) {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    formatDisplayTime(value) {
      if (!value) {
        return "-";
      }
      return this.formatDateTime(value);
    },
    clampScore(value) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        return 0;
      }
      return Math.max(0, Math.min(100, numberValue));
    },
    getTotalScore(row) {
      const totalScore = Number(row?.totalScore);
      if (Number.isFinite(totalScore)) {
        return this.clampScore(Math.round(totalScore));
      }

      const score = Number(row?.score) || 0;
      return this.clampScore(100 - Math.max(score, 0));
    },
    getRoomCurrentScore(item) {
      const currentScore = Number(item?.currentScore);
      if (Number.isFinite(currentScore)) {
        return this.clampScore(currentScore);
      }
      return this.clampScore(item?.averageScore);
    },
    formatScore(value) {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue)) {
        return 0;
      }
      const rounded = Math.round(numberValue * 10) / 10;
      return Number.isInteger(rounded) ? rounded : rounded.toFixed(1);
    },
    formatRoomName(item) {
      if (!item?.dormBuildId || !item?.dormRoomId) {
        return "未知寝室";
      }
      return `${item.dormBuildId} 栋 ${item.dormRoomId} 室`;
    },
    scoreClass(score) {
      const value = Number(score);
      if (value >= 90) {
        return "score-excellent";
      }
      if (value >= 80) {
        return "score-good";
      }
      return "score-warning";
    },
    recheckTagType(status) {
      if (status === "待复查" || status === "复查未通过") {
        return "warning";
      }
      if (status === "复查通过") {
        return "success";
      }
      return "info";
    },
    canRecheck(row) {
      return row?.recheckStatus === "待复查" || row?.recheckStatus === "复查未通过";
    },
    handleResultChange(value) {
      if (value === "合格") {
        this.form.score = 0;
        this.form.issueCategory = "无";
      } else if (!this.form.issueCategory || this.form.issueCategory === "无") {
        this.form.issueCategory = "其他";
      }
    },
    normalizeFormEnhancementFields() {
      if (this.form.result === "合格" && Number(this.form.score) === 0) {
        this.form.issueCategory = "无";
        return;
      }
      if (!this.form.issueCategory || this.form.issueCategory === "无") {
        this.form.issueCategory = "其他";
      }
    },
    buildRoomScoreSummary(records = []) {
      const summaryMap = new Map();
      const sortedRecords = [...records].sort((a, b) => {
        const aTime = a?.checkDate ? new Date(a.checkDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b?.checkDate ? new Date(b.checkDate).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        return Number(a?.id || 0) - Number(b?.id || 0);
      });

      sortedRecords.forEach((record) => {
        if (!record?.dormBuildId || !record?.dormRoomId) {
          return;
        }

        const key = `${record.dormBuildId}-${record.dormRoomId}`;
        const current = summaryMap.get(key) || {
          dormBuildId: record.dormBuildId,
          dormRoomId: record.dormRoomId,
          checkCount: 0,
          totalScore: 100,
          averageScore: 100,
          currentScore: 100,
          totalDeduction: 0,
          latestScore: 100,
          latestCheckDate: null
        };

        const deduction = Math.max(Number(record.score) || 0, 0);
        const actualDeduction = Math.min(deduction, current.currentScore);
        current.currentScore = this.clampScore(current.currentScore - actualDeduction);
        current.checkCount += 1;
        current.totalDeduction += actualDeduction;
        current.totalScore = current.currentScore;
        current.averageScore = current.currentScore;
        current.latestScore = current.currentScore;
        record.totalScore = current.currentScore;

        const recordTime = record.checkDate ? new Date(record.checkDate).getTime() : 0;
        const latestTime = current.latestCheckDate ? new Date(current.latestCheckDate).getTime() : 0;
        if (!current.latestCheckDate || recordTime >= latestTime) {
          current.latestCheckDate = record.checkDate;
          current.latestScore = current.currentScore;
        }

        summaryMap.set(key, current);
      });

      if (this.isStudentView && this.currentRoom?.dormBuildId && this.currentRoom?.dormRoomId) {
        const key = `${this.currentRoom.dormBuildId}-${this.currentRoom.dormRoomId}`;
        if (!summaryMap.has(key)) {
          summaryMap.set(key, {
            dormBuildId: this.currentRoom.dormBuildId,
            dormRoomId: this.currentRoom.dormRoomId,
            checkCount: 0,
            totalScore: 100,
            averageScore: 100,
            currentScore: 100,
            totalDeduction: 0,
            latestScore: 100,
            latestCheckDate: null
          });
        }
      }

      return Array.from(summaryMap.values()).sort((a, b) => {
        if (this.getRoomCurrentScore(a) !== this.getRoomCurrentScore(b)) {
          return this.getRoomCurrentScore(a) - this.getRoomCurrentScore(b);
        }
        if (Number(a.dormBuildId) !== Number(b.dormBuildId)) {
          return Number(a.dormBuildId) - Number(b.dormBuildId);
        }
        return Number(a.dormRoomId) - Number(b.dormRoomId);
      });
    },
    async loadRoomScoreSummary() {
      if (this.isStudentView) {
        this.roomScoreSummary = this.buildRoomScoreSummary(this.checkResults);
        return;
      }

      try {
        const res = await request.get("/hygiene/check/summary");
        if (res.code !== "0" || !Array.isArray(res.data)) {
          throw new Error(res.msg || "获取寝室卫生总分统计失败");
        }
        this.roomScoreSummary = res.data.map((item) => ({
          ...item,
          averageScore: this.clampScore(item.averageScore),
          currentScore: this.clampScore(item.currentScore ?? item.averageScore),
          totalDeduction: Math.max(Number(item.totalDeduction) || 0, 0),
          latestScore: this.clampScore(item.latestScore)
        }));
      } catch (error) {
        this.roomScoreSummary = this.buildRoomScoreSummary(this.checkResults);
      }
    },
    async loadCheckResults() {
      this.loading = true;
      try {
        let res;

        if (this.isStudentView) {
          const username = this.currentUser?.username;
          if (!username) {
            this.currentRoom = null;
            this.checkResults = [];
            this.roomScoreSummary = [];
            return;
          }

          const roomRes = await request.get(`/room/getMyRoom/${username}`);
          if (roomRes.code !== "0" || !roomRes.data) {
            this.currentRoom = null;
            this.checkResults = [];
            this.roomScoreSummary = [];
            return;
          }

          this.currentRoom = roomRes.data;
          res = await request.get(`/hygiene/check/list/room/${roomRes.data.dormBuildId}/${roomRes.data.dormRoomId}`);
        } else {
          res = await request.get("/hygiene/check/list");
        }

        if (res.code !== "0") {
          throw new Error(res.msg || "获取卫生检查记录失败");
        }
        this.checkResults = Array.isArray(res.data) ? res.data : [];
        this.roomScoreSummary = this.buildRoomScoreSummary(this.checkResults);
        await this.loadRoomScoreSummary();
      } catch (error) {
        ElMessage.error(error.message || "获取卫生检查记录失败");
      } finally {
        this.loading = false;
      }
    },
    openCreateDialog() {
      Object.assign(this.form, createDefaultForm());
      this.judgeOption = false;
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate();
      });
    },
    openRecheckDialog(row) {
      Object.assign(this.form, createDefaultForm(), {
        dormBuildId: row.dormBuildId,
        dormRoomId: row.dormRoomId,
        checkDate: new Date(),
        result: "合格",
        score: 0,
        issueCategory: "无",
        checkType: "复查",
        recheckStatus: "复查通过",
        recheckSourceId: row.id,
        checker: "管理员",
        remark: `复查来源：${row.checkDate ? this.formatDisplayTime(row.checkDate) : ""}，原问题分类：${row.issueCategory || "其他"}`
      });
      this.judgeOption = false;
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate();
      });
    },
    handleEdit(row) {
      Object.assign(this.form, createDefaultForm(), row, {
        checkDate: row.checkDate ? new Date(row.checkDate) : new Date()
      });
      this.judgeOption = true;
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate();
      });
    },
    handleDialogClosed() {
      Object.assign(this.form, createDefaultForm());
      this.judgeOption = false;
      this.$refs.formRef?.clearValidate();
    },
    validateDormLocationFields() {
      this.$nextTick(() => {
        this.$refs.formRef?.validateField("dormBuildId", () => {});
        this.$refs.formRef?.validateField("dormRoomId", () => {});
      });
    },
    async validateRoomBeforeSubmit() {
      const dormBuildId = Number(this.form.dormBuildId);
      const dormRoomId = Number(this.form.dormRoomId);
      const score = Number(this.form.score);

      if (!Number.isInteger(dormBuildId) || dormBuildId <= 0) {
        ElMessage.warning("请输入有效楼宇号");
        return false;
      }
      if (!Number.isInteger(dormRoomId) || dormRoomId <= 0) {
        ElMessage.warning("请输入有效房间号");
        return false;
      }
      if (!Number.isFinite(score) || score < 0) {
        ElMessage.warning("扣分不能小于0");
        return false;
      }
      if ((this.form.result !== "合格" || score > 0) && (!this.form.issueCategory || this.form.issueCategory === "无")) {
        ElMessage.warning("请选择扣分分类");
        return false;
      }

      try {
        const res = await request.get(`/hygiene/check/validate-room/${dormBuildId}/${dormRoomId}`, {
          params: {
            id: this.form.id || undefined,
            score,
            checkDate: this.form.checkDate ? this.formatDateTime(this.form.checkDate) : undefined
          }
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "楼宇号与房间号不对应");
        }
        return true;
      } catch (error) {
        ElMessage.error(error.message || "楼宇号与房间号校验失败");
        return false;
      }
    },
    submitCheck() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) {
          ElMessage.warning("请先把检查信息填写完整");
          return;
        }

        const roomValid = await this.validateRoomBeforeSubmit();
        if (!roomValid) {
          return;
        }

        this.submitting = true;
        try {
          this.normalizeFormEnhancementFields();
          const payload = {
            ...this.form,
            checkDate: this.form.checkDate ? this.formatDateTime(this.form.checkDate) : null
          };

          const res = this.judgeOption
            ? await request.put("/hygiene/check/update", payload)
            : await request.post("/hygiene/check", payload);

          if (res.code !== "0") {
            throw new Error(res.msg || (this.judgeOption ? "编辑失败" : "提交失败"));
          }

          ElMessage.success(this.judgeOption ? "编辑成功" : "检查提交成功");
          this.dialogVisible = false;
          await this.loadCheckResults();
        } catch (error) {
          ElMessage.error(error.message || "提交失败");
        } finally {
          this.submitting = false;
        }
      });
    },
    async handleDelete(id) {
      try {
        await ElMessageBox.confirm("确定要删除这条检查记录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        });

        const res = await request.delete(`/hygiene/check/delete/${id}`);
        if (res.code !== "0") {
          throw new Error(res.msg || "删除失败");
        }

        ElMessage.success("删除成功");
        await this.loadCheckResults();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "删除失败");
      }
    }
  }
};
</script>

<style scoped>
.hygiene-page {
  gap: 18px;
}

.hygiene-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 20px;
  padding: 26px;
}

.hygiene-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hygiene-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.panel-header__eyebrow {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-header h3 {
  font-size: 18px;
  line-height: 1.4;
  letter-spacing: 0;
}

.room-alert {
  margin-bottom: 18px;
}

.action-group {
  display: flex;
  gap: 10px;
}

.score-summary-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.score-summary-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.score-summary-metric {
  min-height: 96px;
  padding: 18px;
  border: 1px solid rgba(36, 91, 71, 0.16);
  border-radius: 8px;
  background: var(--surface-color);
}

.score-summary-metric span,
.score-room-item__label {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 600;
}

.score-summary-metric strong {
  display: block;
  margin-top: 8px;
  color: var(--text-color);
  font-size: 32px;
  line-height: 1;
  font-weight: 650;
}

.score-room-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  max-height: 430px;
  overflow-y: auto;
  padding-right: 4px;
}

.score-room-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.score-room-item div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.score-room-item strong {
  white-space: nowrap;
  font-size: 18px;
  font-weight: 650;
}

.score-room-item p {
  margin-top: 10px;
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 1.55;
}

.table-score {
  font-weight: 650;
}

.score-excellent {
  color: var(--success-color);
}

.score-good {
  color: var(--primary-color);
}

.score-warning {
  color: #b91c1c;
}

.hygiene-form {
  padding-top: 6px;
}

.hygiene-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

@media (max-width: 992px) {
  .hygiene-hero {
    grid-template-columns: 1fr;
  }

  .score-room-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hygiene-hero {
    padding: 20px;
  }

  .hygiene-form__grid {
    grid-template-columns: 1fr;
  }

  .score-summary-overview,
  .score-room-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
