// components/FileUploader.js - 文件上传组件
import React, { useState, useRef } from 'react';
import { fileUploadService } from '../utils/fileUploadService';
import './FileUploader.css';

const FileUploader = ({ question, value, onChange, disabled }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // 获取接受的文件类型
  const getAcceptTypes = () => {
    switch (question.fileType) {
      case 'image':
        return 'image/*';
      case 'document':
        return '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
      default:
        return '*';
    }
  };

  // 获取最大文件大小
  const getMaxSize = () => (question.maxSize || 5) * 1024 * 1024;

  // 验证文件
  const validateFile = (file) => {
    const maxSize = getMaxSize();
    
    if (file.size > maxSize) {
      throw new Error(`文件大小不能超过${question.maxSize || 5}MB`);
    }

    if (question.fileType === 'image' && !file.type.startsWith('image/')) {
      throw new Error('请上传图片文件');
    }

    if (question.fileType === 'document') {
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error('请上传文档文件（PDF、Word、Excel、PPT等）');
      }
    }

    return true;
  };

  // 处理文件选择
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      // 验证文件
      validateFile(file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 上传文件
      const fileInfo = await fileUploadService.uploadFile(file, question.id);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // 更新答案
      onChange(fileInfo);
      
      // 重置进度
      setTimeout(() => setUploadProgress(0), 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除文件
  const handleDeleteFile = async () => {
    if (!value || !value.id) return;

    try {
      await fileUploadService.deleteFile(value.id);
      onChange(null);
    } catch (err) {
      setError('删除文件失败');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件图标
  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    return '📎';
  };

  return (
    <div className="file-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileSelect}
        disabled={uploading || disabled || value}
        style={{ display: 'none' }}
      />

      {!value ? (
        <div className="upload-area">
          <button
            type="button"
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || disabled}
          >
            {uploading ? `上传中... ${uploadProgress}%` : '选择文件'}
          </button>
          
          <div className="upload-hint">
            {question.fileType === 'image' && '支持所有图片格式'}
            {question.fileType === 'document' && '支持 PDF、Word、Excel、PPT 等文档'}
            {question.fileType === 'all' && '支持所有文件类型'}
            {`，最大 ${question.maxSize || 5}MB`}
          </div>

          {uploading && (
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      ) : (
        <div className="file-preview">
          <div className="file-info">
            <span className="file-icon">
              {getFileIcon(value.type)}
            </span>
            <div className="file-details">
              <div className="file-name">{value.name}</div>
              <div className="file-size">{formatFileSize(value.size)}</div>
            </div>
          </div>
          <div className="file-actions">
            {value.url && (
              <a 
                href={value.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="preview-link"
              >
                预览
              </a>
            )}
            <button
              type="button"
              className="delete-button"
              onClick={handleDeleteFile}
              disabled={disabled}
            >
              删除
            </button>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FileUploader;