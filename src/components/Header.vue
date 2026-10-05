<template>
  <header class="header-shell">
    <div class="header-context">
      <button type="button" class="header-navigation-toggle" aria-label="打开功能导航" aria-controls="workspace-navigation" :aria-expanded="navigationOpen" @click="$emit('toggle-navigation')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div class="header-breadcrumb">
        <span>{{ roleName }}</span>
        <el-icon class="header-breadcrumb__divider"><ArrowRight /></el-icon>
        <strong>{{ moduleTitle }}</strong>
      </div>
    </div>
    <div class="header-actions">
      <time class="header-time">{{ currentTime }}</time>
      <router-link v-if="identity === 'admin' || identity === 'dormManager'" to="/reminderCenter" class="header-notifications" aria-label="查看提醒中心" title="提醒中心"><el-icon><Bell /></el-icon></router-link>
      <router-link to="/selfInfo" class="header-user" aria-label="查看个人信息">
        <span class="header-avatar">{{ avatarText }}</span>
        <span class="header-user__name">{{ displayName }}</span>
      </router-link>
      <button type="button" class="header-exit" @click="signOut">退出</button>
    </div>
  </header>
</template>

<script>
import request from "@/utils/request";
import { ElMessage } from "element-plus";

const moduleMap = {
  "/home": "首页总览",
  "/aiAssistant": "智能助手",
  "/reminderCenter": "提醒中心",
  "/bedAssignCenter": "床位分配中心",
  "/stuInfo": "学生信息管理",
  "/dormManagerInfo": "宿管信息管理",
  "/buildingInfo": "楼宇信息",
  "/roomInfo": "房间信息",
  "/noticeInfo": "公告信息",
  "/adjustRoomInfo": "调宿申请",
  "/repairInfo": "报修工单处理",
  "/visitorInfo": "访客管理",
  "/myRoomInfo": "我的宿舍",
  "/applyRepairInfo": "报修申请",
  "/applyChangeRoom": "申请调宿",
  "/applyLeaveSchool": "离校申请",
  "/hygieneCheck": "卫生检查",
  "/valuableItemRegister": "贵重物品登记",
  "/leaveRegister": "请假登记",
  "/repairAppointment": "维修工作台",
  "/selfInfo": "个人信息"
};

export default {
  name: "Header",
  props: { navigationOpen: { type: Boolean, default: false } },
  emits: ["toggle-navigation"],
  data() {
    return {
      user: {},
      identity: "",
      currentTime: "",
      timer: null
    };
  },
  computed: {
    moduleTitle() {
      return moduleMap[this.$route.path] || "首页总览";
    },
    displayName() {
      return this.user?.name || this.user?.username || "Admin";
    },
    avatarText() {
      return String(this.displayName || "A").slice(0, 1).toUpperCase();
    },
    roleName() {
      const roleMap = {
        stu: "学生端",
        dormManager: "宿管端",
        worker: "维修端",
        admin: "后勤管理中心"
      };
      return roleMap[this.identity] || "后勤管理中心";
    }
  },
  created() {
    this.bootstrapSession();
    this.updateTime();
    this.timer = window.setInterval(this.updateTime, 60000);
  },
  beforeUnmount() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  },
  methods: {
    async bootstrapSession() {
      try {
        const cachedUser = JSON.parse(window.sessionStorage.getItem("user") || "{}");
        const cachedIdentity = JSON.parse(window.sessionStorage.getItem("identity") || "\"\"");
        if (cachedIdentity) {
          this.user = cachedUser || {};
          this.identity = cachedIdentity;
        }
      } catch (error) {
        this.user = {};
        this.identity = "";
      }

      try {
        const [identityRes, userRes] = await Promise.all([
          request.get("/main/loadIdentity"),
          request.get("/main/loadUserInfo")
        ]);

        if (identityRes.code !== "0" || userRes.code !== "0") {
          throw new Error("用户会话已过期");
        }

        this.identity = identityRes.data || "";
        this.user = userRes.data || {};
        window.sessionStorage.setItem("identity", JSON.stringify(this.identity));
        window.sessionStorage.setItem("user", JSON.stringify(this.user));
      } catch (error) {
        ElMessage({
          message: "用户会话已过期",
          type: "error"
        });
        window.sessionStorage.clear();
        request.get("/main/signOut");
        this.$router.replace({ path: "/Login" });
      }
    },
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleDateString("zh-CN", {
        month: "long", day: "numeric", weekday: "long"
      });
    },
    navigateTo(path) {
      if (!path || path === this.$route.path) {
        return;
      }
      this.$router.push(path);
    },
    signOut() {
      window.sessionStorage.clear();
      request.get("/main/signOut");
      ElMessage({
        message: "已退出登录",
        type: "success"
      });
      this.$router.replace({ path: "/Login" });
    }
  }
};
</script>

<style scoped>
.header-shell { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex: 0 0 70px; min-width: 0; padding: 0 clamp(24px, 2.5vw, 40px); border-bottom: 1px solid var(--border-color); background: #fdfefb; }
.header-context, .header-breadcrumb, .header-actions, .header-user { display: flex; align-items: center; }
.header-context { min-width: 0; gap: 10px; }
.header-breadcrumb { gap: 14px; min-width: 0; font-size: 12px; color: #78827b; }
.header-breadcrumb > span { padding: 3px 9px; border: 1px solid #e7e3d5; border-radius: 5px; background: #f7f4ea; color: #857447; font-size: 11px; white-space: nowrap; }
.header-breadcrumb strong { color: var(--text-color); font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header-breadcrumb__divider { color: #b9c3b6; font-size: 10px; flex-shrink: 0; }
.header-actions { gap: 16px; flex-shrink: 0; }
.header-time { font-size: 12px; color: #7e897e; white-space: nowrap; padding-right: 6px; font-variant-numeric: tabular-nums; }
.header-notifications { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #e5e9df; border-radius: 9px; color: #66786b; background: #fff; transition: background-color .18s, border-color .18s; }
.header-notifications .el-icon { font-size: 18px; }
.header-notifications:hover { color: #245b47; border-color: #b7c9b7; background: #f1f6ed; }
.header-user { gap: 10px; color: #465d4e; font-size: 12px; font-weight: 500; }
.header-user__name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.header-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; border: 3px solid #f1f3e9; background: #245b47; color: #faf8ee; font-size: 12px; font-weight: 600; box-shadow: 0 0 0 1px #dce4d7; }
.header-exit { padding: 0 0 0 16px; min-height: 26px; border: 0; border-left: 1px solid #e2e7e2; background: transparent; color: #7d877f; font-size: 12px; cursor: pointer; }
.header-exit:hover { color: #245b47; }
.header-navigation-toggle { display: none; place-items: center; flex-shrink: 0; width: 32px; height: 34px; border: 1px solid #e4e9dd; border-radius: 7px; background: #f8faf4; color: #526157; cursor: pointer; }
.header-navigation-toggle svg { width: 19px; height: 19px; }
@media (max-width: 1100px) {
  .header-shell { padding: 0 22px; }
  .header-time { display: none; }
}
@media (max-width: 768px) {
  .header-shell { flex-basis: 62px; padding: 0 16px; gap: 10px; }
  .header-navigation-toggle { display: grid; }
  .header-breadcrumb > span, .header-breadcrumb__divider { display: none; }
  .header-actions { gap: 10px; }
  .header-user__name { display: none; }
  .header-exit { padding-left: 10px; }
}
</style>
