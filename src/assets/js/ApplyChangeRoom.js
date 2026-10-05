// LOCATE: 学生调宿申请逻辑，选择目标房间和床位
import request from "@/utils/request";

const {ElMessage} = require("element-plus");
export default {
    name: "AdjustRoomInfo",
    data() {
        const self = this;
        const checkRoomState = (rule, value, callback) => {
            if (value && !isNaN(value)) {
                request.get("/room/checkRoomState/" + value).then((res) => {
                    if (res.code === "-1") {
                        callback(new Error(res.msg));
                        return;
                    }
                    request.get("/room/checkRoomExist/" + value).then((result) => {
                        if (result.code === "-1") {
                            callback(new Error(result.msg));
                            return;
                        }
                        callback();
                    }).catch(() => {
                        callback(new Error("网络错误，请稍后重试"));
                    });
                }).catch(() => {
                    callback(new Error("网络错误，请稍后重试"));
                });
            } else {
                callback(new Error("请输入正确的数据"));
            }
        };
        const checkBedState = (rule, value, callback) => {
            const form = self.form;
            if (form.towardsRoomId && value && !isNaN(value)) {
                request.get("/room/checkBedState/" + form.towardsRoomId + '/' + value).then((res) => {
                    if (res.code === "0") {
                        callback();
                    } else {
                        callback(new Error(res.msg));
                    }
                }).catch(() => {
                    callback(new Error("网络错误，请稍后重试"));
                });
            } else if (!form.towardsRoomId) {
                callback(new Error("请先输入目标房间号"));
            } else {
                callback(new Error("请输入正确的床位号"));
            }
        };
        return {
            loading: true,
            dialogVisible: false,
            detailDialog: false,
            search: "",
            currentPage: 1,
            pageSize: 10,
            total: 0,
            tableData: [],
            form: {},
            attachmentFileList: [],
            attachmentPreviewVisible: false,
            attachmentPreviewTitle: "",
            attachmentPreviewUrl: "",
            attachmentPreviewDownloadUrl: "",
            attachmentPreviewType: "unsupported",
            availableRoomOptions: [],
            availableBedOptions: [],
            roomOptionsLoading: false,
            bedOptionsLoading: false,
            dormRoomId: 0,
            orderState: false,
            judgeOption: false,
            rules: {
                username: [
                    {required: true, message: "请输入学号", trigger: "blur"},
                    {pattern: /^[a-zA-Z0-9]{4,9}$/, message: "必须由 4 到 9 个字母或数字组成", trigger: "blur",},
                ],
                name: [
                    {required: true, message: "请输入姓名", trigger: "blur"},
                    {pattern: /^(?:[\u4E00-\u9FA5路]{2,10})$/, message: "必须由 2 到 10 个汉字组成", trigger: "blur",},
                ],
                currentRoomId: [
                    {required: true, message: "请输入当前房间号", trigger: "blur"},
                ],
                currentBedId: [
                    {required: true, message: "请输入当前床位号", trigger: "blur"},
                ],
                towardsRoomId: [
                    {validator: checkRoomState, trigger: ["blur", "change"]},
                ],
                towardsBedId: [
                    {validator: checkBedState, trigger: ["blur", "change"]},
                ],
                reason: [
                    {required: true, message: "请填写调宿理由", trigger: "blur"},
                    {min: 2, max: 200, message: "调宿理由需要在 2 到 200 个字符之间", trigger: "blur"},
                ],
            },
        }
    },
    created() {
        this.load();
        this.loading = true;
        setTimeout(() => {
            // 设置延迟执行
            this.loading = false;
        }, 1000);
    },
    methods: {
        async load() {
            request.get("/adjustRoom/find", {
                params: {
                    pageNum: this.currentPage,
                    pageSize: this.pageSize,
                    search: this.search,
                },
            }).then((res) => {
                this.tableData = res.data.records;
                this.total = res.data.total;
                this.loading = false;
            });
        },
        filterTag(value, row) {
            return row.gender === value;
        },
        add() {
            const user = JSON.parse(sessionStorage.getItem("user"));
            this.form = {
                username: user.username,
                name: user.name,
                reason: "",
                attachmentName: "",
                attachmentFile: "",
            };
            this.attachmentFileList = [];
            request.get("/room/getMyRoom/" + this.form.username).then((res) => {
                this.form.currentRoomId = res.data.dormRoomId
                this.form.currentBedId = this.calBedNum(this.form.username, res.data)
                this.dialogVisible = true;
                this.judgeOption = true;
                this.loadAvailableRooms();
            });
        },
        calBedNum(username, data) {
            if (data.firstBed === username) {
                return 1;
            } else if (data.secondBed === username) {
                return 2;
            } else if (data.thirdBed === username) {
                return 3;
            } else if (data.fourthBed === username) {
                return 4;
            }
        },
        judgeOrderState(state) {
            if (state === '通过') {
                this.orderState = true
            } else if (state === '驳回') {
                this.orderState = false
            } else if (state === '未处理') {
                this.orderState = false
            }
        },
        save() {
            console.log('点击了确定按钮');
            console.log('表单数据:', this.form);
            this.$refs.form.validate((valid) => {
                console.log('表单验证结果:', valid);
                if (valid) {
                    console.log('表单验证通过，准备提交');
                    if (this.judgeOption === false) {
                        //修改
                        console.log('执行修改操作');
                        this.judgeOrderState(this.form.state)
                        request.put("/adjustRoom/update/" + this.orderState, this.form).then((res) => {
                            console.log('修改操作响应:', res);
                            if (res.code === "0") {
                                ElMessage({
                                    message: "修改成功",
                                    type: "success",
                                });
                                this.search = "";
                                this.load();
                                this.dialogVisible = false;
                            } else if (res.msg === "重复操作") {
                                ElMessage({
                                    message: res.msg,
                                    type: "error",
                                });
                                this.search = "";
                                this.load();
                                this.dialogVisible = false;
                            } else {
                                ElMessage({
                                    message: res.msg,
                                    type: "error",
                                });
                            }
                        }).catch((error) => {
                            console.log('修改操作错误:', error);
                            ElMessage({
                                message: "网络错误，请稍后重试",
                                type: "error",
                            });
                        });
                    } else if (this.judgeOption === true) {
                        // 添加
                        console.log('执行添加操作');
                        request.post("/adjustRoom/add", this.form).then((res) => {
                            console.log('添加操作响应:', res);
                            if (res.code === "0") {
                                ElMessage({
                                    message: "添加成功",
                                    type: "success",
                                });
                                this.search = "";
                                this.load();
                                this.dialogVisible = false;
                            } else {
                                ElMessage({
                                    message: res.msg,
                                    type: "error",
                                });
                            }
                        }).catch((error) => {
                            console.log('添加操作错误:', error);
                            ElMessage({
                                message: "网络错误，请稍后重试",
                                type: "error",
                            });
                        });
                    }
                } else {
                    console.log('表单验证失败');
                    ElMessage({
                        message: "表单验证失败，请检查输入",
                        type: "error",
                    });
                }
            });
        },
        cancel() {
            if (this.$refs.form) {
                this.$refs.form.resetFields();
            }
            this.dialogVisible = false;
            this.detailDialog = false;
            this.attachmentFileList = [];
        },
        showDetail(row) {
            // 查看详情
            this.detailDialog = true;
            this.$nextTick(() => {
                if (this.$refs.form) {
                    this.$refs.form.resetFields();
                }
                this.form = JSON.parse(JSON.stringify(row));
                this.attachmentFileList = this.createAttachmentFileList(this.form);
                this.loadAvailableRooms();
                this.loadAvailableBeds(this.form.towardsRoomId);
            });
        },
        handleEdit(row) {
            //修改
            this.dialogVisible = true;
            this.$nextTick(() => {
                if (this.$refs.form) {
                    this.$refs.form.resetFields();
                }
                this.form = JSON.parse(JSON.stringify(row));
                this.attachmentFileList = this.createAttachmentFileList(this.form);
                this.judgeOption = false;
                this.loadAvailableRooms();
                this.loadAvailableBeds(this.form.towardsRoomId);
            });
        },
        async loadAvailableRooms() {
            this.roomOptionsLoading = true;
            const user = JSON.parse(sessionStorage.getItem("user") || "{}");
            request.get("/room/availableForAdjust", {
                params: {
                    excludeRoomId: this.form.currentRoomId || "",
                    gender: user.gender || "",
                },
            }).then((res) => {
                this.availableRoomOptions = res.code === "0" && Array.isArray(res.data) ? res.data : [];
            }).catch(() => {
                this.availableRoomOptions = [];
                ElMessage({
                    message: "可选房间加载失败，请稍后重试",
                    type: "error",
                });
            }).finally(() => {
                this.roomOptionsLoading = false;
            });
        },
        async loadAvailableBeds(roomId) {
            if (!roomId) {
                this.availableBedOptions = [];
                return;
            }
            this.bedOptionsLoading = true;
            request.get("/room/availableBeds/" + roomId).then((res) => {
                this.availableBedOptions = res.code === "0" && Array.isArray(res.data) ? res.data : [];
            }).catch(() => {
                this.availableBedOptions = [];
                ElMessage({
                    message: "可选床位加载失败，请稍后重试",
                    type: "error",
                });
            }).finally(() => {
                this.bedOptionsLoading = false;
            });
        },
        handleTargetRoomChange(value) {
            this.dormRoomId = value;
            this.form.towardsBedId = "";
            this.loadAvailableBeds(value);
        },
        formatRoomOption(room) {
            if (!room) {
                return "";
            }
            return `${room.dormBuildId}栋 ${room.dormRoomId}室，空床 ${room.availableBedCount || 0} 个`;
        },
        formatBedOption(bedNo) {
            return `${bedNo}号床位`;
        },
        createAttachmentFileList(row) {
            if (!row || !row.attachmentFile) {
                return [];
            }
            return [{
                name: row.attachmentName || row.attachmentFile,
                url: this.getAttachmentPreviewUrl(row),
            }];
        },
        hasAttachment(row) {
            return !!(row && row.attachmentFile);
        },
        getAttachmentUrl(row) {
            return this.getAttachmentDownloadUrl(row);
        },
        getAttachmentDownloadUrl(row) {
            if (!this.hasAttachment(row)) {
                return "";
            }
            const originalName = encodeURIComponent(row.attachmentName || row.attachmentFile);
            return `/api/files/download/${encodeURIComponent(row.attachmentFile)}?originalName=${originalName}`;
        },
        getAttachmentPreviewUrl(row) {
            if (!this.hasAttachment(row)) {
                return "";
            }
            const originalName = encodeURIComponent(row.attachmentName || row.attachmentFile);
            const endpoint = this.getAttachmentPreviewType(row) === "office" ? "previewOffice" : "preview";
            return `/api/files/${endpoint}/${encodeURIComponent(row.attachmentFile)}?originalName=${originalName}`;
        },
        getAttachmentExtension(row) {
            const filename = (row && (row.attachmentName || row.attachmentFile) || "").toLowerCase();
            if (!filename.includes(".")) {
                return "";
            }
            return filename.substring(filename.lastIndexOf(".") + 1);
        },
        getAttachmentPreviewType(row) {
            const extension = this.getAttachmentExtension(row);
            if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
                return "image";
            }
            if (["pdf", "txt", "csv", "log", "json", "md"].includes(extension)) {
                return "frame";
            }
            if (["docx", "xls", "xlsx"].includes(extension)) {
                return "office";
            }
            return "unsupported";
        },
        previewAttachment(row) {
            if (!this.hasAttachment(row)) {
                return;
            }
            this.attachmentPreviewTitle = row.attachmentName || "附件预览";
            this.attachmentPreviewType = this.getAttachmentPreviewType(row);
            this.attachmentPreviewUrl = this.getAttachmentPreviewUrl(row);
            this.attachmentPreviewDownloadUrl = this.getAttachmentDownloadUrl(row);
            this.attachmentPreviewVisible = true;
        },
        handleAttachmentPreview(file) {
            const row = {
                attachmentName: this.form.attachmentName || file?.name || "",
                attachmentFile: this.form.attachmentFile || file?.response?.data?.attachmentFile || "",
            };
            if (this.hasAttachment(row)) {
                this.previewAttachment(row);
            }
        },
        closeAttachmentPreview() {
            this.attachmentPreviewUrl = "";
            this.attachmentPreviewDownloadUrl = "";
            this.attachmentPreviewType = "unsupported";
        },
        beforeAttachmentUpload(file) {
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                ElMessage({
                    message: "附件大小不能超过 10MB",
                    type: "error",
                });
                return false;
            }
            return true;
        },
        handleAttachmentSuccess(res) {
            if (res.code === "0" && res.data) {
                this.form.attachmentName = res.data.attachmentName;
                this.form.attachmentFile = res.data.attachmentFile;
                this.attachmentFileList = this.createAttachmentFileList(this.form);
                ElMessage({
                    message: "附件上传成功",
                    type: "success",
                });
            } else {
                this.attachmentFileList = [];
                ElMessage({
                    message: res.msg || "附件上传失败",
                    type: "error",
                });
            }
        },
        handleAttachmentRemove() {
            this.form.attachmentName = "";
            this.form.attachmentFile = "";
            this.attachmentFileList = [];
        },
        handleAttachmentExceed() {
            ElMessage({
                message: "每条调宿申请只能上传 1 个附件，如需更换请先移除原附件",
                type: "warning",
            });
        },
        isPendingAdjustState(row) {
            const state = String(row?.state || "").trim();
            return !state || state === "\u672a\u5904\u7406" || state.includes("\u5f85\u5904\u7406");
        },
        canEditAdjust(row) {
            return this.isPendingAdjustState(row);
        },
        canDeleteAdjust(row) {
            return this.isPendingAdjustState(row);
        },
        handleSizeChange(pageSize) {
            //改变每页个数
            this.pageSize = pageSize;
            this.load();
        },
        handleCurrentChange(pageNum) {
            //鏀瑰彉椤电爜
            this.currentPage = pageNum;
            this.load();
        },
        handleDelete(id) {
            // 删除
            this.$confirm('确定要删除这条记录吗？', '提示', {
                confirmButtonText: '纭畾',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                request.delete("/adjustRoom/delete/" + id).then((res) => {
                    if (res.code === "0") {
                        ElMessage({
                            message: "删除成功",
                            type: "success",
                        });
                        this.load();
                    } else {
                        ElMessage({
                            message: res.msg,
                            type: "error",
                        });
                    }
                }).catch(() => {
                    ElMessage({
                        message: "网络错误，请稍后重试",
                        type: "error",
                    });
                });
            });
        },
    },
}




