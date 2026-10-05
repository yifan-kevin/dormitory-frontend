<template>
  <div class="page-shell home-page">
    <header class="home-heading">
      <div class="home-heading__copy">
        <span class="home-heading__eyebrow"><span></span>校园住宿服务</span>
        <h1>{{ deskTitle }}</h1>
        <p class="home-greeting">{{ heroTitle }}</p>
        <p v-if="isStudent" class="home-context">
          <span>{{ studentRoomText }}</span>
          <span class="home-context__divider">·</span>
          <span>{{ heroStatusText }}</span>
        </p>
        <p v-else class="home-context">{{ welcomeText }}</p>
        <button type="button" class="home-primary-action" @click="goRepairCenter">
          <el-icon><Tools /></el-icon>
          <span>{{ heroActionText }}</span>
          <el-icon class="home-primary-action__arrow"><ArrowRight /></el-icon>
        </button>
      </div>
      <figure class="home-heading__campus">
        <img src="/images/campus-courtyard.jpg" alt="校园宿舍庭院与绿树" />
        <figcaption><span>校园一隅</span><span>宿舍庭院</span></figcaption>
      </figure>
    </header>

    <section class="home-stats" aria-label="当前数据概览">
      <article v-for="(card, index) in statCards" :key="card.title" class="home-stat" :class="{ 'home-stat--focus': index === 0, 'home-stat--text': isStudent && index === 3 }">
        <div class="home-stat__heading">
          <span class="home-stat__title">{{ card.title }}</span>
          <span class="home-stat__icon"><el-icon><component :is="(isStudent ? ['House', 'Tools', 'Check', 'Van'] : isWorker ? ['Tools', 'Operation', 'Check', 'Bell'] : ['Tools', 'Operation', 'Van', 'House'])[index]" /></el-icon></span>
        </div>
        <strong class="home-stat__value">{{ card.value }}</strong>
        <p>{{ card.description }}</p>
      </article>
    </section>

    <section class="home-panel home-services" aria-label="常用操作">
      <div class="home-panel__heading">
        <h2>常用操作</h2>
        <span>{{ isStudent ? '申请与生活服务' : isWorker ? '维修与任务安排' : '日常管理入口' }}</span>
      </div>
      <div class="home-services__grid">
        <button
          v-for="service in quickServices"
          :key="service.title"
          type="button"
          class="home-service"
          @click="goQuickService(service)"
        >
          <span class="home-service__icon"><el-icon><component :is="service.icon" /></el-icon></span>
          <span class="home-service__copy">
            <strong>{{ service.title }}</strong>
            <small>{{ service.description }}</small>
          </span>
          <el-icon class="home-service__arrow"><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <section class="home-workspace">
      <section v-if="isStudent" class="home-panel home-updates">
        <div class="home-panel__heading">
          <h2>我的最新动态</h2>
          <span>住宿与申请进度</span>
        </div>
        <div v-if="studentTimelineItems.length" class="home-updates__list">
          <div
            v-for="(item, index) in studentTimelineItems"
            :key="`${item.time}-${item.category}-${index}`"
            class="home-update"
            :class="item.tone"
          >
            <span class="home-update__dot"></span>
            <div class="home-update__body">
              <div class="home-update__meta"><strong>{{ item.category }}</strong><time>{{ item.time }}</time></div>
              <p>{{ item.content }}</p>
            </div>
          </div>
        </div>
        <div v-else class="home-empty"><el-icon><Tickets /></el-icon><p>暂无新的住宿或申请动态</p></div>
      </section>

      <section v-else-if="isWorker" class="home-panel home-tasks">
        <div class="home-panel__heading">
          <h2>待办工单</h2>
          <button type="button" class="home-text-action" @click="goRepairCenter">查看全部 <el-icon><ArrowRight /></el-icon></button>
        </div>
        <div class="home-task-list">
          <button
            v-for="(task, index) in workerTaskItems"
            :key="`${task.title}-${index}`"
            type="button"
            class="home-task"
            @click="openWorkerEntry(task)"
          >
            <span class="home-task__icon"><el-icon><Tools /></el-icon></span>
            <span class="home-task__copy"><strong>{{ task.title }}</strong><small>{{ task.description }}</small></span>
            <el-icon class="home-task__arrow"><ArrowRight /></el-icon>
          </button>
        </div>
      </section>

      <section v-else class="home-panel home-chart-panel">
        <div class="home-panel__heading">
          <h2>楼栋入住人数</h2>
          <button type="button" class="home-text-action" @click="goQuickService({ routePath: '/roomInfo' })">宿舍管理 <el-icon><ArrowRight /></el-icon></button>
        </div>
        <div class="home-chart-shell"><home_echarts /></div>
      </section>

      <aside v-if="isStudent" class="home-panel home-room-panel">
        <div class="home-panel__heading">
          <h2>住宿信息</h2>
          <button type="button" class="home-text-action" @click="goQuickService({ routePath: '/myRoomInfo' })">查看详情 <el-icon><ArrowRight /></el-icon></button>
        </div>
        <div class="home-room">
          <span class="home-room__icon"><el-icon><House /></el-icon></span>
          <strong>{{ studentRoomText }}</strong>
          <span>{{ studentBedLabel }}</span>
        </div>
        <dl class="home-room-details">
          <div><dt>入住状态</dt><dd>{{ studentRoomMetricSubtitle }}</dd></div>
          <div><dt>离校状态</dt><dd>{{ todayStatusValue }}</dd></div>
          <div><dt>卫生检查</dt><dd>{{ hygieneScoreValue }}</dd></div>
        </dl>
      </aside>

      <aside v-else-if="isWorker" class="home-panel home-alerts">
        <div class="home-panel__heading"><h2>工作提醒</h2></div>
        <div class="home-alert-list">
          <button
            v-for="(item, index) in workerAlertItems"
            :key="`${item.category}-${index}`"
            type="button"
            class="home-alert"
            :class="item.tone"
            @click="openWorkerEntry(item)"
          >
            <span class="home-alert__meta"><strong>{{ item.category }}</strong><time>{{ item.time }}</time></span>
            <span class="home-alert__title">{{ item.title }}</span>
            <small>{{ item.description }}</small>
          </button>
        </div>
      </aside>

      <aside v-else class="home-panel home-alerts">
        <div class="home-panel__heading">
          <h2>待办提醒</h2>
          <button type="button" class="home-text-action" @click="goReminderCenter">提醒中心 <el-icon><ArrowRight /></el-icon></button>
        </div>
        <div v-if="reminderItems.length" class="home-alert-list">
          <button
            v-for="(item, index) in reminderItems"
            :key="`${item.category}-${index}`"
            type="button"
            class="home-alert"
            :class="{ 'timeline-item--orange': item.level === 'urgent' }"
            @click="openReminder(item)"
          >
            <span class="home-alert__meta"><strong>{{ item.category }}</strong><time>{{ item.time || item.status || '待处理' }}</time></span>
            <span class="home-alert__title">{{ item.title }}</span>
            <small>{{ item.description }}</small>
          </button>
        </div>
        <div v-else class="home-empty"><el-icon><Check /></el-icon><p>暂无待办提醒</p><small>新的待办事项会显示在这里</small></div>
      </aside>
    </section>

    <section class="home-panel home-notices" aria-label="公告通知">
      <div class="home-panel__heading">
        <h2>公告通知</h2>
        <span>最近发布</span>
      </div>
      <div v-if="homeNoticeItems.length" class="home-notices__list">
        <button
          v-for="notice in homeNoticeItems"
          :key="notice.id || notice.title"
          type="button"
          class="home-notice"
          @click="openNoticeDetail(notice)"
        >
          <span class="home-notice__icon"><el-icon><Tickets /></el-icon></span>
          <span class="home-notice__copy"><strong>{{ notice.title }}</strong><small>{{ getNoticeSummary(notice) }}</small></span>
          <time>{{ formatNoticeTime(notice.releaseTime) }}</time>
          <el-icon class="home-notice__arrow"><ArrowRight /></el-icon>
        </button>
      </div>
      <div v-else class="home-empty home-empty--compact"><p>暂无公告通知</p></div>
    </section>

    <el-dialog v-model="noticeDetailDialog" :title="noticeDetail.title || '公告详情'" width="560px" class="notice-detail-dialog">
      <div class="notice-detail">
        <div class="notice-detail__meta"><span>{{ noticeDetail.author || '后勤管理中心' }}</span><time>{{ noticeDetail.releaseTime || '发布时间待确认' }}</time></div>
        <p>{{ noticeDetail.content || '暂无公告内容' }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script src="@/assets/js/Home.js"></script>

<style scoped>
.page-shell.home-page {
  --home-ink: #263d30;
  --home-muted: #7a8479;
  --home-border: #e3e6dc;
  --home-green: #245b47;
  --home-gold: #b79b62;
  --home-surface: #fffefb;
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  min-width: 0;
  color: var(--home-ink);
}

.home-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(230px, 0.48fr);
  align-items: center;
  gap: 30px;
  padding: 28px 32px;
  border: 1px solid #204936;
  border-radius: 16px;
  background: #1c4434;
  box-shadow: 0 8px 22px rgba(31, 56, 39, 0.08);
}
.home-heading__copy { min-width: 0; }
.home-heading__eyebrow { display: flex; align-items: center; gap: 9px; color: #c6b080; font-size: 11px; line-height: 1.5; letter-spacing: 0.08em; }
.home-heading__eyebrow > span { width: 22px; height: 1px; background: var(--home-gold); }
.home-heading h1 { margin: 13px 0 0; color: #faf9f1; font-size: 29px; line-height: 1.4; font-weight: 600; letter-spacing: 0.015em; }
.home-greeting { margin: 9px 0 0; color: #e0e9df; font-size: 14px; line-height: 1.6; }
.home-context { max-width: 650px; margin: 5px 0 0; color: #b3c8b8; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.home-context__divider { margin: 0 8px; color: #809a82; }
.home-heading__campus { min-width: 0; margin: 0; }
.home-heading__campus img { display: block; width: 100%; height: 174px; border: 1px solid rgba(222, 227, 201, 0.18); border-radius: 10px; object-fit: cover; object-position: 50% 62%; }
.home-heading__campus figcaption { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; color: #a8beab; font-size: 11px; letter-spacing: 0.05em; }
.home-heading__campus figcaption > span:first-child { color: #c5b488; }

.home-primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 39px;
  padding: 0 15px;
  margin-top: 21px;
  border: 1px solid #d5c39c;
  border-radius: 7px;
  color: #2f4a36;
  background: #e9ddbf;
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
  transition: background-color 0.18s, border-color 0.18s;
}
.home-primary-action:hover { border-color: #e9d8b2; background: #f3e8cd; }
.home-primary-action :deep(.el-icon) { font-size: 15px; }
.home-primary-action .home-primary-action__arrow { margin-left: 8px; font-size: 12px; }

.home-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.home-stat { min-width: 0; padding: 17px 20px 18px; border: 1px solid var(--home-border); border-radius: 12px; background: var(--home-surface); box-shadow: 0 4px 12px rgba(32, 49, 31, 0.025); }
.home-stat--focus { border-color: #cdd8c8; background: #f0f4e9; }
.home-stat__heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.home-stat__title { color: #64705f; font-size: 13px; line-height: 1.6; }
.home-stat__icon { display: grid; place-items: center; flex-shrink: 0; width: 30px; height: 30px; border-radius: 8px; color: #718265; background: #f2f3eb; font-size: 15px; }
.home-stat--focus .home-stat__icon { color: #426a46; background: #e3ebda; }
.home-stat__value { display: block; margin-top: 8px; color: var(--home-ink); font-size: clamp(25px, 2.1vw, 31px); font-weight: 600; line-height: 1.3; font-variant-numeric: tabular-nums; letter-spacing: 0; }
.home-stat--focus .home-stat__value { color: #245135; }
.home-stat--text .home-stat__value { font-size: 22px; line-height: 1.83; }
.home-stat p { min-height: 36px; margin: 9px 0 0; color: var(--home-muted); font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }

.home-panel { min-width: 0; border: 1px solid var(--home-border); border-radius: 12px; background: var(--home-surface); box-shadow: 0 4px 16px rgba(32, 49, 31, 0.028); overflow: hidden; }
.home-panel__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 62px; padding: 18px 22px; border-bottom: 1px solid #edf0e6; }
.home-panel__heading h2 { display: inline-flex; align-items: center; margin: 0; color: var(--home-ink); font-size: 15px; font-weight: 600; line-height: 1.6; }
.home-panel__heading h2::before { content: ""; width: 3px; height: 13px; margin-right: 10px; border-radius: 2px; background: var(--home-gold); }
.home-panel__heading > span { color: #879080; font-size: 12px; white-space: nowrap; }
.home-text-action { display: inline-flex; align-items: center; gap: 5px; padding: 3px 0; border: 0; color: #5a755b; background: transparent; font-size: 12px; cursor: pointer; white-space: nowrap; }
.home-text-action:hover { color: #245b47; text-decoration: underline; }

.home-services .home-panel__heading { min-height: auto; padding-bottom: 0; border-bottom: 0; }
.home-services__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; padding: 18px 22px 22px; }
.home-service { display: flex; align-items: center; gap: 13px; min-width: 0; min-height: 81px; padding: 15px 17px; border: 1px solid #e6e9df; border-radius: 10px; background: #fafbf6; text-align: left; cursor: pointer; transition: background-color 0.18s, border-color 0.18s, box-shadow 0.18s; }
.home-service:hover { border-color: #c3d3bb; background: #f2f6eb; box-shadow: 0 3px 10px rgba(51, 71, 43, 0.04); }
.home-service__icon { display: grid; place-items: center; flex-shrink: 0; width: 38px; height: 38px; border: 1px solid #e2e9d7; border-radius: 10px; background: #edf2e4; color: #426847; font-size: 18px; }
.home-service__copy { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.home-service__copy strong { color: #354f38; font-size: 13px; line-height: 1.5; font-weight: 550; }
.home-service__copy small { color: var(--home-muted); font-size: 12px; line-height: 1.6; }
.home-service__arrow { flex-shrink: 0; color: #a2ad9a; font-size: 12px; }

.home-workspace { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr); gap: 20px; align-items: stretch; }
.home-chart-shell { height: 295px; padding: 0 12px; }
.home-chart-shell :deep(.home-chart) { min-height: 290px; }
.home-task-list { padding: 0 22px; }
.home-task { display: flex; align-items: center; gap: 13px; width: 100%; min-height: 96px; padding: 20px 0; border: 0; border-bottom: 1px solid #edf0e6; background: transparent; text-align: left; cursor: pointer; }
.home-task:last-child { border-bottom: 0; }
.home-task__icon { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; background: #eff3e8; border: 1px solid #e6ecd9; border-radius: 9px; color: #62855a; font-size: 17px; }
.home-task__copy { display: flex; flex: 1; flex-direction: column; gap: 7px; min-width: 0; }
.home-task__copy strong { color: var(--home-ink); font-size: 13px; line-height: 1.5; font-weight: 550; }
.home-task__copy small { color: var(--home-muted); font-size: 12px; line-height: 1.7; overflow-wrap: anywhere; }
.home-task__arrow { color: #a4ad9c; font-size: 12px; }
.home-task:hover .home-task__copy strong { color: var(--home-green); }

.home-updates__list { padding: 8px 22px 16px; }
.home-update { position: relative; display: flex; gap: 13px; padding: 16px 0; }
.home-update:not(:last-child)::after { content: ""; position: absolute; left: 3px; top: 32px; bottom: -8px; width: 1px; background: #e4eadd; }
.home-update__dot { position: relative; z-index: 1; flex-shrink: 0; width: 7px; height: 7px; margin-top: 7px; border-radius: 50%; background: #759468; }
.home-update__body { flex: 1; min-width: 0; }
.home-update__meta { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; }
.home-update__meta strong { color: #536449; font-size: 12px; font-weight: 550; }
.home-update__meta time { color: #939d89; font-size: 11px; white-space: nowrap; }
.home-update p { margin: 8px 0 0; color: #74806d; font-size: 12px; line-height: 1.8; }
.home-alert-list { padding: 0 22px; }
.home-alert { display: block; width: 100%; padding: 17px 0; border: 0; border-bottom: 1px solid #edf0e6; background: transparent; text-align: left; cursor: pointer; }
.home-alert:last-child { border-bottom: 0; }
.home-alert__meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
.home-alert__meta strong { padding: 2px 7px; border-radius: 4px; color: #608051; background: #eff4e8; font-size: 11px; font-weight: 500; line-height: 1.5; }
.home-alert__meta time { color: #919b87; font-size: 11px; }
.home-alert__title { display: block; color: var(--home-ink); font-size: 13px; font-weight: 550; line-height: 1.6; }
.home-alert > small { display: block; margin-top: 6px; color: var(--home-muted); font-size: 12px; line-height: 1.7; }
.home-alert:hover .home-alert__title { color: var(--home-green); }
.timeline-item--orange .home-alert__meta strong { color: #96723d; background: #f7f0e4; }
.timeline-item--orange .home-update__dot { background: #b3925b; }

.home-room { display: flex; flex-direction: column; align-items: center; gap: 9px; padding: 23px 20px 21px; background: #fbfcf7; }
.home-room__icon { display: grid; place-items: center; width: 47px; height: 47px; margin-bottom: 4px; border: 1px solid #dce5d1; border-radius: 12px; color: #5f7a4c; background: #eef3e6; font-size: 24px; }
.home-room > strong { color: #345139; font-size: 19px; font-weight: 550; }
.home-room > span:last-child { color: #839077; font-size: 12px; }
.home-room-details { margin: 0; padding: 3px 22px 14px; }
.home-room-details > div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid #edf0e6; font-size: 12px; line-height: 1.5; }
.home-room-details > div:first-child { border-top: 0; }
.home-room-details dt { color: var(--home-muted); }
.home-room-details dd { margin: 0; color: #52664b; text-align: right; }

.home-notices__list { padding: 0 22px; }
.home-notice { display: flex; align-items: center; gap: 15px; width: 100%; min-height: 85px; padding: 17px 0; border: 0; border-bottom: 1px solid #edf0e6; background: transparent; text-align: left; cursor: pointer; }
.home-notice:last-child { border-bottom: 0; }
.home-notice__icon { display: grid; place-items: center; width: 32px; height: 36px; flex-shrink: 0; border: 1px solid #e8e4d7; border-radius: 7px; color: #a0936a; background: #f7f5ec; font-size: 16px; }
.home-notice__copy { display: flex; flex: 1; flex-direction: column; gap: 6px; min-width: 0; }
.home-notice__copy strong { overflow: hidden; color: var(--home-ink); font-size: 13px; font-weight: 550; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.home-notice__copy small { overflow: hidden; color: var(--home-muted); font-size: 12px; line-height: 1.5; text-overflow: ellipsis; white-space: nowrap; }
.home-notice time { flex-shrink: 0; color: #929c88; font-size: 12px; }
.home-notice__arrow { color: #a3ad99; font-size: 12px; }
.home-notice:hover .home-notice__copy strong { color: var(--home-green); }

.home-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 230px; padding: 24px; color: #939d89; text-align: center; }
.home-empty > .el-icon { display: grid; place-items: center; width: 47px; height: 47px; margin-bottom: 4px; border: 1px solid #e8ecdf; border-radius: 12px; color: #a8b59d; background: #f8faf3; font-size: 24px; }
.home-empty p { margin: 0; font-size: 12px; line-height: 1.7; }
.home-empty small { font-size: 11px; line-height: 1.6; }
.home-empty--compact { min-height: 110px; }
.notice-detail__meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-bottom: 18px; color: var(--home-muted); font-size: 12px; line-height: 1.6; }
.notice-detail p { margin: 0; color: var(--home-ink); font-size: 14px; line-height: 1.9; overflow-wrap: anywhere; white-space: pre-wrap; }
.home-page :deep(.notice-detail-dialog) { max-width: calc(100% - 32px); border-radius: 12px; }
.home-page button:focus-visible { outline: 2px solid #a79159; outline-offset: 3px; }

@media (max-width: 1180px) {
  .home-heading { grid-template-columns: minmax(0, 1fr) 235px; gap: 24px; padding: 26px; }
  .home-heading__campus img { height: 178px; }
  .home-stats { gap: 12px; }
  .home-stat { padding: 16px; }
  .home-stat__value { font-size: 25px; }
  .home-services__grid { gap: 10px; }
  .home-service { gap: 10px; padding: 13px; }
  .home-service__copy small { font-size: 11px; }
}
@media (max-width: 1100px) {
  .home-workspace { grid-template-columns: 1fr; }
  .home-alert-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
  .home-alert { border-bottom: 0; }
  .home-room-details { display: flex; gap: 20px; }
  .home-room-details > div { flex: 1; border-top: 0; }
}
@media (max-width: 900px) {
  .home-heading { grid-template-columns: 1fr; padding: 25px; }
  .home-heading__campus { display: none; }
  .home-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .home-services__grid { grid-template-columns: 1fr; gap: 8px; }
  .home-service { min-height: 68px; }
  .home-service__copy small { font-size: 11px; }
}
@media (max-width: 600px) {
  .page-shell.home-page { gap: 16px; }
  .home-heading { gap: 0; padding: 24px; border-radius: 13px; }
  .home-heading h1 { margin-top: 12px; font-size: 27px; }
  .home-greeting { font-size: 13px; }
  .home-context { font-size: 12px; }
  .home-primary-action { min-height: 38px; margin-top: 18px; }
  .home-stats { gap: 10px; }
  .home-stat { padding: 14px; border-radius: 10px; }
  .home-stat__title { font-size: 12px; }
  .home-stat__icon { width: 27px; height: 27px; font-size: 13px; }
  .home-stat__value { margin-top: 9px; font-size: 24px; }
  .home-stat--text .home-stat__value { font-size: 22px; line-height: 1.42; }
  .home-stat p { font-size: 11px; }
  .home-panel__heading { padding: 16px; min-height: 56px; }
  .home-panel__heading > span { font-size: 11px; }
  .home-services__grid { padding: 14px 16px 17px; }
  .home-alert-list { display: block; padding: 0 16px; }
  .home-alert { border-bottom: 1px solid #edf0e6; }
  .home-task-list, .home-notices__list { padding: 0 16px; }
  .home-updates__list { padding: 6px 16px 12px; }
  .home-room-details { display: block; padding: 3px 16px 12px; }
  .home-room-details > div { border-top: 1px solid #edf0e6; }
  .home-notice { display: grid; grid-template-columns: 28px minmax(0, 1fr) 12px; gap: 6px 10px; padding: 16px 0; }
  .home-notice__icon { grid-row: 1 / 3; width: 28px; }
  .home-notice__copy { grid-column: 2; }
  .home-notice time { grid-column: 2; font-size: 11px; }
  .home-notice__arrow { grid-column: 3; grid-row: 1 / 3; }
  .home-chart-shell { padding: 0; height: 280px; }
  .home-chart-shell :deep(.home-chart) { min-height: 275px; }
}
@media (prefers-reduced-motion: reduce) {
  .home-primary-action, .home-service { transition: none; }
}
</style>
