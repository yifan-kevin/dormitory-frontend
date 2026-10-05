// LOCATE: 房间信息管理逻辑，床位分配、移出床位、房间查询
import request from "@/utils/request";

const { ElMessage } = require("element-plus");

const BED_FIELDS = [
    { key: "firstBed", label: "1号床", column: "first_bed" },
    { key: "secondBed", label: "2号床", column: "second_bed" },
    { key: "thirdBed", label: "3号床", column: "third_bed" },
    { key: "fourthBed", label: "4号床", column: "fourth_bed" },
];

const createRoomForm = () => ({
    dormRoomId: "",
    dormBuildId: "",
    floorNum: "",
    maxCapacity: "",
    currentCapacity: "",
    firstBed: "",
    secondBed: "",
    thirdBed: "",
    fourthBed: "",
});

const getExpectedFloorFromRoomId = (roomId) => Math.floor((roomId % 100) / 10) + 1;
const getExpectedBuildFromRoomId = (roomId) => Math.floor(roomId / 100);
const getRoomIndexFromRoomId = (roomId) => roomId % 10;

export default {
    name: "RoomInfo",
    data() {
        const checkStuNum = (rule, value, callback) => {
            if (value === null || value === undefined || value === "") {
                callback();
                return;
            }

            request.get("/stu/exist/" + value).then((res) => {
                if (res.code !== "0") {
                    callback(new Error("不存在该学生，请先到学生信息管理里新增"));
                    return;
                }

                request.get("/room/judgeHadBed/" + value).then((result) => {
                    if (result.code === "0") {
                        callback();
                    } else {
                        callback(new Error(result.msg || "该学生已有宿舍"));
                    }
                }).catch(() => {
                    callback(new Error("床位校验失败，请稍后重试"));
                });
            }).catch(() => {
                callback(new Error("学生校验失败，请稍后重试"));
            });
        };

        const checkRoomId = (rule, value, callback) => {
            if (value === null || value === undefined || value === "") {
                callback(new Error("请输入房间号"));
                return;
            }

            const roomId = Number(value);
            const dormBuildId = Number(this.form.dormBuildId);
            const floorNum = Number(this.form.floorNum);

            if (!Number.isInteger(roomId) || roomId < 100 || roomId > 999) {
                callback(new Error("房间号范围：100-999"));
                return;
            }

            const roomIndex = getRoomIndexFromRoomId(roomId);
            if (roomIndex < 1 || roomIndex > 4) {
                callback(new Error("每层最多 4 个房间，房号末位需为 1-4"));
                return;
            }

            if (Number.isInteger(dormBuildId) && dormBuildId > 0 && getExpectedBuildFromRoomId(roomId) !== dormBuildId) {
                callback(new Error("房号百位必须和楼宇号一致，例如 1 号楼使用 101-1xx"));
                return;
            }

            if (Number.isInteger(floorNum) && floorNum > 0 && getExpectedFloorFromRoomId(roomId) !== floorNum) {
                callback(new Error("房号十位必须和楼层对应，例如 1 层 101-104，3 层 231-234"));
                return;
            }

            callback();
        };

        return {
            bedNum: 0,
            havePeopleNum: 0,
            loading: true,
            identity: "",
            disabled: false,
            judge: false,
            dialogVisible: false,
            bedDialog: false,
            stuInfoDialog: false,
            unassignedDialog: false,
            unassignedLoading: false,
            search: "",
            unassignedSearch: "",
            activeBuilding: "all",
            activeFloor: "all",
            currentPage: 1,
            pageSize: 12,
            total: 0,
            unassignedPage: 1,
            unassignedPageSize: 8,
            unassignedTotal: 0,
            allRooms: [],
            tableData: [],
            buildingCatalog: [],
            unassignedStudents: [],
            pendingBedContext: null,
            roomSummary: {
                totalRoomCount: 0,
                emptyRoomCount: 0,
                occupiedRoomCount: 0,
                fullRoomCount: 0,
                availableBedCount: 0,
            },
            form: createRoomForm(),
            rules: {
                dormRoomId: [
                    { required: true, message: "请输入房间号", trigger: "blur" },
                    { validator: checkRoomId, trigger: ["blur", "change"] },
                ],
                floorNum: [
                    { required: true, message: "请输入楼层数", trigger: "blur" },
                    { pattern: /^[1-6]$/, message: "楼层范围：1-6", trigger: "blur" },
                ],
                dormBuildId: [
                    { required: true, message: "请输入楼宇号", trigger: "blur" },
                    { pattern: /^[1-9]$/, message: "楼宇范围：1-9", trigger: "blur" },
                ],
                maxCapacity: [
                    { required: true, message: "请输入房间可住人数", trigger: "blur" },
                    { pattern: /^[0-4]$/, message: "范围：0-4", trigger: "blur" },
                ],
                currentCapacity: [
                    { required: true, message: "请输入当前已住人数", trigger: "blur" },
                    { pattern: /^[0-4]$/, message: "范围：0-4", trigger: "blur" },
                ],
                firstBed: [{ validator: checkStuNum, trigger: "blur" }],
                secondBed: [{ validator: checkStuNum, trigger: "blur" }],
                thirdBed: [{ validator: checkStuNum, trigger: "blur" }],
                fourthBed: [{ validator: checkStuNum, trigger: "blur" }],
            },
        };
    },
    computed: {
        canAssignBeds() {
            return this.identity === "admin";
        },
        buildingOptions() {
            if (this.buildingCatalog.length) {
                return this.buildingCatalog
                    .slice()
                    .sort((a, b) => Number(a.dormBuildId) - Number(b.dormBuildId))
                    .map((item) => ({
                        id: Number(item.dormBuildId),
                        name: item.dormBuildName || `${item.dormBuildId}号楼`,
                    }));
            }

            const buildingIds = this.allRooms
                .map((room) => Number(room.dormBuildId))
                .filter((building) => Number.isInteger(building));

            return [...new Set(buildingIds)].sort((a, b) => a - b).map((id) => ({
                id,
                name: `${id}号楼`,
            }));
        },
        buildingFilteredRooms() {
            return this.allRooms.filter((room) => this.activeBuilding === "all" || String(room.dormBuildId) === String(this.activeBuilding));
        },
        floorOptions() {
            const floors = this.buildingFilteredRooms
                .map((room) => Number(room.floorNum))
                .filter((floor) => Number.isInteger(floor));

            return [...new Set(floors)].sort((a, b) => a - b);
        },
        filteredRooms() {
            const rooms = this.buildingFilteredRooms
                .filter((room) => this.activeFloor === "all" || String(room.floorNum) === String(this.activeFloor))
                .slice();

            return rooms.sort((a, b) => Number(a.dormRoomId) - Number(b.dormRoomId));
        },
        filteredRoomCount() {
            return this.filteredRooms.length;
        },
        visibleRooms() {
            const start = Math.max(0, (this.currentPage - 1) * this.pageSize);
            return this.filteredRooms.slice(start, start + this.pageSize);
        },
    },
    created() {
        this.identity = this.readIdentity();
        this.load();
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
        showBedAssignForbidden() {
            ElMessage({
                message: "宿舍管理员不能分配床位",
                type: "warning",
            });
        },
        load() {
            this.loading = true;
            this.loadBuildings();
            this.loadRoomSummary();

            request.get("/room/find", {
                params: {
                    pageNum: 1,
                    pageSize: 1000,
                    search: this.search,
                },
            }).then((res) => {
                const payload = res.data || {};
                this.allRooms = Array.isArray(payload.records) ? payload.records : [];
                this.tableData = this.allRooms;
                this.total = this.allRooms.length;
                this.syncActiveFloor();
                this.syncCurrentPage();
            }).finally(() => {
                this.loading = false;
            });
        },
        loadRoomSummary() {
            request.get("/room/occupancySummary").then((res) => {
                if (res.code === "0" && res.data) {
                    this.roomSummary = {
                        totalRoomCount: Number(res.data.totalRoomCount) || 0,
                        emptyRoomCount: Number(res.data.emptyRoomCount) || 0,
                        occupiedRoomCount: Number(res.data.occupiedRoomCount) || 0,
                        fullRoomCount: Number(res.data.fullRoomCount) || 0,
                        availableBedCount: Number(res.data.availableBedCount) || 0,
                    };
                }
            });
        },
        loadBuildings() {
            request.get("/building/find", {
                params: {
                    pageNum: 1,
                    pageSize: 200,
                    search: "",
                },
            }).then((res) => {
                const payload = res.data || {};
                this.buildingCatalog = Array.isArray(payload.records) ? payload.records : [];
            });
        },
        reset() {
            this.search = "";
            this.activeBuilding = "all";
            this.activeFloor = "all";
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
        setActiveBuilding(building) {
            this.activeBuilding = building;
            this.syncActiveFloor();
            this.currentPage = 1;
        },
        setActiveFloor(floor) {
            this.activeFloor = floor;
            this.currentPage = 1;
        },
        syncActiveFloor() {
            if (this.activeBuilding !== "all" && !this.buildingOptions.some((building) => String(building.id) === String(this.activeBuilding))) {
                this.activeBuilding = "all";
            }
            if (this.activeFloor !== "all" && !this.floorOptions.some((floor) => String(floor) === String(this.activeFloor))) {
                this.activeFloor = "all";
            }
        },
        syncCurrentPage() {
            const maxPage = Math.max(1, Math.ceil(this.filteredRoomCount / this.pageSize));
            if (this.currentPage > maxPage) {
                this.currentPage = maxPage;
            }
        },
        hasBedValue(value) {
            return value !== null && value !== undefined && String(value).trim() !== "";
        },
        isBedEmpty(value) {
            return !this.hasBedValue(value);
        },
        getDisplayCapacity(room) {
            const capacity = Number(room.maxCapacity);

            if (!Number.isInteger(capacity) || capacity <= 0) {
                return BED_FIELDS.length;
            }

            return Math.min(capacity, BED_FIELDS.length);
        },
        getRoomBeds(room) {
            return BED_FIELDS.slice(0, this.getDisplayCapacity(room)).map((bed, index) => ({
                ...bed,
                index: index + 1,
                value: room[bed.key],
                occupied: this.hasBedValue(room[bed.key]),
            }));
        },
        getOccupiedCount(room) {
            return this.getRoomBeds(room).filter((bed) => bed.occupied).length;
        },
        getBuildingLabel(buildId) {
            const matched = this.buildingCatalog.find((item) => String(item.dormBuildId) === String(buildId));
            return matched?.dormBuildName || `${buildId}号楼`;
        },
        resetFormModel() {
            this.form = createRoomForm();
        },
        clearFormValidation() {
            const refs = ["roomFormRef", "bedFormRef"];
            refs.forEach((refName) => {
                const formRef = this.$refs[refName];
                if (formRef && formRef.clearValidate) {
                    formRef.clearValidate();
                }
            });
        },
        resetDialogState() {
            this.disabled = false;
            this.judge = false;
            this.bedNum = 0;
            this.havePeopleNum = 0;
            this.resetFormModel();
            this.clearFormValidation();
        },
        add() {
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.resetDialogState();
            });
        },
        save() {
            this.$refs.roomFormRef.validate((valid) => {
                if (!valid) {
                    return;
                }

                if (this.judge === false) {
                    request.post("/room/add", this.form).then((res) => {
                        if (res.code === "0") {
                            ElMessage({
                                message: "新增成功",
                                type: "success",
                            });
                            this.search = "";
                            this.loading = true;
                            this.load();
                            this.dialogVisible = false;
                        } else {
                            ElMessage({
                                message: res.msg,
                                type: "error",
                            });
                        }
                    });
                } else {
                    request.put("/room/update", this.form).then((res) => {
                        if (res.code === "0") {
                            ElMessage({
                                message: "修改成功",
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
                    });
                }
            });
        },
        cancel() {
            this.dialogVisible = false;
            this.bedDialog = false;
            this.stuInfoDialog = false;
            this.unassignedDialog = false;
            this.$nextTick(() => {
                this.resetDialogState();
            });
        },
        handleEdit(row) {
            this.judge = true;
            this.dialogVisible = true;
            this.$nextTick(() => {
                this.resetFormModel();
                Object.assign(this.form, JSON.parse(JSON.stringify(row)));
                this.disabled = true;
                this.clearFormValidation();
            });
        },
        handleDelete(dormRoomId) {
            request.delete("/room/delete/" + dormRoomId).then((res) => {
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
        calCurrentNum(info) {
            this.havePeopleNum = this.getOccupiedCount(info);
        },
        plusIcon(num, info) {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            this.judge = false;
            this.bedNum = num;
            this.calCurrentNum(info);
            this.pendingBedContext = {
                room: JSON.parse(JSON.stringify(info)),
                bedIndex: num,
            };
            this.bedDialog = true;
            this.$nextTick(() => {
                this.resetFormModel();
                Object.assign(this.form, JSON.parse(JSON.stringify(info)));
                this.clearFormValidation();
            });
        },
        openCurrentBedCandidates() {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            const room = JSON.parse(JSON.stringify(this.form));

            if (!room.dormRoomId || !this.bedNum) {
                return;
            }

            this.openUnassignedStudents(room, this.bedNum);
        },
        openUnassignedStudents(room, bedIndex) {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            this.pendingBedContext = {
                room: JSON.parse(JSON.stringify(room)),
                bedIndex,
            };
            this.unassignedDialog = true;
            this.unassignedPage = 1;
            this.loadUnassignedStudents();
        },
        closeUnassignedDialog() {
            this.unassignedDialog = false;
            this.unassignedLoading = false;
            this.unassignedSearch = "";
            this.unassignedPage = 1;
            this.unassignedPageSize = 8;
            this.unassignedTotal = 0;
            this.unassignedStudents = [];
            this.pendingBedContext = null;
        },
        loadUnassignedStudents() {
            this.unassignedLoading = true;
            request.get("/stu/unassigned", {
                params: {
                    pageNum: this.unassignedPage,
                    pageSize: this.unassignedPageSize,
                    search: this.unassignedSearch,
                },
            }).then((res) => {
                const payload = res.data || {};
                this.unassignedStudents = Array.isArray(payload.records) ? payload.records : [];
                this.unassignedTotal = Number(payload.total) || 0;
            }).finally(() => {
                this.unassignedLoading = false;
            });
        },
        resetUnassignedSearch() {
            this.unassignedSearch = "";
            this.unassignedPage = 1;
            this.loadUnassignedStudents();
        },
        handleUnassignedSizeChange(pageSize) {
            this.unassignedPageSize = pageSize;
            this.unassignedPage = 1;
            this.loadUnassignedStudents();
        },
        handleUnassignedPageChange(pageNum) {
            this.unassignedPage = pageNum;
            this.loadUnassignedStudents();
        },
        assignSelectedStudent(student) {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            const context = this.pendingBedContext;
            if (!context || !student || !student.username) {
                return;
            }

            this.closeUnassignedDialog();
            this.plusIcon(context.bedIndex, context.room);

            this.$nextTick(() => {
                const bedField = BED_FIELDS[context.bedIndex - 1] ? BED_FIELDS[context.bedIndex - 1].key : "";
                if (bedField) {
                    this.form[bedField] = student.username;
                }
                this.clearFormValidation();
            });
        },
        editIcon(num, info) {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            this.judge = true;
            this.bedNum = num;
            this.bedDialog = true;
            this.$nextTick(() => {
                this.resetFormModel();
                Object.assign(this.form, JSON.parse(JSON.stringify(info)));
                this.clearFormValidation();
            });
        },
        detailIcon(num, info) {
            let stu = "";
            if (num === 1) {
                stu = info.firstBed;
            } else if (num === 2) {
                stu = info.secondBed;
            } else if (num === 3) {
                stu = info.thirdBed;
            } else if (num === 4) {
                stu = info.fourthBed;
            }

            request.get("/stu/exist/" + stu).then((res) => {
                if (res.code === "0") {
                    this.stuInfoDialog = true;
                    this.$nextTick(() => {
                        this.resetFormModel();
                        Object.assign(this.form, JSON.parse(JSON.stringify(res.data)));
                    });
                }
            });
        },
        addStuBed() {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            this.$refs.bedFormRef.validate((valid) => {
                if (!valid) {
                    return;
                }

                this.form.currentCapacity = this.havePeopleNum + 1;
                request.put("/room/update", this.form).then((res) => {
                    if (res.code === "0") {
                        ElMessage({
                            message: "新增成功",
                            type: "success",
                        });
                        this.search = "";
                        this.loading = true;
                        this.load();
                        this.bedDialog = false;
                    } else {
                        ElMessage({
                            message: res.msg,
                            type: "error",
                        });
                    }
                });
            });
        },
        editStuBed() {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            this.$refs.bedFormRef.validate((valid) => {
                if (!valid) {
                    return;
                }

                request.put("/room/update", this.form).then((res) => {
                    if (res.code === "0") {
                        ElMessage({
                            message: "修改成功",
                            type: "success",
                        });
                        this.search = "";
                        this.loading = true;
                        this.load();
                        this.bedDialog = false;
                    } else {
                        ElMessage({
                            message: res.msg,
                            type: "error",
                        });
                    }
                });
            });
        },
        deleteStuBed(bedNum, info) {
            if (!this.canAssignBeds) {
                this.showBedAssignForbidden();
                return;
            }
            const bedName = BED_FIELDS[bedNum - 1] ? BED_FIELDS[bedNum - 1].column : "";
            if (!bedName) {
                return;
            }

            this.calCurrentNum(info);
            request.delete("/room/delete/" + bedName + "/" + info.dormRoomId + "/" + this.havePeopleNum).then((res) => {
                if (res.code === "0") {
                    ElMessage({
                        message: "删除成功",
                        type: "success",
                    });
                    this.search = "";
                    this.loading = true;
                    this.load();
                    this.bedDialog = false;
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
            this.currentPage = 1;
            this.syncCurrentPage();
        },
        handleCurrentChange(pageNum) {
            this.currentPage = pageNum;
            this.syncCurrentPage();
        },
    },
};
