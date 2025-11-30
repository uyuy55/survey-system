// utils/fileUploadService.js - 文件上传模拟服务
class FileUploadService {
  constructor() {
    this.uploadedFiles = new Map(); // 模拟文件存储
  }

  // 模拟文件上传
  async uploadFile(file, questionId) {
    return new Promise((resolve, reject) => {
      // 模拟上传延迟
      setTimeout(() => {
        // 检查文件大小
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          reject(new Error(`文件大小不能超过50MB`));
          return;
        }

        // 生成文件ID和URL
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileUrl = URL.createObjectURL(file);
        
        // 存储文件信息
        const fileInfo = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl,
          questionId,
          uploadTime: new Date().toISOString()
        };

        this.uploadedFiles.set(fileId, fileInfo);
        
        resolve(fileInfo);
      }, 1000 + Math.random() * 2000); // 1-3秒随机延迟
    });
  }

  // 模拟文件删除
  async deleteFile(fileId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileInfo = this.uploadedFiles.get(fileId);
        if (fileInfo && fileInfo.url) {
          URL.revokeObjectURL(fileInfo.url);
        }
        this.uploadedFiles.delete(fileId);
        resolve(true);
      }, 500);
    });
  }

  // 获取文件信息
  async getFile(fileId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.uploadedFiles.get(fileId) || null);
      }, 100);
    });
  }

  // 清理所有文件（用于重置问卷时）
  clearAllFiles() {
    this.uploadedFiles.forEach(fileInfo => {
      if (fileInfo.url) {
        URL.revokeObjectURL(fileInfo.url);
      }
    });
    this.uploadedFiles.clear();
  }
}

// 创建单例实例
export const fileUploadService = new FileUploadService();