<template>
  <!-- LOCATE: 维修工作台页面，维修人员接单预约完工 -->
  <div class="page-shell repair-worker-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 16px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>维修工作台</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card worker-hero">
      <div class="worker-hero__content">
        <div class="page-eyebrow">Repair Workflow</div>
        <h1 class="page-title">维修工作台</h1>
        <p class="page-subtitle">
          工人端现在只展示待认领工单和已分派给当前工人的工单。管理员负责派单，工人负责接单、预约和完工，学生只负责跟踪与评价。
        </p>
        <div class="worker-steps">
          <span>接单</span>
          <span>预约上门</span>
          <span>完工拍照</span>
        </div>
      </div>

      <div class="worker-metrics">
        <div class="metric-card">
          <span>当前工人</span>
          <strong>{{ currentWorkerName }}</strong>
        </div>
        <div class="metric-card">
          <span>待认领 / 待接单</span>
          <strong>{{ workerSummary.pendingCount }}</strong>
        </div>
        <div class="metric-card">
          <span>我的处理中</span>
          <strong>{{ workerSummary.processingCount }}</strong>
        </div>
        <div class="metric-card">
          <span>我的已预约</span>
          <strong>{{ workerSummary.appointedCount }}</strong>
        </div>
        <div class="metric-card">
          <span>待学生确认</span>
          <strong>{{ workerSummary.waitConfirmCount }}</strong>
        </div>
        <div class="metric-card">
          <span>我的平均评分</span>
          <strong>{{ currentWorkerAverageRating }}</strong>
          <small>{{ currentWorkerRatingCount ? `${currentWorkerRatingCount} 次评分` : "暂无评分" }}</small>
        </div>
      </div>
    </section>

    <section class="worker-layout">
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">My Work Orders</div>
              <h3>待处理工单</h3>
            </div>
            <el-button plain @click="loadAll">刷新</el-button>
          </div>
        </template>

        <el-table v-if="loading || activeWorkerRepairs.length" v-loading="loading" :data="activeWorkerRepairs" border style="width: 100%">
          <el-table-column prop="title" label="标题" min-width="160" />
          <el-table-column label="宿舍" width="120">
            <template #default="scope">
              {{ scope.row.dormBuildId }}-{{ scope.row.dormRoomId }}
            </template>
          </el-table-column>
          <el-table-column prop="repairer" label="报修人" width="120" />
          <el-table-column label="附件" width="110">
            <template #default="scope">
              <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
                预览
              </el-link>
              <span v-else>-</span>
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
          <el-table-column label="当前归属" min-width="120">
            <template #default="scope">
              {{ scope.row.handler || "待认领" }}
            </template>
          </el-table-column>
          <el-table-column prop="appointmentTime" label="预约时间" min-width="170" />
          <el-table-column prop="expectedFinishTime" label="预计完工" min-width="170" />
          <el-table-column label="学生评分" width="180">
            <template #default="scope">
              <el-rate
                v-if="scope.row.rating"
                :model-value="scope.row.rating"
                disabled
                show-score
                score-template="{value} 分"
              />
              <span v-else-if="scope.row.state === '待学生确认'">待学生确认</span>
              <span v-else-if="scope.row.state === '已完成'">待评分</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="scope">
              <div class="row-actions">
                <span v-if="scope.row.state === '待学生确认'" class="waiting-text">等待学生确认</span>
                <template v-else>
                  <el-button type="primary" size="small" @click="openAccept(scope.row)" :disabled="!canAccept(scope.row)">
                    接单
                  </el-button>
                  <el-button type="warning" size="small" @click="openAppointment(scope.row)" :disabled="!canSchedule(scope.row)">
                    预约
                  </el-button>
                  <el-button type="success" size="small" @click="openComplete(scope.row)" :disabled="!canComplete(scope.row)">
                    完工
                  </el-button>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-else class="workbench-empty">
          <strong>当前没有需要处理的工单</strong>
          <span>新的派单或预约会出现在这里；已完成任务可以在下方历史区域查看。</span>
          <el-button plain @click="loadAll">刷新一下</el-button>
        </div>
      </el-card>
    </section>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-kicker">Completed Orders</div>
            <h3>已处理工单</h3>
          </div>
          <el-tag type="success" effect="light">共 {{ completedWorkerRepairs.length }} 条</el-tag>
        </div>
      </template>

      <el-table v-loading="loading" :data="completedWorkerRepairs" border style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
        <el-table-column label="宿舍" width="120">
          <template #default="scope">
            {{ scope.row.dormBuildId }}-{{ scope.row.dormRoomId }}
          </template>
        </el-table-column>
        <el-table-column prop="repairer" label="报修人" width="120" />
        <el-table-column label="处理工人" width="120">
          <template #default="scope">
            {{ scope.row.handler || currentWorkerName }}
          </template>
        </el-table-column>
        <el-table-column label="附件" width="110">
          <template #default="scope">
            <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
              预览
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="完工照片" width="110">
          <template #default="scope">
            <el-link v-if="hasCompletionAttachment(scope.row)" type="primary" @click.prevent="previewCompletionAttachment(scope.row)">
              预览
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="报修等级" width="100">
          <template #default="scope">
            <el-tag :type="priorityTagType(scope.row.priority)">{{ scope.row.priority || "普通" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderFinishTime" label="完工时间" min-width="170" />
        <el-table-column label="学生评分" width="180">
          <template #default="scope">
            <el-rate
              v-if="scope.row.rating"
              :model-value="scope.row.rating"
              disabled
              show-score
              score-template="{value} 分"
            />
            <span v-else>待评分</span>
          </template>
        </el-table-column>
        <el-table-column label="评价意见" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            {{ evaluationText(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="完工说明" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.completionNote || "未填写完工说明" }}
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !completedWorkerRepairs.length" description="当前还没有已完成的维修工单" />
    </el-card>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <div class="card-kicker">My Appointments</div>
            <h3>我的预约记录</h3>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="workerAppointments" border style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column label="宿舍" width="120">
          <template #default="scope">
            {{ scope.row.dormBuildId }}-{{ scope.row.dormRoomId }}
          </template>
        </el-table-column>
        <el-table-column prop="appointmentTime" label="预约时间" min-width="170" />
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <div class="row-actions">
              <el-button type="primary" size="small" @click="openAppointmentByRecord(scope.row)" :disabled="scope.row.status === '已完成'">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteAppointment(scope.row)" :disabled="scope.row.status === '已完成'">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !workerAppointments.length" description="当前没有属于你的预约记录" />
    </el-card>

    <el-dialog v-model="acceptDialogVisible" title="接单" width="420px">
      <el-form label-width="96px">
        <el-form-item label="处理人">
          <el-input v-model="acceptForm.handler" disabled />
        </el-form-item>
        <el-form-item label="报修等级">
          <el-input v-model="acceptForm.priority" disabled />
        </el-form-item>
        <el-form-item label="预计完工">
          <el-date-picker
            v-model="acceptForm.expectedFinishTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAccept">确认接单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="appointmentDialogVisible" title="预约上门" width="520px">
      <el-form ref="appointmentFormRef" :model="appointmentForm" :rules="appointmentRules" label-width="96px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="appointmentForm.title" />
        </el-form-item>
        <el-form-item label="楼宇号" prop="dormBuildId">
          <el-input v-model.number="appointmentForm.dormBuildId" />
        </el-form-item>
        <el-form-item label="房间号" prop="dormRoomId">
          <el-input v-model.number="appointmentForm.dormRoomId" />
        </el-form-item>
        <el-form-item label="预约时间" prop="appointmentTime">
          <el-date-picker
            v-model="appointmentForm.appointmentTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="维修内容" prop="content">
          <el-input v-model="appointmentForm.content" type="textarea" rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appointmentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAppointment">
          {{ appointmentForm.id ? "保存预约" : "提交预约" }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完工" width="520px">
      <el-form label-width="96px">
        <el-form-item label="完工时间">
          <el-date-picker
            v-model="completeForm.orderFinishTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="完工说明">
          <el-input v-model="completeForm.completionNote" type="textarea" rows="4" placeholder="请说明维修结果和处理情况" />
        </el-form-item>
        <el-form-item label="完工照片" required>
          <el-upload
            class="completion-upload"
            action="/api/files/uploadCompletionAttachment"
            accept="image/*"
            :limit="1"
            :file-list="completionAttachmentFileList"
            :before-upload="beforeCompletionAttachmentUpload"
            :on-success="handleCompletionAttachmentSuccess"
            :on-remove="handleCompletionAttachmentRemove"
            :on-exceed="handleCompletionAttachmentExceed"
          >
            <el-button>上传照片</el-button>
            <template #tip>
              <div class="upload-tip">请上传维修完成后的现场照片，支持 JPG、PNG、GIF、WEBP，单张不超过 10MB。</div>
            </template>
          </el-upload>
          <el-button v-if="completeForm.completionAttachmentFile" type="primary" text @click="previewCompletionAttachment(completeForm)">
            预览照片
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!completeForm.completionAttachmentFile"
          @click="submitComplete"
        >
          确认完工
        </el-button>
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

const createAcceptForm = (handler = "") => ({
  repairId: null,
  handler,
  priority: "普通",
  expectedFinishTime: "",
});

const createAppointmentForm = () => ({
  id: null,
  repairId: null,
  title: "",
  dormBuildId: null,
  dormRoomId: null,
  appointmentTime: "",
  content: "",
  status: "已预约",
});

const createCompleteForm = (handler = "") => ({
  repairId: null,
  handler,
  completionNote: "",
  completionAttachmentName: "",
  completionAttachmentFile: "",
  orderFinishTime: "",
});

const createWorkbenchSummary = () => ({
  totalCount: 0,
  pendingCount: 0,
  processingCount: 0,
  appointedCount: 0,
  waitConfirmCount: 0,
  returnedCount: 0,
  overdueCount: 0,
  completedCount: 0,
});

export default {
  name: "RepairAppointment",
  data() {
    return {
      loading: false,
      submitting: false,
      repairRecords: [],
      appointmentRecords: [],
      workbenchSummary: createWorkbenchSummary(),
      acceptDialogVisible: false,
      appointmentDialogVisible: false,
      completeDialogVisible: false,
      attachmentPreviewVisible: false,
      completionAttachmentFileList: [],
      acceptForm: createAcceptForm(),
      appointmentForm: createAppointmentForm(),
      completeForm: createCompleteForm(),
      attachmentPreviewTitle: "",
      attachmentPreviewUrl: "",
      attachmentPreviewDownloadUrl: "",
      attachmentPreviewType: "unsupported",
      appointmentRules: {
        title: [{ required: true, message: "请输入标题", trigger: "blur" }],
        dormBuildId: [{ required: true, message: "请输入楼宇号", trigger: "blur" }],
        dormRoomId: [{ required: true, message: "请输入房间号", trigger: "blur" }],
        appointmentTime: [{ required: true, message: "请选择预约时间", trigger: "change" }],
        content: [{ required: true, message: "请输入维修内容", trigger: "blur" }],
      },
    };
  },
  computed: {
    currentWorkerName() {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        return user.name || user.username || "维修人员";
      } catch (error) {
        return "维修人员";
      }
    },
    workerRepairs() {
      return this.repairRecords.filter((item) => !item.handler || item.handler === this.currentWorkerName);
    },
    activeWorkerRepairs() {
      return this.workerRepairs.filter((item) => item.state !== "已完成");
    },
    completedWorkerRepairs() {
      return this.repairRecords.filter((item) => item.state === "已完成" && item.handler === this.currentWorkerName);
    },
    ratedCompletedWorkerRepairs() {
      return this.completedWorkerRepairs.filter((item) => Number(item.rating) > 0);
    },
    currentWorkerRatingCount() {
      return this.ratedCompletedWorkerRepairs.length;
    },
    currentWorkerAverageRating() {
      if (!this.currentWorkerRatingCount) {
        return "暂无";
      }
      const total = this.ratedCompletedWorkerRepairs.reduce((sum, item) => sum + Number(item.rating || 0), 0);
      return (total / this.currentWorkerRatingCount).toFixed(1);
    },
    workerAppointments() {
      return this.appointmentRecords.filter((item) => this.isActiveWorkerAppointment(item));
    },
    workerSummary() {
      return Object.assign(createWorkbenchSummary(), this.workbenchSummary || {});
    },
  },
  created() {
    this.acceptForm = createAcceptForm(this.currentWorkerName);
    this.completeForm = createCompleteForm(this.currentWorkerName);
    this.loadAll();
  },
  methods: {
    async loadAll() {
      this.loading = true;
      try {
        await Promise.all([this.loadRepairs(), this.loadAppointments(), this.loadWorkbenchSummary()]);
      } catch (error) {
        ElMessage.error(error.message || "维修工作台加载失败");
      } finally {
        this.loading = false;
      }
    },
    async loadRepairs() {
      const res = await request.get("/repair/find", {
        params: {
          pageNum: 1,
          pageSize: 200,
          search: "",
        },
      });
      if (res.code !== "0") {
        throw new Error(res.msg || "维修工单加载失败");
      }
      this.repairRecords = res.data?.records || [];
    },
    async loadAppointments() {
      const res = await request.get("/repair/appointment/list");
      if (res.code !== "0") {
        throw new Error(res.msg || "预约记录加载失败");
      }
      this.appointmentRecords = Array.isArray(res.data) ? res.data : [];
    },
    async loadWorkbenchSummary() {
      const res = await request.get("/repair/workbenchSummary");
      if (res.code !== "0") {
        throw new Error(res.msg || "维修统计加载失败");
      }
      this.workbenchSummary = Object.assign(createWorkbenchSummary(), res.data || {});
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
    evaluationText(row) {
      if (row?.evaluationOpinion) {
        return row.evaluationOpinion;
      }
      if (row?.rating) {
        return "已评分，暂无文字评价";
      }
      return "待学生评价";
    },
    canAccept(row) {
      if (!row || row.state === "已完成" || row.state === "待学生确认") {
        return false;
      }
      if (row.handler === this.currentWorkerName) {
        return row.state === "已派单";
      }
      return !row.handler && (row.state === "待受理" || row.state === "已派单" || row.state === "处理中");
    },
    canSchedule(row) {
      if (!row || row.state === "已完成" || row.state === "待学生确认") {
        return false;
      }
      return row.handler === this.currentWorkerName && (row.state === "处理中" || row.state === "已预约");
    },
    canComplete(row) {
      if (!row || row.state === "已完成" || row.state === "待学生确认") {
        return false;
      }
      return row.handler === this.currentWorkerName && (row.state === "处理中" || row.state === "已预约");
    },
    belongsToCurrentWorkerAppointment(record) {
      return !!this.findWorkerRepairByAppointment(record);
    },
    findWorkerRepairByAppointment(record) {
      if (!record) {
        return null;
      }
      return this.workerRepairs.find((item) => item.id === record.repairId) || this.workerRepairs.find((item) =>
        item.title === record.title &&
        item.dormBuildId === record.dormBuildId &&
        item.dormRoomId === record.dormRoomId
      ) || null;
    },
    isActiveWorkerAppointment(record) {
      const repair = this.findWorkerRepairByAppointment(record);
      return !!repair && repair.state !== "已完成" && repair.state !== "待学生确认" && record.status !== "已完成";
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
    createCompletionAttachmentFileList(row) {
      if (!this.hasCompletionAttachment(row)) {
        return [];
      }
      return [{
        name: row.completionAttachmentName || row.completionAttachmentFile,
        url: this.getCompletionAttachmentPreviewUrl(row),
      }];
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
    beforeCompletionAttachmentUpload(file) {
      const isImage = file.type && file.type.startsWith("image/");
      if (!isImage) {
        ElMessage.error("完工照片请上传图片文件");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        ElMessage.error("图片大小不能超过 10MB");
        return false;
      }
      return true;
    },
    handleCompletionAttachmentSuccess(res) {
      if (res.code === "0" && res.data) {
        this.completeForm.completionAttachmentName = res.data.attachmentName;
        this.completeForm.completionAttachmentFile = res.data.attachmentFile;
        this.completionAttachmentFileList = this.createCompletionAttachmentFileList(this.completeForm);
        ElMessage.success("完工照片上传成功");
      } else {
        this.handleCompletionAttachmentRemove();
        ElMessage.error(res.msg || "完工照片上传失败");
      }
    },
    handleCompletionAttachmentRemove() {
      this.completeForm.completionAttachmentName = "";
      this.completeForm.completionAttachmentFile = "";
      this.completionAttachmentFileList = [];
    },
    handleCompletionAttachmentExceed() {
      ElMessage.warning("每个工单只能上传 1 张完工照片，如需更换请先移除原照片");
    },
    openAccept(row) {
      if (!this.canAccept(row)) {
        ElMessage.warning("当前工单不属于你，无法接单");
        return;
      }
      this.acceptForm = {
        repairId: row.id,
        handler: this.currentWorkerName,
        priority: row.priority || "普通",
        expectedFinishTime: row.expectedFinishTime || "",
      };
      this.acceptDialogVisible = true;
    },
    async submitAccept() {
      this.submitting = true;
      try {
        const res = await request.put(`/repair/accept/${this.acceptForm.repairId}`, this.acceptForm);
        if (res.code !== "0") {
          throw new Error(res.msg || "接单失败");
        }
        ElMessage.success("接单成功");
        this.acceptDialogVisible = false;
        await this.loadAll();
      } catch (error) {
        ElMessage.error(error.message || "接单失败");
      } finally {
        this.submitting = false;
      }
    },
    openAppointment(row) {
      if (!this.canSchedule(row)) {
        ElMessage.warning("请先接单，再为属于你的工单预约上门");
        return;
      }
      const currentAppointment = this.findAppointmentByRepair(row.id);
      this.appointmentForm = Object.assign(createAppointmentForm(), currentAppointment || {}, {
        repairId: row.id,
        title: row.title,
        dormBuildId: row.dormBuildId,
        dormRoomId: row.dormRoomId,
        content: currentAppointment?.content || row.content || "",
        status: "已预约",
      });
      this.appointmentDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.appointmentFormRef?.clearValidate();
      });
    },
    openAppointmentByRecord(record) {
      if (!this.belongsToCurrentWorkerAppointment(record)) {
        ElMessage.warning("这条预约记录不属于你");
        return;
      }
      this.appointmentForm = Object.assign(createAppointmentForm(), record, {
        status: record.status || "已预约",
      });
      this.appointmentDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.appointmentFormRef?.clearValidate();
      });
    },
    async submitAppointment() {
      const valid = await this.$refs.appointmentFormRef.validate().catch(() => false);
      if (!valid) {
        return;
      }
      this.submitting = true;
      try {
        const payload = {
          ...this.appointmentForm,
          status: "已预约",
        };
        const res = this.appointmentForm.id
          ? await request.put("/repair/appointment/update", payload)
          : await request.post("/repair/appointment/add", payload);
        if (res.code !== "0") {
          throw new Error(res.msg || "预约提交失败");
        }
        ElMessage.success(this.appointmentForm.id ? "预约已更新" : "预约成功");
        this.appointmentDialogVisible = false;
        this.appointmentForm = createAppointmentForm();
        await this.loadAll();
      } catch (error) {
        ElMessage.error(error.message || "预约提交失败");
      } finally {
        this.submitting = false;
      }
    },
    openComplete(row) {
      if (!this.canComplete(row)) {
        ElMessage.warning("只有属于你的处理中或已预约工单才能完工");
        return;
      }
      this.completeForm = {
        repairId: row.id,
        handler: this.currentWorkerName,
        completionNote: row.completionNote || "",
        completionAttachmentName: row.completionAttachmentName || "",
        completionAttachmentFile: row.completionAttachmentFile || "",
        orderFinishTime: this.nowString(),
      };
      this.completionAttachmentFileList = this.createCompletionAttachmentFileList(this.completeForm);
      this.completeDialogVisible = true;
    },
    async submitComplete() {
      if (!this.completeForm.completionAttachmentFile) {
        ElMessage.warning("请先上传完工照片，再确认完工");
        return;
      }
      this.submitting = true;
      try {
        const res = await request.put(`/repair/complete/${this.completeForm.repairId}`, this.completeForm);
        if (res.code !== "0") {
          throw new Error(res.msg || "完工失败");
        }
        ElMessage.success("已提交完工，等待学生确认");
        this.completeDialogVisible = false;
        this.completeForm = createCompleteForm(this.currentWorkerName);
        this.completionAttachmentFileList = [];
        await this.loadAll();
      } catch (error) {
        ElMessage.error(error.message || "完工失败");
      } finally {
        this.submitting = false;
      }
    },
    async handleDeleteAppointment(row) {
      try {
        await ElMessageBox.confirm("确定删除这条预约记录吗？删除后工单会回到接单后的状态。", "提示", {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
        });
        const res = await request.delete(`/repair/appointment/delete/${row.id}`);
        if (res.code !== "0") {
          throw new Error(res.msg || "删除预约失败");
        }
        ElMessage.success("预约记录已删除");
        await this.loadAll();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "删除预约失败");
      }
    },
    findAppointmentByRepair(repairId) {
      return this.workerAppointments.find((item) => item.repairId === repairId) || null;
    },
    nowString() {
      const date = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
  },
};
</script>

<style scoped>
.repair-worker-page {
  gap: 18px;
}

.worker-hero {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(0, 1.05fr);
  align-items: start;
  gap: 22px;
  padding: 24px 28px;
}

.worker-hero__content {
  min-width: 0;
}

.worker-hero__content .page-subtitle {
  max-width: 680px;
  margin-top: 12px;
}

.worker-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.worker-steps span {
  min-height: 30px;
  padding: 6px 10px;
  border: 1px solid rgba(36, 91, 71, 0.18);
  border-radius: 6px;
  background: rgba(36, 91, 71, 0.08);
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 600;
}

.worker-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 10px;
  min-width: 0;
}

.metric-card {
  min-height: 86px;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.metric-card span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin-top: 7px;
  font-size: 22px;
}

.metric-card small {
  display: block;
  margin-top: 4px;
  color: var(--text-color-muted);
  font-size: 12px;
}

.worker-layout {
  display: block;
}

.workbench-empty {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 22px;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
  color: var(--text-color-muted);
  text-align: center;
}

.workbench-empty strong {
  color: var(--text-color);
  font-size: 16px;
}

.workbench-empty span {
  max-width: 520px;
  line-height: 1.6;
}

.card-header,
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
  gap: 6px;
  white-space: nowrap;
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

.row-actions :deep(.el-button--success) {
  border-color: rgba(53, 118, 82, 0.18) !important;
  background: rgba(53, 118, 82, 0.1) !important;
  color: var(--success-color) !important;
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

.row-actions :deep(.el-button--success:hover) {
  background: rgba(53, 118, 82, 0.16) !important;
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

.waiting-text {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: 6px;
  background: rgba(217, 119, 6, 0.08);
  color: var(--warning-color);
  font-size: 12px;
  font-weight: 600;
}

.completion-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.5;
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
  .worker-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .worker-hero {
    grid-template-columns: 1fr;
  }

  .worker-metrics {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .worker-hero {
    padding: 20px;
  }

  .worker-metrics {
    grid-template-columns: 1fr;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
