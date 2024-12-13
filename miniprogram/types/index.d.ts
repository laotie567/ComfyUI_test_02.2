// 全局类型定义

// 应用配置类型
interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo;
    systemInfo?: WechatMiniprogram.SystemInfo;
    settings?: AppSettings;
  };
}

// API 响应类型
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 绘画参数类型
interface DrawingParams {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  model?: string;
  sampler?: string;
}

// 画廊图片类型
interface GalleryImage {
  id: string;
  url: string;
  prompt: string;
  params?: DrawingParams;
  createTime: string;
}

// 应用设置类型
interface AppSettings {
  apiUrl: string;
  apiKey: string;
  defaultSize: string;
  defaultSteps: number;
  defaultModel?: string;
  defaultSampler?: string;
}
