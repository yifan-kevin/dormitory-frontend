<template>
  <!-- LOCATE: 楼宇信息管理页面，新增楼宇和删除楼宇 -->
  <div class="page-shell building-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: 'home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>宿舍管理</el-breadcrumb-item>
      <el-breadcrumb-item>楼宇信息</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">楼宇档案</span>
            <h3>楼宇信息管理</h3>
          </div>
          <div class="toolbar-shortcuts">
            <el-button type="primary" @click="add">
              <el-icon><Plus /></el-icon>
              新增楼宇
            </el-button>
          </div>
        </div>
      </template>

      <div class="toolbar-actions">
        <el-input v-model="search" clearable placeholder="请输入编号" class="search-input">
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

      <el-table v-loading="loading" :data="tableData" border max-height="705" show-overflow-tooltip
                style="width: 100%; margin-top: 16px">
        <el-table-column label="#" type="index" width="60" />
        <el-table-column label="编号" prop="dormBuildId" sortable min-width="100" />
        <el-table-column label="名称" prop="dormBuildName" min-width="140" />
        <el-table-column
            :filter-method="filterTag"
            :filters="[
            { text: '男宿舍', value: '男宿舍' },
            { text: '女宿舍', value: '女宿舍' },
          ]"
            filter-placement="bottom-end"
            label="备注"
            prop="dormBuildDetail"
            min-width="160"
        />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <el-button circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm title="确认删除该楼宇及其空房间吗？" @confirm="handleDelete(scope.row.dormBuildId)">
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

    <el-dialog v-model="dialogVisible" title="楼宇信息维护" width="560px" @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="modern-form">
        <el-form-item label="编号" prop="dormBuildId">
          <el-input v-model.number="form.dormBuildId" :disabled="disabled" />
        </el-form-item>
        <el-form-item label="名称" prop="dormBuildName">
          <el-input v-model="form.dormBuildName" />
        </el-form-item>
        <el-form-item label="备注" prop="dormBuildDetail">
          <el-input
              v-model="form.dormBuildDetail"
              :autosize="{ minRows: 2, maxRows: 4 }"
              autosize
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
<script src="@/assets/js/BuildingInfo.js"></script>

<style scoped>
.building-page {
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
  letter-spacing: 0;
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

  .pagination-wrap {
    justify-content: flex-start;
  }
}
</style>
