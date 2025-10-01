import { CacheCore } from './core'

/** 画质偏好类型 */
export interface QualityPreference {
  /** 画质值 */
  quality: number
  /** 显示画质（可选） */
  displayQuality?: string | number
  /** 保存时间戳 */
  timestamp: number
}

/** 画质偏好存储前缀 */
const STORE_PREFIX = 'quality_preference'

/** 画质偏好管理器 */
export class QualityPreferenceManager extends CacheCore<QualityPreference> {
  /** 构造函数 */
  constructor() {
    super({
      storeName: STORE_PREFIX,
      enableQuotaManagement: false,
    })
  }

  /** 保存画质偏好 */
  async savePreference(quality: number, displayQuality?: string | number): Promise<void> {
    try {
      const key = this.getStoreKey()
      const preference: QualityPreference = {
        quality,
        displayQuality,
        timestamp: Date.now(),
      }
      await this.set(key, preference)
    }
    catch (error) {
      console.error('保存画质偏好失败', error)
    }
  }

  /** 获取画质偏好 */
  async getPreference(): Promise<QualityPreference | null> {
    try {
      const key = this.getStoreKey()
      const preference = await this.get(key)
      return preference?.value ?? null
    }
    catch {
      return null
    }
  }

  /** 生成存储 key */
  private getStoreKey(): string {
    return `${STORE_PREFIX}_global`
  }
}

/** 画质偏好实例 */
export const qualityPreference = new QualityPreferenceManager()
