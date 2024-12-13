import { promisifyAll } from 'miniprogram-api-promise'

const wxp = {}
promisifyAll(wx, wxp)

// 缓存键
const CACHE_KEYS = {
  RECENT_PROMPTS: 'recent_prompts',
  IMAGE_CACHE: 'image_cache_'
}

// 缓存过期时间（24小时）
const CACHE_EXPIRY = 24 * 60 * 60 * 1000

interface CacheItem<T> {
  data: T
  timestamp: number
}

interface GenerateImageParams {
  // Add properties for GenerateImageParams
}

interface GenerateImageResult {
  // Add properties for GenerateImageResult
}

interface SaveToGalleryParams {
  // Add properties for SaveToGalleryParams
}

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

interface GalleryImage {
  // Add properties for GalleryImage
}

class ApiService {
  private baseUrl: string
  private imageCache: Map<string, string>
  private pendingRequests: Map<string, Promise<any>>

  constructor() {
    this.baseUrl = 'http://localhost:3000/api'
    this.imageCache = new Map()
    this.pendingRequests = new Map()
  }

  // 生成图片
  async generateImage(params: GenerateImageParams): Promise<ApiResponse<GenerateImageResult>> {
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(params)
      const cachedResult = await this.getFromCache<GenerateImageResult>(cacheKey)
      if (cachedResult) {
        return { code: 0, data: cachedResult }
      }

      // 检查是否有相同的请求正在进行
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey)
      }

      // 创建新请求
      const request = this.makeRequest<GenerateImageResult>('/generate', 'POST', params)
      this.pendingRequests.set(cacheKey, request)

      const response = await request
      if (response.code === 0 && response.data) {
        // 压缩图片
        const compressedImage = await this.compressImage(response.data.url)
        response.data.url = compressedImage
        // 存入缓存
        await this.saveToCache(cacheKey, response.data)
      }

      this.pendingRequests.delete(cacheKey)
      return response
    } catch (error) {
      console.error('生成图片失败:', error)
      return { code: -1, message: error.message || '生成失败' }
    }
  }

  // 获取画廊列表
  async getGalleryList(): Promise<ApiResponse<GalleryImage[]>> {
    try {
      const cacheKey = CACHE_KEYS.IMAGE_CACHE + 'gallery'
      const cachedResult = await this.getFromCache<GalleryImage[]>(cacheKey)
      if (cachedResult) {
        return { code: 0, data: cachedResult }
      }

      const response = await this.makeRequest<GalleryImage[]>('/gallery', 'GET')
      if (response.code === 0 && response.data) {
        // 压缩所有图片
        const compressedImages = await Promise.all(
          response.data.map(async (image) => ({
            ...image,
            url: await this.compressImage(image.url)
          }))
        )
        response.data = compressedImages
        await this.saveToCache(cacheKey, compressedImages)
      }

      return response
    } catch (error) {
      console.error('获取画廊列表失败:', error)
      return { code: -1, message: error.message || '获取失败' }
    }
  }

  // 保存到画廊
  async saveToGallery(params: SaveToGalleryParams): Promise<ApiResponse<void>> {
    try {
      const response = await this.makeRequest<void>('/gallery', 'POST', params)
      if (response.code === 0) {
        // 清除画廊缓存
        await wx.removeStorage({ key: CACHE_KEYS.IMAGE_CACHE + 'gallery' })
      }
      return response
    } catch (error) {
      console.error('保存到画廊失败:', error)
      return { code: -1, message: error.message || '保存失败' }
    }
  }

  // 从画廊删除
  async deleteFromGallery(imageId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.makeRequest<void>('/gallery/' + imageId, 'DELETE')
      if (response.code === 0) {
        // 清除画廊缓存
        await wx.removeStorage({ key: CACHE_KEYS.IMAGE_CACHE + 'gallery' })
      }
      return response
    } catch (error) {
      console.error('从画廊删除失败:', error)
      return { code: -1, message: error.message || '删除失败' }
    }
  }

  // 压缩图片
  private async compressImage(imageUrl: string): Promise<string> {
    try {
      if (this.imageCache.has(imageUrl)) {
        return this.imageCache.get(imageUrl)
      }

      const compressResult = await wxp.compressImage({
        src: imageUrl,
        quality: 80
      })

      this.imageCache.set(imageUrl, compressResult.tempFilePath)
      return compressResult.tempFilePath
    } catch (error) {
      console.warn('图片压缩失败:', error)
      return imageUrl
    }
  }

  // 生成缓存键
  private generateCacheKey(params: any): string {
    return CACHE_KEYS.IMAGE_CACHE + JSON.stringify(params)
  }

  // 从缓存获取数据
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const result = await wx.getStorage({ key })
      const cacheItem: CacheItem<T> = result.data

      if (Date.now() - cacheItem.timestamp > CACHE_EXPIRY) {
        await wx.removeStorage({ key })
        return null
      }

      return cacheItem.data
    } catch {
      return null
    }
  }

  // 保存数据到缓存
  private async saveToCache<T>(key: string, data: T): Promise<void> {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now()
    }
    await wx.setStorage({ key, data: cacheItem })
  }

  // 发起请求
  private async makeRequest<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await wx.request({
        url: this.baseUrl + path,
        method,
        data,
        header: {
          'content-type': 'application/json'
        }
      })

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data as ApiResponse<T>
      } else {
        throw new Error(`请求失败: ${response.statusCode}`)
      }
    } catch (error) {
      throw error
    }
  }
}

export const apiService = new ApiService()
