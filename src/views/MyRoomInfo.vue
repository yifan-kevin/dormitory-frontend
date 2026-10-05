<template>
  <!-- LOCATE: 我的宿舍页面，学生查看宿舍床位 -->
  <div class="page-shell myroom-page">
    <el-breadcrumb separator-icon="ArrowRight">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>我的宿舍</el-breadcrumb-item>
    </el-breadcrumb>

    <section class="glass-card myroom-hero">
      <div>
        <div class="page-eyebrow">My Dormitory</div>
        <h1 class="page-title">我的宿舍信息</h1>
        <p class="page-subtitle">查看当前分配的宿舍房间与床位详情。</p>
      </div>
    </section>

    <div v-if="loading" class="loading-shell">
      <el-icon class="is-loading" :size="40" color="var(--primary-color)"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="!hasRoom" class="empty-shell">
      <el-empty description="暂未分配宿舍" :image-size="200" />
      <el-button type="primary" size="large" @click="$router.push('/applyChangeRoom')">申请宿舍</el-button>
    </div>

    <template v-else>
      <section class="myroom-layout">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-kicker">Room Info</div>
                <h3>房间信息</h3>
              </div>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item>
              <template #label>
                <div class="desc-label">
                  <el-icon><OfficeBuilding /></el-icon>
                  楼宇号
                </div>
              </template>
              <span>{{ this.room.dormBuildId }}</span>
            </el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="desc-label">
                  <el-icon><Location /></el-icon>
                  房间号
                </div>
              </template>
              <span>{{ this.room.dormRoomId }}</span>
            </el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="desc-label">
                  <el-icon><Tickets /></el-icon>
                  楼层
                </div>
              </template>
              <span>{{ this.room.floorNum }}</span>
            </el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="desc-label">
                  <el-icon><User /></el-icon>
                  可住人数
                </div>
              </template>
              <span>{{ this.room.maxCapacity }}</span>
            </el-descriptions-item>
            <el-descriptions-item>
              <template #label>
                <div class="desc-label">
                  <el-icon><User /></el-icon>
                  已住人数
                </div>
              </template>
              <span>{{ this.room.currentCapacity }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-kicker">Bed Info</div>
                <h3>床位信息</h3>
              </div>
            </div>
          </template>

          <div class="bed-grid">
            <div v-for="(bedKey, idx) in ['firstBed', 'secondBed', 'thirdBed', 'fourthBed']" :key="idx"
                 class="bed-card" :class="{ 'bed-card--mine': this.name === this.room[bedKey] }">
              <span class="bed-card__label">{{ ['一', '二', '三', '四'][idx] }}号床位</span>
              <div class="bed-card__value">
                <el-tag
                    v-if="this.room[bedKey] != null"
                    :type="this.name === this.room[bedKey] ? 'primary' : 'info'"
                    disable-transitions
                    size="large"
                >{{ this.room[bedKey] }}
                </el-tag>
                <span v-else class="bed-card__empty">空床位</span>
              </div>
              <span v-if="this.name === this.room[bedKey]" class="bed-card__badge">我的床位</span>
            </div>
          </div>
        </el-card>
      </section>

      <el-card class="section-card myroom-image-card">
        <img alt="整洁明亮的宿舍走廊" src="/images/residence-corridor.jpg" class="myroom-image" />
      </el-card>
    </template>
  </div>
</template>
<script src="@/assets/js/MyRoomInfo.js"></script>

<style scoped>
.myroom-page {
  gap: 18px;
}

.myroom-hero {
  padding: 28px;
}

.loading-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 300px;
  color: var(--text-color-muted);
}

.empty-shell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
}

.myroom-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.card-header h3 {
  font-size: 18px;
  line-height: 1.5;
  letter-spacing: 0;
}

.desc-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bed-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.bed-card {
  position: relative;
  padding: 18px;
  border-radius: 8px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.bed-card:hover {
  background: var(--surface-soft);
}

.bed-card--mine {
  background: var(--primary-soft);
  border-color: rgba(36, 91, 71, 0.22);
}

.bed-card__label {
  display: block;
  color: var(--text-color-muted);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}

.bed-card__value {
  display: flex;
  align-items: center;
}

.bed-card__empty {
  color: var(--text-color-muted);
  font-size: 13px;
  font-style: normal;
}

.bed-card__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--primary-color);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.myroom-image-card {
  overflow: hidden;
}

.myroom-image-card :deep(.el-card__body) {
  display: flex;
  justify-content: center;
  padding: 22px 24px;
}

.myroom-image {
  width: min(100%, 960px);
  height: 220px;
  border-radius: 10px;
  box-shadow: none;
  object-fit: cover;
  object-position: center 48%;
}

@media (max-width: 1200px) {
  .myroom-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .myroom-hero {
    padding: 20px;
  }

  .bed-grid {
    grid-template-columns: 1fr;
  }

  .myroom-image-card :deep(.el-card__body) {
    padding: 14px;
  }

  .myroom-image {
    height: 160px;
  }
}
</style>
