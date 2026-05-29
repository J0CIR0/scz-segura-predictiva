let mapaLeaflet;
let marcadorLeaflet;
let heatLayer;

function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
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
    document.getElementById(`pagina-${paginaId}`).classList.add('active');
    
    if (paginaId === 'mapa') {
        setTimeout(() => {
            if (mapaLeaflet) {
                mapaLeaflet.invalidateSize();
            } else {
                inicializarMapa();
            }
            cargarIncidentesPreview();
        }, 100);
    }
    
    if (paginaId === 'incidentes') {
        cargarTodosIncidentes();
    }
    
    if (paginaId === 'mis-reportes') {
        cargarMisIncidentes();
    }
}

function actualizarUIporSesion() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    
    if (token) {
        document.getElementById('auth-nav').style.display = 'flex';
        document.getElementById('public-nav').style.display = 'none';
        if (userName) {
            document.getElementById('user-name').textContent = userName;
        }
    } else {
        document.getElementById('auth-nav').style.display = 'none';
        document.getElementById('public-nav').style.display = 'flex';
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    actualizarUIporSesion();
    mostrarPagina('mapa');
    showMessage('Sesión cerrada', 'success');
}

function cerrarModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}

function mostrarDetalleIncidente(incidente) {
    const modal = document.getElementById('modal-detalle');
    const contenido = document.getElementById('modal-contenido');
    
    let imagenesHtml = '';
    if (incidente.imagenes && incidente.imagenes.length > 0) {
        if (Array.isArray(incidente.imagenes)) {
            incidente.imagenes.forEach(img => {
                imagenesHtml += `<img src="${img}" style="width:100%;margin-bottom:10px;border-radius:5px;">`;
            });
        } else if (typeof incidente.imagenes === 'string') {
            imagenesHtml = `<img src="${incidente.imagenes}" style="width:100%;border-radius:5px;">`;
        }
    }
    
    contenido.innerHTML = `
        <h3>${incidente.tipo_delito.toUpperCase()}</h3>
        <p><strong>Descripción:</strong> ${incidente.descripcion}</p>
        <p><strong>Dirección:</strong> ${incidente.direccion}</p>
        <p><strong>Coordenadas:</strong> ${incidente.latitud}, ${incidente.longitud}</p>
        <p><strong>Reportado por:</strong> ${incidente.vecino_nombre || 'Vecino'} ${incidente.vecino_apellido || ''}</p>
        <p><strong>Estado:</strong> ${incidente.estado}</p>
        <p><strong>Fecha:</strong> ${new Date(incidente.creado_en).toLocaleString()}</p>
        ${imagenesHtml}
    `;
    
    modal.style.display = 'flex';
}