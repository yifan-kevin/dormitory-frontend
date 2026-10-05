// LOCATE: 个人信息逻辑，资料维护、头像上传
import request from "@/utils/request";

const {ElMessage} = require("element-plus");
const phoneNumIdentities = ["stu", "dormManager", "admin"];

const parseSessionJson = (key, fallback) => {
    const value = window.sessionStorage.getItem(key);
    if (!value || value === "undefined" || value === "null") {
        return fallback;
    }
    try {
        return JSON.parse(value);
    } catch (error) {
        console.error(error);
        return fallback;
    }
};

const normalizeProfileForm = (user = {}, identity = "") => {
    const form = {...(user || {})};
    if (phoneNumIdentities.includes(identity)) {
        form.phone = form.phoneNum || form.phone || "";
    } else {
        form.phone = form.phone || form.phoneNum || "";
    }
    if (identity === "stu") {
        form.department = form.department || "";
        form.className = form.className || "";
    }
    return form;
};

const createUpdatePayload = (form = {}, identity = "") => {
    const payload = {...form};
    delete payload.checkPass;
    if (phoneNumIdentities.includes(identity)) {
        payload.phoneNum = payload.phone || payload.phoneNum || "";
        delete payload.phone;
    }
    if (identity === "stu") {
        payload.department = String(payload.department || "").trim();
        payload.className = String(payload.className || "").trim();
    }
    return payload;
};

export default {
    name: "selfInfo",
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
        return {
            showpassword: true,
            image: "",
            editJudge: true,
            disabled: true,
            dialogVisible: false,
            identity: "",
            username: "",
            name: "",
            department: "",
            className: "",
            gender: "",
            age: "",
            phone: "",
            email: "",
            targetURL: "",
            avatar: "",
            form: {
                username: "",
                name: "",
                gender: "",
                age: "",
                phone: "",
                email: "",
            },
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
                department: [{required: true, message: "请输入院系", trigger: "blur"}],
                className: [{required: true, message: "请输入班级", trigger: "blur"}],
                gender: [{required: true, message: "请选择性别", trigger: "change"}],
                age: [
                    {required: true, message: "请输入年龄", trigger: "blur"},
                    {type: "number", message: "年龄必须为数字值", trigger: "blur"},
                    {
                        pattern: /^(1|[1-9]\d?|100)$/,
                        message: "范围：1-100",
                        trigger: "blur",
                    },
                ],
                phone: [{required: true, message: "请输入手机号", trigger: "blur"}],
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
            },
            display: {
                display: "none",
            },
            imgDisplay: {
                display: "none",
            },
        };
    },
    created() {
        this.load();
        this.find();
        this.init(this.avatar);
    },
    computed: {
        canEditProfile() {
            return this.identity !== "worker";
        },
    },
    methods: {
        //获取个人信息页面信息
        load() {
            this.identity = parseSessionJson("identity", "");
            this.form = normalizeProfileForm(parseSessionJson("user", {}), this.identity);
            this.username = this.form.username || "";
            this.name = this.form.name || "";
            this.department = this.form.department || "";
            this.className = this.form.className || "";
            this.gender = this.form.gender || "";
            this.age = this.form.age || "";
            this.phone = this.form.phone || "";
            this.email = this.form.email || "";
            this.avatar = this.form.avatar || "";
        },
        //查询数据，更新session
        find() {
            const userInfo = normalizeProfileForm(parseSessionJson("user", {}), this.identity);
            if (!this.identity || !userInfo.username || !userInfo.password) {
                return;
            }
            const loginData = {
                username: userInfo.username,
                password: userInfo.password,
            };
            request.post("/" + this.identity + "/login", loginData).then((res) => {
                if (res.code === "0" && res.data) {
                    //更新sessionStorage
                    window.sessionStorage.setItem("user", JSON.stringify(res.data));
                    //更新页面数据
                    this.load();
                }
            }).catch((error) => {
                console.error(error);
            });
        },
        Edit() {
            if (!this.canEditProfile) {
                return;
            }
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.$refs.form.resetFields();
                this.form = normalizeProfileForm(parseSessionJson("user", {}), this.identity);
            });
        },
        cancel() {
            this.$refs.form.resetFields();
            this.display = {display: "none"};
            this.showpassword = true;
            this.editJudge = true;
            this.disabled = true;
            this.dialogVisible = false;
        },
        async save() {
            this.$refs.form.validate(async (valid) => {
                if (valid) {
                    // 根据用户类型调整手机号字段名
                    const formData = createUpdatePayload(this.form, this.identity);
                    //修改
                    await request.put("/" + this.identity + "/update", formData).then((res) => {
                        if (res.code === "0") {
                            ElMessage({
                                message: "修改成功",
                                type: "success",
                            });
                            const mergedUser = {
                                ...parseSessionJson("user", {}),
                                ...formData,
                                ...(res.data || {}),
                            };
                            window.sessionStorage.setItem("user", JSON.stringify(mergedUser));
                            this.load();
                            this.find();
                            this.dialogVisible = false;
                        } else {
                            ElMessage({
                                message: res.msg,
                                type: "error",
                            });
                        }
                    }).catch((error) => {
                        console.error(error);
                        ElMessage({
                            message: "保存失败，请稍后重试",
                            type: "error",
                        });
                    });
                }
            });
        },
        EditPass() {
            if (this.editJudge) {
                this.display = {display: "flex"};
                this.showpassword = false;
                this.disabled = false;
                this.editJudge = false;
            } else {
                this.display = {display: "none"};
                this.showpassword = true;
                this.editJudge = true;
                this.disabled = true;
            }
        },
        //发送请求，获取头像
        async init(data) {
            if (data === null || data === "") {
                console.log("用户未设置头像");
                this.imgDisplay = {display: "none"};
            } else {
                this.imgDisplay = {display: "block"};
                console.log("头像名称：" + data);
                await request.get("/files/initAvatar/" + data).then((res) => {
                    if (res.code === "0") {
                        this.image = res.data.data;
                    } else {
                        ElMessage({
                            message: res.msg,
                            type: "error",
                        });
                    }
                });
            }
        },
        async uploadSuccess(uploadResponse) {
            if (!this.canEditProfile) {
                return;
            }
            if (!uploadResponse || uploadResponse.code !== "0" || !uploadResponse.data) {
                ElMessage({
                    message: uploadResponse?.msg || "头像上传失败",
                    type: "error",
                });
                return;
            }
            const uploadedAvatar = uploadResponse.data;
            this.form = normalizeProfileForm(parseSessionJson("user", {}), this.identity);
            this.form.avatar = uploadedAvatar;
            await request.post("/files/uploadAvatar/" + this.identity, this.form).then((res) => {
                if (res.code === "0") {
                    ElMessage({
                        message: "设置成功",
                        type: "success",
                    });
                    //获取头像文件名
                    this.avatar = res.data || uploadedAvatar;
                    const mergedUser = {
                        ...parseSessionJson("user", {}),
                        avatar: this.avatar,
                    };
                    window.sessionStorage.setItem("user", JSON.stringify(mergedUser));
                    this.find();
                    this.init(this.avatar);
                } else {
                    ElMessage({
                        message: res.msg,
                        type: "error",
                    });
                }
            });
        },
    },
};
