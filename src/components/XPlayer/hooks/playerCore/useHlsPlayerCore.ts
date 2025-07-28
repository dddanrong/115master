import type { HlsConfig } from 'hls.js'
import type { PlayerContext } from '../usePlayerProvide'
import type { PlayerCoreMethods } from './types'
import { useEventListener } from '@vueuse/core'
import Hls from 'hls.js'
import { shallowRef } from 'vue'
import { PlayerCoreType } from './types'
import { useNativePlayerCore } from './useNativePlayerCore'

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Partial<HlsConfig> = {
  // 自动开始加载
  autoStartLoad: true,
  // 最大缓冲区长度
  maxBufferLength: 1200,
  // 低延迟模式
  lowLatencyMode: true,
  // 开始位置
  startPosition: -1,
  // 调试
  debug: false,
}

/**
 * HLS 播放器核心
 */
export function useHlsPlayerCore(ctx: PlayerContext) {
  const hlsRef = shallowRef<Hls | null>(null)

  /** 继承原生驱动 */
  const videoNative = useNativePlayerCore(ctx)

  /** 获取 hls */
  const getHlsRef = () => {
    if (!hlsRef.value) {
      throw new Error('Hls is not initialized')
    }
    return hlsRef.value
  }

  /** 方法 */
  const methods: PlayerCoreMethods = {
    ...videoNative,
    init: async (
      container: HTMLDivElement,
      config: Partial<HlsConfig> = {},
    ) => {
      await videoNative.init(container)
      hlsRef.value = new Hls({
        ...DEFAULT_CONFIG,
        ...ctx.rootProps.hlsConfig,
        ...config,
      })
    },
load: (url: string, lastTime?: number) => {  
  const videoElement = videoNative.getRenderElement() as HTMLVideoElement  
  const hls = getHlsRef()  
  hls.loadSource(url)  
  hls.attachMedia(videoElement)  
  videoElement.muted = videoNative.muted.value  
  videoElement.playbackRate = videoNative.playbackRate.value  
  videoElement.volume = videoNative.volume.value / 100  
    
  // 设置播放时间  
  if (lastTime && lastTime > 0) {  
    videoElement.currentTime = lastTime  
  }  
    
  return new Promise<void>((resolve, reject) => {  
    useEventListener(videoElement, 'loadedmetadata', () => {  
      videoNative.duration.value = videoElement.duration  
        
      // 在元数据加载后再次设置时间，确保生效  
      if (lastTime && lastTime > 0) {  
        videoElement.currentTime = lastTime  
      }  
        
      resolve()  
  
      if (videoNative.autoPlay.value) {  
        videoNative.play()  
      }  
    })  
    useEventListener(videoElement, 'error', (_event) => {  
      videoNative.loadError.value = new Error('NotSupportedError')  
      reject(videoNative.loadError.value)  
    })  
  })  
},
    destroy: () => {
      if (hlsRef.value) {
        hlsRef.value.destroy()
        hlsRef.value = null
      }
      return videoNative.destroy()
    },
  }

  return {
    ...videoNative,
    ...methods,
    type: PlayerCoreType.Hls as const,
  }
}
