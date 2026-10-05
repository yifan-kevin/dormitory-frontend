<template>
  <!-- LOCATE: 宿管信息管理页面，新增宿管和分配楼宇 -->
  <div class="page-shell dormmanager-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>宿管信息</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">宿管档案</span>
            <h3>宿管信息管理</h3>
          </div>
          <div class="toolbar-shortcuts">
            <button class="primary-action-button" type="button" @click.prevent.stop="openAddDialog">
              <el-icon><Plus /></el-icon>
              <span>新增宿管</span>
            </button>
          </div>
        </div>
      </template>

      <div class="toolbar-actions">
        <el-input v-model="search" clearable placeholder="请输入姓名" class="search-input">
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

      <el-table v-loading="loading" :data="tableData" border max-height="705" style="width: 100%; margin-top: 16px">
        <el-table-column label="#" type="index" width="60" />
        <el-table-column label="账号" prop="username" sortable min-width="120" />
        <el-table-column label="姓名" prop="name" min-width="100" />
        <el-table-column
            :filter-method="filterTag"
            :filters="[
            { text: '男', value: '男' },
            { text: '女', value: '女' },
          ]"
            filter-placement="bottom-end"
            label="性别"
            prop="gender"
            min-width="90"
        />
        <el-table-column label="年龄" prop="age" sortable min-width="90" />
        <el-table-column label="手机号" prop="phoneNum" min-width="140" />
        <el-table-column label="邮箱" prop="email" :show-overflow-tooltip="true" min-width="200" />
        <el-table-column label="任职宿舍楼" prop="dormBuildIds" sortable min-width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <el-button circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm title="确认删除该宿管信息吗？" @confirm="handleDelete(scope.row.username)">
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

    <div v-if="dialogVisible" class="manager-modal-mask" @click.self="cancel">
      <section class="manager-modal" role="dialog" aria-modal="true" aria-label="宿管信息维护">
        <header class="manager-modal__header">
          <h3>宿管信息维护</h3>
          <button class="manager-modal__close" type="button" aria-label="关闭" @click="cancel">×</button>
        </header>
        <div class="manager-modal__body">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="modern-form">
            <el-form-item label="账号" prop="username">
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
            <el-form-item :style="display" label="确认密码" prop="checkPass">
              <el-input v-model="form.checkPass" :show-password="showpassword" />
            </el-form-item>
            <div class="form-grid">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" />
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
                <el-input v-model="form.phoneNum" />
              </el-form-item>
            </div>
            <el-form-item label="邮箱地址" prop="email">
              <el-input v-model="form.email" />
            </el-form-item>
            <el-form-item label="任职宿舍楼" prop="dormBuildIds">
              <el-input v-model="form.dormBuildIds" placeholder="1,2" />
            </el-form-item>
          </el-form>
        </div>
        <footer class="manager-modal__footer">
          <button class="modal-secondary-button" type="button" @click="cancel">取消</button>
          <button class="modal-primary-button" type="button" @click="save">保存</button>
        </footer>
      </section>
    </div>
  </div>
</template>
<script src="@/assets/js/DormManagerInfo.js"></script>

<style scoped>
.dormmanager-page {
  gap: 18px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.card-header__kicker {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: rgba(36, 91, 71, 0.1);
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.card-header h3 {
  font-size: 18px;
  line-height: 1.5;
  color: var(--text-color);
  font-weight: 600;
}

.toolbar-shortcuts {
  display: flex;
  gap: 10px;
}

.primary-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  box-shadow: none;
}

.primary-action-button:hover {
  background: var(--primary-strong);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: min(300px, 100%);
}

.action-group {
  display: flex;
  gap: 10px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.modern-form {
  padding-top: 8px;
}

.manager-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 7000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(27, 39, 31, 0.35);
}

.manager-modal {
  width: min(640px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface-color);
  box-shadow: 0 12px 48px rgba(27, 39, 31, 0.14);
}

.manager-modal__header,
.manager-modal__footer {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.manager-modal__header {
  justify-content: space-between;
  padding: 20px 24px 8px;
}

.manager-modal__header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.manager-modal__close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-color-muted);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}

.manager-modal__close:hover {
  background: rgba(36, 91, 71, 0.1);
  color: var(--primary-color);
}

.manager-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 24px 4px;
}

.manager-modal__footer {
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 24px 20px;
}

.modal-secondary-button,
.modal-primary-button {
  min-width: 72px;
  height: 38px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.modal-secondary-button {
  border: 0;
  background: transparent;
  color: var(--text-color);
}

.modal-secondary-button:hover {
  background: var(--surface-soft);
}

.modal-primary-button {
  border: 0;
  background: var(--primary-color);
  color: #fff;
  box-shadow: none;
}

.modal-primary-button:hover {
  background: var(--primary-strong);
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

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
  }

  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
