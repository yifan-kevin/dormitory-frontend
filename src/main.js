import {createApp} from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
// element-plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/css/global.css'
import {
    ArrowRight,
    Bell,
    Check,
    Delete,
    Edit,
    Grid,
    House,
    Iphone,
    Loading,
    Location,
    Lock,
    Message,
    MoreFilled,
    OfficeBuilding,
    Operation,
    Plus,
    RefreshLeft,
    School,
    Search,
    Setting,
    SetUp,
    Tickets,
    Tools,
    Upload,
    User,
    Van
} from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const app = createApp(App)
    .use(ElementPlus, {
        locale: zhCn
    })
const icons = {
    ArrowRight,
    Bell,
    Check,
    Delete,
    Edit,
    Grid,
    House,
    Iphone,
    Loading,
    Location,
    Lock,
    Message,
    MoreFilled,
    OfficeBuilding,
    Operation,
    Plus,
    RefreshLeft,
    School,
    Search,
    Setting,
    SetUp,
    Tickets,
    Tools,
    Upload,
    User,
    Van
}

Object.entries(icons).forEach(([iconName, icon]) => {
    app.component(iconName, icon)
})
app.use(router)
app.use(store)
app.mount('#app')
