// request.ts
const BASE_URL = 'http://localhost:3000/api'; // 替换为你的实际API地址

class Request {
  private static instance: Request;
  
  private constructor() {}
  
  public static getInstance(): Request {
    if (!Request.instance) {
      Request.instance = new Request();
    }
    return Request.instance;
  }

  async request<T>(options: {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    header?: object;
  }): Promise<ApiResponse<T>> {
    const { url, method = 'GET', data, header = {} } = options;
    
    try {
      const res = await wx.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: {
          'content-type': 'application/json',
          ...header,
        },
      });
      
      return res.data as ApiResponse<T>;
    } catch (error) {
      console.error('请求失败:', error);
      throw error;
    }
  }

  // GET 请求
  get<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request({ url, method: 'GET', data });
  }

  // POST 请求
  post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request({ url, method: 'POST', data });
  }
}

export const request = Request.getInstance();
