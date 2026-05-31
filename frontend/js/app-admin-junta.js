document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('userRol');
    
    if (!token) {
        window.location.href = '/';
        return;
    }
    
    if (userRol !== 'admin_junta') {
        window.location.href = '/';
        return;
    }
    
    if (document.getElementById('actualizarPerfilForm')) {
        document.getElementById('actualizarPerfilForm').addEventListener('submit', actualizarPerfilAdmin);
    }
    
    mostrarPagina('estadisticas');
});