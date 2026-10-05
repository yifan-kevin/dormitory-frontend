// LOCATE: 登录页面逻辑，账号密码校验和身份登录请求
import request from "@/utils/request";

const { ElMessage } = require("element-plus");

const translations = {
    zh: {
        title: "宿舍管理系统",
        brand: "高校住宿服务",
        introLabel: "校园宿舍服务",
        introTitle: "宿舍事务，统一办理",
        introDescription: "查看住宿信息、提交报修申请，处理日常宿舍事务。",
        photoAlt: "校园内的宿舍楼与绿树",
        photoCaption: "住宿安排 · 日常管理 · 维修服务",
        introNote: "请使用学校分配的账号，选择对应身份登录。",
        subtitle: "高校宿舍综合管理平台",
        loginDescription: "使用您的校园账号登录",
        usernameLabel: "账号",
        passwordLabel: "密码",
        helpNote: "账号问题请联系宿舍管理人员",
        languageLabel: "选择语言",
        usernamePlaceholder: "请输入账号",
        passwordPlaceholder: "请输入密码",
        identityLabel: "选择身份",
        rememberPassword: "记住密码",
        forgotPassword: "忘记密码？",
        login: "进入系统",
        loggingIn: "正在登录...",
        student: "学生",
        studentDesc: "宿舍与申请",
        dormManager: "宿舍管理员",
        dormManagerDesc: "学生与房间",
        worker: "维修人员",
        workerDesc: "工单与预约",
        admin: "后勤管理员",
        adminDesc: "全局与提醒",
        usernameRequired: "请输入账号",
        passwordRequired: "请输入密码",
        identityRequired: "请选择登录身份",
        loginSuccess: "登录成功",
        loginFailed: "登录失败，请重试",
        forgotPasswordTips: "请联系管理员或后勤中心重置密码",
        zhLabel: "中文",
    },
    en: {
        title: "Dormitory Management",
        brand: "Campus Housing",
        introLabel: "Campus housing services",
        introTitle: "Your housing services, together",
        introDescription: "View housing details, submit repair requests, and manage everyday dormitory matters.",
        photoAlt: "Campus residence buildings and trees",
        photoCaption: "Housing · Administration · Maintenance",
        introNote: "Use your assigned campus account and select your role to sign in.",
        subtitle: "Integrated Dormitory Management Platform",
        loginDescription: "Sign in with your campus account",
        usernameLabel: "Username",
        passwordLabel: "Password",
        helpNote: "For account help, contact housing staff",
        languageLabel: "Select language",
        usernamePlaceholder: "Enter username",
        passwordPlaceholder: "Enter password",
        identityLabel: "Select Role",
        rememberPassword: "Remember me",
        forgotPassword: "Forgot password?",
        login: "Sign In",
        loggingIn: "Signing in...",
        student: "Student",
        studentDesc: "Room and requests",
        dormManager: "Dorm Manager",
        dormManagerDesc: "Students and rooms",
        worker: "Worker",
        workerDesc: "Tickets and bookings",
        admin: "Logistics",
        adminDesc: "Overview and alerts",
        usernameRequired: "Please enter your username",
        passwordRequired: "Please enter your password",
        identityRequired: "Please select a role",
        loginSuccess: "Login successful",
        loginFailed: "Login failed, please try again",
        forgotPasswordTips: "Please contact the administrator to reset your password.",
        zhLabel: "中文",
    },
};

export default {
    name: "Login",
    data() {
        return {
            identity: "",
            currentLanguage: "zh",
            rememberPassword: true,
            form: {
                username: "",
                password: "",
                identity: "",
            },
            focusedInput: null,
            loginLoading: false,
        };
    },
    computed: {
        disabled() {
            const { username, password, identity } = this.form;
            return Boolean(username && password && identity);
        },
        copy() {
            return translations[this.currentLanguage] || translations.zh;
        },
        formRules() {
            return {
                username: [{ required: true, message: this.copy.usernameRequired, trigger: "blur" }],
                password: [{ required: true, message: this.copy.passwordRequired, trigger: "blur" }],
                identity: [{ required: true, message: this.copy.identityRequired, trigger: "change" }],
            };
        },
    },
    created() {
        this.restoreLoginPreference();
    },
    methods: {
        login() {
            if (this.loginLoading) {
                return;
            }
            this.$refs.form.validate((valid) => {
                if (!valid) {
                    return;
                }

                this.loginLoading = true;
                this.identity = this.form.identity;
                request
                    .post("/" + this.identity + "/login", this.form)
                    .then((res) => {
                        this.loginLoading = false;
                        if (res.code === "0") {
                            this.persistLoginPreference();
                            ElMessage({
                                message: this.copy.loginSuccess,
                                type: "success",
                            });
                            window.sessionStorage.setItem("user", JSON.stringify(res.data));
                            window.sessionStorage.setItem("identity", JSON.stringify(this.form.identity));
                            this.$router.replace({ path: "/home" });
                        } else {
                            ElMessage({
                                message: res.msg,
                                type: "error",
                            });
                        }
                    })
                    .catch(() => {
                        this.loginLoading = false;
                        ElMessage({
                            message: this.copy.loginFailed,
                            type: "error",
                        });
                    });
            });
        },
        onInputFocus(input) {
            this.focusedInput = input;
        },
        onInputBlur() {
            this.focusedInput = null;
        },
        toggleRememberPassword() {
            this.rememberPassword = !this.rememberPassword;
            if (!this.rememberPassword) {
                window.localStorage.removeItem("rememberedLogin");
            }
        },
        showForgotPasswordTips() {
            ElMessage({
                message: this.copy.forgotPasswordTips,
                type: "info",
            });
        },
        switchLanguage(language) {
            this.currentLanguage = language;
            window.localStorage.setItem("loginLanguage", language);
        },
        restoreLoginPreference() {
            const savedLanguage = window.localStorage.getItem("loginLanguage");
            if (savedLanguage) {
                this.currentLanguage = savedLanguage;
            }

            try {
                const remembered = JSON.parse(window.localStorage.getItem("rememberedLogin") || "null");
                if (remembered && remembered.username && remembered.identity) {
                    this.form.username = remembered.username;
                    this.form.password = remembered.password || "";
                    this.form.identity = remembered.identity;
                    this.rememberPassword = true;
                }
            } catch (error) {
                window.localStorage.removeItem("rememberedLogin");
            }
        },
        persistLoginPreference() {
            if (!this.rememberPassword) {
                window.localStorage.removeItem("rememberedLogin");
                return;
            }

            window.localStorage.setItem(
                "rememberedLogin",
                JSON.stringify({
                    username: this.form.username,
                    password: this.form.password,
                    identity: this.form.identity,
                })
            );
        },
    },
};
