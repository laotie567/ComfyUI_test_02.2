import { posterService } from './poster'

interface ShareImageParams {
  url: string
  prompt: string
  params?: {
    width: number
    height: number
    steps: number
  }
}

interface GeneratePosterOptions {
  template?: 'minimal' | 'artistic' | 'modern'
  showQRCode?: boolean
}

class ShareService {
  // 分享到朋友圈
  async shareToTimeline(params: ShareImageParams): Promise<void> {
    try {
      // 下载图片到本地
      const tempFilePath = await this.downloadImage(params.url)
      
      // 保存图片到相册
      await wx.saveImageToPhotosAlbum({
        filePath: tempFilePath
      })

      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      })
    } catch (error) {
      if (error.errMsg.includes('auth deny')) {
        await this.requestSaveImageAuth()
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        })
      }
    }
  }

  // 分享给好友
  async shareToFriend(params: ShareImageParams): Promise<void> {
    try {
      // 下载图片到本地
      const tempFilePath = await this.downloadImage(params.url)
      
      // 调用分享接口
      wx.shareAppMessage({
        title: params.prompt || 'AI生成的艺术作品',
        imageUrl: tempFilePath,
        path: `/pages/index/index?shared=true`
      })
    } catch (error) {
      wx.showToast({
        title: '分享失败',
        icon: 'error'
      })
    }
  }

  // 生成分享海报
  async generatePoster(
    params: ShareImageParams,
    options: GeneratePosterOptions = {}
  ): Promise<string> {
    try {
      // 使用海报服务生成海报
      const posterPath = await posterService.generatePoster(
        params,
        options.template || 'minimal'
      )

      return posterPath
    } catch (error) {
      console.error('生成海报失败:', error)
      throw error
    }
  }

  // 下载图片
  private async downloadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url,
        success: res => {
          if (res.statusCode === 200) {
            resolve(res.tempFilePath)
          } else {
            reject(new Error('下载图片失败'))
          }
        },
        fail: reject
      })
    })
  }

  // 请求保存图片权限
  private async requestSaveImageAuth(): Promise<void> {
    try {
      const res = await wx.showModal({
        title: '提示',
        content: '需要您授权保存图片到相册',
        confirmText: '去授权'
      })

      if (res.confirm) {
        await wx.openSetting()
      }
    } catch (error) {
      console.error('请求授权失败:', error)
    }
  }
}

export const shareService = new ShareService()
