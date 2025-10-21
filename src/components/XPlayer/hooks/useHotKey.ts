import type { PlayerContext } from './usePlayerProvide'
import { useEventListener } from '@vueuse/core'

// 匹配热键
interface HotKeyMatch {
  /**
   * 按键
   */
  key: string
  /**
   * 配置
   */
  config: HotKeyConfig
}

// 热键配置
export interface HotKeyConfig {
  /**
   * 按键组
   */
  keys: string[]
  /**
   * 名称
   */
  name: string
  /**
   * 是否重复
   * @default false
   */
  allowRepeat?: boolean
  /**
   * 按键按下
   */
  keydown: (
    ctx: PlayerContext,
    event: KeyboardEvent,
    match: HotKeyMatch,
  ) => void
  /**
   * 按键抬起
   */
  keyup?: (
    ctx: PlayerContext,
    event: KeyboardEvent,
    match: HotKeyMatch,
  ) => void
}

/** 修饰键 */
const MODIFIERS = {
  Shift: 'Shift',
  Alt: 'Alt',
  Control: 'Control',
  Meta: 'Meta',
}

/**
 * 按键
 * @description 按键映射
 * @doc https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
 */
const KEYS = {
  'sapce': ' ',
  'arrowLeft': 'ArrowLeft',
  'arrowRight': 'ArrowRight',
  'arrowUp': 'ArrowUp',
  'arrowDown': 'ArrowDown',
  'w': 'w',
  'a': 'a',
  'b': 'b',
  's': 's',
  'd': 'd',
  'c': 'c',
  'f': 'f',
  'p': 'p',
  'm': 'm',
  'W': 'W',
  'A': 'A',
  'B': 'B',
  'S': 'S',
  'D': 'D',
  'C': 'C',
  'F': 'F',
  'P': 'P',
  'M': 'M',
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '-': '-',
  '=': '=',
  '[': '[',
  ']': ']',
  '\\': '\\',
  'h': 'h',
  'j': 'j',
  'k': 'k',
  'l': 'l',
  'H': 'H',
  'J': 'J',
  'K': 'K',
  'L': 'L',
  'r': 'r',
  'R': 'R',
  'enter': 'Enter',  
  'z': 'z',  
  'Z': 'Z',   
  'x': 'x',  
  'X': 'X',
  ',': ',',
  '.': '.',
  'e': 'e',  
'E': 'E',
  'q': 'q',
  'Q': 'Q',
  'n': 'n',
  'N': 'N',
}

const HOT_KEYS_CONFIG: Record<string, HotKeyConfig> = {
  /**
   * 按下 0-9 进度跳转
   */
  progress: {
    keys: [
      KEYS['0'],
      KEYS['1'],
      KEYS['2'],
      KEYS['3'],
      KEYS['4'],
      KEYS['5'],
      KEYS['6'],
      KEYS['7'],
      KEYS['8'],
      KEYS['9'],
    ],
    name: '进度跳转',
    keydown: (ctx, event) => {
      const key = event.key
      const digit = Number(key)
      const percentage = digit / 10

      // 调用原始方法进行跳转
      ctx.playerCore.value?.skip(percentage, true)

      // 显示HUD消息
      if (ctx.hud) {
        ctx.hud.showProgressJump(digit)
      }
    },
  },

  /**  
 * 按下 e 进入文件标题编辑模式  
 */  
editFileName: {  
  keys: [KEYS.e, KEYS.E],  
  name: '编辑文件名',  
  keydown: (ctx) => {  
    // 触发文件名编辑事件  
    ctx.rootEmit('edit-filename')  
  },  
},
  /**
   * 按下 ← a 快退
   */
  fastBackward: {
    keys: [KEYS.a, KEYS.A],
    name: '快退5s',
    allowRepeat: true,
    keydown: (ctx) => {
      ctx.playerCore.value?.skip(-5)
      ctx.hud?.showFastJumpHud(-1)
    },
  },
   /**
   * 按下 ←  快退
   */ 
  fastBackwardMore: {
    keys: [KEYS.arrowLeft],
    name: '快退25s',
    allowRepeat: true,
    keydown: (ctx) => {
      ctx.playerCore.value?.skip(-25)
      ctx.hud?.showFastJumpHud(-1)
    },
  },
   /**
   * 按下 Ctrl + ←  快退
   */ 
  fastBackwardLong: {  
  keys: ['Control+ArrowLeft'],  
  name: '快退110s',  
  keydown: (ctx) => {  
    ctx.playerCore.value?.skip(-110)  
    ctx.hud?.showFastJumpHud(-1)  
  },  
},  
  /**
   * 按下 d 快进
   */
  fastForward: {
    keys: [KEYS.d, KEYS.D],
    name: '快进5s',
    allowRepeat: true,
  keydown: (ctx) => {  
    ctx.playerCore.value?.skip(5)  
    ctx.hud?.showFastJumpHud(1)  
  },  
  },
  /**
   * 按下 →  快进
   */
  fastForwardMore: {
    keys: [KEYS.arrowRight],
    name: '快进30s',
    allowRepeat: true,
  keydown: (ctx) => {  
    ctx.playerCore.value?.skip(30)  
    ctx.hud?.showFastJumpHud(1)  
  },  
  },
  /**
   * 按下 Ctrl + →  快进
   */
fastForwardLong: {  
  keys: ['Control+ArrowRight'],   
  name: '快进120s',  
  keydown: (ctx) => {  
    ctx.playerCore.value?.skip(120)  
    ctx.hud?.showFastJumpHud(1)  
  },  
},
  /**
   * 按下 ↑ 播放速度增大
   */
  playbackRateUp: {
    keys: [KEYS.arrowUp],
    name: '播放速度增大',
    allowRepeat: true,
    keydown: async (ctx) => {
      ctx.playbackRate?.up()
      ctx.hud?.showPlaybackRate()
    },
  },

  /**
   * 按下 ↓ 播放速度减小
   */
  playbackRateDown: {
    keys: [KEYS.arrowDown],
    name: '播放速度减小',
    allowRepeat: true,
    keydown: (ctx, event) => {
      if (event.repeat) {
        ctx.playbackRate?.downWithLowerLimit()
        ctx.hud?.showPlaybackRate()
      }
      else {
        ctx.playbackRate?.down()
        ctx.hud?.showPlaybackRate()
      }
    },
  },

  /**
   * 按下 w 音量增大
   */
  volumeUp: {
    keys: [KEYS.w, KEYS.W, KEYS['=']],
    name: '音量增大',
    allowRepeat: true,
    keydown: (ctx) => {
      ctx.playerCore.value?.adjustVolume(5)
      ctx.hud?.showVolume()
    },
  },

  /**
   * 按下 s 音量减小
   */
  volumeDown: {
    keys: [KEYS.s, KEYS.S, KEYS['-']],
    name: '音量减小',
    allowRepeat: true,
    keydown: (ctx) => {
      ctx.playerCore.value?.adjustVolume(-5)
      ctx.hud?.showVolume()
    },
  },

  /**
   * 按下 空格 播放/暂停
   */
  togglePlay: {
    keys: [KEYS.sapce],
    name: '播放/暂停',
    keydown: (ctx) => {
      ctx.playerCore.value?.togglePlay()
    },
  },

  /**
   * 按下 m 切换静音
   */
  toggleMute: {
    keys: [KEYS.m],
    name: '切换静音',
    keydown: (ctx) => {
      if (ctx.playerCore.value?.isSuspended) {
        ctx.playerCore.value?.resumeSuspended()
        ctx.hud?.showResumeSuspended()
        return
      }
      ctx.playerCore.value?.toggleMute()
      ctx.hud?.showMute()
    },
  },

  /**
   * 按下 c 切换字幕
   */
  toggleSubtitle: {
    keys: [KEYS.c, KEYS.C],
    name: '切换字幕',
    keydown: (ctx) => {
      if (ctx.subtitles?.loading.value || !ctx.subtitles?.ready.value) {
        return
      }
      ctx.subtitles?.toggleEnabled()
    },
  },

  /**
   * 按下 f 切换全屏
   */
  toggleFullscreen: {
    keys: [KEYS.enter, KEYS.f, KEYS.F],
    name: '切换全屏',
    keydown: (ctx) => {
      ctx.fullscreen?.toggleFullscreen()
    },
  },

  /**
   * 按下 l 切换播放列表
   */
  toggleShowSider: {
    keys: [KEYS.l, KEYS.L],
    name: '切换播放列表',
    keydown: (ctx) => {
      ctx.fullscreen?.toggleShowSider()
    },
  },

  /**
   * 按下 p 切换画中画
   */
  togglePictureInPicture: {
    keys: [KEYS.p, KEYS.P],
    name: '切换画中画',
    keydown: (ctx) => {
      ctx.pictureInPicture?.toggle()
    },
  },

  /**
   * 按下 [ 向左旋转
   */
  rotateLeft: {
    keys: [KEYS['['], KEYS.z, KEYS.Z],
    name: '向左旋转',
    keydown: (ctx) => {
      ctx.transform?.left()
    },
  },

  /**
   * 按下 ] 向右旋转
   */
  rotateRight: {
    keys: [KEYS[']'], KEYS.x, KEYS.X],
    name: '向右旋转',
    keydown: (ctx) => {
      ctx.transform?.right()
    },
  },

  /**
   * 按下 \ 重置旋转
   */
  resetRotation: {
    keys: [KEYS['\\']],
    name: '重置旋转',
    keydown: (ctx) => {
      ctx.transform?.normal()
    },
  },

  /**
   * 按下 h 水平翻转
   */
  toggleFlipX: {
    keys: [KEYS.h, KEYS.H],
    name: '水平翻转',
    keydown: (ctx) => {
      ctx.transform?.toggleFlipX()
    },
  },

  /**
   * 按下 j 垂直翻转
   */
  toggleFlipY: {
    keys: [KEYS.j, KEYS.J],
    name: '垂直翻转',
    keydown: (ctx) => {
      ctx.transform?.toggleFlipY()
    },
  },
  // 在 HOT_KEYS_CONFIG 对象中添加  
jumpToPrevMarker: {  
  keys: [','],  
  name: '跳转到上一个时间标记',  
  keydown: (ctx) => {  
    const currentTime = ctx.playerCore.value?.currentTime ?? 0  
    const markers = ctx.progressBar?.timeMarkers?.value ?? []  
      
    // 找到当前时间左侧的第一个标记  
    const prevMarker = markers  
      .filter(marker => marker.time < currentTime)  
      .sort((a, b) => b.time - a.time)[0]  
      
    if (prevMarker) {  
      ctx.playerCore.value?.seek(prevMarker.time)  
    }  
  },  
},  
  
jumpToNextMarker: {  
  keys: ['.'],  
  name: '跳转到下一个时间标记',  
  keydown: (ctx) => {  
    const currentTime = ctx.playerCore.value?.currentTime ?? 0  
    const markers = ctx.progressBar?.timeMarkers?.value ?? []  
      
    // 找到当前时间右侧的第一个标记  
    const nextMarker = markers  
      .filter(marker => marker.time > currentTime)  
      .sort((a, b) => a.time - b.time)[0]  
      
    if (nextMarker) {  
      ctx.playerCore.value?.seek(nextMarker.time)  
    }  
  },  
},
 /**  
   * 按下 B 播放列表上一个  
   */  
  playlistPrevious: {  
    keys: [KEYS.b, KEYS.B],  
    name: '播放列表上一个',  
    keydown: (ctx) => {  
      // 调用播放列表上一个方法  
      ctx.rootEmit('playlist-previous')  
    },  
  },  
  
  /**  
   * 按下 N 播放列表下一个  
   */  
  playlistNext: {  
    keys: [KEYS.n, KEYS.N],  
    name: '播放列表下一个',  
    keydown: (ctx) => {  
      // 调用播放列表下一个方法  
      ctx.rootEmit('playlist-next')  
    },  
  },

  /**
   * 按下 Q 切换画质
   */
  switchQuality: {
    keys: [KEYS.q, KEYS.Q],
    name: '切换画质',
    keydown: (ctx) => {
      // 获取当前画质列表
      const sources = ctx.source?.list.value || []
      if (sources.length <= 1) return
      
      const currentSource = ctx.source?.current.value
      if (!currentSource) return
      
      // 找到当前画质在列表中的索引
      const currentIndex = sources.findIndex(source => 
        source.quality === currentSource.quality && 
        source.displayQuality === currentSource.displayQuality
      )
      
      // 切换到下一个画质（循环）
      const nextIndex = (currentIndex + 1) % sources.length
      const nextSource = sources[nextIndex]
      
      if (nextSource) {
        ctx.source?.changeQuality(nextSource)
        ctx.hud?.showQualitySwitch(nextSource.displayQuality || nextSource.quality)
      }
    },
  },
}

/**
 * 获取热键配置
 */
export function getHotKeysConfig(): Record<string, HotKeyConfig> {
  return HOT_KEYS_CONFIG
}

/**
 * 解析按键组
 * @param key 按键组
 * @returns 按键组 Set<string>
 */
function parseKeyConfig(key: string) {
  return new Set(key.split('+').filter(item => item !== ''))
}

/**
 * 预处理按键事件
 * @param event 按键事件
 * @returns 按键事件 Set<string>
 */
function preseKeyEvent(event: KeyboardEvent) {
  const modifiers = [
    event.altKey ? MODIFIERS.Alt : null,
    event.shiftKey ? MODIFIERS.Shift : null,
    event.ctrlKey ? MODIFIERS.Control : null,
    event.metaKey ? MODIFIERS.Meta : null,
  ].filter(item => !!item) as string[]
  return new Set([...modifiers, event.key])
}

/** 判断事件的修饰键是否与配置键的修饰键相同 */
function isSame(eventSet: Set<string>, configSet: Set<string>) {
  return (
    eventSet.size === configSet.size
    && Array.from(configSet).every(key => eventSet.has(key))
  )
}

/** 匹配按键 */
function matchKey(event: KeyboardEvent) {
  const eventSet = preseKeyEvent(event)
  for (const config of Object.values(HOT_KEYS_CONFIG)) {
    for (const key of config.keys) {
      const configSet = parseKeyConfig(key)
      if (isSame(eventSet, configSet)) {
        return { key, config }
      }
    }
  }
  return null
}

/**
 * 使用热键
 * @param ctx 播放器上下文
 */
export function useHotKey(ctx: PlayerContext) {
  /** 按键按下 */
  const handleKeydown = (event: KeyboardEvent) => {
    const match = matchKey(event)
    if (match?.key) {
      event.preventDefault()
      if (event.repeat && !match.config.allowRepeat) {
        return
      }
      match.config.keydown(ctx, event, match)
    }
  }

  /** 按键抬起 */
  const handleKeyup = (event: KeyboardEvent) => {
    const match = matchKey(event)
    if (match?.key) {
      event.preventDefault()
      match.config.keyup?.(ctx, event, match)
    }
  }

  useEventListener('keydown', handleKeydown)
  useEventListener('keyup', handleKeyup)
}
