document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('registroForm')) {
        document.getElementById('registroForm').addEventListener('submit', registrarUsuario);
    }
    
    if (document.getElementById('verificarForm')) {
        document.getElementById('verificarForm').addEventListener('submit', verificarCodigo);
    }
    
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', loginUsuario);
    }
});