import axios from 'axios'
import router from '@/router'
import { ElMessage } from 'element-plus'

const request = axios.create({
    baseURL: '/api',  // 注意！！ 这里是全局统一加上了 '/api' 前缀，也就是说所有接口都会加上'/api'前缀在，页面里面写接口的时候就不要加 '/api'了，否则会出现2个'/api'，类似 '/api/api/user'这样的报错，切记！！！
    timeout: 60000
})
let token = '';
let handlingUnauthorized = false;

const handleUnauthorized = (message = '登录状态已失效，请重新登录') => {
    if (!handlingUnauthorized) {
        handlingUnauthorized = true
        window.sessionStorage.removeItem('user')
        window.sessionStorage.removeItem('identity')

        if (router.currentRoute.value.path !== '/Login') {
            ElMessage.warning(message)
            router.replace('/Login').finally(() => {
                handlingUnauthorized = false
            })
        } else {
            handlingUnauthorized = false
        }
    }

    return new Promise(() => {})
}
// request 拦截器
// 可以自请求发送前对请求做一些处理
// 比如统一加token，对请求参数统一加密
//添加一个请求拦截器
request.interceptors.request.use(function (config) {
    let user = JSON.parse(window.sessionStorage.getItem('user'));
    if (user) {
        // 这里可以添加token处理逻辑
    }
    //console.dir(config);
    return config;
}, function (error) {
    // Do something with request error
    console.info("error: ");
    console.info(error);
    return Promise.reject(error);
});

// response 拦截器
// 可以在接口响应后统一处理结果
request.interceptors.response.use(
    response => {
        let res = response.data;
        // 如果是返回的文件
        if (response.config.responseType === 'blob') {
            return res
        }
        // 兼容服务端返回的字符串数据
        if (typeof res === 'string') {
            res = res ? JSON.parse(res) : res
        }
        if (res && res.code === '-401') {
            return handleUnauthorized(res.msg || '登录状态已失效，请重新登录')
        }
        return res;
    },
    error => {
        console.log('err' + error) // for debug
        let data = error.response && error.response.data
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data)
            } catch (e) {
                // keep axios default message
            }
        }
        if (data && (data.msg || data.message)) {
            error.message = data.msg || data.message
        }
        if ((error.response && error.response.status === 401) || (data && data.code === '-401')) {
            return handleUnauthorized(error.message || '登录状态已失效，请重新登录')
        }
        return Promise.reject(error)
    }
)

// 以request暴露出去
export default request
