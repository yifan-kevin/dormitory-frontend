<template>
  <div class="aside-shell">
    <div class="aside-brand-row">
      <router-link to="/home" class="aside-brand" @click="$emit('navigate')">
        <span class="aside-brand__mark"><el-icon><School /></el-icon></span>
        <span class="aside-brand__copy">
          <strong>宿舍管理系统</strong>
          <small>{{ roleName }}</small>
        </span>
      </router-link>
      <button type="button" class="aside-close" aria-label="关闭导航" @click="$emit('navigate')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
    </div>

    <nav class="aside-nav" aria-label="功能导航">
      <section v-for="group in navigationGroups" :key="group.title" class="aside-group">
        <h2>{{ group.title }}</h2>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="aside-link"
          :class="{ 'is-active': currentPath === item.path }"
          :aria-current="currentPath === item.path ? 'page' : undefined"
          @click="$emit('navigate')"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </section>
    </nav>

    <div class="aside-footer">
      <router-link to="/aiAssistant" class="aside-link" :class="{ 'is-active': currentPath === '/aiAssistant' }" @click="$emit('navigate')">
        <el-icon><Message /></el-icon><span>智能助手</span>
      </router-link>
      <router-link to="/selfInfo" class="aside-link" :class="{ 'is-active': currentPath === '/selfInfo' }" @click="$emit('navigate')">
        <el-icon><Setting /></el-icon><span>个人信息</span>
      </router-link>
      <p><span aria-hidden="true"></span>宿舍事务 · 日常管理</p>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request";
import { ElMessage } from "element-plus";

export default {
  name: "Aside",
  emits: ["navigate"],
  data() {
    return { user: {}, identity: "" };
  },
  computed: {
    currentPath() { return this.$route.path; },
    roleName() {
      return { stu: "学生服务", dormManager: "宿舍管理", worker: "维修服务", admin: "后勤管理" }[this.identity] || "工作台";
    },
    navigationGroups() {
      const overview = { title: "工作台", items: [{ path: "/home", label: "首页总览", icon: "House" }] };
      if (this.identity === "stu") {
        return [overview, { title: "我的宿舍", items: [
          { path: "/myRoomInfo", label: "住宿信息", icon: "School" },
          { path: "/applyRepairInfo", label: "报修申请", icon: "Tools" },
          { path: "/applyChangeRoom", label: "调宿申请", icon: "Operation" },
          { path: "/applyLeaveSchool", label: "离校申请", icon: "Van" },
          { path: "/hygieneCheck", label: "卫生检查", icon: "SetUp" }
        ] }];
      }
      if (this.identity === "worker") {
        return [overview, { title: "维修事务", items: [
          { path: "/repairAppointment", label: "维修工作台", icon: "Tools" }
        ] }];
      }
      if (!["admin", "dormManager"].includes(this.identity)) return [overview];
      overview.items.push({ path: "/reminderCenter", label: "提醒中心", icon: "Bell" });
      const dormitory = { title: "住宿管理", items: [
        { path: "/buildingInfo", label: "楼宇信息", icon: "OfficeBuilding" },
        { path: "/roomInfo", label: "房间与床位", icon: "School" },
        { path: "/stuInfo", label: "学生信息", icon: "User" }
      ] };
      if (this.identity === "admin") {
        dormitory.items.push(
          { path: "/dormManagerInfo", label: "宿管信息", icon: "User" },
          { path: "/bedAssignCenter", label: "床位分配", icon: "Operation" }
        );
      }
      const daily = { title: "日常事务", items: [
        { path: "/repairInfo", label: "报修工单", icon: "Tools" },
        { path: "/adjustRoomInfo", label: "调宿申请", icon: "Operation" },
        { path: "/visitorInfo", label: "访客登记", icon: "Tickets" },
        { path: "/hygieneCheck", label: "卫生检查", icon: "SetUp" },
        { path: "/valuableItemRegister", label: "贵重物品登记", icon: "Lock" },
        { path: "/leaveRegister", label: "请假登记", icon: "Van" }
      ] };
      if (this.identity === "admin") daily.items.push({ path: "/noticeInfo", label: "公告管理", icon: "Bell" });
      return [overview, dormitory, daily];
    }
  },
  created() { this.bootstrapSession(); },
  methods: {
    async bootstrapSession() {
      try {
        this.user = JSON.parse(window.sessionStorage.getItem("user") || "{}") || {};
        this.identity = JSON.parse(window.sessionStorage.getItem("identity") || '""') || "";
      } catch (error) {
        this.user = {};
        this.identity = "";
      }
      try {
        const [identityRes, userRes] = await Promise.all([
          request.get("/main/loadIdentity"), request.get("/main/loadUserInfo")
        ]);
        if (identityRes.code !== "0" || userRes.code !== "0") throw new Error("用户会话已过期");
        this.identity = identityRes.data || "";
        this.user = userRes.data || {};
        window.sessionStorage.setItem("identity", JSON.stringify(this.identity));
        window.sessionStorage.setItem("user", JSON.stringify(this.user));
      } catch (error) {
        ElMessage.error("用户会话已过期");
        window.sessionStorage.clear();
        request.get("/main/signOut");
        this.$router.replace("/Login");
      }
    }
  }
};
</script>

<style scoped>
.aside-shell { height: 100%; display: flex; flex-direction: column; background: var(--navigation-color); color: #fff; }
.aside-brand-row { display: flex; align-items: center; gap: 8px; flex: 0 0 106px; padding: 24px 22px; }
.aside-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
.aside-brand__mark { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 44px; border: 1px solid rgba(220, 199, 145, .4); background: rgba(220, 199, 145, .08); color: #dfcca0; border-radius: 10px; }
.aside-brand__mark .el-icon { font-size: 25px; }
.aside-brand__copy { display: flex; flex-direction: column; gap: 4px; }
.aside-brand__copy strong { color: #f6f6ed; font-size: 16px; font-weight: 600; white-space: nowrap; letter-spacing: 1px; }
.aside-brand__copy small { color: #a9bdb2; font-size: 11px; letter-spacing: 1.5px; }
.aside-close { display: none; width: 32px; height: 32px; border: 0; background: transparent; color: #c4d2c9; cursor: pointer; }
.aside-close svg { width: 20px; height: 20px; }
.aside-nav { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px 16px; scrollbar-color: #4c6b5e transparent; }
.aside-nav::-webkit-scrollbar-thumb { background: #4c6b5e; }
.aside-group + .aside-group { margin-top: 23px; }
.aside-group h2 { padding: 0 14px; margin: 0 0 9px; color: #9bb2a5; font-size: 11px; font-weight: 400; letter-spacing: 2px; }
.aside-link { position: relative; display: flex; align-items: center; gap: 12px; min-height: 41px; padding: 9px 14px; margin: 3px 0; border: 1px solid transparent; border-radius: 8px; color: #c0d0c6; font-size: 13px; transition: background-color .18s, color .18s, border-color .18s; }
.aside-link .el-icon { flex-shrink: 0; font-size: 17px; color: #99b5a6; }
.aside-link:hover { background: rgba(255, 255, 255, .06); color: #fff; }
.aside-link.is-active { color: #f7f4e8; background: #2e5445; border-color: rgba(219, 199, 150, .17); font-weight: 600; }
.aside-link.is-active .el-icon { color: #dfc995; }
.aside-link.is-active::before { content: ""; position: absolute; left: -1px; top: 12px; bottom: 12px; width: 3px; border-radius: 2px; background: #d0b478; }
.aside-link:focus-visible, .aside-brand:focus-visible, .aside-close:focus-visible { outline-color: #dfc995; }
.aside-footer { flex-shrink: 0; padding: 12px 16px 20px; border-top: 1px solid rgba(203, 219, 204, .12); }
.aside-footer p { display: flex; align-items: center; gap: 8px; margin-top: 16px; padding-left: 14px; color: #9bb2a5; font-size: 10px; letter-spacing: 1px; }
.aside-footer p span { width: 4px; height: 4px; border-radius: 50%; background: #c6ab74; }
@media (max-width: 1100px) {
  .aside-brand-row { padding-left: 18px; padding-right: 18px; }
  .aside-brand__copy strong { font-size: 15px; letter-spacing: .5px; }
  .aside-nav, .aside-footer { padding-left: 12px; padding-right: 12px; }
}
@media (max-width: 768px) {
  .aside-brand-row { padding-left: 20px; padding-right: 12px; justify-content: space-between; }
  .aside-close { display: grid; place-items: center; }
}
</style>
