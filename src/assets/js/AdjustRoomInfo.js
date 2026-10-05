// LOCATE: 调宿申请管理逻辑，审核调宿并同步房间床位
import request from "@/utils/request";

const {ElMessage} = require("element-plus");
export default {
    name: "AdjustRoomInfo",
    data() {
        const checkRoomState = (rule, value, callback) => {
            if (!value) {
                this.dormRoomId = 0;
                callback();
                return;
            }
            this.dormRoomId = value
            request.get("/room/checkRoomState/" + value).then((res) => {
                if (res.code === "0") {
                    callback();
                } else {
                    callback(new Error(res.msg));
                }
            });
        };
        const checkBedState = (rule, value, callback) => {
            const roomId = this.form.towardsRoomId || this.dormRoomId;
            if (!roomId || !value) {
                callback();
                return;
            }
            request.get("/room/checkBedState/" + roomId + '/' + value).then((res) => {
                if (res.code === "0") {
                    callback();
                } else {
                    callback(new Error(res.msg));
                }
            });
        };
        const checkApplyState = (rule, value, callback) => {
            console.log(this.form.finishTime)
            if (value === "通过" && this.form.finishTime !== null) {
                callback();
            } else if (value === "驳回" && this.form.finishTime !== null) {
                callback();
            } else {
                callback(new Error("请检查申请状态与处理时间是否匹配"));
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
                state: [{validator: checkApplyState, trigger: "blur"},],
                towardsRoomId: [{validator: checkRoomState, trigger: ["blur", "change"]}],
                towardsBedId: [{validator: checkBedState, trigger: ["blur", "change"]}],
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
                console.log(res);
                this.tableData = res.data.records;
                this.total = res.data.total;
                this.loading = false;
            });
        },
        reset() {
            this.search = ''
            request.get("/adjustRoom/find", {
                params: {
                    pageNum: 1,
                    pageSize: this.pageSize,
                    search: this.search,
                },
            }).then((res) => {
                console.log(res);
                this.tableData = res.data.records;
                this.total = res.data.total;
                this.loading = false;
            });
        },
        filterTag(value, row) {
            return row.state === value;
        },
        judgeOrderState(state) {
            if (state === "通过") {
                this.orderState = true
            } else if (state === "驳回") {
                this.orderState = false
            }
        },
        save() {
            this.$refs.form.validate((valid) => {
                if (valid) {
                    this.judgeOrderState(this.form.state)
                    //修改
                    request.put("/adjustRoom/update/" + this.orderState, this.form).then((res) => {
                        console.log(res);
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
        },
        showDetail(row) {
            // 查看详情
            this.detailDialog = true;
            this.$nextTick(() => {
                if (this.$refs.form) {
                    this.$refs.form.resetFields();
                }
                this.form = JSON.parse(JSON.stringify(row));
            });
        },
        handleEdit(row) {
            this.dialogVisible = true;
            this.$nextTick(() => {
                if (this.$refs.form) {
                    this.$refs.form.resetFields();
                }
                this.form = JSON.parse(JSON.stringify(row));
                this.dormRoomId = this.form.towardsRoomId || 0;
                this.loadAvailableRooms();
                this.loadAvailableBeds(this.form.towardsRoomId);
            });
        },
        async loadAvailableRooms() {
            this.roomOptionsLoading = true;
            request.get("/room/availableForAdjust", {
                params: {
                    excludeRoomId: this.form.currentRoomId || "",
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
            return `${room.dormBuildId}栋 ${room.dormRoomId}室，可用床位 ${room.availableBedCount || 0} 个`;
        },
        formatBedOption(bedNo) {
            return `${bedNo}号床位`;
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
        closeAttachmentPreview() {
            this.attachmentPreviewUrl = "";
            this.attachmentPreviewDownloadUrl = "";
            this.attachmentPreviewType = "unsupported";
        },
        async handleDelete(id) {
            //删除
            request.delete("/adjustRoom/delete/" + id).then((res) => {
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
        canApproveAdjust(row) {
            const state = String(row?.state || "").trim();
            return !state || state === "\u672a\u5904\u7406" || state.includes("\u5f85\u5904\u7406");
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
    },
}




