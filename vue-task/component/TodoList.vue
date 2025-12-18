<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const BaseURL = `/api/v1`
const router = useRouter()

const userName = ref('')
const newUserName = ref('')
const newUserPassword = ref('')
const todoTitle = ref('')
const todoDescription = ref('')
const todoEndTime = ref('')
const source = ref([])

let token = ref(``)
let isChange = ref(false)
let queryResult = ref(``)
let todoID = ref(``)
let isQuery = ref(false)
let editingTodoId = ref(null)
let editingTitle = ref('')
let editingDescription = ref('')
let editingEndTime = ref('')

// 从本地存储读取token
onMounted(() => {
  const savedToken = localStorage.getItem('userToken')
  const savedUserName = localStorage.getItem('userName')
  if (savedToken) {
    token.value = savedToken
    userName.value = savedUserName
  } else {
    router.push('/')
  }
  //获取待办事项列表
  fetchToDoList()
})

//更改用户信息

function changeWindow() {
  isChange.value = !isChange.value
}

async function changeUser() {
  //检查输入是否为空
  if (newUserName.value == '' || newUserPassword.value == '') {
    alert('用户名或密码不能为空')
    return
  }
  
  try {
    const req = new Request(`${BaseURL}/user/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        name: newUserName.value,
        password: newUserPassword.value,
      }),
    })
    
    const res = await fetch(req)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    alert(`${data.message}`)
    isChange.value = !isChange.value
  } catch (error) {
    console.error('更新用户信息失败:', error)
    alert(`更新失败: ${error.message || '未知错误'}`)
  }
}

//退出登录
function signout() {
  localStorage.removeItem('userName')
  localStorage.removeItem('userToken')
  router.push('/')
}

// 获取待办事项列表
async function fetchToDoList() {
  try {
    const req = new Request(`${BaseURL}/todos/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    })

    const res = await fetch(req)
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    
    if (!Array.isArray(data)) {
      console.warn('API返回的数据格式不正确:', data)
      source.value = []
      return
    }
    
    // 处理待办事项数据
    source.value = data
    console.log(`获取到 ${data.length} 个待办事项`)
  } catch (error) {
    console.error('获取待办事项列表失败:', error)
    source.value = []
    alert(`获取列表失败: ${error.message}`)
  }
}

// 创建待办事项
async function createToDo() {
  // 验证输入
  if (!todoTitle.value?.trim()) {
    alert('标题不能为空')
    return
  }
  
  if (!todoDescription.value?.trim()) {
    alert('描述不能为空')
    return
  }
  
  if (!todoEndTime.value) {
    alert('截止日期不能为空')
    return
  }

  try {
    // 安全地格式化时间
    const formattedEndTime = new Date(todoEndTime.value).toISOString()
    
    const req = new Request(`${BaseURL}/todos/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        title: todoTitle.value.trim(),
        description: todoDescription.value.trim(),
        end_time: formattedEndTime,
      }),
    })

    const res = await fetch(req)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    console.log('待办事项创建成功:', data)
    
    // 清空表单并刷新列表
    todoTitle.value = ''
    todoDescription.value = ''
    todoEndTime.value = ''
    await fetchToDoList()
    
    alert('待办事项创建成功!')
  } catch (error) {
    console.error('创建待办事项失败:', error)
    alert(`创建失败: ${error.message || '未知错误'}`)
  }
}

// 删除待办事项
async function deleteToDoList(item) {
  if (!confirm(`确定要删除待办事项"${item.title}"吗？`)) {
    return
  }

  try {
    const req = new Request(`${BaseURL}/todos/delete/${item.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    })

    const res = await fetch(req)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    console.log('删除成功:', data)
    
    // 立即更新本地状态
    source.value = source.value.filter((todo) => todo.id !== item.id)
    
    alert('待办事项删除成功!')
  } catch (error) {
    console.error('删除待办事项失败:', error)
    alert(`删除失败: ${error.message || '未知错误'}`)
    // 重新获取数据以保持同步
    await fetchToDoList()
  }
}

// 通过ID查询待办事项
async function queryToDo() {
  // 检查ID是否为空
  if (!todoID.value?.trim()) {
    alert('请输入待办事项ID')
    return
  }

  try {
    const req = new Request(`${BaseURL}/todos/get/${todoID.value.trim()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    })

    const res = await fetch(req)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    
    if (!data || Object.keys(data).length === 0) {
      alert('未找到该ID的待办事项')
      return
    }
    
    // 更新查询结果
    queryResult.value = data
    console.log('查询成功:', data)
    isQuery.value = true
    
  } catch (error) {
    console.error('查询待办事项失败:', error)
    alert(`查询失败: ${error.message || '未知错误'}`)
    isQuery.value = false
  }
}


// 开始编辑待办事项
function startEditing(todo) {
  editingTodoId.value = todo.id
  editingTitle.value = todo.title
  editingDescription.value = todo.description
  // 将ISO时间字符串转换为本地时间格式
  try {
    const date = new Date(todo.end_time)
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('无效的日期格式:', todo.end_time)
      editingEndTime.value = ''
      return
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    editingEndTime.value = `${year}-${month}-${day}T${hours}:${minutes}`
  } catch (error) {
    console.error('日期转换错误:', error)
    editingEndTime.value = ''
  }
}

// 取消编辑
function cancelEditing() {
  editingTodoId.value = null
  editingTitle.value = ''
  editingDescription.value = ''
  editingEndTime.value = ''
}

// 保存编辑后的待办事项
async function saveEditing() {
  // 验证输入
  if (!editingTodoId.value) {
    alert('待办事项ID不能为空')
    return
  }
  
  if (!editingTitle.value?.trim()) {
    alert('标题不能为空')
    return
  }
  
  if (!editingDescription.value?.trim()) {
    alert('描述不能为空')
    return
  }
  
  if (!editingEndTime.value) {
    alert('截止日期不能为空')
    return
  }

  try {
    // 安全地格式化时间
    const formattedEndTime = new Date(editingEndTime.value).toISOString()
    
    const req = new Request(`${BaseURL}/todos/update/${editingTodoId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        title: editingTitle.value.trim(),
        description: editingDescription.value.trim(),
        end_time: formattedEndTime,
        status: 1,
      }),
    })

    const res = await fetch(req)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    console.log('更新成功:', data)
    
    // 退出编辑模式
    cancelEditing()
    
    // 刷新列表
    await fetchToDoList()
    
    alert('待办事项更新成功!')
  } catch (error) {
    console.error('更新待办事项失败:', error)
    alert(`更新失败: ${error.message || '未知错误'}`)
  }
}

</script>

<template>
    <div class="LIST">
    <!---用户信息-->
    <div class="user">
      <h1>欢迎 {{ userName }}</h1>
      <div class="user">
        <button @click="signout">退出登录</button>
        <button @click="changeWindow">更改用户信息</button>
      </div>
      <!--更改用户信息-->
      <div class="changeData" v-if="isChange">
        <input
          type="text"
          v-model="newUserName"
          placeholder="输入用户名"
        />
        <input type="password" v-model="newUserPassword" placeholder="输入新密码" />
        <p class="tips">更改密码</p>
        <button @click="changeUser">确认</button>
        <button @click="changeWindow">取消</button>
      </div>
    </div>
    <!---创建待办事项-->
    <div class="creatToDo">
      <h3>创建待办事项</h3>
      <input type="text" v-model="todoTitle" placeholder="输入标题" />
      <input type="text" v-model="todoDescription" placeholder="输入描述" />
      <input type="datetime-local" v-model="todoEndTime" />
      <button @click="createToDo">添加待办事项</button>
    </div>
    <!---通过ID查询待办事项-->
    <div class="queryToDo">
      <h3>通过ID查询待办事项</h3>
      <input type="text" v-model="todoID" placeholder="输入ID" />
      <button @click="queryToDo">查询</button>
    </div>
    <div class="Todos" v-if="isQuery">
      <p>标题： {{ queryResult.title }}</p>
      <p>描述： {{ queryResult.description }}</p>
      <p>截止日期: {{ queryResult.end_time }}</p>
    </div>
    <!-- 编辑待办事项 -->
    <div class="editTodo" v-if="editingTodoId">
      <h3>编辑待办事项</h3>
      <input type="text" v-model="editingTitle" placeholder="标题" />
      <input type="text" v-model="editingDescription" placeholder="描述" />
      <input type="datetime-local" v-model="editingEndTime" />
      <button @click="saveEditing">保存</button>
      <button @click="cancelEditing">取消</button>
    </div>
    
    <hr>
    <!---待办事项列表-->
    <div class="ToDoList">
      <h3>待办事项列表</h3>
      <div v-if="source.length === 0">
        <p>暂无待办事项</p>
      </div>
      <div id="ToDoList" v-for="item in source" :key="item.id" class="Todos">
        <!-- 显示模式 -->
        <div v-if="editingTodoId !== item.id">
          <p>标题: {{ item.title }}</p>
          <p>描述: {{ item.description }}</p>
          <time>截止日期: {{ item.end_time }}</time>
          <p>ID: {{ item.id }}</p>
          <button @click="startEditing(item)">编辑</button>
          <button @click="deleteToDoList(item)" :id="item.id">删除</button>
        </div>
        
        <!-- 编辑模式（仅显示当前编辑的项目） -->
        <div v-else>
          <p>正在编辑 ID: {{ item.id }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.changeData, .user {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
}

.changeData button, .user button {
  margin: 10px;
  width: 40%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 15px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.changeData button:hover, .user button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.changeData button:active, .user button:active {
  transform: translateY(0);
}

.user button:last-child {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.LIST {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.creatToDo button, .queryToDo button, .Todos button, .editTodo button {
  margin: 10px 0;
  width: 100%;
  max-width: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.creatToDo button:hover, .queryToDo button:hover, .Todos button:hover, .editTodo button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.creatToDo button:active, .queryToDo button:active, .Todos button:active, .editTodo button:active {
  transform: translateY(0);
}

.Todos button:last-child {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.Todos {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  background: white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border-radius: 20px;
  margin: 20px;
  padding: 25px;
  width: 100%;
  max-width: 500px;
  transition: all 0.3s ease;
}

.Todos:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.queryToDo, .editTodo, .creatToDo {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.queryToDo h3, .editTodo h3, .creatToDo h3 {
  margin-top: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

hr {
  width: 90%;
  margin: 30px 0;
  border: none;
  border-top: 1px solid #eee;
}

.ToDoList h3 {
  width: 100%;
  text-align: center;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  margin: 20px 0;
}

.ToDoList {
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
}

.editTodo input, .Todos input, .changeData input, .creatToDo input, .queryToDo input {
  width: 100%;
  padding: 12px 20px;
  margin: 10px 0;
  border: none;
  border-radius: 25px;
  background: rgba(245, 245, 245, 0.8);
  font-size: 16px;
  color: #333;
  box-sizing: border-box;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1);
}

.editTodo input:focus, .Todos input:focus, .changeData input:focus, .creatToDo input:focus, .queryToDo input:focus {
  outline: none;
  background: white;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(102, 126, 234, 0.2);
  transform: scale(1.02);
}

.user h1 {
  color: #333;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
}

.Todos p, .Todos time {
  margin: 8px 0;
  color: #555;
  font-size: 16px;
}

@media (max-width: 768px) {
  .LIST {
    padding: 15px;
  }
  
  .queryToDo, .editTodo, .creatToDo, .changeData {
    padding: 20px;
    margin: 15px 0;
  }
  
  .Todos {
    padding: 20px;
    margin: 15px;
  }
  
  .queryToDo h3, .editTodo h3, .creatToDo h3 {
    font-size: 20px;
  }
  
  .user h1 {
    font-size: 26px;
  }
  
  .ToDoList h3 {
    font-size: 24px;
  }
}

@media (max-width: 500px) {
  .creatToDo button, .queryToDo button, .Todos button, .editTodo button, .changeData button {
    width: 100%;
    max-width: none;
    font-size: 14px;
    padding: 12px;
  }
  
  .Todos {
    width: 100%;
    max-width: none;
  }
  
  .queryToDo, .editTodo, .creatToDo, .changeData {
    width: 100%;
    max-width: none;
  }
  
  .Todos p, .Todos time, .Todos input, .Todos button {
    font-size: 14px;
  }
  
  .editTodo input, .Todos input, .changeData input, .creatToDo input, .queryToDo input {
    padding: 10px 15px;
    font-size: 14px;
  }
}
</style>
