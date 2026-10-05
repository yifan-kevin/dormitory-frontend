<template>
  <!-- LOCATE: 学生调宿申请页面 -->
  <div class="page-shell applychange-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>申请管理</el-breadcrumb-item>
      <el-breadcrumb-item>调宿申请</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <span class="card-header__kicker">我的申请</span>
            <h3>申请调宿</h3>
          </div>
          <div class="toolbar-shortcuts">
            <el-button type="primary" @click="add">
              <el-icon><Plus /></el-icon>
              新建申请
            </el-button>
          </div>
        </div>
      </template>

      <div class="toolbar-actions">
        <el-input v-model="search" clearable placeholder="请输入学号" class="search-input">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="load">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border max-height="705" style="width: 100%; margin-top: 16px">
        <el-table-column label="#" type="index" width="60" />
        <el-table-column label="学号" prop="username" sortable min-width="100" />
        <el-table-column label="姓名" prop="name" min-width="100" />
        <el-table-column label="当前房间号" prop="currentRoomId" sortable min-width="110" />
        <el-table-column label="当前床位号" prop="currentBedId" sortable min-width="110" />
        <el-table-column label="目标房间号" prop="towardsRoomId" sortable min-width="110" />
        <el-table-column label="目标床位号" prop="towardsBedId" sortable min-width="110" />
        <el-table-column label="申请理由" prop="reason" min-width="180" show-overflow-tooltip />
        <el-table-column label="附件" min-width="130">
          <template #default="scope">
            <el-link v-if="hasAttachment(scope.row)" type="primary" @click.prevent="previewAttachment(scope.row)">
              预览附件
            </el-link>
              <span v-else class="empty-text">未上传</span>
          </template>
        </el-table-column>
        <el-table-column
            :filter-method="filterTag"
            :filters="[
            { text: '未处理', value: '未处理' },
            { text: '通过', value: '通过' },
            { text: '驳回', value: '驳回' },
          ]"
            filter-placement="bottom-end"
            label="申请状态"
            prop="state"
            sortable
            min-width="120"
        >
          <template #default="scope">
            <el-tag :type="scope.row.state === '通过' ? 'success' : (scope.row.state === '驳回' ? 'danger' : 'info')"
                    disable-transitions
            >{{ scope.row.state }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" prop="applyTime" sortable min-width="180" />
        <el-table-column label="处理时间" prop="finishTime" sortable min-width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-group">
              <el-button circle @click="showDetail(scope.row)">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <el-button v-if="canEditAdjust(scope.row)" circle type="primary" @click="handleEdit(scope.row)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button v-if="canDeleteAdjust(scope.row)" circle type="danger" @click="handleDelete(scope.row.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
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

    <el-dialog v-model="dialogVisible" title="调宿申请" width="640px" @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" class="modern-form">
        <div class="form-grid">
          <el-form-item label="学号" prop="username">
            <el-input v-model="form.username" disabled />
          </el-form-item>
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" disabled />
          </el-form-item>
          <el-form-item label="当前房间号" prop="currentRoomId">
            <el-input v-model="form.currentRoomId" disabled />
          </el-form-item>
          <el-form-item label="当前床位号" prop="currentBedId">
            <el-input v-model="form.currentBedId" disabled />
          </el-form-item>
          <el-form-item label="目标房间号" prop="towardsRoomId">
            <el-select
                v-model="form.towardsRoomId"
                filterable
                clearable
                :loading="roomOptionsLoading"
                placeholder="请选择可入住房间"
                style="width: 100%"
                @change="handleTargetRoomChange"
            >
              <el-option
                  v-for="room in availableRoomOptions"
                  :key="room.dormRoomId"
                  :label="formatRoomOption(room)"
                  :value="room.dormRoomId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标床位号" prop="towardsBedId">
            <el-select
                v-model="form.towardsBedId"
                filterable
                clearable
                :disabled="!form.towardsRoomId"
                :loading="bedOptionsLoading"
                placeholder="请选择空床位"
                style="width: 100%"
            >
              <el-option
                  v-for="bedNo in availableBedOptions"
                  :key="bedNo"
                  :label="formatBedOption(bedNo)"
                  :value="bedNo"
              />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="申请时间" prop="applyTime">
          <el-date-picker
              v-model="form.applyTime"
              :disabled="!judgeOption"
              clearable
              placeholder="选择时间"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="调宿理由" prop="reason">
          <el-input
              v-model="form.reason"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="请填写调宿原因，例如作息冲突、学习安排、身体原因等"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
              class="attachment-upload"
              action="/api/files/uploadAdjustAttachment"
              accept=".jpg,.jpeg,.png,.pdf,.txt,.csv,.docx,.xls,.xlsx"
              :limit="1"
              :file-list="attachmentFileList"
              :before-upload="beforeAttachmentUpload"
              :on-success="handleAttachmentSuccess"
              :on-preview="handleAttachmentPreview"
              :on-remove="handleAttachmentRemove"
              :on-exceed="handleAttachmentExceed"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              上传附件
            </el-button>
            <template #tip>
              <div class="attachment-tip">可上传图片、PDF、TXT、DOCX 或 Excel，单个文件不超过 10MB。上传后点击文件名可预览。</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="save">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog" title="调宿申请详情" width="640px" @close="cancel">
      <div class="detail-stack">
        <div class="detail-grid">
          <div class="detail-item"><span>学号</span><strong>{{ form.username }}</strong></div>
          <div class="detail-item"><span>姓名</span><strong>{{ form.name }}</strong></div>
          <div class="detail-item"><span>当前房间号</span><strong>{{ form.currentRoomId }}</strong></div>
          <div class="detail-item"><span>当前床位号</span><strong>{{ form.currentBedId }}</strong></div>
          <div class="detail-item"><span>目标房间号</span><strong>{{ form.towardsRoomId }}</strong></div>
          <div class="detail-item"><span>目标床位号</span><strong>{{ form.towardsBedId }}</strong></div>
          <div class="detail-item"><span>申请时间</span><strong>{{ form.applyTime }}</strong></div>
          <div class="detail-item"><span>申请状态</span><strong>{{ form.state }}</strong></div>
          <div class="detail-item"><span>处理时间</span><strong>{{ form.finishTime }}</strong></div>
          <div class="detail-item detail-item--wide"><span>调宿理由</span><strong>{{ form.reason || '未填写' }}</strong></div>
          <div class="detail-item detail-item--wide">
            <span>附件</span>
            <strong>
              <el-link v-if="hasAttachment(form)" type="primary" @click.prevent="previewAttachment(form)">
                {{ form.attachmentName || '预览附件' }}
              </el-link>
              <span v-else class="empty-text">未上传附件</span>
            </strong>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
        v-model="attachmentPreviewVisible"
        :title="attachmentPreviewTitle || '附件预览'"
        width="860px"
        class="attachment-preview-dialog"
        @closed="closeAttachmentPreview"
    >
      <div class="attachment-preview">
        <img
            v-if="attachmentPreviewType === 'image'"
            :src="attachmentPreviewUrl"
            alt="附件预览"
            class="attachment-preview__image"
        />
        <iframe
            v-else-if="attachmentPreviewType === 'frame' || attachmentPreviewType === 'office'"
            :src="attachmentPreviewUrl"
            class="attachment-preview__frame"
            title="附件预览"
        ></iframe>
        <div v-else class="attachment-preview__empty">
          <p>该文件类型暂不支持页面内预览。</p>
          <el-link :href="attachmentPreviewDownloadUrl" target="_blank" type="primary">打开原文件</el-link>
        </div>
      </div>
    </el-dialog>
  </div>
</template>
<script src="@/assets/js/ApplyChangeRoom.js"></script>

<style scoped>
.applychange-page {
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

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.detail-item span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
  margin-bottom: 6px;
}

.detail-item strong {
  display: block;
  color: var(--text-color);
  font-size: 15px;
}

.detail-item--wide {
  grid-column: 1 / -1;
}

.empty-text {
  color: var(--text-color-muted);
  font-size: 13px;
}

.attachment-upload {
  width: 100%;
}

.attachment-tip {
  color: var(--text-color-muted);
  font-size: 12px;
  line-height: 1.6;
  margin-top: 6px;
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

  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>


