import { favoriteService } from '../../services/favorite'

interface PageData {
  favorites: any[]
  currentSort: number
  currentCategory: string
  categories: string[]
  showSortOptions: boolean
  showCategoryManager: boolean
  showEditCategory: boolean
  newCategory: string
  selectedImage: string
  selectedCategory: string
  hasMore: boolean
  pageSize: number
  currentPage: number
}

Page<PageData>({
  data: {
    favorites: [],
    currentSort: 0,
    currentCategory: '',
    categories: [],
    showSortOptions: false,
    showCategoryManager: false,
    showEditCategory: false,
    newCategory: '',
    selectedImage: '',
    selectedCategory: '',
    hasMore: true,
    pageSize: 10,
    currentPage: 1
  },

  async onLoad() {
    await this.loadCategories()
    await this.loadFavorites()
  },

  onPullDownRefresh() {
    this.setData({ currentPage: 1 }, async () => {
      await this.loadFavorites()
      wx.stopPullDownRefresh()
    })
  },

  // 加载分类
  async loadCategories() {
    const categories = await favoriteService.getCategories()
    this.setData({ categories })
  },

  // 加载收藏列表
  async loadFavorites() {
    const { currentSort, currentCategory, currentPage, pageSize } = this.data
    const sortType = favoriteService.sortTypes[currentSort].value

    try {
      const allFavorites = await favoriteService.getFavorites(sortType, currentCategory)
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const favorites = allFavorites.slice(start, end)
      
      this.setData({
        favorites: currentPage === 1 ? favorites : [...this.data.favorites, ...favorites],
        hasMore: end < allFavorites.length
      })
    } catch (error) {
      console.error('加载收藏失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 加载更多
  async loadMore() {
    if (!this.data.hasMore) return

    this.setData(
      {
        currentPage: this.data.currentPage + 1
      },
      () => this.loadFavorites()
    )
  },

  // 显示排序选项
  showSortOptions() {
    this.setData({ showSortOptions: true })
  },

  // 选择排序方式
  selectSort(event: any) {
    const { index } = event.currentTarget.dataset
    this.setData(
      {
        currentSort: index,
        showSortOptions: false,
        currentPage: 1
      },
      () => this.loadFavorites()
    )
  },

  // 显示分类管理
  showCategories() {
    this.setData({ showCategoryManager: true })
  },

  // 选择分类
  selectCategory(event: any) {
    const { category } = event.currentTarget.dataset
    this.setData(
      {
        currentCategory: category,
        showCategoryManager: false,
        currentPage: 1
      },
      () => this.loadFavorites()
    )
  },

  // 添加分类
  async addCategory() {
    const { newCategory } = this.data
    if (!newCategory.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    try {
      const success = await favoriteService.addCategory(newCategory)
      if (success) {
        await this.loadCategories()
        this.setData({ newCategory: '' })
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '分类已存在',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('添加分类失败:', error)
      wx.showToast({
        title: '添加失败',
        icon: 'error'
      })
    }
  },

  // 删除分类
  async deleteCategory(event: any) {
    const { category } = event.currentTarget.dataset
    
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确定删除该分类吗？',
        confirmText: '删除'
      })

      if (res.confirm) {
        const success = await favoriteService.deleteCategory(category)
        if (success) {
          await this.loadCategories()
          if (this.data.currentCategory === category) {
            this.setData({ currentCategory: '' })
          }
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
  },

  // 编辑图片分类
  editCategory(event: any) {
    const { id } = event.currentTarget.dataset
    this.setData({
      selectedImage: id,
      showEditCategory: true
    })
  },

  // 选择编辑的分类
  selectEditCategory(event: any) {
    const { category } = event.currentTarget.dataset
    this.setData({ selectedCategory: category })
  },

  // 确认编辑分类
  async confirmEdit() {
    const { selectedImage, selectedCategory } = this.data
    
    try {
      const success = await favoriteService.updateCategory(selectedImage, selectedCategory)
      if (success) {
        await this.loadFavorites()
        this.setData({
          showEditCategory: false,
          selectedImage: '',
          selectedCategory: ''
        })
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('更新分类失败:', error)
      wx.showToast({
        title: '更新失败',
        icon: 'error'
      })
    }
  },

  // 取消编辑
  cancelEdit() {
    this.setData({
      showEditCategory: false,
      selectedImage: '',
      selectedCategory: ''
    })
  },

  // 移除收藏
  async removeFavorite(event: any) {
    const { id } = event.currentTarget.dataset
    
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '确定取消收藏吗？',
        confirmText: '取消收藏'
      })

      if (res.confirm) {
        const success = await favoriteService.removeFavorite(id)
        if (success) {
          await this.loadFavorites()
          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          })
        }
      }
    } catch (error) {
      console.error('取消收藏失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  },

  // 预览图片
  previewImage(event: any) {
    const { url } = event.currentTarget.dataset
    wx.previewImage({
      urls: [url]
    })
  },

  // 分类输入
  onCategoryInput(event: any) {
    this.setData({
      newCategory: event.detail.value
    })
  }
})
