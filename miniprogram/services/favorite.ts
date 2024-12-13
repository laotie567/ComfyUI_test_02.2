interface FavoriteImage {
  id: string
  url: string
  prompt: string
  params?: {
    width: number
    height: number
    steps: number
  }
  createTime: number
  category?: string
}

interface SortOption {
  value: 'time' | 'category'
  text: string
  compare: (a: FavoriteImage, b: FavoriteImage) => number
}

class FavoriteService {
  private readonly STORAGE_KEY = 'favorite_images'
  private readonly CATEGORIES_KEY = 'favorite_categories'

  // 排序选项
  readonly sortTypes: SortOption[] = [
    {
      value: 'time',
      text: '按时间排序',
      compare: (a, b) => b.createTime - a.createTime
    },
    {
      value: 'category',
      text: '按分类排序',
      compare: (a, b) => {
        if (!a.category && !b.category) return 0
        if (!a.category) return 1
        if (!b.category) return -1
        return a.category.localeCompare(b.category)
      }
    }
  ]

  // 获取所有收藏
  async getFavorites(sortType: SortOption['value'] = 'time', category?: string): Promise<FavoriteImage[]> {
    try {
      let favorites: FavoriteImage[] = wx.getStorageSync(this.STORAGE_KEY) || []
      
      // 应用分类筛选
      if (category) {
        favorites = favorites.filter(item => item.category === category)
      }

      // 应用排序
      const sortOption = this.sortTypes.find(type => type.value === sortType)
      if (sortOption) {
        favorites.sort(sortOption.compare)
      }

      return favorites
    } catch (error) {
      console.error('获取收藏失败:', error)
      return []
    }
  }

  // 添加收藏
  async addFavorite(image: Omit<FavoriteImage, 'createTime'>): Promise<boolean> {
    try {
      const favorites = await this.getFavorites()
      
      // 检查是否已收藏
      const exists = favorites.some(item => item.id === image.id)
      if (exists) {
        return false
      }

      // 添加到收藏列表
      const newFavorite: FavoriteImage = {
        ...image,
        createTime: Date.now()
      }
      favorites.unshift(newFavorite)

      // 保存到本地存储
      wx.setStorageSync(this.STORAGE_KEY, favorites)
      return true
    } catch (error) {
      console.error('添加收藏失败:', error)
      return false
    }
  }

  // 取消收藏
  async removeFavorite(imageId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites()
      const index = favorites.findIndex(item => item.id === imageId)
      
      if (index === -1) {
        return false
      }

      favorites.splice(index, 1)
      wx.setStorageSync(this.STORAGE_KEY, favorites)
      return true
    } catch (error) {
      console.error('取消收藏失败:', error)
      return false
    }
  }

  // 更新收藏分类
  async updateCategory(imageId: string, category: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites()
      const index = favorites.findIndex(item => item.id === imageId)
      
      if (index === -1) {
        return false
      }

      favorites[index] = {
        ...favorites[index],
        category
      }

      wx.setStorageSync(this.STORAGE_KEY, favorites)
      return true
    } catch (error) {
      console.error('更新分类失败:', error)
      return false
    }
  }

  // 获取所有分类
  async getCategories(): Promise<string[]> {
    try {
      return wx.getStorageSync(this.CATEGORIES_KEY) || []
    } catch (error) {
      console.error('获取分类失败:', error)
      return []
    }
  }

  // 添加分类
  async addCategory(category: string): Promise<boolean> {
    try {
      const categories = await this.getCategories()
      
      if (categories.includes(category)) {
        return false
      }

      categories.push(category)
      wx.setStorageSync(this.CATEGORIES_KEY, categories)
      return true
    } catch (error) {
      console.error('添加分类失败:', error)
      return false
    }
  }

  // 删除分类
  async deleteCategory(category: string): Promise<boolean> {
    try {
      const categories = await this.getCategories()
      const index = categories.indexOf(category)
      
      if (index === -1) {
        return false
      }

      // 删除分类
      categories.splice(index, 1)
      wx.setStorageSync(this.CATEGORIES_KEY, categories)

      // 更新所有使用该分类的收藏
      const favorites = await this.getFavorites()
      const updatedFavorites = favorites.map(item => {
        if (item.category === category) {
          return { ...item, category: undefined }
        }
        return item
      })
      wx.setStorageSync(this.STORAGE_KEY, updatedFavorites)

      return true
    } catch (error) {
      console.error('删除分类失败:', error)
      return false
    }
  }

  // 检查是否已收藏
  async isFavorite(imageId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites()
      return favorites.some(item => item.id === imageId)
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      return false
    }
  }

  // 获取收藏数量
  async getFavoriteCount(): Promise<number> {
    try {
      const favorites = await this.getFavorites()
      return favorites.length
    } catch (error) {
      console.error('获取收藏数量失败:', error)
      return 0
    }
  }

  // 清空收藏
  async clearFavorites(): Promise<boolean> {
    try {
      wx.setStorageSync(this.STORAGE_KEY, [])
      return true
    } catch (error) {
      console.error('清空收藏失败:', error)
      return false
    }
  }
}

export const favoriteService = new FavoriteService()
