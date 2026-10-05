<template>
  <!-- LOCATE: 访客管理页面 -->
  <div class="page-shell visitor-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>访客管理</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">访客登记</span>
            <h3>访客信息管理</h3>
          </div>
          <div class="toolbar-shortcuts">
            <el-button type="primary" @click="add">
              <el-icon><Plus /></el-icon>
              登记访客
            </el-button>
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
        <el-table-column label="姓名" prop="visitorName" min-width="120" />
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
        <el-table-column label="手机号" prop="phoneNum" min-width="150" />
        <el-table-column label="来源地" prop="originCity" sortable min-width="120" />
        <el-table-column label="来访时间" prop="visitTime" sortable min-width="200" />
        <el-table-column label="备注" prop="content" :show-overflow-tooltip="true" min-width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <el-button circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm title="确认删除该访客记录吗？" @confirm="handleDelete(scope.row.id)">
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

    <el-dialog v-model="dialogVisible" title="访客信息维护" width="560px" @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="modern-form">
        <div class="form-grid">
          <el-form-item label="姓名" prop="visitorName">
            <el-input v-model="form.visitorName" clearable />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="手机号" prop="phoneNum">
            <el-input v-model="form.phoneNum" clearable />
          </el-form-item>
          <el-form-item label="来源地" prop="originCity">
            <el-input v-model="form.originCity" clearable />
          </el-form-item>
        </div>
        <el-form-item label="来访时间" prop="visitTime">
          <el-date-picker
              v-model="form.visitTime"
              clearable
              placeholder="选择时间"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="来访信息" prop="content">
          <el-input
              v-model="form.content"
              :autosize="{ minRows: 3, maxRows: 10 }"
              autosize
              clearable
              type="textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script src="@/assets/js/VisitorInfo.js"></script>

<style scoped>
.visitor-page {
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
  font-weight: 700;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
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
