// LOCATE: 首页逻辑，统计数据、轮播图和角色首页内容
import request from "@/utils/request";
import home_echarts from "@/components/home_echarts";

const { ElMessage } = require("element-plus");

const createReminderSummary = () => ({
    totalPending: 0,
    urgentCount: 0,
    repairPending: 0,
    repairOverdue: 0,
    repairWaitConfirm: 0,
    repairReturned: 0,
    adjustPending: 0,
    leaveAwayCount: 0,
    leaveWaitConfirmCount: 0,
    leaveAbnormalCount: 0,
    leaveWarnings: 0,
    hygieneAlerts: 0,
    consistencyWarnings: 0,
    recentNoticeCount: 0,
    availableBeds: 0,
    items: []
});

const createRepairWorkbenchSummary = () => ({
    totalCount: 0,
    pendingCount: 0,
    processingCount: 0,
    appointedCount: 0,
    waitConfirmCount: 0,
    returnedCount: 0,
    overdueCount: 0,
    completedCount: 0
});

const createStudentRoom = () => ({
    dormBuildId: "",
    dormRoomId: "",
});

const isPendingAdjust = (state) => {
    const text = String(state || "").trim();
    return !text || text.includes("未处理") || text.includes("待处理");
};

const isApprovedAdjust = (state) => String(state || "").trim().includes("通过");

const isRejectedAdjust = (state) => {
    const text = String(state || "").trim();
    return text.includes("驳") || text.includes("拒");
};

const finishedRepairStates = ["\u5df2\u5b8c\u6210", "\u5df2\u5173\u95ed", "\u5df2\u53d6\u6d88"];
const WAIT_CONFIRM_REPAIR_STATE = "\u5f85\u5b66\u751f\u786e\u8ba4";

const getGreetingText = () => {
    const hour = new Date().getHours();
    if (hour < 6) {
        return "\u591c\u6df1\u4e86";
    }
    if (hour < 12) {
        return "\u4e0a\u5348\u597d";
    }
    if (hour < 14) {
        return "\u4e2d\u5348\u597d";
    }
    if (hour < 18) {
        return "\u4e0b\u5348\u597d";
    }
    return "\u665a\u4e0a\u597d";
};

const getStudentCallName = (user) => {
    const rawName = String(user?.name || user?.username || "").trim();
    if (!rawName) {
        return "\u540c\u5b66";
    }
    if (rawName.endsWith("\u540c\u5b66")) {
        return rawName;
    }
    const firstChar = Array.from(rawName)[0];
    if (/[\u4e00-\u9fa5]/.test(firstChar)) {
        return `${firstChar}\u540c\u5b66`;
    }
    return `${rawName}\u540c\u5b66`;
};

const bedFields = [
    { key: "firstBed", label: "1\u53f7\u5e8a\u4f4d" },
    { key: "secondBed", label: "2\u53f7\u5e8a\u4f4d" },
    { key: "thirdBed", label: "3\u53f7\u5e8a\u4f4d" },
    { key: "fourthBed", label: "4\u53f7\u5e8a\u4f4d" },
];

const parseDateTime = (value) => {
    if (!value) {
        return null;
    }
    const date = value instanceof Date ? value : new Date(String(value).replace(/-/g, "/"));
    return Number.isNaN(date.getTime()) ? null : date;
};

const getRecordTime = (record) => {
    const date = parseDateTime(record?.checkDate || record?.registerTime || record?.leaveTime);
    return date ? date.getTime() : 0;
};

const formatShortDateTime = (value) => {
    const date = parseDateTime(value);
    if (!date) {
        return "";
    }
    const pad = (number) => String(number).padStart(2, "0");
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const stripNoticeText = (value) => String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const shortenNoticeText = (value, maxLength = 88) => {
    const text = stripNoticeText(value);
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength)}...`;
};

const isCompletedRepair = (state) => {
    const text = String(state || "").trim();
    return finishedRepairStates.includes(text) || (text.includes("\u5b8c\u6210") && !text.includes("\u672a"));
};

const isWaitingConfirmRepair = (state) => String(state || "").trim() === WAIT_CONFIRM_REPAIR_STATE;

const isReturnedRepair = (repair) => !isCompletedRepair(repair?.state)
    && !isWaitingConfirmRepair(repair?.state)
    && !!String(repair?.studentFeedback || "").trim();

const isToday = (value) => {
    const date = parseDateTime(value);
    if (!date) {
        return false;
    }
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
        && date.getMonth() === today.getMonth()
        && date.getDate() === today.getDate();
};

const getFutureTime = (value) => {
    const date = parseDateTime(value);
    return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

export default {
    name: "Home",
    components: {
        home_echarts,
    },
    computed: {
        isStudent() {
            return this.identity === "stu";
        },
        isWorker() {
            return this.identity === "worker";
        },
        homeNoticeItems() {
            const notices = Array.isArray(this.activities) ? this.activities : [];
            return notices
                .filter((notice) => notice && String(notice.title || "").trim())
                .sort((a, b) => getFutureTime(b.releaseTime || b.createTime) - getFutureTime(a.releaseTime || a.createTime))
                .slice(0, 4);
        },
        latestNotice() {
            return this.homeNoticeItems[0] || null;
        },
        secondaryNotices() {
            return this.homeNoticeItems.slice(1, 4);
        },
        deskLabel() {
            if (this.isStudent) {
                return "Student Desk";
            }
            if (this.isWorker) {
                return "Worker Desk";
            }
            return "Logistics Desk";
        },
        deskTitle() {
            if (this.isStudent) {
                return "我的宿舍";
            }
            if (this.isWorker) {
                return "维修工作台";
            }
            return "工作概览";
        },
        currentWorkerName() {
            return this.currentUser?.name || this.currentUser?.username || "维修人员";
        },
        occupancyRate() {
            const total = Number(this.studentNum) || 0;
            const occupied = Number(this.haveRoomStudentNum) || 0;
            if (!total) {
                return "0%";
            }
            return `${Math.round((occupied / total) * 100)}%`;
        },
        excellentRoomNum() {
            return Number(this.excellentHygieneRoomNum) || 0;
        },
        pendingRepairNum() {
            return Number(this.repairOrderNum) || 0;
        },
        repairFollowupText() {
            const returned = Number(this.reminderSummary.repairReturned || 0);
            const waitConfirm = Number(this.reminderSummary.repairWaitConfirm || 0);
            if (returned || waitConfirm) {
                const parts = [];
                if (returned) {
                    parts.push(`${returned} \u6761\u5b66\u751f\u9000\u56de`);
                }
                if (waitConfirm) {
                    parts.push(`${waitConfirm} 条待学生确认`);
                }
                return parts.join("\uff0c");
            }
            return "\u9700\u8981\u7ee7\u7eed\u8ddf\u8fdb\u7684\u7ef4\u4fee\u5de5\u5355\u6570\u91cf";
        },
        logisticsRepairPendingCount() {
            return Number(this.reminderSummary.repairPending || this.repairOrderNum || 0);
        },
        logisticsAvailableBedCount() {
            return Number(this.reminderSummary.availableBeds || this.availableBedNum || 0);
        },
        leaveReminderCount() {
            return Number(this.reminderSummary.leaveWaitConfirmCount || 0)
                + Number(this.reminderSummary.leaveAbnormalCount || 0);
        },
        adjustReminderText() {
            const count = Number(this.reminderSummary.adjustPending || 0);
            if (!count) {
                return "\u5f53\u524d\u6ca1\u6709\u5f85\u5904\u7406\u7684\u8c03\u5bbf\u7533\u8bf7";
            }
            return `\u5f53\u524d\u6709 ${count} \u6761\u7533\u8bf7\u7b49\u5f85\u5ba1\u6838\u6216\u843d\u4f4d`;
        },
        leaveReminderText() {
            const away = Number(this.reminderSummary.leaveAwayCount || 0);
            const waitConfirm = Number(this.reminderSummary.leaveWaitConfirmCount || 0);
            const abnormal = Number(this.reminderSummary.leaveAbnormalCount || 0);
            const parts = [];
            if (away) {
                parts.push(`${away} \u4eba\u79bb\u6821\u4e2d`);
            }
            if (waitConfirm) {
                parts.push(`${waitConfirm} \u4eba\u5f85\u786e\u8ba4\u8fd4\u6821`);
            }
            if (abnormal) {
                parts.push(`${abnormal} \u4eba\u5f02\u5e38\u672a\u5f52`);
            }
            if (parts.length) {
                return parts.join("\uff0c");
            }
            return "\u5f53\u524d\u6ca1\u6709\u751f\u6548\u4e2d\u7684\u79bb\u6821\u63d0\u9192";
        },
        studentDisplayName() {
            return getStudentCallName(this.currentUser);
        },
        studentRoomText() {
            if (this.studentRoom?.dormBuildId && this.studentRoom?.dormRoomId) {
                return `${this.studentRoom.dormBuildId}\u680b ${this.studentRoom.dormRoomId}\u5ba4`;
            }
            return "\u6682\u672a\u5206\u914d\u5bbf\u820d";
        },
        studentRoomMetricValue() {
            if (this.studentBedLabel === "\u5e8a\u4f4d\u5f85\u786e\u8ba4") {
                return "\u5f85\u786e\u8ba4";
            }
            return this.studentBedLabel.replace("\u5e8a\u4f4d", "\u5e8a");
        },
        studentBedLabel() {
            const candidates = [this.currentUser?.username, this.currentUser?.name]
                .map((value) => String(value || "").trim())
                .filter(Boolean);
            const bed = bedFields.find((item) => candidates.includes(String(this.studentRoom?.[item.key] || "").trim()));
            return bed?.label || "\u5e8a\u4f4d\u5f85\u786e\u8ba4";
        },
        studentRoomMetricSubtitle() {
            if (!this.studentRoom?.dormBuildId || !this.studentRoom?.dormRoomId) {
                return "\u7b49\u5f85\u5bbf\u820d\u5206\u914d";
            }
            return "\u6b63\u5e38\u5165\u4f4f";
        },
        studentRepairMetricSubtitle() {
            if (this.studentRepairWaitConfirmCount > 0) {
                return `\u6709 ${this.studentRepairWaitConfirmCount} \u6761\u7ef4\u4fee\u7ed3\u679c\u5f85\u4f60\u786e\u8ba4`;
            }
            if (this.studentPendingRepairCount > 0) {
                return `\u5f53\u524d\u6709 ${this.studentPendingRepairCount} \u6761\u62a5\u4fee\u6b63\u5728\u5904\u7406\u4e2d`;
            }
            return "\u5f53\u524d\u6682\u65e0\u6b63\u5728\u5904\u7406\u7684\u62a5\u4fee";
        },
        latestHygieneRecord() {
            if (!Array.isArray(this.studentHygieneRecords) || !this.studentHygieneRecords.length) {
                return null;
            }
            return [...this.studentHygieneRecords].sort((a, b) => getRecordTime(b) - getRecordTime(a))[0];
        },
        hygieneScoreValue() {
            const rawScore = Number(this.latestHygieneRecord?.score);
            if (!Number.isFinite(rawScore)) {
                return "暂无";
            }
            const displayScore = rawScore <= 20 ? 100 - rawScore : rawScore;
            return `${Math.max(0, Math.min(100, Math.round(displayScore)))}\u5206`;
        },
        hygieneScoreNumber() {
            const rawScore = Number(this.latestHygieneRecord?.score);
            if (!Number.isFinite(rawScore)) {
                return null;
            }
            const displayScore = rawScore <= 20 ? 100 - rawScore : rawScore;
            return Math.max(0, Math.min(100, Math.round(displayScore)));
        },
        hygieneMetricSubtitle() {
            if (this.hygieneScoreNumber === null) {
                return "\u6682\u65e0\u536b\u751f\u68c0\u67e5\u8bb0\u5f55";
            }
            if (this.hygieneScoreNumber >= 90) {
                return "表现优秀，继续保持！";
            }
            if (this.hygieneScoreNumber >= 80) {
                return "\u6574\u4f53\u826f\u597d\uff0c\u6ce8\u610f\u7ec6\u8282";
            }
            return "\u672c\u5468\u536b\u751f\u9700\u8981\u91cd\u70b9\u63d0\u5347";
        },        activeLeaveRecord() {
            const now = Date.now();
            return this.studentLeaveRecords.find((item) => {
                if (String(item?.status || "").includes("返回")) {
                    return false;
                }
                const leaveTime = parseDateTime(item?.leaveTime);
                const returnTime = parseDateTime(item?.returnTime);
                if (!leaveTime || !returnTime) {
                    return false;
                }
                return leaveTime.getTime() <= now && now <= returnTime.getTime();
            }) || null;
        },
        latestAdjustRecord() {
            if (!Array.isArray(this.studentAdjustRecords) || !this.studentAdjustRecords.length) {
                return null;
            }
            return [...this.studentAdjustRecords].sort((a, b) => {
                return getFutureTime(b?.finishTime || b?.applyTime) - getFutureTime(a?.finishTime || a?.applyTime);
            })[0];
        },
        todayStatusValue() {
            if (this.activeLeaveRecord) {
                return "\u79bb\u6821\u4e2d";
            }
            return this.studentLeaveRecords.some((item) => String(item?.status || "").includes("返回"))
                ? "已返校"
                : "暂无生效离校";
        },        todayStatusSubtitle() {
            if (!this.activeLeaveRecord) {
                if (this.latestAdjustRecord && isPendingAdjust(this.latestAdjustRecord.state)) {
                    return "你有调宿申请正在等待宿管或后勤处理";
                }
                return this.studentLeaveRecords.length
                    ? "今日暂无生效中的请假或离校申请"
                    : "未提交任何请假或离校申请";
            }
            const returnText = formatShortDateTime(this.activeLeaveRecord.returnTime);
            return returnText ? `预计 ${returnText} 返校` : "当前有正在生效的离校申请";
        },
        workerRepairs() {
            return this.workerRepairRecords.filter((item) => !item.handler || item.handler === this.currentWorkerName);
        },
        activeWorkerRepairs() {
            return this.workerRepairs.filter((item) => !isCompletedRepair(item?.state));
        },
        workerActionableRepairs() {
            return this.activeWorkerRepairs.filter((item) => !isWaitingConfirmRepair(item?.state));
        },
        workerWaitingConfirmRepairs() {
            return this.activeWorkerRepairs.filter((item) => isWaitingConfirmRepair(item?.state));
        },
        workerReturnedRepairs() {
            return this.workerActionableRepairs.filter((item) => isReturnedRepair(item));
        },
        workerAppointments() {
            return this.workerAppointmentRecords.filter((item) => this.isActiveWorkerAppointment(item));
        },
        workerTodayAppointments() {
            return this.workerAppointments.filter((item) => isToday(item?.appointmentTime));
        },
        workerUrgentRepairs() {
            return this.workerActionableRepairs.filter((item) => item?.overdue || String(item?.priority || "").includes("\u7d27\u6025"));
        },
        workerSummary() {
            return Object.assign(createRepairWorkbenchSummary(), this.workerWorkbenchSummary || {});
        },
        workerFocusTask() {
            if (!this.workerActionableRepairs.length) {
                return null;
            }
            return [...this.workerActionableRepairs].sort((a, b) => this.workerTaskWeight(a) - this.workerTaskWeight(b))[0];
        },
        workerTaskItems() {
            const tasks = [...this.workerActionableRepairs].sort((a, b) => this.workerTaskWeight(a) - this.workerTaskWeight(b)).slice(0, 3);
            if (!tasks.length) {
                return [
                    {
                        title: "\u6682\u65e0\u5f85\u5904\u7406\u5de5\u5355",
                        description: "\u5f53\u524d\u6ca1\u6709\u5206\u914d\u7ed9\u4f60\u7684\u7ef4\u4fee\u4efb\u52a1\uff0c\u53ef\u4ee5\u8fdb\u5165\u5de5\u4f5c\u53f0\u67e5\u770b\u5386\u53f2\u8bb0\u5f55\u3002",
                        icon: "Tools",
                        routePath: "/repairAppointment"
                    }
                ];
            }
            return tasks.map((task) => ({
                title: task.title || "维修工单",
                description: this.workerTaskDescription(task),
                icon: "Tools",
                routePath: "/repairAppointment"
            }));
        },
        workerAlertItems() {
            const items = [];
            if (this.workerReturnedRepairs.length) {
                items.push({
                    category: "\u5b66\u751f\u9000\u56de",
                    title: `${this.workerReturnedRepairs.length} \u4e2a\u5de5\u5355\u9700\u8981\u8fd4\u4fee`,
                    description: "\u5b66\u751f\u53cd\u9988\u4ecd\u6709\u95ee\u9898\uff0c\u5efa\u8bae\u4f18\u5148\u67e5\u770b\u53cd\u9988\u5e76\u7ee7\u7eed\u5904\u7406\u3002",
                    time: "现在",
                    tone: "timeline-item--orange",
                    routePath: "/repairAppointment"
                });
            }
            if (this.workerWaitingConfirmRepairs.length) {
                items.push({
                    category: "等待确认",
                    title: `${this.workerWaitingConfirmRepairs.length} 个工单待学生确认`,
                    description: "\u8fd9\u4e9b\u5de5\u5355\u5df2\u63d0\u4ea4\u5b8c\u5de5\uff0c\u5b66\u751f\u786e\u8ba4\u540e\u624d\u4f1a\u8fdb\u5165\u5df2\u5b8c\u6210\u3002",
                    time: "\u5f85\u786e\u8ba4",
                    tone: "timeline-item--blue",
                    routePath: "/repairAppointment"
                });
            }
            if (this.workerUrgentRepairs.length) {
                items.push({
                    category: "优先处理",
                    title: `${this.workerUrgentRepairs.length} 个紧急或逾期工单`,
                    description: "\u5efa\u8bae\u4f18\u5148\u5904\u7406\u8fd9\u4e9b\u4efb\u52a1\uff0c\u907f\u514d\u5f71\u54cd\u5b66\u751f\u6b63\u5e38\u4f7f\u7528\u3002",
                    time: "现在",
                    tone: "timeline-item--orange",
                    routePath: "/repairAppointment"
                });
            }
            if (this.workerTodayAppointments.length) {
                items.push({
                    category: "今日预约",
                    title: `${this.workerTodayAppointments.length} \u4e2a\u4e0a\u95e8\u9884\u7ea6`,
                    description: "\u6309\u9884\u7ea6\u65f6\u95f4\u5904\u7406\uff0c\u5b8c\u5de5\u65f6\u8bb0\u5f97\u4e0a\u4f20\u73b0\u573a\u7167\u7247\u3002",
                    time: "今日",
                    tone: "timeline-item--blue",
                    routePath: "/repairAppointment"
                });
            }
            if (this.workerFocusTask) {
                items.push({
                    category: "下一任务",
                    title: this.workerFocusTask.title || "维修工单",
                    description: this.workerTaskDescription(this.workerFocusTask),
                    time: this.workerTaskTime(this.workerFocusTask) || "\u5f85\u5b89\u6392",
                    tone: "timeline-item--green",
                    routePath: "/repairAppointment"
                });
            }
            if (!items.length) {
                items.push({
                    category: "\u5de5\u4f5c\u72b6\u6001",
                    title: "当前没有新的维修提醒",
                    description: "\u9996\u9875\u4f1a\u5728\u6709\u65b0\u4efb\u52a1\u65f6\u81ea\u52a8\u540c\u6b65\u63d0\u9192\u3002",
                    time: "刚刚",
                    tone: "timeline-item--green",
                    routePath: "/repairAppointment"
                });
            }
            return items.slice(0, 3);
        },
        heroStatusText() {
            if (this.studentRepairWaitConfirmCount > 0) {
                return `\u6709 ${this.studentRepairWaitConfirmCount} \u6761\u7ef4\u4fee\u7ed3\u679c\u5f85\u4f60\u786e\u8ba4\u3002`;
            }
            if (this.studentPendingRepairCount > 0) {
                return `\u4f60\u63d0\u4ea4\u7684 ${this.studentPendingRepairCount} \u6761\u62a5\u4fee\u7533\u8bf7\u6b63\u5728\u5904\u7406\u4e2d\uff0c\u8bf7\u7559\u610f\u8fdb\u5ea6\u3002`;
            }
            return "\u4f60\u5f53\u524d\u6682\u65e0\u6b63\u5728\u5904\u7406\u7684\u62a5\u4fee\u7533\u8bf7\u3002";
        },
        heroTitle() {
            if (this.isWorker) {
                return `${getGreetingText()}，${this.currentWorkerName}。`;
            }
            if (this.isStudent) {
                return `${getGreetingText()}，${this.studentDisplayName}。`;
            }
            const name = this.currentUser?.name || this.currentUser?.username || "";
            return name ? `${getGreetingText()}，${name}。` : `${getGreetingText()}。`;
        },
        heroActionText() {
            if (this.isStudent) {
                return "查看我的报修";
            }
            if (this.identity === "worker") {
                return "\u8fdb\u5165\u5de5\u4f5c\u53f0";
            }
            return "处理工单";
        },
        welcomeText() {
            if (this.isWorker) {
                if (this.workerFocusTask) {
                    return `\u4e0b\u4e00\u6761\u91cd\u70b9\u4efb\u52a1\uff1a${this.workerFocusTask.title || "\u7ef4\u4fee\u5de5\u5355"}，${this.workerTaskDescription(this.workerFocusTask)}`;
                }
                if (this.workerWaitingConfirmRepairs.length) {
                    return `${this.workerWaitingConfirmRepairs.length} \u6761\u5de5\u5355\u5df2\u63d0\u4ea4\u5b8c\u5de5\uff0c\u6b63\u5728\u7b49\u5f85\u5b66\u751f\u786e\u8ba4`;
                }
                return "\u5f53\u524d\u6ca1\u6709\u65b0\u7684\u7ef4\u4fee\u4efb\u52a1\uff0c\u540e\u7eed\u6d3e\u5355\u548c\u9884\u7ea6\u4f1a\u5728\u8fd9\u91cc\u63d0\u9192\u3002";
            }
            if (this.isStudent) {
                return this.heroStatusText;
            }
            if (Number(this.reminderSummary.totalPending || 0) > 0) {
                return `\u5f53\u524d\u6709 ${this.reminderSummary.totalPending} \u6761\u5f85\u5904\u7406\u63d0\u9192\uff0c\u5176\u4e2d\u8c03\u5bbf ${this.reminderSummary.adjustPending || 0} \u6761\uff0c\u79bb\u6821 ${this.leaveReminderCount} \u6761\u9700\u8ddf\u8fdb`;
            }
            return `目前入住率达 ${this.occupancyRate}，有 ${this.pendingRepairNum} 条工单待处理`;
        },
        statCards() {
            if (this.isStudent) {
                return [
                    {
                        title: "我的床位",
                        value: this.studentRoomMetricValue,
                        description: this.studentRoomMetricSubtitle
                    },
                    {
                        title: "我的报修",
                        value: this.studentPendingRepairCount,
                        description: this.studentRepairMetricSubtitle
                    },
                    {
                        title: "最近卫生检查",
                        value: this.hygieneScoreValue,
                        description: this.hygieneMetricSubtitle
                    },
                    {
                        title: "\u4eca\u65e5\u72b6\u6001",
                        value: this.todayStatusValue,
                        description: this.todayStatusSubtitle
                    }
                ];
            }
            if (this.isWorker) {
                return [
                    {
                        title: "\u5f85\u63a5\u5355",
                        value: this.workerSummary.pendingCount,
                        description: "\u9700\u8981\u786e\u8ba4\u9886\u53d6\u6216\u7b49\u5f85\u5b89\u6392\u7684\u7ef4\u4fee\u4efb\u52a1"
                    },
                    {
                        title: "\u5904\u7406\u4e2d",
                        value: this.workerSummary.processingCount,
                        description: "已经接单，正在推进的工单"
                    },
                    {
                        title: "\u5f85\u5b66\u751f\u786e\u8ba4",
                        value: this.workerSummary.waitConfirmCount,
                        description: "已提交完工，等待学生确认结果"
                    },
                    {
                        title: "紧急/逾期",
                        value: this.workerUrgentRepairs.length + this.workerReturnedRepairs.length,
                        description: "紧急、逾期或学生退回的工单"
                    }
                ];
            }
            return [
                {
                    title: "\u5f85\u5904\u7406\u62a5\u4fee",
                    value: this.logisticsRepairPendingCount,
                    description: this.repairFollowupText
                },
                {
                    title: "\u8c03\u5bbf\u7533\u8bf7",
                    value: this.reminderSummary.adjustPending || 0,
                    description: this.adjustReminderText
                },
                {
                    title: "\u79bb\u6821\u63d0\u9192",
                    value: this.leaveReminderCount,
                    description: this.leaveReminderText
                },
                {
                    title: "\u53ef\u5206\u914d\u5e8a\u4f4d",
                    value: this.logisticsAvailableBedCount,
                    description: this.bedMetricFallback ? "可用床位以房间明细为准" : "可继续安排入住的空余床位"
                }
            ];
        },
        quickServices() {
            if (this.isWorker) {
                return [
                    { title: "维修工单", description: "接单、处理与提交完工", icon: "Tools", routePath: "/repairAppointment" },
                    { title: "上门预约", description: "查看预约时间与任务安排", icon: "Tickets", routePath: "/repairAppointment" },
                    { title: "个人资料", description: "维护联系方式与账户资料", icon: "User", routePath: "/selfInfo" }
                ];
            }
            if (!this.isStudent) {
                return [
                    { title: "宿舍管理", description: "查看房间与入住信息", icon: "House", routePath: "/roomInfo" },
                    { title: "调宿审批", description: "处理学生调宿申请", icon: "Operation", routePath: "/adjustRoomInfo" },
                    { title: "离校登记", description: "跟进离校与返校记录", icon: "Van", routePath: "/leaveRegister" }
                ];
            }
            return [
                {
                    title: "提交报修",
                    description: "宿舍设施故障及时反馈",
                    icon: "Tools",
                    routePath: "/applyRepairInfo"
                },
                {
                    title: "请假/离校申请",
                    description: "\u586b\u5199\u79bb\u6821\u65f6\u95f4\u4e0e\u8fd4\u6821\u65f6\u95f4",
                    icon: "Van",
                    routePath: "/applyLeaveSchool"
                },
                {
                    title: "调宿申请",
                    description: "\u63d0\u4ea4\u5bbf\u820d\u8c03\u6574\u9700\u6c42",
                    icon: "Operation",
                    routePath: "/applyChangeRoom"
                }
            ];
        },
        studentTimelineItems() {
            const items = [];
            if (this.latestAdjustRecord) {
                const adjustTime = formatShortDateTime(this.latestAdjustRecord.finishTime || this.latestAdjustRecord.applyTime) || "最近";
                if (isPendingAdjust(this.latestAdjustRecord.state)) {
                    items.push({
                        time: adjustTime,
                        category: "调宿",
                        content: "你的调宿申请正在等待处理，建议留意目标房间和床位变化。",
                        tone: "timeline-item--blue"
                    });
                } else if (isApprovedAdjust(this.latestAdjustRecord.state)) {
                    items.push({
                        time: adjustTime,
                        category: "调宿",
                        content: "最近一条调宿申请已通过，住宿信息已经同步更新。",
                        tone: "timeline-item--green"
                    });
                } else if (isRejectedAdjust(this.latestAdjustRecord.state)) {
                    items.push({
                        time: adjustTime,
                        category: "调宿",
                        content: "最近一条调宿申请已驳回，可以补充理由后重新提交。",
                        tone: "timeline-item--orange"
                    });
                }
            }
            if (this.activeLeaveRecord) {
                items.push({
                    time: formatShortDateTime(this.activeLeaveRecord.returnTime) || "当前",
                    category: "离校",
                    content: this.todayStatusSubtitle,
                    tone: "timeline-item--orange"
                });
            } else if (this.studentLeaveRecords.some((item) => String(item?.status || "").includes("返回"))) {
                items.push({
                    time: "最近",
                    category: "离校",
                    content: "最近一条离校记录已经确认返校，当前状态正常。",
                    tone: "timeline-item--green"
                });
            }
            if (this.studentRepairWaitConfirmCount > 0) {
                items.push({
                    time: "现在",
                    category: "维修",
                    content: `${this.studentRepairWaitConfirmCount} 条维修结果待确认，请查看完工照片后处理。`,
                    tone: "timeline-item--orange"
                });
            }
            const processingCount = Math.max(0, this.studentPendingRepairCount - this.studentRepairWaitConfirmCount);
            if (processingCount > 0) {
                items.push({
                    time: "进行中",
                    category: "报修",
                    content: `${processingCount} 条报修仍在接单、预约或处理中。`,
                    tone: "timeline-item--blue"
                });
            }
            if (this.latestHygieneRecord) {
                items.push({
                    time: formatShortDateTime(this.latestHygieneRecord.checkDate) || "最近",
                    category: "卫生检查",
                    content: `最近一次宿舍卫生检查：${this.hygieneScoreValue}。${this.hygieneMetricSubtitle}`,
                    tone: this.hygieneScoreNumber >= 80 ? "timeline-item--green" : "timeline-item--orange"
                });
            }
            return items.slice(0, 3);
        },
        reminderItems() {
            const source = Array.isArray(this.reminderSummary.items) ? this.reminderSummary.items : [];
            const selected = [];
            const hasSelected = (item) => selected.some((current) => current === item);
            const textOf = (item) => `${item?.category || ""} ${item?.title || ""} ${item?.description || ""}`;
            const addFirst = (predicate) => {
                const item = source.find((candidate) => predicate(candidate) && !hasSelected(candidate));
                if (item && selected.length < 3) {
                    selected.push(item);
                }
            };

            addFirst((item) => item?.level === "urgent");
            addFirst((item) => textOf(item).includes("\u8c03\u5bbf"));
            addFirst((item) => textOf(item).includes("\u79bb\u6821"));
            source.forEach((item) => {
                if (selected.length < 3 && !hasSelected(item)) {
                    selected.push(item);
                }
            });

            if (selected.length) {
                return selected;
            }
            return [];
        },
    },
    data() {
        return {
            identity: "",
            currentUser: {},
            studentNum: "",
            haveRoomStudentNum: "",
            repairOrderNum: "",
            availableBedNum: "",
            studentRoom: createStudentRoom(),
            studentPendingRepairCount: 0,
            studentRepairWaitConfirmCount: 0,
            studentHygieneRecords: [],
            studentLeaveRecords: [],
            studentAdjustRecords: [],
            workerRepairRecords: [],
            workerAppointmentRecords: [],
            workerWorkbenchSummary: createRepairWorkbenchSummary(),
            bedMetricFallback: false,
            excellentHygieneRoomNum: 0,
            activities: [],
            noticeDetailDialog: false,
            noticeDetail: {},
            reminderSummary: createReminderSummary(),
            dashboardRefreshTimer: null,
            dormSlides: [
                {
                    title: "校园宿舍庭院",
                    tag: "庭院",
                    description: "绿树环绕的宿舍庭院与步行空间。",
                    src: "/images/campus-courtyard.jpg"
                },
                {
                    title: "学生宿舍楼",
                    tag: "楼宇",
                    description: "校园学生宿舍楼的建筑外观。",
                    src: "/images/residence-exterior.jpg"
                },
                {
                    title: "学生住宿空间",
                    tag: "室内",
                    description: "整洁有序的学生宿舍与日常生活空间。",
                    src: "/images/student-room.jpg"
                },
                {
                    title: "公共学习区",
                    tag: "学习",
                    description: "供学生阅读、自习与交流的公共学习空间。",
                    src: "/images/common-study-area.jpg"
                },
                {
                    title: "宿舍公共走廊",
                    tag: "走廊",
                    description: "明亮整洁的宿舍楼公共走廊。",
                    src: "/images/residence-corridor.jpg"
                }
            ],
        };
    },
    created() {
        this.loadCurrentUser();
        this.loadIdentity();
        this.refreshDashboard({ silent: true });
    },
    mounted() {
        this.startDashboardAutoRefresh();
        window.addEventListener("focus", this.handleWindowFocus);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
    },
    beforeUnmount() {
        this.stopDashboardAutoRefresh();
        window.removeEventListener("focus", this.handleWindowFocus);
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    },
    methods: {
        loadIdentity() {
            try {
                this.identity = JSON.parse(window.sessionStorage.getItem("identity") || "\"\"");
            } catch (error) {
                this.identity = "";
            }
        },
        loadCurrentUser() {
            try {
                this.currentUser = JSON.parse(window.sessionStorage.getItem("user") || "{}");
            } catch (error) {
                this.currentUser = {};
            }
        },
        refreshDashboard(options = {}) {
            const silent = Boolean(options.silent);
            this.getHomePageNotice(silent);
            if (this.isWorker) {
                this.getWorkerHomeData(silent);
                return;
            }
            this.getStuNum(silent);
            this.getHaveRoomNum(silent);
            this.getOrderNum(silent);
            this.getAvailableBedNum(silent);
            if (this.isStudent) {
                this.getStudentRoomInfo(silent).then(() => this.getStudentHygieneSummary(silent));
                this.getStudentRepairSummary(silent);
                this.getStudentLeaveStatus(silent);
                this.getStudentAdjustStatus(silent);
            } else {
                this.getReminderSummary(silent);
                this.getExcellentHygieneRoomNum(silent);
            }
        },
        startDashboardAutoRefresh() {
            this.stopDashboardAutoRefresh();
            this.dashboardRefreshTimer = window.setInterval(() => {
                this.refreshDashboard({ silent: true });
            }, 120000);
        },
        stopDashboardAutoRefresh() {
            if (this.dashboardRefreshTimer) {
                window.clearInterval(this.dashboardRefreshTimer);
                this.dashboardRefreshTimer = null;
            }
        },
        handleWindowFocus() {
            this.refreshDashboard({ silent: true });
        },
        handleVisibilityChange() {
            if (document.visibilityState === "visible") {
                this.refreshDashboard({ silent: true });
            }
        },
        async getWorkerHomeData(silent = false) {
            try {
                const [repairRes, appointmentRes, summaryRes] = await Promise.all([
                    request.get("/repair/find", {
                        params: {
                            pageNum: 1,
                            pageSize: 200,
                            search: "",
                        },
                    }),
                    request.get("/repair/appointment/list"),
                    request.get("/repair/workbenchSummary")
                ]);
                if (repairRes.code !== "0") {
                    throw new Error(repairRes.msg || "维修工单加载失败");
                }
                if (appointmentRes.code !== "0") {
                    throw new Error(appointmentRes.msg || "预约记录加载失败");
                }
                if (summaryRes.code !== "0") {
                    throw new Error(summaryRes.msg || "维修统计加载失败");
                }
                this.workerRepairRecords = repairRes.data?.records || [];
                this.workerAppointmentRecords = Array.isArray(appointmentRes.data) ? appointmentRes.data : [];
                this.workerWorkbenchSummary = Object.assign(createRepairWorkbenchSummary(), summaryRes.data || {});
            } catch (error) {
                this.workerRepairRecords = [];
                this.workerAppointmentRecords = [];
                this.workerWorkbenchSummary = createRepairWorkbenchSummary();
                if (!silent) {
                    ElMessage.error(error.message || "维修首页数据加载失败");
                }
                console.error(error);
            }
        },
        findWorkerRepairByAppointment(record) {
            if (!record) {
                return null;
            }
            return this.workerRepairs.find((item) => item.id === record.repairId) || this.workerRepairs.find((item) =>
                item.title === record.title &&
                item.dormBuildId === record.dormBuildId &&
                item.dormRoomId === record.dormRoomId
            ) || null;
        },
        isActiveWorkerAppointment(record) {
            const repair = this.findWorkerRepairByAppointment(record);
            return !!repair
                && !isCompletedRepair(repair.state)
                && !isWaitingConfirmRepair(repair.state)
                && !isCompletedRepair(record?.status);
        },
        workerTaskTime(task) {
            return formatShortDateTime(task?.appointmentTime || task?.expectedFinishTime);
        },
        workerTaskDescription(task) {
            const location = task?.dormBuildId && task?.dormRoomId ? `${task.dormBuildId}-${task.dormRoomId}` : "\u5bbf\u820d\u5f85\u786e\u8ba4";
            const status = task?.handler ? (task?.state || "\u5904\u7406\u4e2d") : "\u5f85\u63a5\u5355";
            const time = this.workerTaskTime(task);
            const priority = task?.priority ? ` · ${task.priority}` : "";
            const returned = isReturnedRepair(task) ? " · \u5b66\u751f\u9000\u56de" : "";
            return `${location} · ${status}${priority}${returned}${time ? ` · ${time}` : ""}`;
        },
        workerTaskWeight(task) {
            let weight = 0;
            if (isReturnedRepair(task)) {
                weight -= 2500;
            }
            if (task?.overdue) {
                weight -= 3000;
            }
            if (String(task?.priority || "").includes("\u7d27\u6025")) {
                weight -= 2000;
            }
            if (isToday(task?.appointmentTime)) {
                weight -= 1000;
            }
            if (String(task?.state || "").includes("预约")) {
                weight -= 200;
            } else if (String(task?.state || "").includes("处理")) {
                weight -= 100;
            }
            return weight + Math.min(getFutureTime(task?.appointmentTime || task?.expectedFinishTime), 9999999999999) / 100000000000;
        },
        async getStuNum(silent = false) {
            request.get("/stu/stuNum").then((res) => {
                if (res.code === "0") {
                    this.studentNum = res.data;
                } else if (!silent) {
                    ElMessage.error(res.msg);
                }
            }).catch((error) => {
                if (!silent) {
                    ElMessage.error("学生总数获取失败");
                }
                console.error(error);
            });
        },
        async getHaveRoomNum(silent = false) {
            request.get("/room/selectHaveRoomStuNum").then((res) => {
                if (res.code === "0") {
                    this.haveRoomStudentNum = res.data;
                } else if (!silent) {
                    ElMessage.error(res.msg);
                }
            }).catch((error) => {
                if (!silent) {
                    ElMessage.error("入住人数获取失败");
                }
                console.error(error);
            });
        },
        async getOrderNum(silent = false) {
            request.get("/repair/orderNum").then((res) => {
                if (res.code === "0") {
                    this.repairOrderNum = res.data;
                } else if (!silent) {
                    ElMessage.error(res.msg);
                }
            }).catch((error) => {
                if (!silent) {
                    ElMessage.error("报修工单获取失败");
                }
                console.error(error);
            });
        },
        async getAvailableBedNum(silent = false) {
            try {
                const res = await request.get("/room/availableBeds");
                if (res.code === "0") {
                    this.availableBedNum = res.data;
                    this.bedMetricFallback = false;
                } else if (!silent) {
                    ElMessage.error(res.msg);
                }
            } catch (error) {
                try {
                    const fallbackRes = await request.get("/room/noFullRoom");
                    if (fallbackRes.code === "0") {
                        this.availableBedNum = fallbackRes.data;
                        this.bedMetricFallback = true;
                        if (!silent) {
                            ElMessage.warning("后端仍在使用旧统计接口，页面已切换为兼容数据");
                        }
                    } else if (!silent) {
                        ElMessage.error(fallbackRes.msg);
                    }
                } catch (fallbackError) {
                    if (!silent) {
                        ElMessage.error("\u53ef\u5206\u914d\u5e8a\u4f4d\u83b7\u53d6\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u540e\u7aef\u670d\u52a1");
                    }
                    console.error(error);
                    console.error(fallbackError);
                }
            }
        },
        async getHomePageNotice(silent = false) {
            request.get("/notice/homePageNotice").then((res) => {
                if (res.code === "0") {
                    this.activities = res.data || [];
                } else if (!silent) {
                    ElMessage.error(res.msg);
                }
            }).catch((error) => {
                if (!silent) {
                    ElMessage.error("公告列表获取失败");
                }
                console.error(error);
            });
        },
        async getReminderSummary(silent = false) {
            try {
                const res = await request.get("/reminder/summary");
                if (res.code !== "0") {
                    throw new Error(res.msg || "提醒中心数据加载失败");
                }
                this.reminderSummary = Object.assign(createReminderSummary(), res.data || {});
            } catch (error) {
                if (!silent) {
                    ElMessage.error(error.message || "提醒中心数据加载失败");
                }
                console.error(error);
            }
        },
        async getExcellentHygieneRoomNum(silent = false) {
            try {
                const res = await request.get("/hygiene/check/summary");
                if (res.code !== "0" || !Array.isArray(res.data)) {
                    throw new Error(res.msg || "卫生总分统计加载失败");
                }
                this.excellentHygieneRoomNum = res.data.filter((item) => Number(item.averageScore) >= 90).length;
            } catch (error) {
                this.excellentHygieneRoomNum = 0;
                if (!silent) {
                    ElMessage.error(error.message || "卫生总分统计加载失败");
                }
                console.error(error);
            }
        },
        async getStudentRoomInfo(silent = false) {
            const username = this.currentUser?.username;
            if (!username) {
                this.studentRoom = createStudentRoom();
                return;
            }
            try {
                const res = await request.get(`/room/getMyRoom/${username}`);
                if (res.code === "0" && res.data) {
                    this.studentRoom = res.data;
                    return;
                }
                this.studentRoom = createStudentRoom();
                if (!silent) {
                    ElMessage.error(res.msg || "宿舍信息获取失败");
                }
            } catch (error) {
                this.studentRoom = createStudentRoom();
                if (!silent) {
                    ElMessage.error("宿舍信息获取失败");
                }
                console.error(error);
            }
        },
        async getStudentRepairSummary(silent = false) {
            const studentName = this.currentUser?.name;
            if (!studentName) {
                this.studentPendingRepairCount = 0;
                this.studentRepairWaitConfirmCount = 0;
                return;
            }
            try {
                const res = await request.get("/repair/workbenchSummary");
                if (res.code !== "0") {
                    throw new Error(res.msg || "报修统计获取失败");
                }
                const summary = Object.assign(createRepairWorkbenchSummary(), res.data || {});
                this.studentPendingRepairCount = Number(summary.pendingCount || 0)
                    + Number(summary.processingCount || 0)
                    + Number(summary.appointedCount || 0)
                    + Number(summary.waitConfirmCount || 0);
                this.studentRepairWaitConfirmCount = Number(summary.waitConfirmCount || 0);
            } catch (error) {
                this.studentPendingRepairCount = 0;
                this.studentRepairWaitConfirmCount = 0;
                if (!silent) {
                    ElMessage.error(error.message || "报修统计获取失败");
                }
                console.error(error);
            }
        },
        async getStudentHygieneSummary(silent = false) {
            if (!this.studentRoom?.dormBuildId || !this.studentRoom?.dormRoomId) {
                this.studentHygieneRecords = [];
                return;
            }
            try {
                const res = await request.get(`/hygiene/check/list/room/${this.studentRoom.dormBuildId}/${this.studentRoom.dormRoomId}`);
                if (res.code !== "0") {
                    throw new Error(res.msg || "\u536b\u751f\u68c0\u67e5\u8bb0\u5f55\u83b7\u53d6\u5931\u8d25");
                }
                this.studentHygieneRecords = Array.isArray(res.data) ? res.data : [];
            } catch (error) {
                this.studentHygieneRecords = [];
                if (!silent) {
                    ElMessage.error(error.message || "\u536b\u751f\u68c0\u67e5\u8bb0\u5f55\u83b7\u53d6\u5931\u8d25");
                }
                console.error(error);
            }
        },        async getStudentLeaveStatus(silent = false) {
            const studentId = this.currentUser?.username;
            if (!studentId) {
                this.studentLeaveRecords = [];
                return;
            }
            try {
                const res = await request.get("/leaveRegister/list");
                if (res.code !== "0") {
                    throw new Error(res.msg || "离校申请记录获取失败");
                }
                this.studentLeaveRecords = Array.isArray(res.data) ? res.data : [];
            } catch (error) {
                this.studentLeaveRecords = [];
                if (!silent) {
                    ElMessage.error(error.message || "离校申请记录获取失败");
                }
                console.error(error);
            }
        },
        async getStudentAdjustStatus(silent = false) {
            const studentId = this.currentUser?.username;
            if (!studentId) {
                this.studentAdjustRecords = [];
                return;
            }
            try {
                const res = await request.get("/adjustRoom/find", {
                    params: {
                        pageNum: 1,
                        pageSize: 50,
                        search: ""
                    }
                });
                if (res.code !== "0") {
                    throw new Error(res.msg || "调宿申请记录获取失败");
                }
                const records = Array.isArray(res.data?.records) ? res.data.records : [];
                this.studentAdjustRecords = records.filter((item) => item?.username === studentId);
            } catch (error) {
                this.studentAdjustRecords = [];
                if (!silent) {
                    ElMessage.error(error.message || "调宿申请记录获取失败");
                }
                console.error(error);
            }
        },
        goReminderCenter() {
            this.$router.push("/reminderCenter");
        },
        goRepairCenter() {
            if (this.identity === "worker") {
                this.$router.push("/repairAppointment");
                return;
            }
            if (this.identity === "stu") {
                this.$router.push("/applyRepairInfo");
                return;
            }
            this.$router.push("/repairInfo");
        },
        openReminder(item) {
            if (item?.routePath) {
                this.$router.push(item.routePath);
            }
        },
        openWorkerEntry(item) {
            this.$router.push(item?.routePath || "/repairAppointment");
        },
        goQuickService(service) {
            if (service?.routePath) {
                this.$router.push(service.routePath);
            }
        },
        formatNoticeTime(value) {
            return formatShortDateTime(value) || "最新";
        },
        getNoticeSummary(notice) {
            return shortenNoticeText(notice?.content || "请查看公告详情。");
        },
        openNoticeDetail(notice) {
            this.noticeDetail = {
                title: notice?.title || "公告详情",
                content: stripNoticeText(notice?.content || ""),
                author: notice?.author || "后勤管理中心",
                releaseTime: notice?.releaseTime || ""
            };
            this.noticeDetailDialog = true;
        },
    },
};

