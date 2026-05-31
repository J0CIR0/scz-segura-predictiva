document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('userRol');
    
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    if (userRol !== 'policia') {
        window.location.href = '/';
        return;
    }
    
    if (document.getElementById('actualizarPerfilForm')) {
        document.getElementById('actualizarPerfilForm').addEventListener('submit', actualizarPerfilPolicia);
    }
    
    mostrarPagina('asignados');
});