// LOCATE: 我的宿舍逻辑，学生查询本人宿舍床位
import request from "@/utils/request";

const {ElMessage} = require("element-plus");

export default {
    name: "MyRoomInfo",
    data() {
        return {
            name: "",
            form: {
                username: "",
            },
            room: {
                dormRoomId: "",
                dormBuildId: "",
                floorNum: "",
                maxCapacity: "",
                currentCapacity: "",
                firstBed: "",
                secondBed: "",
                thirdBed: "",
                fourthBed: "",
            },
            loading: true,
            hasRoom: false,
        };
    },
    created() {
        this.init();
        this.getInfo();
    },
    methods: {
        init() {
            const user = sessionStorage.getItem("user");
            if (user) {
                this.form = JSON.parse(user);
                this.name = this.form.username;
            } else {
                ElMessage({
                    message: "用户信息未找到",
                    type: "error",
                });
                this.loading = false;
                this.hasRoom = false;
            }
        },
        getInfo() {
            if (!this.name) {
                this.loading = false;
                this.hasRoom = false;
                console.log("用户名为空:", this.name);
                return;
            }
            
            console.log("请求宿舍信息，用户名为:", this.name);
            console.log("请求URL:", "/room/getMyRoom/" + this.name);
            
            request.get("/room/getMyRoom/" + this.name).then((res) => {
                console.log("响应数据:", res);
                this.loading = false;
                if (res.code === "0") {
                    this.room = res.data;
                    this.hasRoom = true;
                    console.log("获取宿舍信息成功:", this.room);
                } else {
                    this.hasRoom = false;
                    console.log("未分配宿舍，响应信息:", res);
                }
            }).catch((error) => {
                this.loading = false;
                this.hasRoom = false;
                console.error("获取宿舍信息失败:", error);
                ElMessage({
                    message: "获取宿舍信息失败",
                    type: "error",
                });
            });
        },
    },
};
