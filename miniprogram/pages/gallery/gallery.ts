import { apiService } from '../../services/api'
import { shareService } from '../../services/share'
import { favoriteService } from '../../services/favorite'

interface PageData {
  images: GalleryImage[]
  loading: boolean
  refreshing: boolean
  showShareMenu: boolean
  showPosterMenu: boolean
  selectedImage: GalleryImage | null
  currentShareImage: GalleryImage | null
}

Page<PageData>({
  data: {
    images: [] as GalleryImage[],
    loading: false,
    refreshing: false,
    showShareMenu: false,
    showPosterMenu: false,
    selectedImage: null,
    currentShareImage: null
  },

  async onLoad() {
    await this.loadGallery()
    await this.updateFavoriteStatus()
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadGallery().finally(() => {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    })
  },

  // 加载画廊图片
  async loadGallery() {
    if (this.data.loading) return

    try {
      this.setData({ loading: true })
      const res = await apiService.getGalleryList()
      
      if (res.code === 0) {
        this.setData({
          images: res.data || []
        })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 预览图片
  onPreviewImage(e: WechatMiniprogram.Touch) {
    const { url } = e.currentTarget.dataset
    if (!url) return

    const urls = this.data.images.map(img => img.url)
    wx.previewImage({
      current: url,
      urls
    })
  },

  // 删除图片
  async onDeleteImage(e: WechatMiniprogram.Touch) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const res = await wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      confirmText: '删除',
      confirmColor: '#ff4444'
    })

    if (res.confirm) {
      try {
        wx.showLoading({ title: '删除中...' })
        const result = await apiService.deleteFromGallery(id)
        
        if (result.code === 0) {
          this.setData({
            images: this.data.images.filter(img => img.id !== id)
          })
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } else {
          throw new Error(result.message || '删除失败')
        }
      } catch (error) {
        wx.showToast({
          title: error.message || '删除失败',
          icon: 'error'
        })
      } finally {
        wx.hideLoading()
      }
    }
  },

  // 查看图片详情
  onViewDetail(e: WechatMiniprogram.Touch) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const image = this.data.images.find(img => img.id === id)
    if (!image) return

    wx.showModal({
      title: '图片信息',
      content: `提示词：${image.prompt}\n\n参数：\n- 尺寸：${image.params.width}x${image.params.height}\n- 步数：${image.params.steps}`,
      confirmText: '关闭',
      showCancel: false
    })
  },

  // 显示分享菜单
  showShareMenu(event: any) {
    const { image } = event.currentTarget.dataset
    this.setData({
      showShareMenu: true,
      selectedImage: image
    })
  },

  // 关闭分享菜单
  closeShareMenu() {
    this.setData({
      showShareMenu: false,
      showPosterMenu: false
    })
  },

  // 显示海报模板选项
  showPosterOptions() {
    this.setData({
      showShareMenu: false,
      showPosterMenu: true
    })
  },

  // 关闭海报模板选项
  closePosterMenu() {
    this.setData({
      showPosterMenu: false
    })
  },

  // 分享给好友
  async shareToFriend() {
    const { selectedImage } = this.data
    if (!selectedImage) return

    try {
      await shareService.shareToFriend({
        url: selectedImage.url,
        prompt: selectedImage.prompt,
        params: selectedImage.params
      })
      this.closeShareMenu()
    } catch (error) {
      console.error('分享失败:', error)
    }
  },

  // 分享到朋友圈
  async shareToTimeline() {
    const { selectedImage } = this.data
    if (!selectedImage) return

    try {
      await shareService.shareToTimeline({
        url: selectedImage.url,
        prompt: selectedImage.prompt,
        params: selectedImage.params
      })
      this.closeShareMenu()
    } catch (error) {
      console.error('分享失败:', error)
    }
  },

  // 生成分享海报
  async generatePoster(event: any) {
    const { template } = event.currentTarget.dataset
    const { selectedImage } = this.data
    if (!selectedImage) return

    wx.showLoading({
      title: '生成海报中...',
      mask: true
    })

    try {
      const posterPath = await shareService.generatePoster(
        {
          url: selectedImage.url,
          prompt: selectedImage.prompt,
          params: selectedImage.params
        },
        { template }
      )

      // 预览海报
      await wx.previewImage({
        urls: [posterPath]
      })

      this.closePosterMenu()
    } catch (error) {
      console.error('生成海报失败:', error)
      wx.showToast({
        title: '生成海报失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 阻止事件冒泡
  preventDefault() {},

  onHideShareMenu() {
    this.setData({
      showShareMenu: false,
      currentShareImage: null
    })
  },

  onShowShareMenu(e: WechatMiniprogram.Touch) {
    const { index } = e.currentTarget.dataset
    const image = this.data.images[index]
    if (!image) return

    this.setData({
      showShareMenu: true,
      currentShareImage: image
    })
  },

  async onShareToFriend() {
    const { currentShareImage } = this.data
    if (!currentShareImage) return

    try {
      await shareService.shareToFriend({
        url: currentShareImage.url,
        prompt: currentShareImage.prompt,
        params: currentShareImage.params
      })
      this.onHideShareMenu()
    } catch (error) {
      wx.showToast({
        title: '分享失败',
        icon: 'error'
      })
    }
  },

  async onShareToTimeline() {
    const { currentShareImage } = this.data
    if (!currentShareImage) return

    try {
      await shareService.shareToTimeline({
        url: currentShareImage.url,
        prompt: currentShareImage.prompt,
        params: currentShareImage.params
      })
      this.onHideShareMenu()
    } catch (error) {
      wx.showToast({
        title: '分享失败',
        icon: 'error'
      })
    }
  },

  async onGeneratePoster() {
    const { currentShareImage } = this.data
    if (!currentShareImage) return

    try {
      wx.showLoading({ title: '生成中...' })
      const posterPath = await shareService.generatePoster({
        url: currentShareImage.url,
        prompt: currentShareImage.prompt,
        params: currentShareImage.params
      })

      // 预览海报
      wx.previewImage({
        urls: [posterPath],
        current: posterPath
      })

      this.onHideShareMenu()
    } catch (error) {
      wx.showToast({
        title: '生成失败',
        icon: 'error'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 更新收藏状态
  async updateFavoriteStatus() {
    const { images } = this.data
    const updatedImages = await Promise.all(
      images.map(async image => ({
        ...image,
        isFavorite: await favoriteService.isFavorite(image.id)
      }))
    )
    this.setData({ images: updatedImages })
  },

  // 切换收藏状态
  async toggleFavorite(event: any) {
    const { index } = event.currentTarget.dataset
    const image = this.data.images[index]
    
    try {
      const isFavorite = await favoriteService.isFavorite(image.id)
      let success: boolean

      if (isFavorite) {
        success = await favoriteService.removeFavorite(image.id)
        if (success) {
          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          })
        }
      } else {
        success = await favoriteService.addFavorite({
          id: image.id,
          url: image.url,
          prompt: image.prompt,
          params: image.params
        })
        if (success) {
          wx.showToast({
            title: '已收藏',
            icon: 'success'
          })
        }
      }

      if (success) {
        // 更新当前图片的收藏状态
        const updatedImages = [...this.data.images]
        updatedImages[index] = {
          ...image,
          isFavorite: !isFavorite
        }
        this.setData({ images: updatedImages })
      }
    } catch (error) {
      console.error('操作收藏失败:', error)
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  }
})
