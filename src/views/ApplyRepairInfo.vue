<template>
  <!-- LOCATE: 学生报修申请页面，提交报修和跟踪记录 -->
  <div class="page-shell repair-student-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 16px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>报修申请</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card repair-student-hero">
      <div>
        <div class="page-eyebrow">Repair Request</div>
        <h1 class="page-title">报修申请</h1>
        <p class="page-subtitle">
          学生端负责提报、查看进度，并在工人提交完工后确认结果；确认完成后再进行维修评价。
        </p>
      </div>

      <div class="hero-tags">
        <div class="hero-tag">
          <span>当前学生</span>
          <strong>{{ studentName || "-" }}</strong>
        </div>
        <div class="hero-tag">
          <span>宿舍位置</span>
          <strong>{{ dormText }}</strong>
        </div>
      </div>
    </section>

    <section class="repair-student-layout">
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Request Form</div>
              <h3>{{ isEditing ? "修改报修申请" : "提交新报修" }}</h3>
            </div>
            <el-tag :type="isEditing ? 'warning' : 'success'" effect="dark">
              {{ isEditing ? "编辑中" : "新申请" }}
            </el-tag>
          </div>
        </template>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="98px" class="repair-form">
          <el-form-item label="楼宇号">
            <el-input v-model="form.dormBuildId" disabled />
          </el-form-item>
          <el-form-item label="房间号">
            <el-input v-model="form.dormRoomId" disabled />
          </el-form-item>
          <el-form-item label="报修标题" prop="title">
            <el-input
              v-model.trim="form.title"
              maxlength="40"
              show-word-limit
              placeholder="例如：宿舍门锁松动"
              @blur="recommendPriority(false)"
            />
          </el-form-item>
          <el-form-item label="系统初判">
            <div class="priority-field">
              <div class="priority-control">
                <div class="priority-auto-result">
                  <el-tag :type="priorityTagType(form.priority)" effect="light">
                    {{ form.priority || "待判断" }}
                  </el-tag>
                  <span>由系统根据标题和内容自动判断，管理员派单时可最终调整。</span>
                </div>
                <el-button :loading="priorityRecommending" @click="recommendPriority(true)">重新判断</el-button>
              </div>
              <div v-if="priorityRecommendation" class="priority-recommendation">
                <el-tag :type="priorityTagType(priorityRecommendation.priority)" size="small">
                  建议 {{ priorityRecommendation.priority }}
                </el-tag>
                <span>{{ priorityRecommendation.reason }}</span>
              </div>
              <div v-else class="priority-recommendation priority-recommendation--muted">
                填写报修标题和内容后，系统会自动给出优先级建议。
              </div>
            </div>
          </el-form-item>
          <el-form-item label="报修内容" prop="content">
            <el-input
              v-model.trim="form.content"
              type="textarea"
              :autosize="{ minRows: 4, maxRows: 8 }"
              placeholder="请描述故障位置、现象和影响，方便管理员与工人快速判断"
              @blur="recommendPriority(false)"
            />
          </el-form-item>
          <el-form-item label="故障图片">
            <el-upload
              class="repair-upload"
              action="/api/files/uploadRepairAttachment"
              accept="image/*"
              :limit="1"
              :file-list="attachmentFileList"
              :before-upload="beforeRepairAttachmentUpload"
              :on-success="handleAttachmentSuccess"
              :on-remove="handleAttachmentRemove"
              :on-exceed="handleAttachmentExceed"
            >
              <el-button>上传图片</el-button>
              <template #tip>
                <div class="upload-tip">支持 JPG、PNG、GIF、WEBP，单张不超过 10MB。</div>
              </template>
            </el-upload>
            <el-button v-if="form.attachmentFile" type="primary" text @click="previewAttachment(form)">
              预览图片
            </el-button>
          </el-form-item>
          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" :loading="submitting" @click="submitRepair">
                {{ isEditing ? "保存修改" : "提交报修" }}
              </el-button>
              <el-button @click="resetForm">{{ isEditing ? "取消编辑" : "重置" }}</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">My Tickets</div>
              <h3>我的报修记录</h3>
            </div>
            <div class="card-actions">
              <el-input
                v-model="search"
                clearable
                placeholder="搜索标题"
                style="width: 180px"
                @keyup.enter="load"
                @clear="load"
              />
              <el-button type="primary" plain @click="load">刷新</el-button>
            </div>
          </div>
        </template>

        <el-table v-loading="loading" :data="tableData" border style="width: 100%">
          <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="110">
            <template #default="scope">
              <el-tag :type="stateTagType(scope.row.state)">{{ scope.row.state }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="报修等级" width="100">
            <template #default="scope">
              <el-tag :type="priorityTagType(scope.row.priority)">{{ scope.row.priority || "普通" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handler" label="处理人" width="120" />
          <el-table-column label="附件" width="110">
            <template #default="scope">
              <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
                预览
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="appointmentTime" label="预约时间" min-width="170" />
          <el-table-column prop="expectedFinishTime" label="预计完工" min-width="170" />
          <el-table-column prop="orderBuildTime" label="提交时间" min-width="170" />
          <el-table-column label="评价" min-width="220">
            <template #default="scope">
              <div v-if="isCompleted(scope.row)" class="rating-cell">
                <el-rate
                  v-if="scope.row.rating"
                  :model-value="scope.row.rating"
                  :max="5"
                  disabled
                  show-score
                  score-template="{value} 分"
                />
                <el-button v-if="scope.row.rating && scope.row.evaluationOpinion" type="primary" text @click="openEvaluation(scope.row)">
                  查看评价
                </el-button>
                <el-button v-else-if="scope.row.rating" type="primary" text @click="openEvaluation(scope.row)">
                  补写评价
                </el-button>
                <el-button v-else type="primary" plain size="small" @click="openEvaluation(scope.row)">
                  填写评价
                </el-button>
              </div>
              <div v-else-if="isWaitingConfirm(scope.row)" class="confirm-cell">
                <span>待确认完工</span>
                <el-button type="primary" text @click="openDetail(scope.row)">查看照片</el-button>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="scope">
              <div class="row-actions">
                <el-button type="primary" text @click="openDetail(scope.row)">查看</el-button>
                <template v-if="isWaitingConfirm(scope.row)">
                  <el-button type="success" text @click="confirmCompletion(scope.row)">确认完成</el-button>
                  <el-button type="warning" text @click="rejectCompletion(scope.row)">仍有问题</el-button>
                </template>
                <el-button type="primary" text :disabled="!isEditable(scope.row)" @click="handleEdit(scope.row)">
                  编辑
                </el-button>
                <el-button type="danger" text :disabled="!isEditable(scope.row)" @click="handleDelete(scope.row)">
                  删除
                </el-button>
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
    </section>

    <el-dialog v-model="detailDialogVisible" title="报修详情" width="640px">
      <div v-if="detailRecord" class="detail-stack">
        <div class="detail-head">
          <strong>{{ detailRecord.title }}</strong>
          <el-tag :type="stateTagType(detailRecord.state)">{{ detailRecord.state }}</el-tag>
        </div>
        <div class="detail-grid">
          <span>楼宇号：{{ detailRecord.dormBuildId }}</span>
          <span>房间号：{{ detailRecord.dormRoomId }}</span>
          <span>处理人：{{ detailRecord.handler || "待分派" }}</span>
          <span>报修等级：{{ detailRecord.priority || "普通" }}</span>
          <span>预约时间：{{ detailRecord.appointmentTime || "-" }}</span>
          <span>预计完工：{{ detailRecord.expectedFinishTime || "-" }}</span>
          <span>提交时间：{{ detailRecord.orderBuildTime || "-" }}</span>
          <span>完工提交：{{ detailRecord.completionSubmitTime || "-" }}</span>
          <span>学生确认：{{ detailRecord.studentConfirmTime || "-" }}</span>
          <span>完成时间：{{ detailRecord.orderFinishTime || "-" }}</span>
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
        <div v-if="detailRecord.studentFeedback" class="detail-block">
          <div class="detail-label">上次反馈</div>
          <p>{{ detailRecord.studentFeedback }}</p>
        </div>
        <div v-if="isCompleted(detailRecord) || isWaitingConfirm(detailRecord)" class="detail-block">
          <div class="detail-label">完工照片</div>
          <el-link v-if="hasCompletionAttachment(detailRecord)" type="primary" @click.prevent="previewCompletionAttachment(detailRecord)">
            {{ detailRecord.completionAttachmentName || "预览完工照片" }}
          </el-link>
          <p v-else>工人暂未上传完工照片</p>
        </div>
        <div v-if="isWaitingConfirm(detailRecord)" class="detail-block confirm-panel">
          <div class="detail-label">完工确认</div>
          <p>请查看完工说明和现场照片。如果维修结果没问题，可以确认完成；如果仍有故障，请写明问题退回给维修人员。</p>
          <div class="form-actions">
            <el-button type="success" :loading="submitting" @click="confirmCompletion(detailRecord)">确认完成</el-button>
            <el-button type="warning" :loading="submitting" @click="rejectCompletion(detailRecord)">仍有问题</el-button>
          </div>
        </div>
        <div v-if="isCompleted(detailRecord)" class="detail-block">
          <div class="detail-label">我的评价</div>
          <div v-if="detailRecord.rating" class="evaluation-readonly">
            <el-rate :model-value="detailRecord.rating" disabled show-score score-template="{value} 分" />
            <p>{{ detailRecord.evaluationOpinion || "暂无评价意见" }}</p>
            <small>评价时间：{{ detailRecord.evaluationTime || "-" }}</small>
          </div>
          <p v-else>维修已完成，待填写评价意见。</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailDialogVisible = false">关闭</el-button>
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

    <el-dialog v-model="evaluationDialogVisible" :title="evaluationReadOnly ? '查看维修评价' : '填写维修评价'" width="560px">
      <div class="evaluation-dialog-body">
        <div class="evaluation-target">
          <strong>{{ evaluationTarget?.title || "维修工单" }}</strong>
          <span>{{ evaluationTarget?.dormBuildId }}-{{ evaluationTarget?.dormRoomId }}｜{{ evaluationTarget?.handler || "维修人员" }}</span>
        </div>
        <el-form label-width="90px">
          <el-form-item label="维修评分">
            <el-rate
              v-model="evaluationForm.rating"
              :max="5"
              :disabled="evaluationReadOnly"
              show-score
              score-template="{value} 分"
            />
          </el-form-item>
          <el-form-item label="评价意见">
            <el-input
              v-model.trim="evaluationForm.evaluationOpinion"
              type="textarea"
              :rows="5"
              maxlength="500"
              show-word-limit
              :disabled="evaluationReadOnly"
              placeholder="请写下维修质量、响应速度、服务态度等评价意见"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="evaluationDialogVisible = false">关闭</el-button>
        <el-button v-if="!evaluationReadOnly" type="primary" :loading="submitting" @click="submitEvaluation">
          提交评价
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage, ElMessageBox } from "element-plus";

const createDefaultForm = () => ({
  id: null,
  title: "",
  content: "",
  dormBuildId: "",
  dormRoomId: "",
  repairer: "",
  orderBuildTime: "",
  priority: "普通",
  attachmentName: "",
  attachmentFile: "",
});

export default {
  name: "ApplyRepairInfo",
  data() {
    return {
      form: createDefaultForm(),
      formRef: null,
      loading: false,
      submitting: false,
      priorityRecommending: false,
      dialogVisible: false,
      detailDialogVisible: false,
      evaluationDialogVisible: false,
      attachmentPreviewVisible: false,
      evaluationReadOnly: false,
      detailRecord: null,
      evaluationTarget: null,
      attachmentFileList: [],
      attachmentPreviewTitle: "",
      attachmentPreviewUrl: "",
      attachmentPreviewDownloadUrl: "",
      attachmentPreviewType: "unsupported",
      priorityRecommendation: null,
      evaluationForm: {
        id: null,
        rating: 5,
        evaluationOpinion: "",
      },
      search: "",
      currentPage: 1,
      pageSize: 10,
      total: 0,
      tableData: [],
      room: {
        dormBuildId: "",
        dormRoomId: "",
      },
      studentUser: {},
      studentName: "",
      studentUsername: "",
      isEditing: false,
      rules: {
        title: [{ required: true, message: "请输入报修标题", trigger: "blur" }],
        content: [{ required: true, message: "请输入报修内容", trigger: "blur" }],
      },
    };
  },
  computed: {
    dormText() {
      if (!this.room.dormBuildId || !this.room.dormRoomId) {
        return "暂未分配宿舍";
      }
      return `${this.room.dormBuildId}号楼 ${this.room.dormRoomId}`;
    },
  },
  created() {
    this.loadStudentUser();
    this.loadRoomInfo();
    this.load();
  },
  methods: {
    loadStudentUser() {
      try {
        this.studentUser = JSON.parse(window.sessionStorage.getItem("user") || "{}");
      } catch (error) {
        this.studentUser = {};
      }
      this.studentName = this.studentUser?.name || "";
      this.studentUsername = this.studentUser?.username || "";
      this.form.repairer = this.studentName;
    },
    async loadRoomInfo() {
      if (!this.studentUsername) {
        return;
      }
      try {
        const res = await request.get(`/room/getMyRoom/${this.studentUsername}`);
        if (res.code === "0" && res.data) {
          this.room = res.data;
          this.applyRoomInfo();
        } else {
          ElMessage.error(res.msg || "宿舍信息获取失败");
        }
      } catch (error) {
        ElMessage.error("宿舍信息获取失败");
        console.error(error);
      }
    },
    applyRoomInfo() {
      this.form.dormBuildId = this.room?.dormBuildId || "";
      this.form.dormRoomId = this.room?.dormRoomId || "";
      this.form.repairer = this.studentName;
    },
    async load() {
      if (!this.studentName) {
        return;
      }
      this.loading = true;
      try {
        const res = await request.get(`/repair/find/${this.studentName}`, {
          params: {
            pageNum: this.currentPage,
            pageSize: this.pageSize,
            search: this.search,
          },
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "报修记录加载失败");
        }
        this.tableData = res.data?.records || [];
        this.total = res.data?.total || 0;
      } catch (error) {
        ElMessage.error(error.message || "报修记录加载失败");
      } finally {
        this.loading = false;
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
    async recommendPriority(forceApply = false) {
      if (!this.form.title && !this.form.content) {
        return;
      }
      this.priorityRecommending = true;
      try {
        const res = await request.post("/repair/priority/recommend", {
          title: this.form.title,
          content: this.form.content,
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "优先级推荐失败");
        }
        this.priorityRecommendation = res.data;
        if (res.data?.priority) {
          this.form.priority = res.data.priority;
        }
      } catch (error) {
        if (forceApply) {
          ElMessage.warning(error.message || "优先级推荐失败");
        }
      } finally {
        this.priorityRecommending = false;
      }
    },
    buildPayload() {
      return {
        id: this.form.id,
        title: this.form.title,
        content: this.form.content,
        dormBuildId: Number(this.form.dormBuildId),
        dormRoomId: Number(this.form.dormRoomId),
        repairer: this.studentName,
        orderBuildTime: this.form.orderBuildTime || this.nowString(),
        priority: this.form.priority || "普通",
        attachmentName: this.form.attachmentName || "",
        attachmentFile: this.form.attachmentFile || "",
      };
    },
    isEditable(row) {
      return row?.state === "待受理";
    },
    isCompleted(row) {
      return row?.state === "已完成";
    },
    isWaitingConfirm(row) {
      return row?.state === "待学生确认";
    },
    async submitRepair() {
      if (!this.room?.dormBuildId || !this.room?.dormRoomId) {
        ElMessage.warning("当前还没有分配宿舍，暂时不能提交报修");
        return;
      }
      const valid = await this.$refs.formRef.validate().catch(() => false);
      if (!valid) {
        ElMessage.warning("请先把表单填写完整后再提交");
        return;
      }
      this.submitting = true;
      try {
        await this.recommendPriority(false);
        const payload = this.buildPayload();
        const res = this.isEditing
          ? await request.put("/repair/update", payload)
          : await request.post("/repair/add", payload);
        if (res.code !== "0") {
          throw new Error(res.msg || "报修提交失败");
        }
        ElMessage.success(this.isEditing ? "报修申请修改成功" : "报修申请提交成功");
        this.resetForm();
        this.load();
      } catch (error) {
        ElMessage.error(error.message || "报修提交失败");
      } finally {
        this.submitting = false;
      }
    },
    handleEdit(row) {
      if (!this.isEditable(row)) {
        ElMessage.warning("报修进入受理流程后，学生端不能再修改");
        return;
      }
      Object.assign(this.form, {
        id: row.id,
        title: row.title || "",
        content: row.content || "",
        dormBuildId: row.dormBuildId || this.room.dormBuildId || "",
        dormRoomId: row.dormRoomId || this.room.dormRoomId || "",
        repairer: row.repairer || this.studentName,
        orderBuildTime: row.orderBuildTime || "",
        priority: row.priority || "普通",
        attachmentName: row.attachmentName || "",
        attachmentFile: row.attachmentFile || "",
      });
      this.attachmentFileList = this.createAttachmentFileList(this.form);
      this.priorityRecommendation = null;
      this.isEditing = true;
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate();
      });
    },
    async handleDelete(row) {
      if (!this.isEditable(row)) {
        ElMessage.warning("报修进入受理流程后，学生端不能再删除");
        return;
      }
      try {
        await ElMessageBox.confirm("确定撤回这条报修申请吗？", "提示", {
          type: "warning",
          confirmButtonText: "确定",
          cancelButtonText: "取消",
        });
        const res = await request.delete(`/repair/delete/${row.id}`);
        if (res.code !== "0") {
          throw new Error(res.msg || "删除失败");
        }
        ElMessage.success("报修申请已删除");
        if (this.isEditing && this.form.id === row.id) {
          this.resetForm();
        }
        this.load();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "删除失败");
      }
    },
    resetForm() {
      Object.assign(this.form, createDefaultForm());
      this.applyRoomInfo();
      this.attachmentFileList = [];
      this.priorityRecommendation = null;
      this.isEditing = false;
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate();
      });
    },
    openDetail(row) {
      this.detailRecord = { ...row };
      this.detailDialogVisible = true;
    },
    createAttachmentFileList(row) {
      if (!this.hasAttachment(row)) {
        return [];
      }
      return [{
        name: row.attachmentName || row.attachmentFile,
        url: this.getAttachmentPreviewUrl(row),
      }];
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
    beforeRepairAttachmentUpload(file) {
      const isImage = file.type && file.type.startsWith("image/");
      if (!isImage) {
        ElMessage.error("报修附件请上传图片文件");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        ElMessage.error("图片大小不能超过 10MB");
        return false;
      }
      return true;
    },
    handleAttachmentSuccess(res) {
      if (res.code === "0" && res.data) {
        this.form.attachmentName = res.data.attachmentName;
        this.form.attachmentFile = res.data.attachmentFile;
        this.attachmentFileList = this.createAttachmentFileList(this.form);
        ElMessage.success("图片上传成功");
      } else {
        this.attachmentFileList = [];
        ElMessage.error(res.msg || "图片上传失败");
      }
    },
    handleAttachmentRemove() {
      this.form.attachmentName = "";
      this.form.attachmentFile = "";
      this.attachmentFileList = [];
    },
    handleAttachmentExceed() {
      ElMessage.warning("每条报修申请只能上传 1 张图片，如需更换请先移除原图片");
    },
    openEvaluation(row) {
      if (!this.isCompleted(row)) {
        ElMessage.warning(this.isWaitingConfirm(row) ? "请先确认维修结果，再填写评价" : "工人完成维修后才能评价");
        return;
      }
      this.evaluationTarget = { ...row };
      this.evaluationReadOnly = !!(row.rating && row.evaluationOpinion);
      this.evaluationForm = {
        id: row.id,
        rating: row.rating || 5,
        evaluationOpinion: row.evaluationOpinion || "",
      };
      this.evaluationDialogVisible = true;
    },
    async confirmCompletion(row) {
      if (!this.isWaitingConfirm(row)) {
        return;
      }
      try {
        await ElMessageBox.confirm("确认该维修已经处理完成吗？确认后工单会进入已完成，并可以填写评价。", "确认完工", {
          type: "success",
          confirmButtonText: "确认完成",
          cancelButtonText: "取消",
        });
        this.submitting = true;
        const res = await request.put(`/repair/confirm/${row.id}`, {
          repairer: this.studentName,
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "确认完工失败");
        }
        ElMessage.success("已确认维修完成，可以填写评价了");
        this.detailDialogVisible = false;
        await this.load();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "确认完工失败");
      } finally {
        this.submitting = false;
      }
    },
    async rejectCompletion(row) {
      if (!this.isWaitingConfirm(row)) {
        return;
      }
      try {
        const { value } = await ElMessageBox.prompt("请说明还存在的问题，维修人员会根据反馈继续处理。", "仍有问题", {
          confirmButtonText: "提交反馈",
          cancelButtonText: "取消",
          inputType: "textarea",
          inputPlaceholder: "例如：门锁仍然松动，关门后会弹开",
          inputValidator: (value) => !!(value && value.trim()) || "请填写具体问题",
        });
        this.submitting = true;
        const res = await request.put(`/repair/reject/${row.id}`, {
          repairer: this.studentName,
          feedback: value.trim(),
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "退回维修失败");
        }
        ElMessage.success("已退回维修人员继续处理");
        this.detailDialogVisible = false;
        await this.load();
      } catch (error) {
        if (error === "cancel" || error === "close") {
          return;
        }
        ElMessage.error(error.message || "退回维修失败");
      } finally {
        this.submitting = false;
      }
    },
    async submitEvaluation() {
      if (!this.evaluationForm.rating) {
        ElMessage.warning("请先选择维修评分");
        return;
      }
      if (!this.evaluationForm.evaluationOpinion || !this.evaluationForm.evaluationOpinion.trim()) {
        ElMessage.warning("请填写评价意见");
        return;
      }
      this.submitting = true;
      try {
        const res = await request.put("/repair/updateRating", {
          id: this.evaluationForm.id,
          rating: this.evaluationForm.rating,
          evaluationOpinion: this.evaluationForm.evaluationOpinion,
        });
        if (res.code !== "0") {
          throw new Error(res.msg || "评价提交失败");
        }
        ElMessage.success("评价提交成功");
        this.evaluationDialogVisible = false;
        await this.load();
      } catch (error) {
        ElMessage.error(error.message || "评价提交失败");
      } finally {
        this.submitting = false;
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
    nowString() {
      const date = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
  },
};
</script>

<style scoped>
.repair-student-page {
  gap: 18px;
}

.repair-student-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
}

.hero-tags {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
  min-width: 320px;
}

.hero-tag {
  padding: 16px 18px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.hero-tag span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.hero-tag strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
}

.repair-student-layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.58fr) minmax(0, 1.42fr);
  gap: 18px;
}

.card-header,
.card-actions,
.form-actions,
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

.repair-form {
  max-width: 560px;
}

.priority-field {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 10px;
}

.priority-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.priority-auto-result {
  display: flex;
  min-height: 32px;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-soft);
}

.priority-auto-result span {
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.5;
}

.priority-recommendation {
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

.priority-recommendation--muted {
  color: var(--text-color-muted);
}

.repair-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.6;
}

.form-actions {
  justify-content: center;
  width: 100%;
}

.row-actions {
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.rating-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 176px;
}

.confirm-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color-secondary);
}

.confirm-panel .form-actions {
  justify-content: flex-start;
  margin-top: 12px;
}

.evaluation-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.evaluation-target {
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
}

.evaluation-target strong,
.evaluation-target span,
.evaluation-readonly small {
  display: block;
}

.evaluation-target span {
  margin-top: 6px;
  color: var(--text-color-muted);
  font-size: 13px;
}

.evaluation-readonly {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.evaluation-readonly small {
  color: var(--text-color-muted);
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

@media (max-width: 1200px) {
  .repair-student-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .repair-student-hero {
    flex-direction: column;
  }

  .hero-tags {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .repair-student-hero {
    padding: 20px;
  }

  .hero-tags,
  .detail-grid,
  .priority-control {
    grid-template-columns: 1fr;
  }

  .card-header,
  .card-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
