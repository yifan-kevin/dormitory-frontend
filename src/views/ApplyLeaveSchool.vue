<template>
  <!-- LOCATE: 学生离校申请页面 -->
  <div class="page-shell leave-apply-page">
    <el-breadcrumb separator-icon="ArrowRight" style="margin: 16px 0 0">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>离校申请</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card leave-hero">
      <div>
        <div class="page-eyebrow">Leave Request</div>
        <h1 class="page-title">提交离校申请并维护自己的申请记录</h1>
        <p class="page-subtitle">
          当前学生信息会自动带入，提交、编辑和删除都会直接同步到离校申请记录里，避免重复填写。
        </p>
      </div>

      <div class="leave-hero__tips">
        <div class="tip-chip">
          <span>当前学生</span>
          <strong>{{ form.studentName || "-" }}</strong>
        </div>
        <div class="tip-chip">
          <span>学号</span>
          <strong>{{ form.studentId || "-" }}</strong>
        </div>
      </div>
    </section>

    <section class="leave-layout">
      <el-card class="section-card leave-form-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Application Form</div>
              <h3>离校申请表</h3>
            </div>
            <el-tag :type="isEditing ? 'warning' : 'success'" effect="dark">
              {{ isEditing ? "编辑中" : "新增申请" }}
            </el-tag>
          </div>
        </template>

        <el-form
          ref="form"
          :model="form"
          :rules="rules"
          label-width="110px"
          class="leave-form"
        >
          <el-form-item label="学生学号" prop="studentId">
            <el-input v-model="form.studentId" disabled />
          </el-form-item>

          <el-form-item label="学生姓名" prop="studentName">
            <el-input v-model="form.studentName" disabled />
          </el-form-item>

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

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model.trim="form.remark"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="可填写离校原因、去向或其他说明"
            />
          </el-form-item>

          <el-form-item label="离校证明">
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
                <div class="upload-tip">支持图片、PDF、TXT、DOCX、Excel，单个文件不超过 10MB。审核通过后离校申请才会生效。</div>
              </template>
            </el-upload>
            <el-button v-if="form.attachmentFile" type="primary" text @click="previewAttachment(form)">
              预览证明
            </el-button>
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" :loading="submitting" @click="submitApply">
                {{ isEditing ? "保存修改" : "提交申请" }}
              </el-button>
              <el-button @click="resetForm">{{ isEditing ? "取消编辑" : "重置" }}</el-button>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="section-card leave-record-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">My Records</div>
              <h3>我的离校申请记录</h3>
            </div>
            <el-button type="primary" text @click="loadMyRecords">刷新</el-button>
          </div>
        </template>

        <el-table v-loading="loading" :data="records" border style="width: 100%">
          <el-table-column label="提交时间" min-width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.registerTime) }}
            </template>
          </el-table-column>
          <el-table-column label="离校时间" min-width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.leaveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="返校时间" min-width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.returnTime) }}
            </template>
          </el-table-column>
          <el-table-column label="学生状态" min-width="130">
            <template #default="scope">
              <el-tag :type="statusTagType(displayStatus(scope.row))">
                {{ displayStatus(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="证明审核" min-width="130">
            <template #default="scope">
              <el-tag :type="reviewTagType(reviewStatus(scope.row))">
                {{ reviewStatus(scope.row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="登记人" prop="register" min-width="120" />
          <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
          <el-table-column label="附件" min-width="110">
            <template #default="scope">
              <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
                预览证明
              </el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="scope">
              <div class="record-actions">
                <el-button
                  v-if="canMarkReturned(scope.row)"
                  type="success"
                  text
                  @click="markReturned(scope.row)"
                >
                  已返回学校</el-button>
                <el-button v-if="canEditRecord(scope.row)" type="primary" text @click="handleEdit(scope.row)">编辑</el-button>
                <el-button v-if="canDeleteRecord(scope.row)" type="danger" text @click="handleDelete(scope.row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="!loading && !records.length" description="暂时还没有离校申请记录" />
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

const createDefaultForm = () => ({
  id: null,
  studentId: "",
  studentName: "",
  leaveTime: null,
  returnTime: null,
  status: "待离校",
  registerTime: new Date(),
  register: "",
  remark: "",
  attachmentName: "",
  attachmentFile: "",
  proofReviewStatus: "",
  proofReviewer: "",
  proofReviewTime: "",
  proofReviewRemark: "",
});

export default {
  name: "ApplyLeaveSchool",
  data() {
    return {
      form: createDefaultForm(),
      studentUser: {},
      submitting: false,
      loading: false,
      records: [],
      isEditing: false,
      attachmentFileList: [],
      attachmentPreviewVisible: false,
      attachmentPreviewTitle: "",
      attachmentPreviewUrl: "",
      attachmentPreviewDownloadUrl: "",
      attachmentPreviewType: "unsupported",
      rules: {
        studentId: [{ required: true, message: "未读取到当前学生学号，请重新登录后再试", trigger: "change" }],
        studentName: [{ required: true, message: "未读取到当前学生姓名，请重新登录后再试", trigger: "change" }],
        leaveTime: [{ required: true, message: "请选择离校时间", trigger: "change" }],
        returnTime: [{ required: true, message: "请选择返校时间", trigger: "change" }],
      },
    };
  },
  created() {
    this.loadStudentUser();
    this.loadMyRecords();
  },
  methods: {
    loadStudentUser() {
      try {
        this.studentUser = JSON.parse(window.sessionStorage.getItem("user") || "{}");
      } catch (error) {
        this.studentUser = {};
      }
      this.applyStudentInfo();
    },
    applyStudentInfo() {
      const username = this.studentUser?.username || "";
      const name = this.studentUser?.name || "";
      this.form.studentId = username;
      this.form.studentName = name;
      this.form.register = name || username || "学生本人";
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
    canEditRecord(row) {
      return !!row?.id && ["证明待审核", "证明驳回", "待离校"].includes(this.displayStatus(row));
    },
    canDeleteRecord(row) {
      const status = this.displayStatus(row);
      return ["证明待审核", "证明驳回", "待离校", "已返回学校"].includes(status);
    },
    markReturned(row) {
      request.put(`/leaveRegister/confirmReturn/${row.id}`).then((res) => {
        if (res.code === "0") {
          ElMessage.success("已更新为已返回学校");
          this.loadMyRecords();
        } else {
          ElMessage.error(res.msg || "状态更新失败");
        }
      }).catch((error) => {
        ElMessage.error("状态更新失败，请稍后重试");
        console.error(error);
      });
    },
    buildPayload() {
      return {
        id: this.form.id,
        studentId: this.form.studentId,
        studentName: this.form.studentName,
        leaveTime: this.formatDateTime(this.form.leaveTime),
        returnTime: this.formatDateTime(this.form.returnTime),
        status: this.form.status || this.resolveStatus(this.form),
        registerTime: this.formatDateTime(this.form.registerTime || new Date()),
        register: this.form.register || this.form.studentName || this.form.studentId || "学生本人",
        remark: this.form.remark || "",
        attachmentName: this.form.attachmentName || "",
        attachmentFile: this.form.attachmentFile || "",
        proofReviewStatus: this.form.proofReviewStatus || "",
        proofReviewer: this.form.proofReviewer || "",
        proofReviewTime: this.form.proofReviewTime || "",
        proofReviewRemark: this.form.proofReviewRemark || "",
      };
    },
    validateTimeRange() {
      const leaveTime = this.parseDateTime(this.form.leaveTime);
      const returnTime = this.parseDateTime(this.form.returnTime);
      if (!leaveTime || !returnTime) {
        return false;
      }
      if (returnTime.getTime() < leaveTime.getTime()) {
        ElMessage({
          message: "返校时间不能早于离校时间",
          type: "warning",
        });
        return false;
      }
      return true;
    },
    submitApply() {
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

        if (!this.validateTimeRange()) {
          return;
        }

        if (!this.form.attachmentFile) {
          ElMessage({
            message: "请先上传离校证明，管理员审核通过后申请才会生效",
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
        const requestPromise = this.isEditing
          ? request.put("/leaveRegister/update", payload)
          : request.post("/leaveRegister/register", payload);

        requestPromise.then((res) => {
          this.submitting = false;
          if (res.code === "0") {
            ElMessage({
              message: this.isEditing ? "离校申请修改成功" : "离校申请提交成功",
              type: "success",
            });
            this.resetForm();
            this.loadMyRecords();
          } else {
            ElMessage({
              message: res.msg || "提交失败",
              type: "error",
            });
          }
        }).catch((error) => {
          this.submitting = false;
          ElMessage({
            message: "请求失败，请检查后端服务后重试",
            type: "error",
          });
          console.error(error);
        });
      });
    },
    handleEdit(row) {
      Object.assign(this.form, {
        id: row.id,
        studentId: row.studentId || this.studentUser?.username || "",
        studentName: row.studentName || this.studentUser?.name || "",
        leaveTime: this.parseDateTime(row.leaveTime),
        returnTime: this.parseDateTime(row.returnTime),
        status: row.status || this.displayStatus(row),
        registerTime: this.parseDateTime(row.registerTime) || new Date(),
        register: row.register || this.studentUser?.name || this.studentUser?.username || "学生本人",
        remark: row.remark || "",
        attachmentName: row.attachmentName || "",
        attachmentFile: row.attachmentFile || "",
        proofReviewStatus: row.proofReviewStatus || "",
        proofReviewer: row.proofReviewer || "",
        proofReviewTime: row.proofReviewTime || "",
        proofReviewRemark: row.proofReviewRemark || "",
      });
      this.attachmentFileList = this.createAttachmentFileList(this.form);
      this.isEditing = true;
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
    handleDelete(row) {
      ElMessageBox.confirm("确定要删除这条离校申请记录吗？", "删除确认", {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        request.delete(`/leaveRegister/delete/${row.id}`).then((res) => {
          if (res.code === "0") {
            ElMessage({
              message: "离校申请删除成功",
              type: "success",
            });
            if (this.isEditing && this.form.id === row.id) {
              this.resetForm();
            }
            this.loadMyRecords();
          } else {
            ElMessage({
              message: res.msg || "删除失败",
              type: "error",
            });
          }
        }).catch((error) => {
          ElMessage({
            message: "删除失败，请稍后重试",
            type: "error",
          });
          console.error(error);
        });
      }).catch(() => {});
    },
    resetForm() {
      Object.assign(this.form, createDefaultForm());
      this.isEditing = false;
      this.attachmentFileList = [];
      this.applyStudentInfo();
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
    loadMyRecords() {
      this.loading = true;
      request.get("/leaveRegister/list").then((res) => {
        if (res.code === "0") {
          const allRecords = Array.isArray(res.data) ? res.data : [];
          const studentId = this.form.studentId || this.studentUser?.username || "";
          this.records = allRecords.filter((item) => item?.studentId === studentId);
        } else {
          ElMessage({
            message: res.msg || "离校记录加载失败",
            type: "error",
          });
        }
        this.loading = false;
      }).catch((error) => {
        this.loading = false;
        ElMessage({
          message: "离校记录加载失败",
          type: "error",
        });
        console.error(error);
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
      ElMessage.warning("每条离校申请只能上传 1 个证明文件，如需更换请先移除原文件");
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
  },
};
</script>

<style scoped>
.leave-apply-page {
  gap: 18px;
}

.leave-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
}

.leave-hero__tips {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
  min-width: 300px;
}

.tip-chip {
  padding: 16px 18px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.tip-chip span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
}

.tip-chip strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
  line-height: 1.2;
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

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

  .leave-hero__tips {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .leave-hero {
    padding: 20px;
  }

  .leave-hero__tips {
    grid-template-columns: 1fr;
  }

  .record-actions {
    justify-content: flex-start;
  }
}
</style>


