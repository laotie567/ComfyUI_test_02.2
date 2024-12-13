interface PosterConfig {
  width: number
  height: number
  background: string
  padding: number
  borderRadius: number
  title: {
    text: string
    fontSize: number
    color: string
    marginBottom: number
  }
  image: {
    width: number
    height: number
    borderRadius: number
    marginBottom: number
  }
  prompt: {
    fontSize: number
    color: string
    lineHeight: number
    marginBottom: number
  }
  params: {
    fontSize: number
    color: string
    marginBottom: number
  }
  qrcode: {
    size: number
    marginTop: number
  }
  watermark: {
    text: string
    fontSize: number
    color: string
    marginTop: number
  }
}

// 海报模板
const POSTER_TEMPLATES = {
  // 简约模板
  minimal: {
    width: 600,
    height: 1000,
    background: '#ffffff',
    padding: 40,
    borderRadius: 20,
    title: {
      text: 'AI绘画作品',
      fontSize: 36,
      color: '#333333',
      marginBottom: 30
    },
    image: {
      width: 520,
      height: 520,
      borderRadius: 12,
      marginBottom: 30
    },
    prompt: {
      fontSize: 28,
      color: '#333333',
      lineHeight: 1.6,
      marginBottom: 20
    },
    params: {
      fontSize: 24,
      color: '#666666',
      marginBottom: 40
    },
    qrcode: {
      size: 120,
      marginTop: 30
    },
    watermark: {
      text: '长按识别小程序码，创作你的AI艺术',
      fontSize: 24,
      color: '#999999',
      marginTop: 20
    }
  },
  // 艺术模板
  artistic: {
    width: 600,
    height: 1000,
    background: '#f8f8f8',
    padding: 40,
    borderRadius: 20,
    title: {
      text: '艺术创作',
      fontSize: 40,
      color: '#222222',
      marginBottom: 40
    },
    image: {
      width: 520,
      height: 520,
      borderRadius: 20,
      marginBottom: 40
    },
    prompt: {
      fontSize: 30,
      color: '#333333',
      lineHeight: 1.8,
      marginBottom: 30
    },
    params: {
      fontSize: 26,
      color: '#666666',
      marginBottom: 50
    },
    qrcode: {
      size: 140,
      marginTop: 40
    },
    watermark: {
      text: '探索AI艺术的无限可能',
      fontSize: 26,
      color: '#888888',
      marginTop: 25
    }
  },
  // 现代模板
  modern: {
    width: 600,
    height: 1000,
    background: 'linear-gradient(135deg, #f6f6f6 0%, #ffffff 100%)',
    padding: 40,
    borderRadius: 30,
    title: {
      text: 'AI艺术馆',
      fontSize: 38,
      color: '#1a1a1a',
      marginBottom: 35
    },
    image: {
      width: 520,
      height: 520,
      borderRadius: 16,
      marginBottom: 35
    },
    prompt: {
      fontSize: 29,
      color: '#2a2a2a',
      lineHeight: 1.7,
      marginBottom: 25
    },
    params: {
      fontSize: 25,
      color: '#555555',
      marginBottom: 45
    },
    qrcode: {
      size: 130,
      marginTop: 35
    },
    watermark: {
      text: '打开小程序，创作你的专属艺术品',
      fontSize: 25,
      color: '#777777',
      marginTop: 22
    }
  }
}

class PosterService {
  private canvas: any
  private ctx: any
  private pixelRatio: number

  constructor() {
    this.pixelRatio = wx.getSystemInfoSync().pixelRatio || 2
  }

  // 生成海报
  async generatePoster(
    params: ShareImageParams,
    template: keyof typeof POSTER_TEMPLATES = 'minimal'
  ): Promise<string> {
    const config = POSTER_TEMPLATES[template]
    
    try {
      // 创建离屏画布
      this.canvas = wx.createOffscreenCanvas({
        type: '2d',
        width: config.width * this.pixelRatio,
        height: config.height * this.pixelRatio
      })
      this.ctx = this.canvas.getContext('2d')
      this.ctx.scale(this.pixelRatio, this.pixelRatio)

      // 绘制背景
      await this.drawBackground(config)

      // 绘制标题
      await this.drawTitle(config)

      // 绘制图片
      await this.drawImage(params.url, config)

      // 绘制提示词
      await this.drawPrompt(params.prompt, config)

      // 绘制参数信息
      if (params.params) {
        await this.drawParams(params.params, config)
      }

      // 绘制小程序码
      await this.drawQRCode(config)

      // 绘制水印
      await this.drawWatermark(config)

      // 导出图片
      return await this.exportImage()
    } catch (error) {
      console.error('生成海报失败:', error)
      throw error
    }
  }

  // 绘制背景
  private async drawBackground(config: PosterConfig): Promise<void> {
    this.ctx.fillStyle = config.background
    this.roundRect(
      0,
      0,
      config.width,
      config.height,
      config.borderRadius
    )
    this.ctx.fill()
  }

  // 绘制标题
  private async drawTitle(config: PosterConfig): Promise<void> {
    const { title } = config
    this.ctx.font = `bold ${title.fontSize}px sans-serif`
    this.ctx.fillStyle = title.color
    this.ctx.textAlign = 'center'
    this.ctx.fillText(
      title.text,
      config.width / 2,
      config.padding + title.fontSize
    )
  }

  // 绘制图片
  private async drawImage(url: string, config: PosterConfig): Promise<void> {
    const { image, padding } = config
    const imageY = padding + config.title.fontSize + config.title.marginBottom

    // 创建图片对象
    const img = this.canvas.createImage()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    // 绘制圆角矩形裁剪区域
    this.ctx.save()
    this.roundRect(
      (config.width - image.width) / 2,
      imageY,
      image.width,
      image.height,
      image.borderRadius
    )
    this.ctx.clip()

    // 绘制图片
    this.ctx.drawImage(
      img,
      (config.width - image.width) / 2,
      imageY,
      image.width,
      image.height
    )
    this.ctx.restore()
  }

  // 绘制提示词
  private async drawPrompt(prompt: string, config: PosterConfig): Promise<void> {
    const { prompt: promptConfig, padding, image } = config
    const promptY = padding + config.title.fontSize + config.title.marginBottom +
      image.height + image.marginBottom

    this.ctx.font = `${promptConfig.fontSize}px sans-serif`
    this.ctx.fillStyle = promptConfig.color
    this.ctx.textAlign = 'left'

    const maxWidth = config.width - padding * 2
    const lines = this.wrapText(prompt, maxWidth, promptConfig.fontSize)

    lines.forEach((line, index) => {
      this.ctx.fillText(
        line,
        padding,
        promptY + index * promptConfig.lineHeight * promptConfig.fontSize
      )
    })
  }

  // 绘制参数信息
  private async drawParams(
    params: { width: number; height: number; steps: number },
    config: PosterConfig
  ): Promise<void> {
    const { params: paramsConfig, padding } = config
    const paramsY = config.height - padding - paramsConfig.marginBottom -
      config.qrcode.size - config.qrcode.marginTop

    this.ctx.font = `${paramsConfig.fontSize}px sans-serif`
    this.ctx.fillStyle = paramsConfig.color
    this.ctx.textAlign = 'left'

    const text = `尺寸: ${params.width}x${params.height}  步数: ${params.steps}`
    this.ctx.fillText(text, padding, paramsY)
  }

  // 绘制小程序码
  private async drawQRCode(config: PosterConfig): Promise<void> {
    const { qrcode, padding } = config
    const qrcodeY = config.height - padding - qrcode.size

    // 获取小程序码（这里使用示例图片）
    const qr = this.canvas.createImage()
    await new Promise((resolve, reject) => {
      qr.onload = resolve
      qr.onerror = reject
      qr.src = '/assets/images/qrcode.png'
    })

    this.ctx.drawImage(
      qr,
      (config.width - qrcode.size) / 2,
      qrcodeY,
      qrcode.size,
      qrcode.size
    )
  }

  // 绘制水印
  private async drawWatermark(config: PosterConfig): Promise<void> {
    const { watermark } = config
    const watermarkY = config.height - config.padding + watermark.marginTop

    this.ctx.font = `${watermark.fontSize}px sans-serif`
    this.ctx.fillStyle = watermark.color
    this.ctx.textAlign = 'center'
    this.ctx.fillText(watermark.text, config.width / 2, watermarkY)
  }

  // 导出图片
  private async exportImage(): Promise<string> {
    return await new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas: this.canvas,
        success: res => resolve(res.tempFilePath),
        fail: reject
      })
    })
  }

  // 绘制圆角矩形
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.arcTo(x + width, y, x + width, y + radius, radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.arcTo(x, y + height, x, y + height - radius, radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.arcTo(x, y, x + radius, y, radius)
    this.ctx.closePath()
  }

  // 文本自动换行
  private wrapText(
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] {
    const lines: string[] = []
    let line = ''
    
    this.ctx.font = `${fontSize}px sans-serif`
    const words = text.split('')

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n]
      const metrics = this.ctx.measureText(testLine)
      const testWidth = metrics.width

      if (testWidth > maxWidth && n > 0) {
        lines.push(line)
        line = words[n]
      } else {
        line = testLine
      }
    }
    lines.push(line)

    return lines
  }
}

export const posterService = new PosterService()
