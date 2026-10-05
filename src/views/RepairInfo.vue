<template>
  <!-- LOCATE: 报修工单处理页面，派单和维修状态 -->
  <div class="page-shell repair-admin-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 16px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>信息管理</el-breadcrumb-item>
      <el-breadcrumb-item>报修工单处理</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card repair-admin-hero">
      <div>
        <div class="page-eyebrow">Repair Management</div>
        <h1 class="page-title">报修工单处理</h1>
      </div>

      <div class="hero-guide">
        <div class="guide-chip">
          <span>学生</span>
          <strong>提报与跟踪</strong>
        </div>
        <div class="guide-chip">
          <span>管理员</span>
          <strong>分派与监督</strong>
        </div>
        <div class="guide-chip">
          <span>工人</span>
          <strong>接单与完工</strong>
        </div>
      </div>
    </section>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-kicker">Ticket Board</div>
            <h3>报修工单总览</h3>
          </div>
          <div class="card-actions">
            <el-input
              v-model="search"
              clearable
              placeholder="搜索标题、学生或内容"
              style="width: 220px"
              @keyup.enter="load"
              @clear="load"
            />
            <el-button type="primary" plain @click="refreshAll">刷新</el-button>
          </div>
        </div>
      </template>

      <div class="worker-table-panel">
        <div class="worker-table-panel__header">
          <div>
            <div class="card-kicker">Worker Rating</div>
            <h4>工人信息与评分</h4>
          </div>
          <div class="worker-table-panel__tools">
            <span class="worker-count">共 {{ workers.length }} 名工人</span>
            <el-button v-if="isAdmin" type="primary" size="small" @click="openWorkerCreateDialog">新增工人</el-button>
          </div>
        </div>
        <el-table :data="workers" border stripe style="width: 100%">
          <el-table-column label="工人账号" prop="username" min-width="120" />
          <el-table-column label="姓名" prop="name" min-width="110" />
          <el-table-column label="性别" prop="gender" width="80">
            <template #default="scope">
              {{ scope.row.gender || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="年龄" prop="age" width="80">
            <template #default="scope">
              {{ scope.row.age || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="联系电话" prop="phone" min-width="140">
            <template #default="scope">
              {{ scope.row.phone || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="邮箱" prop="email" min-width="190" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.email || "-" }}
            </template>
          </el-table-column>
          <el-table-column label="已处理工单" width="110">
            <template #default="scope">
              {{ scope.row.completedCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="平均评分" width="180">
            <template #default="scope">
              <div class="worker-score-cell">
                <strong>{{ formatAverageRating(scope.row.averageRating) }}</strong>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="评分次数" width="100">
            <template #default="scope">
              {{ scope.row.ratingCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column v-if="isAdmin" label="维护" width="150" fixed="right">
            <template #default="scope">
              <div class="row-actions">
                <el-button type="primary" text @click="openWorkerEditDialog(scope.row)">编辑</el-button>
                <el-button type="danger" text @click="deleteWorker(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-table v-loading="loading" :data="tableData" border style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="repairer" label="报修人" width="120" />
        <el-table-column label="附件" width="110">
          <template #default="scope">
            <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
              预览
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="宿舍" width="120">
          <template #default="scope">
            {{ scope.row.dormBuildId }}-{{ scope.row.dormRoomId }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="stateTagType(scope.row.state)">{{ scope.row.state }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报修等级" width="100">
          <template #default="scope">
            <el-tag :type="priorityTagType(scope.row.priority)">{{ scope.row.priority || "普通" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handler" label="处理人" width="120" />
        <el-table-column prop="appointmentTime" label="预约时间" min-width="170" />
        <el-table-column prop="expectedFinishTime" label="预计完工" min-width="170" />
        <el-table-column prop="orderBuildTime" label="提交时间" min-width="170" />
        <el-table-column prop="orderFinishTime" label="完成时间" min-width="170" />
        <el-table-column label="完工照片" width="110">
          <template #default="scope">
            <el-link v-if="hasCompletionAttachment(scope.row)" type="primary" @click.prevent="previewCompletionAttachment(scope.row)">
              预览
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="90">
          <template #default="scope">
            {{ scope.row.rating || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="评价意见" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            {{ evaluationSummary(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right" class-name="repair-action-column">
          <template #default="scope">
            <div class="row-actions">
              <el-button type="primary" text @click="openDetail(scope.row)">查看</el-button>
              <el-button type="warning" text :disabled="!isDispatchable(scope.row)" @click="openDispatch(scope.row)">
                {{ scope.row.handler ? "重派" : "派单" }}
              </el-button>
              <el-button type="danger" text @click="handleDelete(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager-shell">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="报修详情" width="680px">
      <div v-if="detailRecord" class="detail-stack">
        <div class="detail-head">
          <strong>{{ detailRecord.title }}</strong>
          <el-tag :type="stateTagType(detailRecord.state)">{{ detailRecord.state }}</el-tag>
        </div>
        <div class="detail-grid">
          <span>报修人：{{ detailRecord.repairer }}</span>
          <span>宿舍：{{ detailRecord.dormBuildId }}-{{ detailRecord.dormRoomId }}</span>
          <span>处理人：{{ detailRecord.handler || "待分派" }}</span>
          <span>报修等级：{{ detailRecord.priority || "普通" }}</span>
          <span>接单时间：{{ detailRecord.acceptTime || "-" }}</span>
          <span>预约时间：{{ detailRecord.appointmentTime || "-" }}</span>
          <span>预计完工：{{ detailRecord.expectedFinishTime || "-" }}</span>
          <span>提交时间：{{ detailRecord.orderBuildTime || "-" }}</span>
          <span>完工提交：{{ detailRecord.completionSubmitTime || "-" }}</span>
          <span>学生确认：{{ detailRecord.studentConfirmTime || "-" }}</span>
          <span>完成时间：{{ detailRecord.orderFinishTime || "-" }}</span>
          <span>学生评分：{{ detailRecord.rating || "-" }}</span>
          <span>评价时间：{{ detailRecord.evaluationTime || "-" }}</span>
        </div>
        <div class="detail-block">
          <div class="detail-label">报修内容</div>
          <p>{{ detailRecord.content || "暂无内容" }}</p>
        </div>
        <div class="detail-block">
          <div class="detail-label">报修附件</div>
          <el-link v-if="hasAttachment(detailRecord)" type="primary" @click.prevent="previewAttachment(detailRecord)">
            {{ detailRecord.attachmentName || "预览故障图片" }}
          </el-link>
          <p v-else>未上传附件</p>
        </div>
        <div class="detail-block">
          <div class="detail-label">完工说明</div>
          <p>{{ detailRecord.completionNote || "工人暂未填写完工说明" }}</p>
        </div>
        <div class="detail-block">
          <div class="detail-label">完工照片</div>
          <el-link v-if="hasCompletionAttachment(detailRecord)" type="primary" @click.prevent="previewCompletionAttachment(detailRecord)">
            {{ detailRecord.completionAttachmentName || "预览完工照片" }}
          </el-link>
          <p v-else>{{ detailRecord.state === "已完成" || detailRecord.state === "待学生确认" ? "未上传完工照片" : "工单完工后上传" }}</p>
        </div>
        <div v-if="detailRecord.studentFeedback" class="detail-block">
          <div class="detail-label">学生退回说明</div>
          <p>{{ detailRecord.studentFeedback }}</p>
        </div>
        <div class="detail-block">
          <div class="detail-label">学生评价意见</div>
          <div v-if="detailRecord.rating || detailRecord.evaluationOpinion" class="evaluation-view">
            <el-rate
              v-if="detailRecord.rating"
              :model-value="detailRecord.rating"
              disabled
              show-score
              score-template="{value} 分"
            />
            <p>{{ detailRecord.evaluationOpinion || "学生暂未填写文字评价" }}</p>
          </div>
          <p v-else>{{ detailRecord.state === "已完成" ? "维修已完成，等待学生评价。" : "工单完成后学生可填写评价。" }}</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchDialogVisible" :title="dispatchTarget?.handler ? '重派维修工单' : '派单维修工单'" width="720px">
      <div v-if="dispatchTarget" class="dispatch-dialog-body">
        <div class="dispatch-target">
          <strong>{{ dispatchTarget.title || "报修工单" }}</strong>
          <span>{{ dispatchTarget.dormBuildId }}-{{ dispatchTarget.dormRoomId }}｜{{ dispatchTarget.repairer || "报修人" }}｜{{ dispatchTarget.state || "待受理" }}</span>
        </div>
        <div class="dispatch-recommendation" v-loading="recommendationLoading">
          <div class="dispatch-recommendation__header">
            <div>
              <span>智能派单推荐</span>
              <strong>{{ topDispatchRecommendations[0]?.name || topDispatchRecommendations[0]?.username || "暂无推荐" }}</strong>
            </div>
            <el-button
              v-if="topDispatchRecommendations.length"
              type="warning"
              plain
              size="small"
              @click="applyRecommendation(topDispatchRecommendations[0])"
            >
              采用推荐
            </el-button>
          </div>
          <div v-if="topDispatchRecommendations.length" class="recommendation-list">
            <button
              v-for="worker in topDispatchRecommendations"
              :key="worker.username || worker.name"
              type="button"
              class="recommendation-card"
              :class="{ 'is-active': dispatchForm.handler === (worker.name || worker.username), 'is-best': worker.recommended }"
              @click="applyRecommendation(worker)"
            >
              <div class="recommendation-card__top">
                <strong>{{ worker.name || worker.username }}</strong>
                <el-tag size="small" :type="worker.recommended ? 'warning' : 'info'">
                  {{ worker.recommendationLevel }}
                </el-tag>
              </div>
              <div class="recommendation-score">{{ worker.recommendationScore || 0 }} 分</div>
              <div class="recommendation-metrics">
                <span>当前 {{ worker.currentTaskCount || 0 }} 单</span>
                <span>评分 {{ formatAverageRating(worker.averageRating) }}</span>
                <span>均时 {{ formatProcessTime(worker) }}</span>
              </div>
              <p>{{ recommendationReason(worker) }}</p>
            </button>
          </div>
          <el-empty v-else :image-size="48" description="暂无可推荐维修工" />
        </div>
        <el-form ref="dispatchFormRef" :model="dispatchForm" :rules="dispatchRules" label-width="98px">
          <el-form-item label="维修工人" prop="handler">
            <el-select v-model="dispatchForm.handler" filterable placeholder="请选择维修工人" style="width: 100%">
              <el-option
                v-for="worker in workers"
                :key="worker.username || worker.name"
                :label="workerOptionLabel(worker)"
                :value="worker.name || worker.username"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="报修等级" prop="priority">
            <div class="dispatch-priority-field">
              <div class="dispatch-priority-control">
                <el-select v-model="dispatchForm.priority" placeholder="请选择报修等级" style="width: 100%">
                  <el-option label="普通" value="普通" />
                  <el-option label="较高" value="较高" />
                  <el-option label="紧急" value="紧急" />
                </el-select>
                <el-button :loading="priorityRecommending" @click="loadDispatchPriorityRecommendation(dispatchTarget, true)">
                  智能推荐
                </el-button>
              </div>
              <div v-if="dispatchPriorityRecommendation" class="dispatch-priority-recommendation">
                <el-tag :type="priorityTagType(dispatchPriorityRecommendation.priority)" size="small">
                  建议 {{ dispatchPriorityRecommendation.priority }}
                </el-tag>
                <span>{{ dispatchPriorityRecommendation.reason }}</span>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="预计完工" prop="expectedFinishTime">
            <el-date-picker
              v-model="dispatchForm.expectedFinishTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dispatching" @click="submitDispatch">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="workerDialogVisible"
      :title="workerEditing ? '编辑维修工人' : '新增维修工人'"
      width="640px"
      @closed="resetWorkerDialog"
    >
      <el-form ref="workerFormRef" :model="workerForm" :rules="workerRules" label-width="92px" class="worker-form">
        <div class="worker-form-grid">
          <el-form-item label="工人账号" prop="username">
            <el-input v-model.trim="workerForm.username" :disabled="workerEditing" maxlength="20" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model.trim="workerForm.password"
              show-password
              maxlength="32"
              :placeholder="workerEditing ? '留空则不修改密码' : '请输入初始密码'"
            />
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model.trim="workerForm.name" maxlength="20" />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="workerForm.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="年龄" prop="age">
            <el-input v-model.trim="workerForm.age" type="number" min="1" max="100" placeholder="请输入年龄" />
          </el-form-item>
          <el-form-item label="联系电话" prop="phone">
            <el-input v-model.trim="workerForm.phone" maxlength="20" />
          </el-form-item>
        </div>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model.trim="workerForm.email" maxlength="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="workerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="workerSubmitting" @click="saveWorker">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="attachmentPreviewVisible"
      :title="attachmentPreviewTitle || '附件预览'"
      width="820px"
      @closed="closeAttachmentPreview"
    >
      <div class="attachment-preview">
        <img
          v-if="attachmentPreviewType === 'image'"
          :src="attachmentPreviewUrl"
          alt="报修附件预览"
          class="attachment-preview__image"
        />
        <iframe
          v-else-if="attachmentPreviewType === 'frame' || attachmentPreviewType === 'office'"
          :src="attachmentPreviewUrl"
          class="attachment-preview__frame"
          title="报修附件预览"
        ></iframe>
        <div v-else class="attachment-preview__empty">
          <p>该附件暂不支持在线预览。</p>
          <el-link :href="attachmentPreviewDownloadUrl" target="_blank" type="primary">打开原文件</el-link>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage, ElMessageBox } from "element-plus";

const createDispatchForm = () => ({
  handler: "",
  priority: "普通",
  expectedFinishTime: "",
});

const createWorkerForm = () => ({
  username: "",
  password: "",
  name: "",
  gender: "",
  age: "",
  phone: "",
  email: "",
});

const readSessionIdentity = () => {
  const value = window.sessionStorage.getItem("identity");
  if (!value || value === "undefined" || value === "null") {
    return "";
  }
  try {
    return JSON.parse(value) || "";
  } catch (error) {
    return value;
  }
};

export default {
  name: "RepairInfo",
  data() {
    const validateWorkerPassword = (rule, value, callback) => {
      if (!this.workerEditing && !value) {
        callback(new Error("请输入初始密码"));
        return;
      }
      if (value && (value.length < 6 || value.length > 32)) {
        callback(new Error("密码长度为 6 到 32 个字符"));
        return;
      }
      callback();
    };
    return {
      loading: false,
      dispatching: false,
      recommendationLoading: false,
      priorityRecommending: false,
      workerSubmitting: false,
      search: "",
      currentIdentity: "",
      currentPage: 1,
      pageSize: 10,
      total: 0,
      tableData: [],
      workers: [],
      dispatchRecommendations: [],
      dispatchPriorityRecommendation: null,
      detailDialogVisible: false,
      dispatchDialogVisible: false,
      workerDialogVisible: false,
      workerEditing: false,
      attachmentPreviewVisible: false,
      detailRecord: null,
      dispatchTarget: null,
      dispatchForm: createDispatchForm(),
      workerForm: createWorkerForm(),
      attachmentPreviewTitle: "",
      attachmentPreviewUrl: "",
      attachmentPreviewDownloadUrl: "",
      attachmentPreviewType: "unsupported",
      dispatchRules: {
        handler: [{ required: true, message: "请选择维修工人", trigger: "change" }],
        priority: [{ required: true, message: "请选择报修等级", trigger: "change" }],
        expectedFinishTime: [{ required: true, message: "请选择预计完工时间", trigger: "change" }],
      },
      workerRules: {
        username: [
          { required: true, message: "请输入工人账号", trigger: "blur" },
          { pattern: /^[A-Za-z0-9]{4,20}$/, message: "账号需为 4 到 20 位字母或数字", trigger: "blur" },
        ],
        password: [{ validator: validateWorkerPassword, trigger: "blur" }],
        name: [{ required: true, message: "请输入姓名", trigger: "blur" }],
        email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
      },
    };
  },
  computed: {
    isAdmin() {
      return this.currentIdentity === "admin";
    },
    topDispatchRecommendations() {
      return this.dispatchRecommendations.slice(0, 3);
    },
  },
  created() {
    this.currentIdentity = readSessionIdentity();
    this.load();
    this.loadWorkers();
  },
  methods: {
    async load() {
      this.loading = true;
      try {
        const res = await request.get("/repair/find", {
          params: {
            pageNum: this.currentPage,
            pageSize: this.pageSize,
            search: this.search,
          },
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "报修工单加载失败");
        }
        this.tableData = res.data?.records || [];
        this.total = res.data?.total || 0;
      } catch (error) {
        ElMessage.error(error.message || "报修工单加载失败");
      } finally {
        this.loading = false;
      }
    },
    async loadWorkers() {
      try {
        const res = await request.get("/worker/list");
        if (res.code !== "0") {
          throw new Error(res.msg || "工人列表加载失败");
        }
        this.workers = Array.isArray(res.data) ? res.data : [];
      } catch (error) {
        ElMessage.error(error.message || "工人列表加载失败");
      }
    },
    refreshAll() {
      this.load();
      this.loadWorkers();
    },
    openWorkerCreateDialog() {
      if (!this.isAdmin) {
        ElMessage.warning("只有后勤管理员可以维护维修工人信息");
        return;
      }
      this.workerEditing = false;
      this.workerForm = createWorkerForm();
      this.workerDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.workerFormRef?.clearValidate();
      });
    },
    openWorkerEditDialog(worker) {
      if (!this.isAdmin) {
        ElMessage.warning("只有后勤管理员可以维护维修工人信息");
        return;
      }
      this.workerEditing = true;
      this.workerForm = {
        username: worker.username || "",
        password: "",
        name: worker.name || "",
        gender: worker.gender || "",
        age: worker.age ? String(worker.age) : "",
        phone: worker.phone || "",
        email: worker.email || "",
      };
      this.workerDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.workerFormRef?.clearValidate();
      });
    },
    resetWorkerDialog() {
      this.workerEditing = false;
      this.workerSubmitting = false;
      this.workerForm = createWorkerForm();
      this.$refs.workerFormRef?.clearValidate();
    },
    async saveWorker() {
      if (!this.isAdmin || this.workerSubmitting) {
        return;
      }
      const valid = await this.$refs.workerFormRef.validate().catch(() => false);
      if (!valid) {
        return;
      }
      const payload = { ...this.workerForm };
      if (this.workerEditing && !payload.password) {
        delete payload.password;
      }
      if (payload.age === "" || payload.age === undefined || payload.age === null) {
        payload.age = null;
      } else {
        payload.age = Number(payload.age);
      }
      this.workerSubmitting = true;
      try {
        const res = this.workerEditing
          ? await request.put("/worker/update", payload)
          : await request.post("/worker/add", payload);
        if (res.code !== "0") {
          throw new Error(res.msg || "保存失败");
        }
        ElMessage.success(this.workerEditing ? "工人信息已更新" : "维修工人已添加");
        this.workerDialogVisible = false;
        await this.loadWorkers();
      } catch (error) {
        ElMessage.error(error.message || "保存失败");
      } finally {
        this.workerSubmitting = false;
      }
    },
    async deleteWorker(worker) {
      if (!this.isAdmin || !worker?.username) {
        return;
      }
      try {
        await ElMessageBox.confirm(`确定删除维修工人 ${worker.name || worker.username} 吗？`, "提示", {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
        });
        const res = await request.delete(`/worker/delete/${encodeURIComponent(worker.username)}`);
        if (res.code !== "0") {
          throw new Error(res.msg || "删除失败");
        }
        ElMessage.success("维修工人已删除");
        await this.loadWorkers();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "删除失败");
      }
    },
    stateTagType(state) {
      if (state === "已完成") {
        return "success";
      }
      if (state === "待学生确认") {
        return "warning";
      }
      if (state === "已预约") {
        return "warning";
      }
      if (state === "处理中") {
        return "info";
      }
      if (state === "已派单") {
        return "";
      }
      return "info";
    },
    priorityTagType(priority) {
      if (priority === "紧急") {
        return "danger";
      }
      if (priority === "较高") {
        return "warning";
      }
      return "info";
    },
    evaluationSummary(row) {
      if (row?.evaluationOpinion) {
        return row.evaluationOpinion;
      }
      if (row?.rating) {
        return "已评分，暂无文字评价";
      }
      if (row?.state === "待学生确认") {
        return "待学生确认";
      }
      if (row?.state === "已完成") {
        return "待学生评价";
      }
      return "-";
    },
    formatAverageRating(value) {
      return value ? Number(value).toFixed(1) : "暂无";
    },
    formatProcessTime(worker) {
      const minutes = Number(worker?.averageProcessMinutes);
      if (minutes > 0 && minutes < 60) {
        return `${minutes.toFixed(1)}分钟`;
      }
      if (minutes >= 60) {
        return `${(minutes / 60).toFixed(1)}小时`;
      }
      const hours = Number(worker?.averageProcessHours);
      return hours > 0 ? `${hours.toFixed(1)}小时` : "暂无";
    },
    recommendationReason(worker) {
      if (!worker || !Array.isArray(worker.reasons)) {
        return "暂无推荐依据";
      }
      return worker.reasons.slice(0, 3).join("｜");
    },
    formatRatingCount(count) {
      return count ? `${count} 次评分` : "暂无评分";
    },
    workerOptionLabel(worker) {
      const score = worker.averageRating ? `${Number(worker.averageRating).toFixed(1)}分` : "暂无评分";
      const finished = worker.completedCount || 0;
      return `${worker.name || worker.username} (${worker.username || "无账号"})｜平均 ${score}｜已处理 ${finished}`;
    },
    isDispatchable(row) {
      if (!row) {
        return false;
      }
      return row.state !== "已完成" && row.state !== "待学生确认";
    },
    defaultExpectedFinishTime() {
      const date = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    },
    async openDispatch(row) {
      if (!this.isDispatchable(row)) {
        ElMessage.warning("已完成或待学生确认的工单不能再派单");
        return;
      }
      if (!this.workers.length) {
        ElMessage.warning("暂无可选维修工人，请先维护维修人员信息");
        return;
      }
      this.dispatchTarget = { ...row };
      this.dispatchForm = {
        handler: row.handler || "",
        priority: row.priority || "普通",
        expectedFinishTime: row.expectedFinishTime || this.defaultExpectedFinishTime(),
      };
      this.dispatchRecommendations = [];
      this.dispatchPriorityRecommendation = null;
      this.dispatchDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.dispatchFormRef?.clearValidate();
      });
      await this.loadDispatchPriorityRecommendation(row, !row.priority || row.priority === "普通");
      await this.loadDispatchRecommendations(row);
    },
    async loadDispatchPriorityRecommendation(row, forceApply = false) {
      if (!row) {
        return;
      }
      this.priorityRecommending = true;
      try {
        const res = await request.post("/repair/priority/recommend", {
          title: row.title,
          content: row.content,
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "优先级推荐失败");
        }
        this.dispatchPriorityRecommendation = res.data;
        if (forceApply && res.data?.priority) {
          this.dispatchForm.priority = res.data.priority;
        }
      } catch (error) {
        if (forceApply) {
          ElMessage.warning(error.message || "优先级推荐失败");
        }
      } finally {
        this.priorityRecommending = false;
      }
    },
    async loadDispatchRecommendations(row) {
      this.recommendationLoading = true;
      try {
        const res = await request.get(`/repair/dispatch/recommend/${row.id}`);
        if (res.code !== "0") {
          throw new Error(res.msg || "智能派单推荐加载失败");
        }
        this.dispatchRecommendations = Array.isArray(res.data) ? res.data : [];
        if (!row.handler && this.dispatchRecommendations.length) {
          this.applyRecommendation(this.dispatchRecommendations[0], false);
        }
      } catch (error) {
        this.dispatchRecommendations = [];
        ElMessage.warning(error.message || "智能派单推荐加载失败");
      } finally {
        this.recommendationLoading = false;
      }
    },
    applyRecommendation(worker, showMessage = true) {
      if (!worker) {
        return;
      }
      this.dispatchForm.handler = worker.name || worker.username || "";
      if (showMessage && this.dispatchForm.handler) {
        ElMessage.success(`已选择推荐维修工：${this.dispatchForm.handler}`);
      }
    },
    async submitDispatch() {
      if (!this.dispatchTarget) {
        return;
      }
      const valid = await this.$refs.dispatchFormRef.validate().catch(() => false);
      if (!valid) {
        return;
      }
      this.dispatching = true;
      try {
        const res = await request.put(`/repair/dispatch/${this.dispatchTarget.id}`, this.dispatchForm);
        if (res.code !== "0") {
          throw new Error(res.msg || "派单失败");
        }
        ElMessage.success(this.dispatchTarget.handler ? "工单已重新派单" : "工单派单成功");
        this.dispatchDialogVisible = false;
        this.dispatchTarget = null;
        await this.load();
        await this.loadWorkers();
      } catch (error) {
        ElMessage.error(error.message || "派单失败");
      } finally {
        this.dispatching = false;
      }
    },
    hasAttachment(row) {
      return !!(row && row.attachmentFile);
    },
    getAttachmentDownloadUrl(row) {
      if (!this.hasAttachment(row)) {
        return "";
      }
      const originalName = encodeURIComponent(row.attachmentName || row.attachmentFile);
      return `/api/files/download/${encodeURIComponent(row.attachmentFile)}?originalName=${originalName}`;
    },
    getAttachmentPreviewUrl(row) {
      if (!this.hasAttachment(row)) {
        return "";
      }
      const originalName = encodeURIComponent(row.attachmentName || row.attachmentFile);
      const endpoint = this.getAttachmentPreviewType(row) === "office" ? "previewOffice" : "preview";
      return `/api/files/${endpoint}/${encodeURIComponent(row.attachmentFile)}?originalName=${originalName}`;
    },
    getAttachmentExtension(row) {
      const filename = (row && (row.attachmentName || row.attachmentFile) || "").toLowerCase();
      if (!filename.includes(".")) {
        return "";
      }
      return filename.substring(filename.lastIndexOf(".") + 1);
    },
    getAttachmentPreviewType(row) {
      const extension = this.getAttachmentExtension(row);
      if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
        return "image";
      }
      if (["pdf", "txt", "csv", "log", "json", "md"].includes(extension)) {
        return "frame";
      }
      if (["docx", "xls", "xlsx"].includes(extension)) {
        return "office";
      }
      return "unsupported";
    },
    previewAttachment(row) {
      if (!this.hasAttachment(row)) {
        return;
      }
      this.attachmentPreviewTitle = row.attachmentName || "报修附件";
      this.attachmentPreviewType = this.getAttachmentPreviewType(row);
      this.attachmentPreviewUrl = this.getAttachmentPreviewUrl(row);
      this.attachmentPreviewDownloadUrl = this.getAttachmentDownloadUrl(row);
      this.attachmentPreviewVisible = true;
    },
    hasCompletionAttachment(row) {
      return !!(row && row.completionAttachmentFile);
    },
    getCompletionAttachmentDownloadUrl(row) {
      if (!this.hasCompletionAttachment(row)) {
        return "";
      }
      const originalName = encodeURIComponent(row.completionAttachmentName || row.completionAttachmentFile);
      return `/api/files/download/${encodeURIComponent(row.completionAttachmentFile)}?originalName=${originalName}`;
    },
    getCompletionAttachmentPreviewUrl(row) {
      if (!this.hasCompletionAttachment(row)) {
        return "";
      }
      const originalName = encodeURIComponent(row.completionAttachmentName || row.completionAttachmentFile);
      return `/api/files/preview/${encodeURIComponent(row.completionAttachmentFile)}?originalName=${originalName}`;
    },
    previewCompletionAttachment(row) {
      if (!this.hasCompletionAttachment(row)) {
        return;
      }
      this.attachmentPreviewTitle = row.completionAttachmentName || "完工照片";
      this.attachmentPreviewType = "image";
      this.attachmentPreviewUrl = this.getCompletionAttachmentPreviewUrl(row);
      this.attachmentPreviewDownloadUrl = this.getCompletionAttachmentDownloadUrl(row);
      this.attachmentPreviewVisible = true;
    },
    closeAttachmentPreview() {
      this.attachmentPreviewUrl = "";
      this.attachmentPreviewDownloadUrl = "";
      this.attachmentPreviewType = "unsupported";
    },
    openDetail(row) {
      this.detailRecord = { ...row };
      this.detailDialogVisible = true;
    },
    async handleDelete(row) {
      try {
        await ElMessageBox.confirm("确定删除这条报修工单吗？删除后预约记录也会一起清理。", "提示", {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
        });
        const res = await request.delete(`/repair/delete/${row.id}`);
        if (res.code !== "0") {
          throw new Error(res.msg || "删除失败");
        }
        ElMessage.success("报修工单已删除");
        this.load();
        this.loadWorkers();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "删除失败");
      }
    },
    handleSizeChange(pageSize) {
      this.pageSize = pageSize;
      this.currentPage = 1;
      this.load();
    },
    handleCurrentChange(pageNum) {
      this.currentPage = pageNum;
      this.load();
    },
  },
};
</script>

<style scoped>
.repair-admin-page {
  gap: 18px;
}

.repair-admin-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
}

.hero-guide {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 12px;
  min-width: 420px;
}

.guide-chip {
  padding: 16px 18px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.guide-chip span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.guide-chip strong {
  display: block;
  margin-top: 8px;
  font-size: 18px;
}

.card-header,
.card-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header {
  justify-content: space-between;
}

.card-kicker {
  margin-bottom: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-header h3 {
  font-size: 18px;
  line-height: 1.4;
  letter-spacing: 0;
}

.row-actions {
  justify-content: flex-start;
  flex-wrap: nowrap;
  white-space: nowrap;
  gap: 6px;
}

.row-actions :deep(.el-button) {
  min-height: 32px;
  height: 32px;
  padding: 0 10px !important;
  border: 1px solid rgba(36, 91, 71, 0.18) !important;
  border-radius: 6px !important;
  background: rgba(36, 91, 71, 0.1) !important;
  box-shadow: none !important;
  font-weight: 600 !important;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0 !important;
}

.row-actions :deep(.el-button--primary) {
  border-color: rgba(36, 91, 71, 0.18) !important;
  background: rgba(36, 91, 71, 0.1) !important;
  color: var(--primary-strong) !important;
}

.row-actions :deep(.el-button--warning) {
  border-color: rgba(217, 119, 6, 0.18) !important;
  background: rgba(217, 119, 6, 0.1) !important;
  color: var(--warning-color) !important;
}

.row-actions :deep(.el-button--danger) {
  border-color: rgba(185, 28, 28, 0.16) !important;
  background: rgba(185, 28, 28, 0.08) !important;
  color: var(--danger-color) !important;
}

.row-actions :deep(.el-button:hover) {
  background: rgba(36, 91, 71, 0.16) !important;
}

.row-actions :deep(.el-button--warning:hover) {
  background: rgba(217, 119, 6, 0.16) !important;
}

.row-actions :deep(.el-button--danger:hover) {
  background: rgba(185, 28, 28, 0.14) !important;
}

.row-actions :deep(.el-button.is-disabled),
.row-actions :deep(.el-button.is-disabled:hover) {
  border-color: rgba(120, 130, 123, 0.16) !important;
  background: rgba(120, 130, 123, 0.08) !important;
  color: var(--text-color-muted) !important;
}

.pager-shell {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-head strong {
  font-size: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  color: var(--text-color-secondary);
}

.detail-block {
  padding: 16px 18px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
}

.detail-label {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-block p {
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.evaluation-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dispatch-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dispatch-target {
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
}

.dispatch-target strong,
.dispatch-target span {
  display: block;
}

.dispatch-target strong {
  color: var(--text-color);
  font-size: 17px;
}

.dispatch-target span {
  margin-top: 6px;
  color: var(--text-color-muted);
  font-size: 13px;
}

.dispatch-priority-field {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 10px;
}

.dispatch-priority-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.dispatch-priority-recommendation {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid rgba(36, 91, 71, 0.14);
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.dispatch-recommendation {
  min-height: 154px;
  padding: 14px 16px;
  border: 1px solid rgba(36, 91, 71, 0.14);
  border-radius: 8px;
  background: var(--primary-soft);
}

.dispatch-recommendation__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.dispatch-recommendation__header span {
  display: block;
  margin-bottom: 4px;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 600;
}

.dispatch-recommendation__header strong {
  color: var(--primary-color);
  font-size: 18px;
}

.recommendation-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.recommendation-card {
  display: flex;
  min-height: 126px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
  color: var(--text-color);
  cursor: pointer;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.recommendation-card:hover {
  border-color: rgba(36, 91, 71, 0.36);
  box-shadow: none;
}

.recommendation-card.is-best {
  border-color: rgba(217, 119, 6, 0.34);
}

.recommendation-card.is-active {
  border-color: rgba(36, 91, 71, 0.64);
  box-shadow: 0 0 0 2px rgba(36, 91, 71, 0.14);
}

.recommendation-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.recommendation-card__top strong {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommendation-score {
  color: var(--primary-color);
  font-size: 24px;
  font-weight: 650;
  line-height: 1;
}

.recommendation-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recommendation-metrics span {
  padding: 3px 6px;
  border-radius: 6px;
  background: rgba(36, 91, 71, 0.08);
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 700;
}

.recommendation-card p {
  margin: 0;
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.45;
}

.worker-table-panel {
  margin: 0 0 18px;
  padding: 18px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.worker-table-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.worker-table-panel__header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.worker-table-panel__header .worker-count {
  color: var(--text-color-muted);
  font-size: 13px;
}

.worker-table-panel__tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.worker-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.worker-score-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.worker-score-cell strong {
  min-width: 36px;
  color: var(--primary-color);
  font-size: 18px;
}

.attachment-preview {
  min-height: 520px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
}

.attachment-preview__image {
  display: block;
  max-width: 100%;
  max-height: 72vh;
  margin: 0 auto;
  object-fit: contain;
}

.attachment-preview__frame {
  display: block;
  width: 100%;
  height: 68vh;
  border: 0;
}

.attachment-preview__empty {
  display: flex;
  min-height: 520px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: var(--text-color-muted);
}

@media (max-width: 1200px) {
  .repair-admin-hero {
    flex-direction: column;
  }

  .hero-guide {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .repair-admin-hero {
    padding: 20px;
  }

  .hero-guide,
  .detail-grid,
  .recommendation-list,
  .dispatch-priority-control,
  .worker-form-grid {
    grid-template-columns: 1fr;
  }

  .card-header,
  .card-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
