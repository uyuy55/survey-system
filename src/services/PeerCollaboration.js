import Peer from 'peerjs';

class PeerCollaboration {
  constructor() {
    this.peer = null;
    this.connections = new Map();
    this.userId = this.getUserId();
    this.roomId = null;
    
    this.onSurveyUpdate = null;
    this.onUsersUpdate = null;
    this.onQuestionLock = null;
    this.onConnectionStatus = null;
  }

  getUserId() {
    let userId = localStorage.getItem('peer_userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('peer_userId', userId);
    }
    return userId;
  }

  getUserName() {
    return localStorage.getItem('userName') || `用户${this.userId.slice(-4)}`;
  }

  async joinRoom(surveyId) {
    this.roomId = surveyId;
    
    try {
      this.peer = new Peer(`${surveyId}_${this.userId}`, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        debug: 2
      });

      return new Promise((resolve, reject) => {
        this.peer.on('open', (id) => {
          console.log('P2P连接成功:', id);
          if (this.onConnectionStatus) {
            this.onConnectionStatus(true, this.getOnlineUsers().length);
          }
          resolve(id);
        });

        this.peer.on('error', (error) => {
          console.error('PeerJS错误:', error);
          if (this.onConnectionStatus) {
            this.onConnectionStatus(false, 0);
          }
          reject(error);
        });

        this.peer.on('connection', (conn) => {
          this.handleNewConnection(conn);
        });

        // 模拟连接其他用户
        setTimeout(() => {
          this.connectToRoomUsers(surveyId);
        }, 1000);
      });

    } catch (error) {
      console.error('加入房间失败:', error);
      throw error;
    }
  }

  connectToRoomUsers(surveyId) {
    // 这里可以添加已知用户的连接逻辑
    // 目前先保持简单，等待其他用户连接
  }

  handleNewConnection(conn) {
    this.setupConnection(conn);
  }

  setupConnection(conn) {
    this.connections.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.handleIncomingData(data, conn);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.notifyUsersUpdate();
    });

    conn.on('error', (error) => {
      this.connections.delete(conn.peer);
      this.notifyUsersUpdate();
    });

    this.notifyUsersUpdate();
  }

  handleIncomingData(data, conn) {
    switch (data.type) {
      case 'user_join':
        this.notifyUsersUpdate();
        break;

      case 'survey_update':
        if (this.onSurveyUpdate && data.surveyData) {
          this.onSurveyUpdate(data.surveyData, data.userId);
        }
        break;

      case 'question_lock':
        if (this.onQuestionLock) {
          this.onQuestionLock(data.questionId, data.userId, data.userName, true);
        }
        break;

      case 'question_unlock':
        if (this.onQuestionLock) {
          this.onQuestionLock(data.questionId, data.userId, null, false);
        }
        break;
    }
  }

  broadcast(message) {
    if (this.connections.size === 0) return;

    this.connections.forEach((conn, peerId) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (error) {
          console.error('发送消息失败:', error);
        }
      }
    });
  }

  updateSurvey(surveyData) {
    this.broadcast({
      type: 'survey_update',
      surveyData: surveyData,
      userId: this.userId,
      userName: this.getUserName(),
      timestamp: Date.now()
    });
  }

  lockQuestion(questionId) {
    this.broadcast({
      type: 'question_lock',
      questionId: questionId,
      userId: this.userId,
      userName: this.getUserName(),
      timestamp: Date.now()
    });
  }

  unlockQuestion(questionId) {
    this.broadcast({
      type: 'question_unlock',
      questionId: questionId,
      userId: this.userId
    });
  }

  getOnlineUsers() {
    const users = [{
      id: this.userId,
      name: this.getUserName(),
      isCurrentUser: true
    }];

    this.connections.forEach((conn, peerId) => {
      users.push({
        id: peerId,
        name: `用户${peerId.slice(-4)}`,
        isCurrentUser: false
      });
    });

    return users;
  }

  notifyUsersUpdate() {
    if (this.onUsersUpdate) {
      this.onUsersUpdate(this.getOnlineUsers());
    }
    
    if (this.onConnectionStatus) {
      this.onConnectionStatus(true, this.getOnlineUsers().length);
    }
  }

  leaveRoom() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connections.clear();
    
    if (this.onConnectionStatus) {
      this.onConnectionStatus(false, 0);
    }
  }

  setCallbacks(callbacks) {
    if (callbacks.onSurveyUpdate) this.onSurveyUpdate = callbacks.onSurveyUpdate;
    if (callbacks.onUsersUpdate) this.onUsersUpdate = callbacks.onUsersUpdate;
    if (callbacks.onQuestionLock) this.onQuestionLock = callbacks.onQuestionLock;
    if (callbacks.onConnectionStatus) this.onConnectionStatus = callbacks.onConnectionStatus;
  }
}

const collaborationService = new PeerCollaboration();
export default collaborationService;