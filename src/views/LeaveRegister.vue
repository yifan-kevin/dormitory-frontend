<template>
  <!-- LOCATE: 离校登记管理页面，证明审核和返校确认 -->
  <div class="page-shell leave-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>请假登记</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card leave-hero">
      <div>
        <div class="page-eyebrow">Leave Register</div>
        <h1 class="page-title">请假登记管理</h1>
        <p class="page-subtitle">统一管理学生请假登记信息，支持新增、编辑和删除操作。</p>
      </div>
      <div class="hero-stats">
        <div class="stat-pill">
            <span class="stat-pill__label">总记录</span>
          <strong class="stat-pill__value">{{ leaveRecords.length }}</strong>
        </div>
      </div>
    </section>

    <section class="leave-layout">
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Registration Form</div>
              <h3>{{ judgeOption ? "修改请假" : "新增请假" }}</h3>
            </div>
            <el-tag :type="judgeOption ? 'warning' : 'success'" effect="dark">
              {{ judgeOption ? "编辑中" : "新增请假" }}
            </el-tag>
          </div>
        </template>

        <el-form
          ref="form"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="leave-form"
        >
          <div class="form-grid">
            <el-form-item label="学生学号" prop="studentId">
              <el-input v-model.trim="form.studentId" placeholder="请输入学生学号" />
            </el-form-item>
            <el-form-item label="学生姓名" prop="studentName">
              <el-input v-model.trim="form.studentName" placeholder="请输入学生姓名" />
            </el-form-item>
          </div>
          <el-form-item label="离校时间" prop="leaveTime">
            <el-date-picker
              v-model="form.leaveTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择离校时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="返校时间" prop="returnTime">
            <el-date-picker
              v-model="form.returnTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择返校时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="学生状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择学生状态" style="width: 100%">
              <el-option label="待离校" value="待离校" />
              <el-option label="离校中" value="离校中" />
              <el-option label="待确认返校" value="待确认返校" />
              <el-option label="异常未归" value="异常未归" />
              <el-option label="已返回学校" value="已返回学校" />
            </el-select>
          </el-form-item>
          <el-form-item label="请假时间" prop="registerTime">
            <el-date-picker
              v-model="form.registerTime"
              type="datetime"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择请假时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model.trim="form.remark"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="请输入备注"
            />
          </el-form-item>
          <el-form-item label="请假附件">
            <el-upload
              class="leave-upload"
              action="/api/files/uploadLeaveAttachment"
              accept="image/*,.pdf,.txt,.docx,.xls,.xlsx"
              :limit="1"
              :file-list="attachmentFileList"
              :before-upload="beforeLeaveAttachmentUpload"
              :on-success="handleAttachmentSuccess"
              :on-remove="handleAttachmentRemove"
              :on-exceed="handleAttachmentExceed"
            >
              <el-button>上传证明</el-button>
              <template #tip>
                <div class="upload-tip">支持图片、PDF、TXT、DOCX、Excel，单个文件不超过 10MB。</div>
              </template>
            </el-upload>
            <el-button v-if="form.attachmentFile" type="primary" text @click="previewAttachment(form)">
              预览证明
            </el-button>
          </el-form-item>
          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" :loading="submitting" @click="submitRegister">
                {{ judgeOption ? "保存修改" : "提交请假" }}
              </el-button>
              <el-button @click="resetForm">{{ judgeOption ? "取消编辑" : "重置" }}</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Records</div>
              <h3>请假记录</h3>
            </div>
            <el-button type="primary" text @click="loadLeaveRecords">刷新</el-button>
          </div>
        </template>

        <el-table v-loading="loading" :data="leaveRecords" border style="width: 100%">
          <el-table-column label="请假时间" width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.registerTime) }}
            </template>
          </el-table-column>
          <el-table-column label="学生学号" prop="studentId" width="120" />
          <el-table-column label="学生姓名" prop="studentName" width="120" />
          <el-table-column label="离校时间" width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.leaveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="返校时间" width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.returnTime) }}
            </template>
          </el-table-column>
          <el-table-column label="学生状态" width="130">
            <template #default="scope">
              <el-tag :type="statusTagType(displayStatus(scope.row))">
                {{ displayStatus(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="证明审核" width="140">
            <template #default="scope">
              <el-tag :type="reviewTagType(reviewStatus(scope.row))">
                {{ reviewStatus(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="登记人" prop="register" width="120" />
          <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
          <el-table-column label="附件" width="110">
            <template #default="scope">
              <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
                预览证明
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="scope">
              <div class="action-group">
                <el-button
                  v-if="canReviewProof(scope.row)"
                  type="success"
                  text
                  @click="reviewProof(scope.row, true)"
                >
                  通过
                </el-button>
                <el-button
                  v-if="canReviewProof(scope.row)"
                  type="warning"
                  text
                  @click="reviewProof(scope.row, false)"
                >
                  驳回
                </el-button>
                <el-button
                  v-if="canMarkReturned(scope.row)"
                  circle
                  type="success"
                  title="已返回学校"
                  @click="markReturned(scope.row)"
                >
                  返
                </el-button>
                <el-button circle type="primary" @click="handleEdit(scope.row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-popconfirm title="确认删除这条记录吗？" @confirm="handleDelete(scope.row.id)">
                  <template #reference>
                    <el-button circle type="danger">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && !leaveRecords.length" description="暂无请假记录" />
      </el-card>
    </section>

    <el-dialog
      v-model="attachmentPreviewVisible"
      :title="attachmentPreviewTitle || '请假附件预览'"
      width="820px"
      @closed="closeAttachmentPreview"
    >
      <div class="attachment-preview">
        <img
          v-if="attachmentPreviewType === 'image'"
          :src="attachmentPreviewUrl"
          alt="离校证明预览"
          class="attachment-preview__image"
        />
        <iframe
          v-else-if="attachmentPreviewType === 'frame' || attachmentPreviewType === 'office'"
          :src="attachmentPreviewUrl"
          class="attachment-preview__frame"
          title="离校证明预览"
        />
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

export default {
  name: "LeaveRegister",
  data() {
    return {
      form: this.createDefaultForm(),
      rules: {
        studentId: [{ required: true, message: "请输入学生学号", trigger: "blur" }],
        studentName: [{ required: true, message: "请输入学生姓名", trigger: "blur" }],
        leaveTime: [{ required: true, message: "请选择离校时间", trigger: "change" }],
        returnTime: [{ required: true, message: "请选择返校时间", trigger: "change" }],
        status: [{ required: true, message: "请选择学生状态", trigger: "change" }],
        registerTime: [{ required: true, message: "请选择请假时间", trigger: "change" }],
      },
      loading: false,
      submitting: false,
      leaveRecords: [],
      judgeOption: false,
      attachmentFileList: [],
      attachmentPreviewVisible: false,
      attachmentPreviewTitle: "",
      attachmentPreviewUrl: "",
      attachmentPreviewDownloadUrl: "",
      attachmentPreviewType: "unsupported",
    };
  },
  created() {
    this.loadLeaveRecords();
  },
  methods: {
    createDefaultForm() {
      return {
        id: null,
        studentId: "",
        studentName: "",
        leaveTime: null,
        returnTime: null,
        status: "待离校",
        registerTime: new Date(),
        register: "管理员",
        remark: "",
        attachmentName: "",
        attachmentFile: "",
        proofReviewStatus: "审核通过",
        proofReviewer: "",
        proofReviewTime: "",
        proofReviewRemark: "",
      };
    },
    pad(value) {
      return String(value).padStart(2, "0");
    },
    formatDateTime(date) {
      if (!date) {
        return "";
      }
      const target = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(target.getTime())) {
        return "";
      }
      const year = target.getFullYear();
      const month = this.pad(target.getMonth() + 1);
      const day = this.pad(target.getDate());
      const hours = this.pad(target.getHours());
      const minutes = this.pad(target.getMinutes());
      const seconds = this.pad(target.getSeconds());
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    parseDateTime(value) {
      if (!value) {
        return null;
      }
      if (value instanceof Date) {
        return value;
      }
      const normalized = String(value).replace(/-/g, "/");
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    },
    formatDisplayTime(value) {
      return this.formatDateTime(this.parseDateTime(value));
    },
    resolveStatus(row) {
      const status = String(row?.status || "").trim();
      const review = this.reviewStatus(row);
      if (review === "待审核") {
        return "证明待审核";
      }
      if (review === "审核驳回") {
        return "证明驳回";
      }
      if (["待离校", "离校中", "待确认返校", "异常未归", "已返回学校"].includes(status)) {
        return status;
      }
      if (status === "已返回学校") {
        return status;
      }
      if (status === "异常未归") {
        return status;
      }
      const leaveTime = this.parseDateTime(row?.leaveTime);
      const returnTime = this.parseDateTime(row?.returnTime);
      const now = new Date();
      if (!leaveTime || now.getTime() < leaveTime.getTime()) {
        return "待离校";
      }
      if (returnTime && now.getTime() > returnTime.getTime()) {
        if (now.getTime() - returnTime.getTime() >= 24 * 60 * 60 * 1000) {
          return "异常未归";
        }
        return "待确认返校";
      }
      return "离校中";
    },
    displayStatus(row) {
      return this.resolveStatus(row);
    },
    statusTagType(status) {
      const value = String(status || "");
      if (value.includes("返回")) {
        return "success";
      }
      if (value.includes("异常") || value.includes("未归") || value.includes("超期")) {
        return "danger";
      }
      if (value.includes("确认") || value.includes("待审核")) {
        return "warning";
      }
      if (value.includes("驳回")) {
        return "danger";
      }
      if (value.includes("离校中")) {
        return "danger";
      }
      return "info";
    },
    canMarkReturned(row) {
      const status = this.displayStatus(row);
      return !!row?.id && ["离校中", "待确认返校", "异常未归"].includes(status);
    },
    canReviewProof(row) {
      return !!row?.id && this.reviewStatus(row) !== "审核通过";
    },
    reviewStatus(row) {
      const value = String(row?.proofReviewStatus || "").trim();
      if (!value) {
        return "审核通过";
      }
      if (value.includes("驳回")) {
        return "审核驳回";
      }
      if (value.includes("通过")) {
        return "审核通过";
      }
      return "待审核";
    },
    reviewTagType(status) {
      if (status === "审核通过") {
        return "success";
      }
      if (status === "审核驳回") {
        return "danger";
      }
      return "warning";
    },
    reviewProof(row, approved) {
      const actionText = approved ? "通过" : "驳回";
      ElMessageBox.prompt("可填写审核意见", `确认${actionText}离校证明`, {
        confirmButtonText: actionText,
        cancelButtonText: "取消",
        inputType: "textarea",
        inputValue: approved ? "证明材料有效，审核通过。" : "证明材料不完整，请重新上传。",
      }).then(({ value }) => {
        request.put(`/leaveRegister/reviewProof/${row.id}`, {
          proofReviewStatus: approved ? "审核通过" : "审核驳回",
          proofReviewRemark: value || "",
        }).then((res) => {
          if (res.code === "0") {
            ElMessage.success(`离校证明已${actionText}`);
            this.loadLeaveRecords();
          } else {
            ElMessage.error(res.msg || "审核失败");
          }
        }).catch(() => {
          ElMessage.error("审核失败，请稍后重试");
        });
      }).catch(() => {});
    },
    markReturned(row) {
      request.put(`/leaveRegister/confirmReturn/${row.id}`).then((res) => {
        if (res.code === "0") {
          ElMessage.success("已更新为已返回学校");
          this.loadLeaveRecords();
        } else {
          ElMessage.error(res.msg || "状态更新失败");
        }
      }).catch(() => {
        ElMessage.error("状态更新失败，请稍后重试");
      });
    },
    buildPayload() {
      return {
        ...this.form,
        leaveTime: this.formatDateTime(this.form.leaveTime),
        returnTime: this.formatDateTime(this.form.returnTime),
        status: this.form.status || this.resolveStatus(this.form),
        registerTime: this.formatDateTime(this.form.registerTime),
        proofReviewStatus: this.form.proofReviewStatus || "审核通过",
        proofReviewer: this.form.proofReviewer || "",
        proofReviewTime: this.form.proofReviewTime || "",
        proofReviewRemark: this.form.proofReviewRemark || "",
      };
    },
    loadLeaveRecords() {
      this.loading = true;
      request.get("/leaveRegister/list").then((res) => {
        if (res.code === "0") {
          this.leaveRecords = res.data || [];
        } else {
          ElMessage({
            message: res.msg,
            type: "error",
          });
        }
        this.loading = false;
      }).catch(() => {
        this.loading = false;
        ElMessage({
          message: "加载请假记录失败",
          type: "error",
        });
      });
    },
    submitRegister() {
      if (!this.$refs.form) {
        return;
      }

      this.$refs.form.validate((valid) => {
        if (!valid) {
          ElMessage({
            message: "请先把表单填写完整后再提交",
            type: "warning",
          });
          return;
        }

        const payload = this.buildPayload();
        if (!payload.leaveTime || !payload.returnTime || !payload.registerTime) {
          ElMessage({
            message: "时间格式不正确，请重新选择",
            type: "warning",
          });
          return;
        }

        this.submitting = true;
        const requestPromise = this.judgeOption
          ? request.put("/leaveRegister/update", payload)
          : request.post("/leaveRegister/register", payload);

        requestPromise.then((res) => {
          this.submitting = false;
          if (res.code === "0") {
            ElMessage({
              message: this.judgeOption ? "修改成功" : "请假提交成功",
              type: "success",
            });
            this.resetForm();
            this.loadLeaveRecords();
          } else {
            ElMessage({
              message: res.msg || "提交失败",
              type: "error",
            });
          }
        }).catch(() => {
          this.submitting = false;
          ElMessage({
            message: "请求失败，请稍后重试",
            type: "error",
          });
        });
      });
    },
    resetForm() {
      Object.assign(this.form, this.createDefaultForm());
      this.judgeOption = false;
      this.attachmentFileList = [];
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
    handleEdit(row) {
      Object.assign(this.form, {
        id: row.id,
        studentId: row.studentId || "",
        studentName: row.studentName || "",
        leaveTime: this.parseDateTime(row.leaveTime),
        returnTime: this.parseDateTime(row.returnTime),
        status: row.status || this.displayStatus(row),
        registerTime: this.parseDateTime(row.registerTime) || new Date(),
        register: row.register || "管理员",
        remark: row.remark || "",
        attachmentName: row.attachmentName || "",
        attachmentFile: row.attachmentFile || "",
        proofReviewStatus: row.proofReviewStatus || "",
        proofReviewer: row.proofReviewer || "",
        proofReviewTime: row.proofReviewTime || "",
        proofReviewRemark: row.proofReviewRemark || "",
      });
      this.attachmentFileList = this.createAttachmentFileList(this.form);
      this.judgeOption = true;
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
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
      this.attachmentPreviewTitle = row.attachmentName || "离校证明预览";
      this.attachmentPreviewType = this.getAttachmentPreviewType(row);
      this.attachmentPreviewUrl = this.getAttachmentPreviewUrl(row);
      this.attachmentPreviewDownloadUrl = this.getAttachmentDownloadUrl(row);
      this.attachmentPreviewVisible = true;
    },
    closeAttachmentPreview() {
      this.attachmentPreviewUrl = "";
      this.attachmentPreviewDownloadUrl = "";
      this.attachmentPreviewType = "unsupported";
    },
    beforeLeaveAttachmentUpload(file) {
      const isImageType = file.type && file.type.startsWith("image/");
      const isAllowedName = /\.(jpe?g|png|gif|bmp|webp|pdf|txt|docx|xls|xlsx)$/i.test(file.name || "");
      if (!isImageType && !isAllowedName) {
        ElMessage.error("离校证明仅支持图片、PDF、TXT、DOCX 或 Excel 文件");
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
        ElMessage.success("证明上传成功");
      } else {
        this.attachmentFileList = [];
        ElMessage.error(res.msg || "证明上传失败");
      }
    },
    handleAttachmentRemove() {
      this.form.attachmentName = "";
      this.form.attachmentFile = "";
      this.attachmentFileList = [];
    },
    handleAttachmentExceed() {
      ElMessage.warning("每条离校记录只能上传 1 个证明文件，如需更换请先移除原文件");
    },
    handleDelete(id) {
      request.delete("/leaveRegister/delete/" + id).then((res) => {
        if (res.code === "0") {
          ElMessage({
            message: "删除成功",
            type: "success",
          });
          this.loadLeaveRecords();
        } else {
          ElMessage({
            message: res.msg,
            type: "error",
          });
        }
      });
    },
  },
};
</script>

<style scoped>
.leave-page {
  gap: 18px;
}

.leave-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
}

.hero-stats {
  display: flex;
  gap: 12px;
  min-width: 140px;
}

.stat-pill {
  padding: 16px 18px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.stat-pill__label {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.stat-pill__value {
  display: block;
  margin-top: 8px;
  font-size: 18px;
  line-height: 1;
}

.leave-layout {
  display: grid;
  grid-template-columns: minmax(340px, 0.9fr) minmax(0, 1.1fr);
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
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-header h3 {
  font-size: 18px;
  line-height: 1;
  letter-spacing: -0.03em;
}

.leave-form {
  max-width: 560px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.action-group {
  display: flex;
  gap: 10px;
}

.leave-upload {
  width: 100%;
}

.upload-tip {
  margin-top: 6px;
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.6;
}

.attachment-preview {
  min-height: 520px;
  border-radius: 8px;
  overflow: hidden;
  background: #fbfaf7;
  border: 1px solid rgba(148, 163, 184, 0.18);
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
  min-height: 72vh;
  border: 0;
  background: #fff;
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
  .leave-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .leave-hero {
    flex-direction: column;
  }

  .hero-stats {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .leave-hero {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>


