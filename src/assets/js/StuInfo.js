// LOCATE: 学生信息管理逻辑，查询、新增、导入、删除学生
import request from "@/utils/request";

const { ElMessage } = require("element-plus");

const createDefaultForm = () => ({
    username: "",
    password: "",
    checkPass: "",
    name: "",
    department: "",
    className: "",
    age: "",
    gender: "",
    phoneNum: "",
    email: "",
});

export default {
    name: "StuInfo",
    data() {
        const checkPhone = (rule, value, callback) => {
            const normalized = String(value ?? "").trim();
            const phoneReg = /^1[3-9]\d{9}$/;

            if (!normalized) {
                callback(new Error("手机号不能为空"));
                return;
            }

            if (!phoneReg.test(normalized)) {
                callback(new Error("手机号格式不正确"));
                return;
            }

            callback();
        };

        const checkPass = (rule, value, callback) => {
            if (!this.editJudge) {
                if (!value) {
                    callback(new Error("请再次输入密码"));
                } else if (value !== this.form.password) {
                    callback(new Error("两次输入密码不一致"));
                } else {
                    callback();
                }
            } else {
                callback();
            }
        };

        return {
            identity: "",
            showpassword: true,
            judgeAddOrEdit: true,
            loading: true,
            submitting: false,
            editJudge: true,
            disabled: false,
            judge: false,
            dialogVisible: false,
            search: "",
            currentPage: 1,
            pageSize: 10,
            total: 0,
            tableData: [],
            form: createDefaultForm(),
            rules: {
                username: [
                    { required: true, message: "请输入学号", trigger: "blur" },
                    {
                        pattern: /^[a-zA-Z0-9]{4,12}$/,
                        message: "必须由 4 到 12 个字母或数字组成",
                        trigger: "blur",
                    },
                ],
                name: [
                    { required: true, message: "请输入姓名", trigger: "blur" },
                    {
                        pattern: /^(?:[\u4E00-\u9FA5·]{2,10})$/,
                        message: "必须由 2 到 10 个汉字组成",
                        trigger: "blur",
                    },
                ],
                department: [{ required: true, message: "请输入院系", trigger: "blur" }],
                className: [{ required: true, message: "请输入班级", trigger: "blur" }],
                age: [
                    { required: true, message: "请输入年龄", trigger: "blur" },
                    { type: "number", message: "年龄必须为数字", trigger: "blur" },
                    {
                        pattern: /^(1|[1-9]\d?|100)$/,
                        message: "范围：1-100",
                        trigger: "blur",
                    },
                ],
                gender: [{ required: true, message: "请选择性别", trigger: "change" }],
                phoneNum: [{ required: true, message: "请输入手机号", trigger: "blur" }],
                email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }],
                password: [
                    { required: true, message: "请输入密码", trigger: "blur" },
                    {
                        min: 6,
                        max: 32,
                        message: "长度在 6 到 32 个字符",
                        trigger: "blur",
                    },
                ],
                checkPass: [{ validator: checkPass, trigger: "blur" }],
            },
            importDialogVisible: false,
            file: null,
            fileList: [],
        };
    },
    created() {
        this.identity = this.readIdentity();
        this.load();
    },
    computed: {
        canCreateStudents() {
            return this.identity === "admin";
        },
    },
    watch: {
        dialogVisible(value) {
            if (!value) {
                this.submitting = false;
                this.$nextTick(() => {
                    Object.assign(this.form, createDefaultForm());
                    this.judge = false;
                    this.judgeAddOrEdit = true;
                    this.disabled = true;
                    this.editJudge = true;
                    this.showpassword = true;
                    this.clearFormValidate();
                });
            }
        },
    },
    methods: {
        readIdentity() {
            const raw = window.sessionStorage.getItem("identity");
            if (!raw || raw === "undefined" || raw === "null") {
                return "";
            }
            try {
                return JSON.parse(raw) || "";
            } catch (error) {
                return raw;
            }
        },
        showCreateForbidden() {
            ElMessage({
                message: "宿管不能新增或导入学生信息",
                type: "warning",
            });
        },
        async load() {
            this.loading = true;
            try {
                const res = await request.get("/stu/find", {
                    params: {
                        pageNum: this.currentPage,
                        pageSize: this.pageSize,
                        search: this.search,
                    },
                });
                this.tableData = res.data.records;
                this.total = res.data.total;
            } catch (error) {
                ElMessage({
                    message: "学生信息加载失败，请稍后重试",
                    type: "error",
                });
            } finally {
                this.loading = false;
            }
        },
        reset() {
            this.search = "";
            this.currentPage = 1;
            this.load();
        },
        statusText(status) {
            return status || "在校";
        },
        statusTagType(status) {
            const value = String(status || "");
            if (value.includes("异常") || value.includes("未归") || value.includes("超期")) {
                return "danger";
            }
            if (value.includes("离校")) {
                return "danger";
            }
            if (value.includes("确认") || value.includes("待")) {
                return "warning";
            }
            if (value.includes("寝") || value.includes("返回")) {
                return "success";
            }
            return "info";
        },
        filterTag(value, row) {
            return row.gender === value;
        },
        clearFormValidate(fields) {
            if (this.$refs.formRef && typeof this.$refs.formRef.clearValidate === "function") {
                this.$refs.formRef.clearValidate(fields);
            }
        },
        openCreateDialog() {
            if (!this.canCreateStudents) {
                this.showCreateForbidden();
                return;
            }
            this.dialogVisible = true;
            this.$nextTick(() => {
                Object.assign(this.form, createDefaultForm());
                this.judge = false;
                this.judgeAddOrEdit = false;
                this.disabled = false;
                this.editJudge = true;
                this.showpassword = true;
                this.submitting = false;
                this.clearFormValidate();
            });
        },
        async save() {
            if (!this.$refs.formRef || this.submitting) {
                return;
            }

            this.$refs.formRef.validate(async (valid) => {
                if (!valid) {
                    return;
                }

                const payload = {
                    ...this.form,
                    department: String(this.form.department ?? "").trim(),
                    className: String(this.form.className ?? "").trim(),
                    phoneNum: String(this.form.phoneNum ?? "").trim(),
                };
                delete payload.checkPass;

                this.submitting = true;

                try {
                    const res = this.judge === false
                        ? await request.post("/stu/add", payload)
                        : await request.put("/stu/update", payload);

                    if (res.code === "0") {
                        ElMessage({
                            message: this.judge === false ? "新增成功" : "修改成功",
                            type: "success",
                        });
                        this.search = "";
                        this.dialogVisible = false;
                        await this.load();
                    } else {
                        ElMessage({
                            message: res.msg || "保存失败",
                            type: "error",
                        });
                    }
                } catch (error) {
                    const backendMessage =
                        (error && error.response && error.response.data && error.response.data.msg) ||
                        (error && error.response && typeof error.response.data === "string" ? error.response.data : "") ||
                        error.message;
                    ElMessage({
                        message: backendMessage || "保存失败，请检查后端服务后重试",
                        type: "error",
                    });
                } finally {
                    this.submitting = false;
                }
            });
        },
        EditPass() {
            if (this.editJudge) {
                this.showpassword = false;
                this.disabled = false;
                this.editJudge = false;
                this.form.checkPass = "";
            } else {
                this.showpassword = true;
                this.editJudge = true;
                this.disabled = true;
                this.form.checkPass = "";
                this.$nextTick(() => {
                    this.clearFormValidate(["checkPass"]);
                });
            }
        },
        handleEdit(row) {
            Object.assign(this.form, createDefaultForm(), JSON.parse(JSON.stringify(row)));
            this.judge = true;
            this.judgeAddOrEdit = true;
            this.disabled = true;
            this.editJudge = true;
            this.showpassword = true;
            this.submitting = false;
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.clearFormValidate();
            });
        },
        async handleDelete(username) {
            request.delete("/stu/delete/" + username).then((res) => {
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
            this.pageSize = pageSize;
            this.load();
        },
        handleCurrentChange(pageNum) {
            this.currentPage = pageNum;
            this.load();
        },
        handleImport() {
            if (!this.canCreateStudents) {
                this.showCreateForbidden();
                return;
            }
            this.importDialogVisible = true;
            this.file = null;
            this.fileList = [];
        },
        handleFileChange(file) {
            this.file = file.raw;
            this.fileList = [file];
        },
        importExcel() {
            if (!this.canCreateStudents) {
                this.showCreateForbidden();
                return;
            }
            if (!this.file) {
                ElMessage({
                    message: "请选择Excel文件",
                    type: "warning",
                });
                return;
            }

            const formData = new FormData();
            formData.append("file", this.file);

            fetch("/api/stu/importExcel", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.code === "0") {
                        ElMessage({
                            message: data.data,
                            type: "success",
                        });
                        this.importDialogVisible = false;
                        this.file = null;
                        this.fileList = [];
                        this.load();
                    } else {
                        ElMessage({
                            message: data.msg,
                            type: "error",
                        });
                    }
                })
                .catch(() => {
                    ElMessage({
                        message: "上传失败，请检查网络连接",
                        type: "error",
                    });
                });
        },
    },
};
