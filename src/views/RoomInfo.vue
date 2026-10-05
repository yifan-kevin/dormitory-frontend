<template>
  <!-- LOCATE: 房间信息管理页面，房间床位维护 -->
  <div class="page-shell room-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>宿舍管理</el-breadcrumb-item>
      <el-breadcrumb-item>房间信息</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <div>
            <h3>房间信息管理</h3>
            <p>查询房间、入住情况与可用床位。</p>
          </div>
          <div class="toolbar-shortcuts">
            <el-button type="primary" @click="add">
              <el-icon><Plus /></el-icon>
              新增房间
            </el-button>
          </div>
        </div>
      </template>

      <div class="room-summary-grid">
        <article class="room-summary-card">
          <span>宿舍总数</span>
          <strong>{{ roomSummary.totalRoomCount }}</strong>
          <small>当前已登记的宿舍房间</small>
        </article>
        <article class="room-summary-card room-summary-card--empty">
          <span>空宿舍</span>
          <strong>{{ roomSummary.emptyRoomCount }}</strong>
          <small>当前无人入住的宿舍</small>
        </article>
        <article class="room-summary-card room-summary-card--occupied">
          <span>已住宿舍</span>
          <strong>{{ roomSummary.occupiedRoomCount }}</strong>
          <small>至少有 1 名学生入住</small>
        </article>
        <article class="room-summary-card">
          <span>可用床位</span>
          <strong>{{ roomSummary.availableBedCount }}</strong>
          <small>仍可继续分配入住</small>
        </article>
      </div>

      <div class="room-board-toolbar">
        <div class="toolbar-actions">
          <el-input
            v-model="search"
            clearable
            placeholder="请输入房间号"
            class="search-input"
            @keyup.enter="load"
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
        <div class="room-board-toolbar__meta">
          <span>当前页 {{ visibleRooms.length }} 间房</span>
          <span>共 {{ filteredRoomCount }} 间房</span>
        </div>
      </div>

      <div v-if="buildingOptions.length" class="floor-filter">
        <span class="floor-filter__label">楼宇</span>
        <div class="floor-filter__chips">
          <button
            type="button"
            class="floor-chip"
            :class="{ 'floor-chip--active': activeBuilding === 'all' }"
            @click="setActiveBuilding('all')"
          >
            全部
          </button>
          <button
            v-for="building in buildingOptions"
            :key="building.id"
            type="button"
            class="floor-chip"
            :class="{ 'floor-chip--active': String(activeBuilding) === String(building.id) }"
            @click="setActiveBuilding(building.id)"
          >
            {{ building.name }}
          </button>
        </div>
      </div>

      <div v-if="floorOptions.length" class="floor-filter floor-filter--secondary">
        <span class="floor-filter__label">楼层</span>
        <div class="floor-filter__chips">
          <button
            type="button"
            class="floor-chip"
            :class="{ 'floor-chip--active': activeFloor === 'all' }"
            @click="setActiveFloor('all')"
          >
            全部
          </button>
          <button
            v-for="floor in floorOptions"
            :key="floor"
            type="button"
            class="floor-chip"
            :class="{ 'floor-chip--active': String(activeFloor) === String(floor) }"
            @click="setActiveFloor(floor)"
          >
            {{ floor }}楼
          </button>
        </div>
      </div>

      <div v-loading="loading" class="room-board">
        <article
          v-for="room in visibleRooms"
          :key="room.dormRoomId"
          class="room-card"
        >
          <div class="room-card__header">
            <div class="room-card__title-wrap">
              <div class="room-card__title-row">
                <strong>{{ room.dormRoomId }}</strong>
                <span class="room-card__type">{{ getDisplayCapacity(room) }}人间</span>
                <span class="room-card__count">{{ getOccupiedCount(room) }}/{{ getDisplayCapacity(room) }}</span>
              </div>
              <p>{{ getBuildingLabel(room.dormBuildId) }} · {{ room.floorNum }}楼</p>
            </div>
            <div class="room-card__actions">
              <el-button circle type="primary" plain @click="handleEdit(room)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-popconfirm title="确认删除该房间吗？" @confirm="handleDelete(room.dormRoomId)">
                <template #reference>
                  <el-button circle type="danger" plain>
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>

          <div class="room-beds-grid">
            <div
              v-for="bed in getRoomBeds(room)"
              :key="bed.key"
              class="room-bed"
              :class="{
                'room-bed--occupied': bed.occupied,
                'room-bed--empty': !bed.occupied,
              }"
            >
              <div class="room-bed__head">
                <span>{{ bed.label }}</span>
                <el-tag
                  :type="bed.occupied ? 'success' : 'info'"
                  effect="plain"
                  disable-transitions
                >
                  {{ bed.occupied ? '已入住' : '空床位' }}
                </el-tag>
              </div>

              <template v-if="bed.occupied">
                <strong class="room-bed__value">{{ bed.value }}</strong>
                <p class="room-bed__hint">当前床位已分配学生学号</p>
                <div class="room-bed__actions">
                  <button type="button" class="bed-action-link" @click="detailIcon(bed.index, room)">查看</button>
                  <button v-if="canAssignBeds" type="button" class="bed-action-link" @click="editIcon(bed.index, room)">编辑</button>
                  <el-popconfirm v-if="canAssignBeds" title="确认移出该床位学生吗？" @confirm="deleteStuBed(bed.index, room)">
                    <template #reference>
                      <button type="button" class="bed-action-link bed-action-link--danger">移出</button>
                    </template>
                  </el-popconfirm>
                </div>
              </template>

              <template v-else>
                <p class="room-bed__empty-copy">这个床位还没有安排入住。</p>
                <div v-if="canAssignBeds" class="room-bed__empty-actions">
                  <el-button class="room-bed__add" type="primary" plain @click="plusIcon(bed.index, room)">
                    <el-icon><Plus /></el-icon>
                    添加入住
                  </el-button>
                  <button type="button" class="room-bed__helper" @click="openUnassignedStudents(room, bed.index)">
                    查看未分配学生
                  </button>
                </div>
              </template>
            </div>
          </div>
        </article>

        <el-empty
          v-if="!loading && visibleRooms.length === 0"
          class="room-board__empty"
          description="当前条件下没有房间数据"
        />
      </div>

      <div class="pagination-wrap">
        <el-pagination
          v-model:currentPage="currentPage"
          :page-size="pageSize"
          :page-sizes="[8, 12, 16, 20]"
          :total="filteredRoomCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="房间信息维护" width="560px" @close="cancel">
      <el-form ref="roomFormRef" :model="form" :rules="rules" label-width="120px" class="modern-form">
        <div class="form-grid">
          <el-form-item label="楼栋号" prop="dormBuildId">
            <el-input v-model.number="form.dormBuildId" />
          </el-form-item>
          <el-form-item label="楼层数" prop="floorNum">
            <el-input v-model.number="form.floorNum" />
          </el-form-item>
          <el-form-item label="房间号" prop="dormRoomId">
            <el-input v-model.number="form.dormRoomId" :disabled="disabled" />
          </el-form-item>
          <el-form-item label="最多可住人数" prop="maxCapacity">
            <el-input v-model.number="form.maxCapacity" />
          </el-form-item>
        </div>
        <el-form-item label="已住人数" prop="currentCapacity">
          <el-input v-model.number="form.currentCapacity" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button type="primary" @click="save">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="bedDialog" title="床位操作" width="560px" @close="cancel">
      <el-form ref="bedFormRef" :model="form" :rules="rules" label-width="120px" class="modern-form">
        <div class="form-grid">
          <el-form-item label="楼栋号" prop="dormBuildId">
            <el-input v-model.number="form.dormBuildId" disabled />
          </el-form-item>
          <el-form-item label="楼层数" prop="floorNum">
            <el-input v-model.number="form.floorNum" disabled />
          </el-form-item>
        </div>
        <el-form-item label="房间号" prop="dormRoomId">
          <el-input v-model.number="form.dormRoomId" disabled />
        </el-form-item>
        <el-form-item v-if="bedNum === 1" label="床位(一)" prop="firstBed">
          <el-input v-model.number="form.firstBed" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item v-if="bedNum === 2" label="床位(二)" prop="secondBed">
          <el-input v-model.number="form.secondBed" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item v-if="bedNum === 3" label="床位(三)" prop="thirdBed">
          <el-input v-model.number="form.thirdBed" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item v-if="bedNum === 4" label="床位(四)" prop="fourthBed">
          <el-input v-model.number="form.fourthBed" placeholder="请输入学号" />
        </el-form-item>
        <div v-if="judge === false && canAssignBeds" class="bed-dialog-helper">
          <span>不确定填谁时，可以先看还没安排宿舍的学生。</span>
          <el-button type="primary" link @click="openCurrentBedCandidates">查看未分配学生</el-button>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancel">取消</el-button>
          <el-button v-if="judge === false && canAssignBeds" type="primary" @click="addStuBed">确定</el-button>
          <el-button v-if="judge === true && canAssignBeds" type="primary" @click="editStuBed">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="unassignedDialog" title="未分配床位学生" width="860px" @close="closeUnassignedDialog">
      <div class="unassigned-panel">
        <div class="unassigned-panel__header">
          <div class="unassigned-panel__context">
            <strong v-if="pendingBedContext">
              当前准备分配到 {{ pendingBedContext.room.dormRoomId }} 的 {{ pendingBedContext.bedIndex }}号床
            </strong>
            <span>这里只显示还没有安排宿舍床位的学生。</span>
          </div>
          <div class="unassigned-toolbar">
            <el-input
              v-model="unassignedSearch"
              clearable
              placeholder="搜索学号、姓名、院系或班级"
              class="unassigned-toolbar__input"
              @keyup.enter="loadUnassignedStudents"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="loadUnassignedStudents">查询</el-button>
            <el-button @click="resetUnassignedSearch">重置</el-button>
          </div>
        </div>

        <el-table v-loading="unassignedLoading" :data="unassignedStudents" border class="unassigned-table">
          <el-table-column label="学号" prop="username" min-width="120" />
          <el-table-column label="姓名" prop="name" min-width="100" />
          <el-table-column label="性别" prop="gender" min-width="80" />
          <el-table-column label="学生状态" min-width="110">
            <template #default="scope">
              <el-tag :type="statusTagType(scope.row.studentStatus)" effect="plain">
                {{ statusText(scope.row.studentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="院系" prop="department" min-width="150" show-overflow-tooltip />
          <el-table-column label="班级" prop="className" min-width="150" show-overflow-tooltip />
          <el-table-column v-if="canAssignBeds" label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button type="primary" link @click="assignSelectedStudent(scope.row)">选择入住</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap pagination-wrap--dialog">
          <el-pagination
            v-model:currentPage="unassignedPage"
            :page-size="unassignedPageSize"
            :page-sizes="[8, 12, 16]"
            :total="unassignedTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleUnassignedSizeChange"
            @current-change="handleUnassignedPageChange"
          />
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="stuInfoDialog" title="学生信息" width="560px" @close="cancel">
      <div class="detail-grid">
        <div class="detail-item"><span>学号</span><strong>{{ form.username }}</strong></div>
        <div class="detail-item"><span>姓名</span><strong>{{ form.name }}</strong></div>
        <div class="detail-item"><span>年龄</span><strong>{{ form.age }}</strong></div>
        <div class="detail-item"><span>性别</span><strong>{{ form.gender }}</strong></div>
        <div class="detail-item">
          <span>学生状态</span>
          <strong>
            <el-tag :type="statusTagType(form.studentStatus)" effect="plain">
              {{ statusText(form.studentStatus) }}
            </el-tag>
          </strong>
        </div>
        <div class="detail-item"><span>手机号</span><strong>{{ form.phoneNum }}</strong></div>
        <div class="detail-item"><span>邮箱</span><strong>{{ form.email }}</strong></div>
        <div class="detail-item"><span>状态来源</span><strong>{{ form.statusSource || "学生档案" }}</strong></div>
      </div>
    </el-dialog>
  </div>
</template>

<script src="@/assets/js/RoomInfo.js"></script>

<style scoped>
.room-page {
  gap: 18px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.card-header h3 {
  font-size: 20px;
  line-height: 1.4;
  color: var(--text-color);
  font-weight: 600;
}

.card-header p {
  margin-top: 8px;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.toolbar-shortcuts {
  display: flex;
  gap: 10px;
}

.room-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.room-summary-card {
  position: relative;
  overflow: hidden;
  min-height: 126px;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--surface-soft);
}

.room-summary-card:first-child { background: var(--navigation-color); border-color: var(--navigation-color); }
.room-summary-card:first-child span, .room-summary-card:first-child small { color: #c1d0c2; }
.room-summary-card:first-child strong { color: #f4f4e7; }
.room-summary-card--empty { background: #f8f4ea; border-color: #e9e1cf; }
.room-summary-card--occupied { background: #edf3ed; border-color: #dce7d9; }

.room-summary-card span,
.room-summary-card strong,
.room-summary-card small {
  position: relative;
  z-index: 1;
}

.room-summary-card span {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 500;
}

.room-summary-card strong {
  display: block;
  margin-top: 10px;
  color: var(--text-color);
  font-size: 32px;
  line-height: 1;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.room-summary-card small {
  display: block;
  margin-top: 10px;
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.room-board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.room-board-toolbar__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.room-board-toolbar__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: min(320px, 100%);
}

.floor-filter {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.floor-filter--secondary {
  margin-top: -4px;
}

.floor-filter__label {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 700;
}

.floor-filter__chips {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.floor-chip {
  min-width: 64px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-color-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.floor-chip:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.floor-chip--active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
}

.floor-chip--active:hover {
  background: var(--primary-strong);
  color: #fff;
}

.room-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  align-items: start;
}

.room-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 18px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  box-shadow: var(--shadow-card);
}

.room-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color);
}

.room-card__title-wrap {
  min-width: 0;
}

.room-card__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.room-card__title-row strong {
  color: var(--text-color);
  font-size: 22px;
  line-height: 1;
  font-weight: 600;
}

.room-card__title-wrap p {
  margin-top: 8px;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.room-card__type,
.room-card__count {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.room-card__type {
  background: var(--surface-soft);
  color: var(--text-color-secondary);
}

.room-card__count {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.room-card__actions {
  display: flex;
  gap: 8px;
}

.room-beds-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.room-bed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 156px;
  padding: 12px;
  border-radius: 5px;
  border: 1px dashed var(--border-strong);
  background: var(--surface-soft);
}

.room-bed--occupied {
  border-style: solid;
  border-color: #c6d9ce;
  background: #f1f7f3;
}

.room-bed__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.room-bed__head span {
  color: var(--text-color);
  font-size: 13px;
  font-weight: 700;
}

.room-bed__value {
  color: var(--primary-color);
  font-size: 16px;
  line-height: 1.1;
  font-weight: 600;
}

.room-bed__hint,
.room-bed__empty-copy {
  color: var(--text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.room-bed__empty-copy {
  margin-top: auto;
}

.room-bed__actions {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: nowrap;
  margin-top: auto;
}

.room-bed__add {
  margin-top: auto;
  align-self: flex-start;
}

.room-bed__empty-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: auto;
}

.room-bed__helper {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.room-bed__helper:hover {
  color: var(--primary-strong);
}

.bed-action-link {
  position: relative;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--primary-color);
  font-size: 12px;
  line-height: 1;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}

.bed-action-link + .bed-action-link::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 12px;
  background: var(--border-strong);
  transform: translateY(-50%);
}

.bed-action-link:hover {
  color: var(--primary-strong);
}

.bed-action-link--danger {
  color: var(--danger-color);
}

.bed-action-link--danger:hover {
  color: #dc2626;
}

.room-board__empty {
  grid-column: 1 / -1;
  padding: 50px 0;
  border-radius: 6px;
  background: var(--surface-color);
  border: 1px dashed var(--border-strong);
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.pagination-wrap--dialog {
  justify-content: flex-end;
  margin-top: 16px;
}

.modern-form {
  padding-top: 8px;
}

.bed-dialog-helper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 5px;
  background: var(--primary-soft);
  color: var(--text-color-secondary);
  font-size: 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  padding: 14px 16px;
  border-radius: 5px;
  background: var(--surface-soft);
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

.unassigned-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.unassigned-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.unassigned-panel__context strong {
  display: block;
  color: var(--text-color);
  font-size: 15px;
  margin-bottom: 6px;
}

.unassigned-panel__context span {
  color: var(--text-color-secondary);
  font-size: 13px;
}

.unassigned-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.unassigned-toolbar__input {
  width: min(320px, 100%);
}

.unassigned-table {
  width: 100%;
}

@media (max-width: 1200px) {
  .room-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .room-board {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

@media (max-width: 768px) {
  .card-header,
  .room-board-toolbar,
  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .room-board-toolbar__meta {
    width: 100%;
  }

  .room-summary-grid,
  .form-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .search-input,
  .unassigned-toolbar__input {
    width: 100%;
  }

  .room-board {
    grid-template-columns: 1fr;
  }

  .floor-filter {
    align-items: stretch;
  }

  .floor-filter__chips {
    width: 100%;
  }

  .room-card__header {
    flex-direction: column;
  }

  .room-card__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .unassigned-panel__header,
  .unassigned-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .bed-dialog-helper {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .room-beds-grid { grid-template-columns: 1fr; }
}
</style>
