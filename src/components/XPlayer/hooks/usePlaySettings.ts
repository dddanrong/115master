import type { PlayerContext } from './usePlayerProvide'
import { useLocalStorage } from '@vueuse/core'

/**
 * 播放设置
 */
export function usePlaySettings(ctx: PlayerContext) {
  /** 播放时保持进度条可见（当有时间标记时） */
  const keepProgressBarVisible = useLocalStorage('xplayer_keep_progressbar_visible', false)
  /** FC2低画质播放（默认开启，保持现有行为） */
  const fc2LowQualityPlay = useLocalStorage('xplayer_fc2_low_quality_play', true)

  /** 切换自动播放 */
  const toggleAutoPlay = () => {
    ctx.rootPropsVm.autoPlay.value = !ctx.rootPropsVm.autoPlay.value
  }

  /** 切换保持进度条可见 */
  const toggleKeepProgressBarVisible = () => {
    keepProgressBarVisible.value = !keepProgressBarVisible.value
  }

  /** 切换FC2低画质播放 */
  const toggleFc2LowQualityPlay = () => {
    fc2LowQualityPlay.value = !fc2LowQualityPlay.value
  }

  return {
    // 状态
    autoPlay: ctx.rootPropsVm.autoPlay,
    keepProgressBarVisible,
    fc2LowQualityPlay,
    // 方法
    toggleAutoPlay,
    toggleKeepProgressBarVisible,
    toggleFc2LowQualityPlay,
  }
}
