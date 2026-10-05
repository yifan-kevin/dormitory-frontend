<template>
  <!-- LOCATE: 公告信息管理页面 -->
  <div class="page-shell notice-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>信息管理</el-breadcrumb-item>
      <el-breadcrumb-item>公告信息</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">公告管理</span>
            <h3>公告信息管理</h3>
          </div>
          <div class="toolbar-shortcuts">
            <el-button type="primary" @click="add">
              <el-icon><Plus /></el-icon>
              发布公告
            </el-button>
          </div>
        </div>
      </template>

      <div class="toolbar-actions">
        <el-input v-model="search" clearable placeholder="请输入标题" class="search-input">
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
        <el-table-column :show-overflow-tooltip="true" label="标题" prop="title" min-width="200" />
        <el-table-column label="作者" prop="author" width="150px" />
        <el-table-column label="发布时间" prop="releaseTime" sortable min-width="200" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <el-button circle @click="showDetail(scope.row)">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <el-button circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm title="确认删除该公告吗？" @confirm="handleDelete(scope.row.id)">
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

    <el-dialog v-model="dialogVisible" title="公告编辑" width="720px" @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" class="modern-form">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" clearable />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <div id="div1" style="width: 100%; margin: 4px 0"></div>
        </el-form-item>
        <el-form-item label="发布时间" prop="releaseTime">
          <el-date-picker
              v-model="form.releaseTime"
              clearable
              placeholder="选择时间"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="save">发布</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog" title="公告详情" width="720px">
      <div class="notice-detail">
        <div class="notice-detail__content" v-html="detail.content"></div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="closeDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script src="@/assets/js/NoticeInfo.js"></script>

<style scoped>
.notice-page {
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

.notice-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-detail__content {
  padding: 16px;
  border-radius: 8px;
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
  line-height: 1.8;
  color: var(--text-color);
  word-break: break-word;
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
}
</style>
