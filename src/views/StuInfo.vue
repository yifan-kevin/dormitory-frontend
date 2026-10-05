<template>
  <!-- LOCATE: 学生信息管理页面，新增、导入、删除学生 -->
  <div class="page-shell student-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>学生信息</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="student-hero">
      <div class="student-hero__copy">
        <h1 class="page-title">学生信息管理</h1>
      </div>

      <div class="student-hero__stats">
        <div class="stat-pill">
          <span class="stat-pill__label">学生总数</span>
          <strong class="stat-pill__value">{{ total || 0 }}</strong>
        </div>
        <div class="stat-pill">
          <span class="stat-pill__label">当前页记录</span>
          <strong class="stat-pill__value">{{ tableData.length }}</strong>
        </div>
        <div v-if="canCreateStudents" class="stat-pill">
          <span class="stat-pill__label">导入状态</span>
          <strong class="stat-pill__value">{{ file ? "待导入" : "就绪" }}</strong>
        </div>
      </div>
    </section>

    <section class="student-toolbar-grid" :class="{ 'student-toolbar-grid--single': !canCreateStudents }">
      <el-card class="toolbar-card section-card">
        <div class="toolbar-card__header">
          <div>
            <h3>学生档案</h3>
          </div>
          <div v-if="canCreateStudents" class="toolbar-shortcuts">
            <el-button type="success" @click="handleImport">
              <el-icon><Upload /></el-icon>
              Excel 导入
            </el-button>
            <el-button type="primary" @click="openCreateDialog">
              <el-icon><Plus /></el-icon>
              新增学生
            </el-button>
          </div>
        </div>

        <div class="toolbar-actions">
          <el-input
            v-model="search"
            clearable
            placeholder="请输入姓名、学号、院系或班级"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="load">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="reset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </el-card>

      <el-card v-if="canCreateStudents" class="import-card">
        <div class="import-card__header">
          <strong>导入状态</strong>
        </div>

        <div class="import-card__item">
          <span>标准格式</span>
          <strong>9 列</strong>
        </div>
        <div class="import-card__item">
          <span>文件类型</span>
          <strong>.xlsx / .xls</strong>
        </div>
        <div class="import-card__item">
          <span>当前文件</span>
          <strong>{{ file ? file.name : "未选择" }}</strong>
        </div>
      </el-card>
    </section>

    <el-card class="table-card section-card">
      <template #header>
        <div class="table-card__header">
          <div>
            <h3>学生信息列表</h3>
          </div>
          <div class="table-card__meta">共 {{ total || 0 }} 条记录</div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        max-height="705"
        style="width: 100%"
      >
        <el-table-column label="#" type="index" width="60" />
        <el-table-column label="学号" prop="username" sortable min-width="120" />
        <el-table-column label="姓名" prop="name" min-width="100" />
        <el-table-column label="院系" prop="department" min-width="140" />
        <el-table-column label="班级" prop="className" min-width="140" />
        <el-table-column label="学生状态" min-width="120">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.studentStatus)" effect="plain">
              {{ statusText(scope.row.studentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :filter-method="filterTag"
          :filters="[
            { text: '男', value: '男' },
            { text: '女', value: '女' }
          ]"
          filter-placement="bottom-end"
          label="性别"
          prop="gender"
          min-width="90"
        />
        <el-table-column label="年龄" prop="age" sortable min-width="90" />
        <el-table-column label="手机号" prop="phoneNum" min-width="140" />
        <el-table-column label="邮箱" prop="email" :show-overflow-tooltip="true" min-width="210" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <el-button circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm title="确认删除该学生信息吗？" @confirm="handleDelete(scope.row.username)">
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

      <div class="pagination-wrap">
        <el-pagination
          v-model:currentPage="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      title="学生信息维护"
      width="640px"
      :lock-scroll="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="student-form">
        <el-form-item label="学号" prop="username">
          <el-input v-model="form.username" :disabled="judgeAddOrEdit" />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <div class="password-row">
            <el-input v-model="form.password" :disabled="disabled" :show-password="showpassword" />
            <el-tooltip v-if="judgeAddOrEdit" content="修改密码" placement="right">
              <el-button circle @click="EditPass">
                <el-icon><Edit /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </el-form-item>

        <el-form-item v-show="!editJudge" label="确认密码" prop="checkPass">
          <el-input v-model="form.checkPass" :show-password="showpassword" />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" />
          </el-form-item>

          <el-form-item label="院系" prop="department">
            <el-input v-model.trim="form.department" placeholder="例如：计算机学院" />
          </el-form-item>

          <el-form-item label="班级" prop="className">
            <el-input v-model.trim="form.className" placeholder="例如：软件工程2242" />
          </el-form-item>

          <el-form-item label="年龄" prop="age">
            <el-input v-model.number="form.age" />
          </el-form-item>

          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="手机号" prop="phoneNum">
            <el-input v-model.trim="form.phoneNum" />
          </el-form-item>
        </div>

        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="save">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="Excel 导入学生信息" width="560px">
      <div class="import-panel">
        <el-upload
          class="upload-demo"
          action=""
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="true"
          accept=".xlsx,.xls"
          :limit="1"
          :file-list="fileList"
          drag
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">将 Excel 文件拖到此处，或 <em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持 `.xlsx` 和 `.xls`，列顺序：学号、密码、姓名、年龄、性别、手机号、邮箱、院系、班级。
            </div>
          </template>
        </el-upload>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="importExcel">开始导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script src="@/assets/js/StuInfo.js"></script>

<style scoped>
.student-page {
  gap: 18px;
}

.student-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #fdfefb;
  box-shadow: var(--shadow-card);
}

.student-hero .page-title {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0;
}

.student-hero__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 14px 22px;
  border-left: 2px solid #c5ad77;
  border-radius: 0 8px 8px 0;
  background: #f5f5ed;
}

.stat-pill {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-pill__label {
  font-size: 12px;
  color: var(--text-color-muted);
  font-weight: 500;
}

.stat-pill__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  font-variant-numeric: tabular-nums;
}

.student-toolbar-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
}

.student-toolbar-grid--single {
  grid-template-columns: 1fr;
}

.toolbar-card__header,
.table-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.toolbar-card__header h3,
.table-card__header h3,
.import-card__header strong {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-color);
}

.toolbar-shortcuts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.search-input {
  width: min(360px, 100%);
  min-width: 160px;
  flex: 1 1 220px;
}

.import-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.import-card__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  background: transparent;
}

.import-card__item span {
  color: var(--text-color-muted);
  font-size: 13px;
}

.import-card__item strong {
  color: var(--text-color);
  font-size: 13px;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.table-card__meta {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 0;
  color: var(--text-color-secondary);
  font-size: 12px;
  font-weight: 400;
}

.action-group {
  display: flex;
  gap: 10px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
}

.student-form {
  padding-top: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.password-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  width: 100%;
}

.import-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 1200px) {
  .student-toolbar-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .student-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
  }
}

@media (max-width: 768px) {
  .student-hero { padding: 20px 16px; }
  .student-hero__stats { width: 100%; padding: 14px 16px; gap: 24px; }
  .toolbar-card__header,
  .toolbar-actions,
  .toolbar-shortcuts {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
    flex: 0 1 auto;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .pagination-wrap {
    justify-content: flex-start;
  }
}
</style>
