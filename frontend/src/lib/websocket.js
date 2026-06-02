class WebSocketManager {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 2000; // start at 2s
  }

  connect() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn("WebSocket connect aborted: No access token found.");
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Using relative URL proxy in development (handled by vite.config.js proxy rules)
    const wsUrl = `${protocol}//${window.location.host}/ws/realtime/?token=${token}`;

    console.log("Connecting to WebSocket...", wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established successfully!");
      this.reconnectAttempts = 0;
      this.reconnectInterval = 2000;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    this.socket.onclose = (event) => {
      console.warn(`WebSocket closed. Code: ${event.code}. Reason: ${event.reason}`);
      this.socket = null;
      
      // Do not reconnect on deliberate forbidden closures (e.g. invalid credentials)
      if (event.code === 4003) {
        console.error("WebSocket authorization failed. Not reconnecting.");
        return;
      }
      
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("WebSocket: Max reconnection attempts reached.");
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting WebSocket in ${this.reconnectInterval}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
      // Exponential backoff
      this.reconnectInterval *= 2;
    }, this.reconnectInterval);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      console.log("WebSocket disconnected manually.");
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const wsManager = new WebSocketManager();
