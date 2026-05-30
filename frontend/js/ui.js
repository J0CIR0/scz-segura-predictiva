let mapaLeaflet = null;
let marcadorLeaflet = null;
let heatLayer = null;
let currentUserRol = null;

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
    
    if (paginaId === 'mis-reportes') {
        cargarMisIncidentes();
    }
    
    if (paginaId === 'admin') {
        cargarAdminPanel();
    }
    
    if (paginaId === 'policia') {
        cargarPanelPolicia();
    }
}

function actualizarUIporSesion() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName');
    const userRol = localStorage.getItem('userRol');
    
    currentUserRol = userRol;
    
    if (token) {
        document.getElementById('auth-nav').style.display = 'flex';
        document.getElementById('public-nav').style.display = 'none';
        if (userName) {
            document.getElementById('user-name').textContent = userName;
        }
        if (userRol) {
            const rolSpan = document.getElementById('user-rol');
            if (rolSpan) {
                let rolTexto = '';
                switch(userRol) {
                    case 'vecino': rolTexto = 'Vecino'; break;
                    case 'admin_junta': rolTexto = 'Admin Junta'; break;
                    case 'policia': rolTexto = 'Policía'; break;
                    case 'superadmin': rolTexto = 'Super Admin'; break;
                }
                rolSpan.textContent = `(${rolTexto})`;
            }
        }
        
        const btnAdmin = document.getElementById('btn-admin');
        const btnPolicia = document.getElementById('btn-policia');
        
        if (btnAdmin) {
            if (userRol === 'admin_junta') {
                btnAdmin.style.display = 'block';
            } else {
                btnAdmin.style.display = 'none';
            }
        }
        
        if (btnPolicia) {
            if (userRol === 'policia') {
                btnPolicia.style.display = 'block';
            } else {
                btnPolicia.style.display = 'none';
            }
        }
    } else {
        document.getElementById('auth-nav').style.display = 'none';
        document.getElementById('public-nav').style.display = 'flex';
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRol');
    currentUserRol = null;
    actualizarUIporSesion();
    mostrarPagina('mapa');
    showMessage('Sesion cerrada', 'success');
}

function cerrarModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}

function mostrarDetalleIncidente(incidente) {
    const modal = document.getElementById('modal-detalle');
    const contenido = document.getElementById('modal-contenido');
    
    let imagenesHtml = '';
    if (incidente.imagenes) {
        if (Array.isArray(incidente.imagenes) && incidente.imagenes.length > 0) {
            incidente.imagenes.forEach(img => {
                imagenesHtml += `<img src="${img}" style="width:100%;margin-bottom:10px;border-radius:5px;">`;
            });
        } else if (typeof incidente.imagenes === 'string' && incidente.imagenes.length > 0) {
            imagenesHtml = `<img src="${incidente.imagenes}" style="width:100%;border-radius:5px;">`;
        }
    }
    
    const fecha = new Date(incidente.creado_en).toLocaleString();
    
    let accionesHtml = '';
    if (currentUserRol === 'admin_junta' || currentUserRol === 'superadmin') {
        if (incidente.estado === 'pendiente') {
            accionesHtml = `
                <div style="margin-top:15px;display:flex;gap:10px;">
                    <button onclick="validarIncidente(${incidente.id}, true)" style="background-color:#28a745;">Validar</button>
                    <button onclick="validarIncidente(${incidente.id}, false)" style="background-color:#dc3545;">Rechazar</button>
                </div>
            `;
        }
    }
    
    contenido.innerHTML = `
        <h3>${incidente.tipo_delito.toUpperCase()}</h3>
        <p><strong>Descripción:</strong> ${incidente.descripcion}</p>
        <p><strong>Dirección:</strong> ${incidente.direccion}</p>
        <p><strong>Coordenadas:</strong> ${incidente.latitud}, ${incidente.longitud}</p>
        <p><strong>Reportado por:</strong> ${incidente.vecino_nombre || 'Vecino'} ${incidente.vecino_apellido || ''}</p>
        <p><strong>Estado:</strong> ${incidente.estado}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        ${imagenesHtml}
        ${accionesHtml}
    `;
    
    modal.style.display = 'flex';
}

async function validarIncidente(incidenteId, esValido) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/admin/incidentes/${incidenteId}/validar?es_valido=${esValido}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModal();
            cargarAdminPanel();
            cargarIncidentesPreview();
            cargarTodosIncidentes();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al validar incidente', 'error');
    }
}

async function cargarAdminPanel() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('userRol');
    
    if (userRol !== 'admin_junta' && userRol !== 'superadmin') {
        showMessage('No tienes permisos de administrador', 'error');
        mostrarPagina('mapa');
        return;
    }
    
    try {
        const statsResponse = await fetch('/api/admin/estadisticas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsResponse.json();
        
        const statsHtml = `
            <div class="admin-stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px;">
                <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;">
                    <h3>Total Incidentes</h3>
                    <p style="font-size:36px;color:#004d00;">${statsData.incidentes.total_incidentes}</p>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;">
                    <h3>Pendientes</h3>
                    <p style="font-size:36px;color:#ff8c00;">${statsData.incidentes.pendientes}</p>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;">
                    <h3>Validados</h3>
                    <p style="font-size:36px;color:#28a745;">${statsData.incidentes.validados}</p>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;">
                    <h3>Rechazados</h3>
                    <p style="font-size:36px;color:#dc3545;">${statsData.incidentes.rechazados}</p>
                </div>
                <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;">
                    <h3>Usuarios</h3>
                    <p style="font-size:36px;color:#004d00;">${statsData.usuarios.total_usuarios}</p>
                </div>
            </div>
        `;
        document.getElementById('admin-stats').innerHTML = statsHtml;
        
        const incidentesResponse = await fetch('/api/admin/incidentes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const incidentesData = await incidentesResponse.json();
        
        const incidentesLista = document.getElementById('admin-incidentes-lista');
        incidentesLista.innerHTML = '';
        
        incidentesData.incidentes.forEach(inc => {
            let estadoColor = '';
            switch(inc.estado) {
                case 'pendiente': estadoColor = '#ff8c00'; break;
                case 'validado': estadoColor = '#28a745'; break;
                case 'rechazado': estadoColor = '#dc3545'; break;
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = () => mostrarDetalleIncidente(inc);
            card.innerHTML = `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">Reportado por: ${inc.vecino_nombre}</div>
                <div class="incidente-fecha">Estado: <span style="color:${estadoColor}">${inc.estado}</span></div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
            `;
            incidentesLista.appendChild(card);
        });
        
        if (userRol === 'superadmin') {
            const usuariosResponse = await fetch('/api/admin/usuarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const usuariosData = await usuariosResponse.json();
            
            const usuariosLista = document.getElementById('admin-usuarios-lista');
            usuariosLista.innerHTML = '<div class="incidentes-lista"></div>';
            const usuariosContainer = usuariosLista.querySelector('.incidentes-lista');
            
            usuariosData.usuarios.forEach(usr => {
                const card = document.createElement('div');
                card.className = 'incidente-card';
                card.innerHTML = `
                    <div class="incidente-titulo">${usr.nombre} ${usr.apellido}</div>
                    <div class="incidente-descripcion">Email: ${usr.email}</div>
                    <div class="incidente-descripcion">CI: ${usr.ci}</div>
                    <div class="incidente-descripcion">
                        Rol: 
                        <select onchange="cambiarRolUsuario(${usr.id}, this.value)" ${usr.id === parseInt(localStorage.getItem('userId')) ? 'disabled' : ''}>
                            <option value="vecino" ${usr.rol === 'vecino' ? 'selected' : ''}>Vecino</option>
                            <option value="admin_junta" ${usr.rol === 'admin_junta' ? 'selected' : ''}>Admin Junta</option>
                            <option value="policia" ${usr.rol === 'policia' ? 'selected' : ''}>Policía</option>
                            <option value="superadmin" ${usr.rol === 'superadmin' ? 'selected' : ''}>Super Admin</option>
                        </select>
                    </div>
                    <div class="incidente-fecha">Verificado: ${usr.esta_verificado ? 'Si' : 'No'}</div>
                `;
                usuariosContainer.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error cargando admin panel:', error);
        showMessage('Error al cargar panel de administracion', 'error');
    }
}

async function cambiarRolUsuario(usuarioId, nuevoRol) {

    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/admin/usuarios/${usuarioId}/rol?nuevo_rol=${nuevoRol}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cargarAdminPanel();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al cambiar rol', 'error');
    }
}
async function cargarPanelPolicia() {
    const token = localStorage.getItem('token');
    const userRol = localStorage.getItem('userRol');
    
    if (userRol !== 'policia') {
        showMessage('No tienes permisos de policia', 'error');
        mostrarPagina('mapa');
        return;
    }
    
    try {
        const asignadosResponse = await fetch('/api/policia/incidentes-asignados', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const asignadosData = await asignadosResponse.json();
        
        const asignadosLista = document.getElementById('policia-incidentes-asignados');
        asignadosLista.innerHTML = '';
        
        asignadosData.incidentes.forEach(inc => {
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = () => mostrarDetalleIncidentePolicia(inc);
            card.innerHTML = `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">Dirección: ${inc.direccion}</div>
                <div class="incidente-fecha">Reportado por: ${inc.vecino_nombre}</div>
                <div class="incidente-fecha">Telefono vecino: ${inc.vecino_telefono}</div>
                <div class="incidente-fecha">Asignado: ${new Date(inc.fecha_asignacion).toLocaleString()}</div>
            `;
            asignadosLista.appendChild(card);
        });
        
        const pendientesResponse = await fetch('/api/policia/incidentes-pendientes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const pendientesData = await pendientesResponse.json();
        
        const pendientesLista = document.getElementById('policia-incidentes-pendientes');
        pendientesLista.innerHTML = '';
        
        pendientesData.incidentes.forEach(inc => {
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = () => mostrarAsignarIncidente(inc);
            card.innerHTML = `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">Dirección: ${inc.direccion}</div>
                <div class="incidente-fecha">Reportado por: ${inc.vecino_nombre}</div>
                <div class="incidente-fecha">Telefono vecino: ${inc.vecino_telefono}</div>
                <button class="btn-ubicacion" onclick="event.stopPropagation();asignarIncidente(${inc.id})">Asignarme este incidente</button>
            `;
            pendientesLista.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error cargando panel policia:', error);
        showMessage('Error al cargar panel policia', 'error');
    }
}

async function mostrarDetalleIncidentePolicia(incidente) {
    const modal = document.getElementById('modal-detalle');
    const contenido = document.getElementById('modal-contenido');
    
    let imagenesHtml = '';
    if (incidente.imagenes) {
        if (Array.isArray(incidente.imagenes) && incidente.imagenes.length > 0) {
            incidente.imagenes.forEach(img => {
                imagenesHtml += `<img src="${img}" style="width:100%;margin-bottom:10px;border-radius:5px;">`;
            });
        } else if (typeof incidente.imagenes === 'string' && incidente.imagenes.length > 0) {
            imagenesHtml = `<img src="${incidente.imagenes}" style="width:100%;border-radius:5px;">`;
        }
    }
    
    contenido.innerHTML = `
        <h3>${incidente.tipo_delito.toUpperCase()}</h3>
        <p><strong>Descripción:</strong> ${incidente.descripcion}</p>
        <p><strong>Dirección:</strong> ${incidente.direccion}</p>
        <p><strong>Coordenadas:</strong> ${incidente.latitud}, ${incidente.longitud}</p>
        <p><strong>Reportado por:</strong> ${incidente.vecino_nombre} ${incidente.vecino_apellido || ''}</p>
        <p><strong>Telefono vecino:</strong> ${incidente.vecino_telefono || 'No disponible'}</p>
        <p><strong>Estado:</strong> ${incidente.estado}</p>
        <p><strong>Fecha:</strong> ${new Date(incidente.creado_en).toLocaleString()}</p>
        ${imagenesHtml}
        <div style="margin-top:15px;display:flex;gap:10px;">
            <button onclick="resolverIncidente(${incidente.id})" style="background-color:#28a745;">Marcar como Resuelto</button>
            <button onclick="rechazarIncidente(${incidente.id})" style="background-color:#dc3545;">Rechazar Incidente</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function mostrarAsignarIncidente(incidente) {
    const modal = document.getElementById('modal-detalle');
    const contenido = document.getElementById('modal-contenido');
    
    let imagenesHtml = '';
    if (incidente.imagenes) {
        if (Array.isArray(incidente.imagenes) && incidente.imagenes.length > 0) {
            incidente.imagenes.forEach(img => {
                imagenesHtml += `<img src="${img}" style="width:100%;margin-bottom:10px;border-radius:5px;">`;
            });
        } else if (typeof incidente.imagenes === 'string' && incidente.imagenes.length > 0) {
            imagenesHtml = `<img src="${incidente.imagenes}" style="width:100%;border-radius:5px;">`;
        }
    }
    
    contenido.innerHTML = `
        <h3>${incidente.tipo_delito.toUpperCase()}</h3>
        <p><strong>Descripción:</strong> ${incidente.descripcion}</p>
        <p><strong>Dirección:</strong> ${incidente.direccion}</p>
        <p><strong>Coordenadas:</strong> ${incidente.latitud}, ${incidente.longitud}</p>
        <p><strong>Reportado por:</strong> ${incidente.vecino_nombre} ${incidente.vecino_apellido || ''}</p>
        <p><strong>Fecha:</strong> ${new Date(incidente.creado_en).toLocaleString()}</p>
        ${imagenesHtml}
        <button onclick="asignarIncidente(${incidente.id})" style="background-color:#004d00;">Asignarme este incidente</button>
    `;
    
    modal.style.display = 'flex';
}

async function asignarIncidente(incidenteId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/policia/asignar-incidente/${incidenteId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModal();
            cargarPanelPolicia();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al asignar incidente', 'error');
    }
}

async function resolverIncidente(incidenteId) {
    const token = localStorage.getItem('token');
    const observaciones = prompt('Ingrese observaciones sobre la resolucion:');
    
    try {
        const response = await fetch(`/api/policia/resolver-incidente/${incidenteId}?observaciones=${encodeURIComponent(observaciones || '')}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModal();
            cargarPanelPolicia();
            cargarHeatMap();
            cargarIncidentesPreview();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al resolver incidente', 'error');
    }
}

async function rechazarIncidente(incidenteId) {
    const token = localStorage.getItem('token');
    const motivo = prompt('Ingrese el motivo del rechazo:');
    
    if (!motivo) {
        showMessage('Debe ingresar un motivo', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/policia/rechazar-incidente/${incidenteId}?motivo=${encodeURIComponent(motivo)}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cerrarModal();
            cargarPanelPolicia();
            cargarHeatMap();
            cargarIncidentesPreview();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al rechazar incidente', 'error');
    }
}