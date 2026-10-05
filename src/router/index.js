import Layout from "../layout/Layout.vue";
import { createRouter, createWebHistory } from "vue-router";

export const constantRoutes = [
    // LOCATE: login route
    { path: "/Login", name: "Login", component: () => import("@/views/Login") },
    {
        path: "/Layout",
        name: "Layout",
        component: Layout,
        children: [
            // LOCATE: common routes home assistant reminder bed assign
            { path: "/home", name: "Home", component: () => import("@/views/Home") },
            { path: "/aiAssistant", name: "AiAssistant", component: () => import("@/views/AiAssistant") },
            { path: "/reminderCenter", name: "ReminderCenter", component: () => import("@/views/ReminderCenter") },
            { path: "/bedAssignCenter", name: "BedAssignCenter", component: () => import("@/views/BedAssignCenter") },

            // LOCATE: admin and dorm manager routes student manager building room notice repair visitor
            { path: "/stuInfo", name: "StuInfo", component: () => import("@/views/StuInfo") },
            { path: "/dormManagerInfo", name: "DormManagerInfo", component: () => import("@/views/DormManagerInfo") },
            { path: "/buildingInfo", name: "BuildingInfo", component: () => import("@/views/BuildingInfo") },
            { path: "/roomInfo", name: "RoomInfo", component: () => import("@/views/RoomInfo") },
            { path: "/noticeInfo", name: "NoticeInfo", component: () => import("@/views/NoticeInfo") },
            { path: "/adjustRoomInfo", name: "AdjustRoomInfo", component: () => import("@/views/AdjustRoomInfo") },
            { path: "/repairInfo", name: "RepairInfo", component: () => import("@/views/RepairInfo") },
            { path: "/visitorInfo", name: "VisitorInfo", component: () => import("@/views/VisitorInfo") },

            // LOCATE: student routes my room repair apply change room leave school
            { path: "/myRoomInfo", name: "MyRoomInfo", component: () => import("@/views/MyRoomInfo") },
            { path: "/applyRepairInfo", name: "ApplyRepairInfo", component: () => import("@/views/ApplyRepairInfo") },
            { path: "/applyChangeRoom", name: "ApplyChangeRoom", component: () => import("@/views/ApplyChangeRoom") },
            { path: "/applyLeaveSchool", name: "ApplyLeaveSchool", component: () => import("@/views/ApplyLeaveSchool") },

            // LOCATE: daily routes hygiene valuable item leave register repair workbench self info
            { path: "/hygieneCheck", name: "HygieneCheck", component: () => import("@/views/HygieneCheck") },
            { path: "/valuableItemRegister", name: "ValuableItemRegister", component: () => import("@/views/ValuableItemRegister") },
            { path: "/leaveRegister", name: "LeaveRegister", component: () => import("@/views/LeaveRegister") },
            { path: "/repairAppointment", name: "RepairAppointment", component: () => import("@/views/RepairAppointment") },
            { path: "/selfInfo", name: "SelfInfo", component: () => import("@/views/SelfInfo") },
        ],
    },
];

const router = createRouter({
    routes: constantRoutes,
    history: createWebHistory(process.env.BASE_URL),
});

const hasValidLoginUser = () => {
    const user = window.sessionStorage.getItem("user");
    if (!user || user === "undefined" || user === "null") {
        return false;
    }
    try {
        const parsed = JSON.parse(user);
        return Boolean(parsed && parsed.username);
    } catch (error) {
        console.error(error);
        return false;
    }
};

const getSessionIdentity = () => {
    const identity = window.sessionStorage.getItem("identity");
    if (!identity || identity === "undefined" || identity === "null") {
        return "";
    }
    try {
        return JSON.parse(identity) || "";
    } catch (error) {
        return identity;
    }
};

const roleRoutes = {
    // LOCATE: student role routes
    stu: [
        "/home",
        "/aiAssistant",
        "/selfInfo",
        "/myRoomInfo",
        "/applyRepairInfo",
        "/applyChangeRoom",
        "/applyLeaveSchool",
        "/hygieneCheck",
    ],
    // LOCATE: worker role routes
    worker: [
        "/home",
        "/aiAssistant",
        "/selfInfo",
        "/repairAppointment",
    ],
    // LOCATE: dorm manager role routes
    dormManager: [
        "/home",
        "/aiAssistant",
        "/selfInfo",
        "/reminderCenter",
        "/buildingInfo",
        "/roomInfo",
        "/stuInfo",
        "/repairInfo",
        "/adjustRoomInfo",
        "/visitorInfo",
        "/hygieneCheck",
        "/valuableItemRegister",
        "/leaveRegister",
    ],
    // LOCATE: admin role routes
    admin: [
        "/home",
        "/aiAssistant",
        "/selfInfo",
        "/reminderCenter",
        "/buildingInfo",
        "/roomInfo",
        "/bedAssignCenter",
        "/stuInfo",
        "/dormManagerInfo",
        "/repairInfo",
        "/noticeInfo",
        "/adjustRoomInfo",
        "/visitorInfo",
        "/hygieneCheck",
        "/valuableItemRegister",
        "/leaveRegister",
    ],
};

const canAccessRoute = (identity, path) => {
    if (path === "/" || path === "/Layout") {
        return true;
    }
    const routes = roleRoutes[identity];
    return !routes || routes.includes(path);
};

router.beforeEach((to, from, next) => {
    const hasUser = hasValidLoginUser();
    if (to.path === "/Login") {
        return next();
    }
    if (!hasUser) {
        window.sessionStorage.removeItem("user");
        return next("/Login");
    }
    const identity = getSessionIdentity();
    if (!canAccessRoute(identity, to.path)) {
        return next("/home");
    }
    if (to.path === "/" && hasUser) {
        return next("/home");
    }
    next();
});

export default router;
