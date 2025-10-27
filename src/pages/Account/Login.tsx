// lib
import { createSignal, onMount, onCleanup, Switch, Match, Show } from 'solid-js'
import qr from 'qrcode'

// style
import style from './Login.module.css'

// api
import { createLoginQrcodeKey } from '@/api/adapters/user'
import { authService } from '@/api/services'

// components
import Load from '@/components/Load'
import { useNavigate } from '@solidjs/router'

import Button from '@/components/Button'
import Input from '@/components/Input'

export default function Login() {
  // 登录方式：qrcode 或 password
  const [loginMethod, setLoginMethod] = createSignal<'qrcode' | 'password'>('password')

  // 二维码相关状态
  const [qrcodeDataURL, setQrcodeDataURL] = createSignal('')
  const [qrcodeStatus, setQrcodeStatus] = createSignal<'loading' | 'scanning' | 'timeout' | 'error'>(
    'loading',
  )
  const [qrcodeError, setQrcodeError] = createSignal('')

  // 账号密码相关状态
  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [passwordLoading, setPasswordLoading] = createSignal(false)
  const [passwordError, setPasswordError] = createSignal('')

  const nav = useNavigate()

  let abortController: AbortController | null = null
  let currentQrcodeKey: string | null = null

  onMount(() => {
    startQrcodeLogin()
  })

  onCleanup(() => {
    cleanup()
  })

  function cleanup() {
    abortController?.abort()
    abortController = null
  }

  async function startQrcodeLogin() {
    cleanup()
    abortController = new AbortController()

    setQrcodeStatus('loading')
    setQrcodeError('')

    try {
      const qrcodeKey = await createLoginQrcodeKey()
      currentQrcodeKey = qrcodeKey
      setQrcodeDataURL(await qr.toDataURL(qrcodeKey, { scale: 5 }))
      setQrcodeStatus('scanning')

      const result = await authService.pollingScanAction(qrcodeKey, abortController, 2 * 60 * 1000)

      if (result.scanned) {
        console.log('二维码登录成功:', qrcodeKey)
        console.log('cookie', result.cookie)
        nav('/home', { replace: true })
      } else if (result.timeout) {
        console.log('扫描超时')
        setQrcodeStatus('timeout')
      }
    } catch (error) {
      console.error('二维码登录失败:', error)
      setQrcodeStatus('error')
      setQrcodeError(error instanceof Error ? error.message : '未知错误')
    }
  }

  // 恢复二维码登录 使用旧的二维码key
  async function resumeQrcodeLogin() {
    // 如果二维码已超时或出错，直接显示对应状态
    if (qrcodeStatus() === 'timeout' || qrcodeStatus() === 'error') {
      setLoginMethod('qrcode')
      return
    }

    // 如果还在扫码中, 也就是二维码还有效, 且有旧的 key，继续轮询
    if (qrcodeStatus() === 'scanning' && currentQrcodeKey) {
      setLoginMethod('qrcode')

      cleanup()
      abortController = new AbortController()

      try {
        const result = await authService.pollingScanAction(currentQrcodeKey, abortController)

        if (result.scanned) {
          console.log('二维码登录成功:', currentQrcodeKey)
          console.log('cookie', result.cookie)
          nav('/home', { replace: true })
        } else if (result.timeout) {
          console.log('扫描超时')
          setQrcodeStatus('timeout')
        }
      } catch (error) {
        console.error('二维码登录失败:', error)
        setQrcodeStatus('error')
        setQrcodeError(error instanceof Error ? error.message : '未知错误')
      }
    } else {
      // 其他情况重新开始
      setLoginMethod('qrcode')
      startQrcodeLogin()
    }
  }

  // 切换到账号密码登录
  function switchToPassword() {
    cleanup() // 停止二维码轮询
    setLoginMethod('password')
    setPasswordError('')
  }

  // 切换到二维码登录
  function switchToQrcode() {
    setPasswordError('')
    resumeQrcodeLogin()
  }

  // 重试二维码
  function handleQrcodeRetry() {
    startQrcodeLogin()
  }

  // 账号密码登录
  async function handlePasswordSubmit(e: Event) {
    e.preventDefault()

    if (!username().trim() || !password().trim()) {
      setPasswordError('请输入账号和密码')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')

    try {
      const result = await authService.submitLogin(username(), password())
      if (result.success) {
        console.log('账号密码登录成功')
        nav('/home', { replace: true })
      } else {
        setPasswordError('登录失败，请检查账号密码')
      }
    } catch (error) {
      console.error('账号密码登录失败:', error)
      setPasswordError(error instanceof Error ? error.message : '登录失败，请检查账号密码')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div class={style.loginContainer}>
      {/* 二维码登录 */}
      <Show when={loginMethod() === 'qrcode'}>
        <Switch>
          <Match when={qrcodeStatus() === 'loading'}>
            <Load tip='正在加载二维码' />
          </Match>

          <Match
            when={qrcodeStatus() === 'scanning' || qrcodeStatus() === 'timeout' || qrcodeStatus() === 'error'}
          >
            <div class={style.qrContainer}>
              <div class={style.qrImageContainer}>
                <img src={qrcodeDataURL()} alt='qrcode' />

                {/* 超时遮罩 */}
                <Show when={qrcodeStatus() === 'timeout'}>
                  <div class={style.overlayMask}>
                    <p>扫描超时，二维码已失效</p>
                    <button onClick={handleQrcodeRetry}>重新获取</button>
                  </div>
                </Show>

                {/* 错误遮罩 */}
                <Show when={qrcodeStatus() === 'error'}>
                  <div class={style.overlayMask}>
                    <p>加载失败</p>
                    <p class={style.errorDetail}>{qrcodeError()}</p>
                    <button onClick={handleQrcodeRetry}>重试</button>
                  </div>
                </Show>
              </div>

              <div class={style.guide}>
                <p>请使用工院云课堂扫码登录</p>
                <p>打开工院云课堂，点击 "我的"，在列表中找到 "扫码登录"</p>
              </div>

              <Button class={style.switchBtn} onClick={switchToPassword}>
                账号登录
              </Button>
            </div>
          </Match>
        </Switch>
      </Show>

      {/* 账号密码登录 */}
      <Show when={loginMethod() === 'password'}>
        <div class={style.passwordContainer}>
          <form onSubmit={handlePasswordSubmit} class={style.form}>
            <div class={style.formItem}>
              <Input
                id='username'
                type='text'
                value={username()}
                onInput={(e) => setUsername(e.currentTarget.value)}
                placeholder='账号'
                disabled={passwordLoading()}
                style={{ 'min-width': '268px' }}
              />
            </div>
            <div class={style.formItem}>
              <Input
                id='password'
                type='password'
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder='密码'
                disabled={passwordLoading()}
                style={{ 'min-width': '268px' }}
              />
            </div>

            <Show when={passwordError()}>
              <div class={style.error}>{passwordError()}</div>
            </Show>

            <Button type='submit' disabled={passwordLoading()}>
              {passwordLoading() ? '登录中...' : '登录'}
            </Button>
          </form>

          <Button class={style.switchBtn} onClick={switchToQrcode}>
            扫码登录
          </Button>
        </div>
      </Show>
    </div>
  )
}
