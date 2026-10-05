// LOCATE: 宿管信息管理逻辑，新增宿管、编辑宿管、分配楼宇
import request from "@/utils/request";

const {ElMessage} = require("element-plus");

const parseDormBuildIds = (value) => {
    return String(value || "")
        .split(/[^0-9]+/)
        .map((item) => item.trim())
        .filter(Boolean);
};

const normalizeDormManager = (row = {}) => ({
    ...row,
    dormBuildIds: row.dormBuildIds || (row.dormBuildId ? String(row.dormBuildId) : ""),
});

const createDormManagerForm = () => ({
    username: "",
    password: "",
    checkPass: "",
    name: "",
    age: "",
    gender: "",
    phoneNum: "",
    email: "",
    dormBuildId: "",
    dormBuildIds: "",
});

export default {
    name: "DormManagerInfo",
    components: {},
    data() {
        // 手机号验证
        const checkPhone = (rule, value, callback) => {
            const phoneReg = /^1[3|4|5|6|7|8][0-9]{9}$/;
            if (!value) {
                return callback(new Error("电话号码不能为空"));
            }
            setTimeout(() => {
                if (!Number.isInteger(+value)) {
                    callback(new Error("请输入数字值"));
                } else {
                    if (phoneReg.test(value)) {
                        callback();
                    } else {
                        callback(new Error("电话号码格式不正确"));
                    }
                }
            }, 100);
        };
        const checkPass = (rule, value, callback) => {
            if (!this.editJudge) {
                console.log("验证");
                if (value == "") {
                    callback(new Error("请再次输入密码"));
                } else if (value !== this.form.password) {
                    callback(new Error("两次输入密码不一致!"));
                } else {
                    callback();
                }
            } else {
                console.log("不验证");
                callback();
            }
        };
        const checkDormBuildIds = (rule, value, callback) => {
            const ids = parseDormBuildIds(value);
            if (!ids.length) {
                callback(new Error("Please enter assigned dorm buildings"));
                return;
            }
            if (ids.length > 2) {
                callback(new Error("A dorm manager can manage at most 2 buildings"));
                return;
            }
            if (ids.some((id) => !/^[1-9]\d*$/.test(id))) {
                callback(new Error("Use building numbers like 1,2"));
                return;
            }
            callback();
        };
        return {
            showpassword: true,
            editJudge: true,
            judgeAddOrEdit: true,
            loading: true,
            disabled: false,
            judge: false,
            dialogVisible: false,
            staleDialogCleanupTimer: null,
            search: "",
            currentPage: 1,
            pageSize: 10,
            total: 0,
            tableData: [],
            form: createDormManagerForm(),
            rules: {
                username: [
                    {required: true, message: "请输入账号", trigger: "blur"},
                    {
                        pattern: /^[a-zA-Z0-9]{4,9}$/,
                        message: "必须由 4 到 9 个字母或数字组成",
                        trigger: "blur",
                    },
                ],
                name: [
                    {required: true, message: "请输入姓名", trigger: "blur"},
                    {
                        pattern: /^(?:[\u4E00-\u9FA5·]{2,10})$/,
                        message: "必须由 2 到 10 个汉字组成",
                        trigger: "blur",
                    },
                ],
                age: [
                    {required: true, message: "请输入年龄", trigger: "blur"},
                    {type: "number", message: "年龄必须为数字值", trigger: "blur"},
                    {
                        pattern: /^(1|[1-9]\d?|100)$/,
                        message: "范围：1-100",
                        trigger: "blur",
                    },
                ],
                gender: [{required: true, message: "请选择性别", trigger: "change"}],
                phoneNum: [{required: true, message: "请输入手机号", trigger: "blur"}],
                email: [
                    {type: "email", message: "请输入正确的邮箱地址", trigger: "blur"},
                ],
                password: [
                    {required: true, message: "请输入密码", trigger: "blur"},
                    {
                        min: 6,
                        max: 32,
                        message: "长度在 6 到 16 个字符",
                        trigger: "blur",
                    },
                ],
                checkPass: [{validator: checkPass, trigger: "blur"}],
                dormBuildIds: [{required: true, validator: checkDormBuildIds, trigger: ["blur", "change"]}],
            },
            editDisplay: {
                display: "block",
            },
            display: {
                display: "none",
            },
        };
    },
    created() {
        this.load();
        this.loading = true;
        setTimeout(() => {
            //设置延迟执行
            this.loading = false;
        }, 1000);
    },
    mounted() {
        this.clearElementDialogArtifacts();
        this.staleDialogCleanupTimer = window.setInterval(() => {
            if (!this.dialogVisible) {
                this.clearElementDialogArtifacts();
            }
        }, 800);
    },
    beforeUnmount() {
        if (this.staleDialogCleanupTimer) {
            window.clearInterval(this.staleDialogCleanupTimer);
            this.staleDialogCleanupTimer = null;
        }
        this.clearElementDialogArtifacts();
    },
    methods: {
        async load() {
            request.get("/dormManager/find", {
                params: {
                    pageNum: this.currentPage,
                    pageSize: this.pageSize,
                    search: this.search,
                },
            }).then((res) => {
                console.log(res);
                this.tableData = (res.data.records || []).map(normalizeDormManager);
                this.total = res.data.total;
                this.loading = false;
            });
        },
        reset() {
            this.search = ''
            request.get("/dormManager/find", {
                params: {
                    pageNum: 1,
                    pageSize: this.pageSize,
                    search: this.search,
                },
            }).then((res) => {
                console.log(res);
                this.tableData = (res.data.records || []).map(normalizeDormManager);
                this.total = res.data.total;
                this.loading = false;
            });
        },
        filterTag(value, row) {
            return row.gender === value;
        },
        openAddDialog() {
            this.clearElementDialogArtifacts();
            this.judge = false;
            this.judgeAddOrEdit = false;
            this.editDisplay = {display: "none"};
            this.disabled = false;
            this.editJudge = true;
            this.showpassword = true;
            this.display = {display: "none"};
            this.form = createDormManagerForm();
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.form?.clearValidate();
            });
        },
        save() {
            this.$refs.form.validate(async (valid) => {
                if (valid) {
                    this.normalizeScopeBeforeSubmit();
                    if (this.judge === false) {
                        //新增
                        request.post("/dormManager/add", this.form).then((res) => {
                            console.log(res);
                            if (res.code === "0") {
                                ElMessage({
                                    message: "新增成功",
                                    type: "success",
                                });
                                this.search = "";
                                this.load();
                                this.dialogVisible = false;
                                this.resetDialogState();
                            } else {
                                ElMessage({
                                    message: res.msg,
                                    type: "error",
                                });
                            }
                        });
                    } else {
                        //修改
                        request.put("/dormManager/update", this.form).then((res) => {
                            console.log(res);
                            if (res.code === "0") {
                                ElMessage({
                                    message: "修改成功",
                                    type: "success",
                                });
                                this.search = "";
                                this.load();
                                this.dialogVisible = false;
                                this.resetDialogState();
                            } else {
                                ElMessage({
                                    message: res.msg,
                                    type: "error",
                                });
                            }
                        });
                    }
                }
            });
        },
        cancel() {
            this.dialogVisible = false;
            this.resetDialogState();
            this.$nextTick(() => {
                this.clearElementDialogArtifacts();
            });
        },
        resetDialogState() {
            this.$refs.form?.clearValidate();
            this.display = {display: "none"};
            this.editJudge = true;
            this.disabled = false;
            this.showpassword = true;
            this.judgeAddOrEdit = true;
            this.editDisplay = {display: "block"};
            this.form = createDormManagerForm();
        },
        EditPass() {
            if (this.editJudge) {
                this.showpassword = false;
                this.display = {display: "flex"};
                this.disabled = false;
                this.editJudge = false;
            } else {
                this.showpassword = true;
                this.display = {display: "none"};
                this.editJudge = true;
                this.disabled = true;
            }
        },
        handleEdit(row) {
            //修改
            //判断操作类型
            this.clearElementDialogArtifacts();
            this.judge = true;
            // 生拷贝
            this.form = normalizeDormManager(JSON.parse(JSON.stringify(row)));
            this.judgeAddOrEdit = true;
            this.editDisplay = {display: "block"};
            this.disabled = true;
            this.editJudge = true;
            this.showpassword = true;
            this.display = {display: "none"};
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.form?.clearValidate();
            });
        },
        async handleDelete(username) {
            //删除
            console.log(username);
            request.delete("/dormManager/delete/" + username).then((res) => {
                if (res.code === "0") {
                    ElMessage({
                        message: "删除成功",
                        type: "success",
                    });
                    this.search = "";
                    this.load();
                } else {
                    ElMessage({
                        message: res.msg,
                        type: "error",
                    });
                }
            });
        },
        handleSizeChange(pageSize) {
            //改变每页个数
            this.pageSize = pageSize;
            this.load();
        },
        handleCurrentChange(pageNum) {
            //改变页码
            this.currentPage = pageNum;
            this.load();
        },
        normalizeScopeBeforeSubmit() {
            const ids = parseDormBuildIds(this.form.dormBuildIds);
            this.form.dormBuildIds = ids.join(",");
            this.form.dormBuildId = Number(ids[0]);
        },
        clearElementDialogArtifacts() {
            if (typeof document === "undefined") {
                return;
            }
            document.querySelectorAll(".el-overlay").forEach((overlay) => {
                overlay.parentNode?.removeChild(overlay);
            });
            document.body.classList.remove("el-popup-parent--hidden");
            if (document.body.style.overflow === "hidden") {
                document.body.style.overflow = "";
            }
        },
    },
};
