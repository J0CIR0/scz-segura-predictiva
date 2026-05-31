let ws = null;
let wsReconnectInterval = null;

function connectWebSocket() {
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${token}`;
    
    if (ws) {
        ws.close();
    }
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('WebSocket conectado');
        if (wsReconnectInterval) {
            clearInterval(wsReconnectInterval);
            wsReconnectInterval = null;
        }
    };
    
    ws.onmessage = function(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'session_expired') {
                showMessage(data.data.message || 'Tu sesion fue cerrada porque iniciaste sesion en otro dispositivo', 'error');
                localStorage.removeItem('token');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRol');
                actualizarUIporSesion();
                mostrarPagina('login');
            }
        } catch (e) {
            console.error('Error procesando mensaje WebSocket:', e);
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = function() {
        console.log('WebSocket desconectado');
        if (!wsReconnectInterval) {
            wsReconnectInterval = setInterval(function() {
                if (localStorage.getItem('token')) {
                    connectWebSocket();
                }
            }, 5000);
        }
    };
}

function disconnectWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
    }
    if (wsReconnectInterval) {
        clearInterval(wsReconnectInterval);
        wsReconnectInterval = null;
    }
}