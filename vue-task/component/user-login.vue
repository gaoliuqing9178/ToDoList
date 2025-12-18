<script setup>
import { ref, onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'

const BaseURL = `/api/v1`
const router = useRouter()

const accountName = ref('')
const accountPassword = ref('')
const userName = ref('')

const isRegister = ref(false)
const isSignin = ref(true)
const isUser = ref(false)


// 注册
async function Register() {
  // 输入验证
  if (!accountName.value?.trim() || !accountPassword.value?.trim() || !userName.value?.trim()) {
    alert('请填写完整的注册信息')
    return
  }

  try {
    const req = new Request(`${BaseURL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: accountName.value.trim(),
        name: userName.value.trim(),
        password: accountPassword.value,
      }),
    })

    const res = await fetch(req)
    const data = await res.json()
    
    if (res.status === 500 || data.message?.includes('用户已存在')) {
      alert('该账户已存在，请直接登录')
    } else if (res.status === 400) {
      alert('输入信息格式不正确')
    } else if (!res.ok) {
      alert(`注册失败: ${data.message || '服务器错误'}`)
    } else {
      alert('注册成功！请登录')
      // 清空输入并切换到登录界面
      userName.value = ''
      accountName.value = ''
      accountPassword.value = ''
      RegisterWindow()
    }
    
    console.log('注册响应:', { status: res.status, data })
  } catch (error) {
    console.error('注册请求失败:', error)
    alert('注册失败，请检查网络连接')
  }
}

// 登录
async function Signin() {
  // 输入验证
  if (!accountName.value?.trim() || !accountPassword.value?.trim()) {
    alert('请输入账户名和密码')
    return
  }

  try {
    const req = new Request(`${BaseURL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: accountName.value.trim(),
        password: accountPassword.value,
      }),
    })

    const res = await fetch(req)
    const data = await res.json()

    if (res.status === 401 || data.message?.includes('密码错误')) {
      alert('账户名或密码错误')
    } else if (res.status === 400) {
      alert('登录信息格式不正确')
    } else if (!res.ok) {
      alert(`登录失败: ${data.message || '服务器错误'}`)
    } else if (data.token && data.user) {
      // 登录成功，保存用户信息
      localStorage.setItem('userToken', data.token)
      localStorage.setItem('userName', data.user.name)
      
      // 更新界面状态
      userName.value = data.user.name
      isSignin.value = false
      isUser.value = true

      // 导航到待办事项页面
      router.push('/Todos')
      
      console.log('登录成功:', data.user.name)
    } else {
      alert('登录响应数据不完整')
    }
  } catch (error) {
    console.error('登录请求失败:', error)
    alert('登录失败，请检查网络连接')
  }
}

function RegisterWindow() {
  isRegister.value = !isRegister.value
  isSignin.value = !isSignin.value
}

// 若本地存在token则自动登录
onMounted(() => {
  const savedToken = localStorage.getItem('userToken')
  const savedUserName = localStorage.getItem('userName')
  
  if (savedToken && savedUserName) {
    userName.value = savedUserName
    isUser.value = true
    router.push('/Todos')
    console.log('自动登录成功:', savedUserName)
  }
})

</script>
<!------------------------------------------------------------------------------------------------------>
<template>
    <div class="Sign&register" v-if="!isUser">
      <!---注册和登录页面-->
      <!---登录-->
      <div class="sign" v-if="isSignin">
        <h3>登录</h3>
        <input class="ac" type="text" v-model="accountName" placeholder="输入账户名称" />
        <input class="ac" type="password" v-model="accountPassword" placeholder="输入密码" />
        <button class="acbtn" @click="Signin">登录</button>
        <button class="acbtn" @click="RegisterWindow">注册</button>
      </div>
      <!---注册-->
      <div class="register" v-if="isRegister">
        <h3>注册</h3>
        <input class="ac" type="text" v-model="accountName" placeholder="输入账户名称" />
        <input class="ac" type="password" v-model="accountPassword" placeholder="输入密码" />
        <input class="ac" type="text" v-model="userName" placeholder="输入用户名称" />
        <button class="acbtn" @click="Register">注册</button>
        <button class="acbtn" @click="RegisterWindow">返回登陆</button>
      </div>
    </div>
  <!--------------------------------------------------------------------------------------------------------------------------------------->
  <RouterView></RouterView>
</template>

<style>
html,
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
}

.changeData button {
  margin: 10px;
  width: 20%;
}

.Sign\&register {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.sign,
.register {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  padding: 40px 30px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.sign:hover,
.register:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.sign h3,
.register h3 {
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.sign button,
.register button {
  display: block;
  margin: 15px 0;
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 16px;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.sign button:hover,
.register button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.sign button:active,
.register button:active {
  transform: translateY(0);
}

.sign button:last-child,
.register button:last-child {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

input {
  width: 100%;
  padding: 15px 20px;
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

input:focus {
  outline: none;
  background: white;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(102, 126, 234, 0.2);
  transform: scale(1.02);
}

@media (max-width: 610px) {
  .Sign\&register button {
    width: 100%;
    font-size: 14px;
    padding: 12px;
  }
  
  .sign,
  .register {
    padding: 30px 20px;
    margin: 10px;
  }
  
  input {
    padding: 12px 15px;
    font-size: 14px;
  }
}
</style>
