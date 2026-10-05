<template>
  <!-- LOCATE: 贵重物品登记页面 -->
  <div class="page-shell valuable-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>贵重物品出入登记</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card valuable-hero">
      <div>
        <div class="page-eyebrow">Valuable Items</div>
        <h1 class="page-title">贵重物品出入登记</h1>
        <p class="page-subtitle">登记学生携带的贵重物品出入信息，方便管理与追溯。</p>
      </div>
      <div class="hero-stats">
        <div class="stat-pill">
          <span class="stat-pill__label">总登记</span>
          <strong class="stat-pill__value">{{ registerRecords.length }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">入库</span>
          <strong class="stat-pill__value">{{ registerRecords.filter(r => r.type === '入').length }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">出库</span>
          <strong class="stat-pill__value">{{ registerRecords.filter(r => r.type === '出').length }}</strong>
        </div>
      </div>
    </section>

    <section class="valuable-layout">
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <div>
              <div class="card-kicker">Registration Form</div>
              <h3>{{ judgeOption ? "修改登记" : "新增登记" }}</h3>
            </div>
            <el-tag :type="judgeOption ? 'warning' : 'success'" effect="dark">
              {{ judgeOption ? "编辑中" : "新登记" }}
            </el-tag>
          </div>
        </template>

        <el-form
          ref="form"
          :model="form"
          :rules="rules"
          label-width="100px"
          class="register-form"
        >
          <div class="form-grid">
            <el-form-item label="学生学号" prop="studentId">
              <el-input v-model.trim="form.studentId" placeholder="请输入学生学号" />
            </el-form-item>
            <el-form-item label="学生姓名" prop="studentName">
              <el-input v-model.trim="form.studentName" placeholder="请输入学生姓名" />
            </el-form-item>
            <el-form-item label="物品名称" prop="itemName">
              <el-input v-model.trim="form.itemName" placeholder="请输入物品名称" />
            </el-form-item>
            <el-form-item label="物品价值" prop="itemValue">
              <el-input v-model.number="form.itemValue" placeholder="请输入物品价值" />
            </el-form-item>
            <el-form-item label="出入类型" prop="type">
              <el-radio-group v-model="form.type">
                <el-radio label="入">入</el-radio>
                <el-radio label="出">出</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="登记时间" prop="registerTime">
              <el-date-picker
                v-model="form.registerTime"
                type="datetime"
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="请选择登记时间"
                style="width: 100%"
              />
            </el-form-item>
          </div>
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model.trim="form.remark"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="请输入备注"
            />
          </el-form-item>
          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" :loading="submitting" @click="submitRegister">
                {{ judgeOption ? "保存修改" : "提交登记" }}
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
              <h3>登记记录</h3>
            </div>
          </div>
        </template>

        <el-table v-loading="loading" :data="registerRecords" border style="width: 100%">
          <el-table-column label="登记时间" width="180">
            <template #default="scope">
              {{ formatDisplayTime(scope.row.registerTime) }}
            </template>
          </el-table-column>
          <el-table-column label="学生学号" prop="studentId" width="120" />
          <el-table-column label="学生姓名" prop="studentName" width="120" />
          <el-table-column label="物品名称" prop="itemName" min-width="140" />
          <el-table-column label="物品价值" prop="itemValue" width="100" />
          <el-table-column label="出入类型" prop="type" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.type === '入' ? 'success' : 'danger'">
                {{ scope.row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="登记人" prop="register" width="120" />
          <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="scope">
              <div class="action-group">
                <el-button circle type="primary" @click="handleEdit(scope.row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-popconfirm title="确认删除该记录吗？" @confirm="handleDelete(scope.row.id)">
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

        <el-empty v-if="!loading && !registerRecords.length" description="暂无登记记录" />
      </el-card>
    </section>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage } from "element-plus";

export default {
  name: "ValuableItemRegister",
  data() {
    return {
      form: this.createDefaultForm(),
      rules: {
        studentId: [{ required: true, message: "请输入学生学号", trigger: "blur" }],
        studentName: [{ required: true, message: "请输入学生姓名", trigger: "blur" }],
        itemName: [{ required: true, message: "请输入物品名称", trigger: "blur" }],
        itemValue: [
          { required: true, message: "请输入物品价值", trigger: "blur" },
          { type: "number", message: "请输入数字", trigger: "blur" },
        ],
        type: [{ required: true, message: "请选择出入类型", trigger: "change" }],
        registerTime: [{ required: true, message: "请选择登记时间", trigger: "change" }],
      },
      loading: false,
      submitting: false,
      registerRecords: [],
      judgeOption: false,
    };
  },
  created() {
    this.loadRegisterRecords();
  },
  methods: {
    createDefaultForm() {
      return {
        id: null,
        studentId: "",
        studentName: "",
        itemName: "",
        itemValue: null,
        type: "入",
        registerTime: new Date(),
        register: "管理员",
        remark: "",
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
    buildPayload() {
      return {
        ...this.form,
        itemValue: Number(this.form.itemValue),
        registerTime: this.formatDateTime(this.form.registerTime),
      };
    },
    loadRegisterRecords() {
      this.loading = true;
      request.get("/valuableItem/list").then((res) => {
        if (res.code === "0") {
          this.registerRecords = res.data || [];
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
          message: "加载登记记录失败",
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
        if (!payload.registerTime) {
          ElMessage({
            message: "登记时间格式不正确，请重新选择",
            type: "warning",
          });
          return;
        }

        this.submitting = true;
        const requestPromise = this.judgeOption
          ? request.put("/valuableItem/update", payload)
          : request.post("/valuableItem/register", payload);

        requestPromise.then((res) => {
          this.submitting = false;
          if (res.code === "0") {
            ElMessage({
              message: this.judgeOption ? "修改成功" : "登记提交成功",
              type: "success",
            });
            this.resetForm();
            this.loadRegisterRecords();
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
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
    handleDelete(id) {
      request.delete("/valuableItem/delete/" + id).then((res) => {
        if (res.code === "0") {
          ElMessage({
            message: "删除成功",
            type: "success",
          });
          this.loadRegisterRecords();
        } else {
          ElMessage({
            message: res.msg,
            type: "error",
          });
        }
      });
    },
    handleEdit(row) {
      Object.assign(this.form, {
        id: row.id,
        studentId: row.studentId || "",
        studentName: row.studentName || "",
        itemName: row.itemName || "",
        itemValue: row.itemValue,
        type: row.type || "入",
        registerTime: this.parseDateTime(row.registerTime) || new Date(),
        register: row.register || "管理员",
        remark: row.remark || "",
      });
      this.judgeOption = true;
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate();
        }
      });
    },
  },
};
</script>

<style scoped>
.valuable-page {
  gap: 18px;
}

.valuable-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  gap: 12px;
  min-width: 320px;
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

.valuable-layout {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.1fr);
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

.register-form {
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

@media (max-width: 1200px) {
  .valuable-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .valuable-hero {
    flex-direction: column;
  }

  .hero-stats {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .valuable-hero {
    padding: 20px;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
