import { createRouter,createWebHistory } from "vue-router";

import TodoList from "../component/TodoList.vue"
import UserLogin from "../component/user-login.vue";

const router = createRouter({
    history: createWebHistory(),
    routes:[
        {
            path: `/`,
            name: "login",
            component: UserLogin
        },
        {
            path: `/Todos`,
            name: "register",
            component: TodoList
        }
    ]
})

export default router
