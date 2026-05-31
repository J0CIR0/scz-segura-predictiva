function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    if (!msgDiv) return;
    msgDiv.textContent = text;
    msgDiv.className = 'message ' + type;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 5000);
}


function mostrarPagina(paginaId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(`pagina-${paginaId}`);
    if (targetPage) targetPage.classList.add('active');
    
    if (paginaId === 'mapa') {
        setTimeout(() => {
            if (mapaLeaflet) {
                mapaLeaflet.invalidateSize();
                cargarHeatMap();
            } else {
                inicializarMapa();
            }
            cargarIncidentesPreview();
        }, 100);
    }
    
    if (paginaId === 'incidentes') {
        cargarTodosIncidentes();
    }
}

async function actualizarPerfilUsuario(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('No has iniciado sesion', 'error');
        return;
    }
    
    const data = {};
    const telefono = document.getElementById('perfil_telefono');
    const telefonoEmergencia = document.getElementById('perfil_telefono_emergencia');
    
    if (telefono && telefono.value) data.telefono = telefono.value;
    if (telefonoEmergencia && telefonoEmergencia.value) data.telefono_emergencia = telefonoEmergencia.value;
    
    try {
        const response = await fetch('/api/perfil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al actualizar perfil', 'error');
    }
}