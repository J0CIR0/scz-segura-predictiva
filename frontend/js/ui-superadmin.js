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
    document.getElementById(`pagina-${paginaId}`).classList.add('active');
    
    if (paginaId === 'usuarios') {
        cargarUsuarios();
    }
    
    if (paginaId === 'estadisticas') {
        cargarEstadisticasGlobales();
    }
    
    if (paginaId === 'logs') {
        cargarLogs();
    }
    
    if (paginaId === 'respaldos') {
        cargarRespaldos();
    }
    
    if (paginaId === 'monitoreo') {
        cargarMonitoreo();
    }
    
    if (paginaId === 'perfil') {
        cargarPerfilSuperadmin();
    }

    if (paginaId === 'configuracion') {
        cargarConfiguracionSistema();
    }
}

async function cargarUsuarios() {
    const token = localStorage.getItem('token');
    const rol = document.getElementById('filtro_rol')?.value || '';
    const buscar = document.getElementById('filtro_buscar')?.value || '';
    
    let url = '/api/superadmin/usuarios';
    const params = [];
    if (rol) params.push(`rol=${rol}`);
    if (buscar) params.push(`buscar=${encodeURIComponent(buscar)}`);
    if (params.length) url += '?' + params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('superadmin-usuarios-lista');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.usuarios.length === 0) {
            lista.innerHTML = '<p>No hay usuarios registrados</p>';
            return;
        }
        
        data.usuarios.forEach(function(usr) {
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.innerHTML = `
                <div class="incidente-titulo">${usr.nombre} ${usr.apellido}</div>
                <div class="incidente-descripcion">Email: ${usr.email}</div>
                <div class="incidente-descripcion">CI: ${usr.ci}</div>
                <div class="incidente-descripcion">Teléfono: ${usr.telefono || 'No registrado'}</div>
                <div class="incidente-descripcion">
                    Rol: 
                    <select id="rol-select-${usr.id}" onchange="cambiarRolUsuario(${usr.id}, this.value)" ${usr.id === parseInt(localStorage.getItem('userId')) ? 'disabled' : ''}>
                        <option value="vecino" ${usr.rol === 'vecino' ? 'selected' : ''}>Vecino</option>
                        <option value="admin_junta" ${usr.rol === 'admin_junta' ? 'selected' : ''}>Admin Junta</option>
                        <option value="policia" ${usr.rol === 'policia' ? 'selected' : ''}>Policía</option>
                        <option value="superadmin" ${usr.rol === 'superadmin' ? 'selected' : ''}>Super Admin</option>
                    </select>
                </div>
                <div class="incidente-fecha">Verificado: ${usr.esta_verificado ? 'Si' : 'No'}</div>
                <div class="incidente-fecha">Registrado: ${new Date(usr.creado_en).toLocaleDateString()}</div>
                <div style="margin-top:15px;display:flex;gap:10px;">
                    <button onclick="event.stopPropagation();mostrarModalEditarUsuario(${usr.id})" style="background-color:#004d00;width:auto;">Editar</button>
                    <button onclick="event.stopPropagation();eliminarUsuario(${usr.id})" style="background-color:#dc3545;width:auto;" ${usr.id === parseInt(localStorage.getItem('userId')) ? 'disabled' : ''}>Eliminar</button>
                </div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        showMessage('Error al cargar usuarios', 'error');
    }
}

async function cambiarRolUsuario(usuarioId, nuevoRol) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/superadmin/usuarios/${usuarioId}/rol`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ rol: nuevoRol })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cargarUsuarios();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al cambiar rol', 'error');
    }
}

function mostrarModalEditarUsuario(usuarioId) {
    const modal = document.getElementById('modal-editar-usuario');
    const contenido = document.getElementById('modal-editar-usuario-contenido');
    
    contenido.innerHTML = `
        <h3>Editar Usuario</h3>
        <div class="form-group">
            <label>Teléfono:</label>
            <input type="text" id="edit_telefono">
        </div>
        <div class="form-group">
            <label>Teléfono Emergencia:</label>
            <input type="text" id="edit_telefono_emergencia">
        </div>
        <div class="form-group">
            <label>Nueva Contraseña (opcional):</label>
            <input type="password" id="edit_password">
        </div>
        <div style="display:flex;gap:10px;margin-top:15px;">
            <button onclick="guardarEdicionUsuario(${usuarioId})" style="background-color:#004d00;">Guardar</button>
            <button onclick="cerrarModalEditarUsuario()" style="background-color:#6c757d;">Cancelar</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function guardarEdicionUsuario(usuarioId) {
    const token = localStorage.getItem('token');
    const telefono = document.getElementById('edit_telefono')?.value;
    const telefonoEmergencia = document.getElementById('edit_telefono_emergencia')?.value;
    const password = document.getElementById('edit_password')?.value;
    
    const data = {};
    if (telefono) data.telefono = telefono;
    if (telefonoEmergencia) data.telefono_emergencia = telefonoEmergencia;
    if (password) data.password = password;
    
    try {
        const response = await fetch(`/api/superadmin/usuarios/${usuarioId}`, {
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
            cerrarModalEditarUsuario();
            cargarUsuarios();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al editar usuario', 'error');
    }
}

function cerrarModalEditarUsuario() {
    document.getElementById('modal-editar-usuario').style.display = 'none';
}

async function eliminarUsuario(usuarioId) {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/superadmin/usuarios/${usuarioId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            cargarUsuarios();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al eliminar usuario', 'error');
    }
}

async function cargarEstadisticasGlobales() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/superadmin/estadisticas-globales', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const statsDiv = document.getElementById('superadmin-stats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="admin-stats-grid">
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #004d00;">
                        <h3>Total Usuarios</h3>
                        <p style="font-size:36px;color:#004d00;">${data.total_usuarios}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #004d00;">
                        <h3>Total Incidentes</h3>
                        <p style="font-size:36px;color:#004d00;">${data.total_incidentes}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #28a745;">
                        <h3>Verificados</h3>
                        <p style="font-size:36px;color:#28a745;">${data.usuarios_verificados}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #ff8c00;">
                        <h3>Pendientes</h3>
                        <p style="font-size:36px;color:#ff8c00;">${data.incidentes_pendientes}</p>
                    </div>
                    <div class="stat-card" style="background:white;padding:20px;border-radius:10px;text-align:center;border:1px solid #28a745;">
                        <h3>Resueltos</h3>
                        <p style="font-size:36px;color:#28a745;">${data.incidentes_resueltos}</p>
                    </div>
                </div>
            `;
        }
        
        const mensualesDiv = document.getElementById('superadmin-incidentes-mensuales');
        if (mensualesDiv && data.incidentes_por_mes) {
            mensualesDiv.innerHTML = '<div class="incidentes-lista">';
            data.incidentes_por_mes.forEach(function(mes) {
                mensualesDiv.innerHTML += `
                    <div class="incidente-card">
                        <div class="incidente-titulo">${mes.mes}</div>
                        <div class="incidente-descripcion">Incidentes: ${mes.total}</div>
                    </div>
                `;
            });
            mensualesDiv.innerHTML += '</div>';
        }
        
        const barriosDiv = document.getElementById('superadmin-top-barrios');
        if (barriosDiv && data.top_barrios) {
            barriosDiv.innerHTML = '<div class="incidentes-lista">';
            data.top_barrios.forEach(function(barrio) {
                barriosDiv.innerHTML += `
                    <div class="incidente-card">
                        <div class="incidente-titulo">${barrio.barrio}</div>
                        <div class="incidente-descripcion">Incidentes: ${barrio.total}</div>
                    </div>
                `;
            });
            barriosDiv.innerHTML += '</div>';
        }

        const verificacionDiv = document.getElementById('superadmin-verificacion-usuarios');
        if (verificacionDiv) {
            const porcentaje = data.total_usuarios ? Math.round((data.usuarios_verificados / data.total_usuarios) * 100) : 0;
            verificacionDiv.innerHTML = `
                <div class="progress-card">
                    <div class="progress-header">
                        <strong>${porcentaje}%</strong>
                        <span>${data.usuarios_verificados} de ${data.total_usuarios} usuarios</span>
                    </div>
                    <div class="progress-bar"><span style="width:${porcentaje}%"></span></div>
                </div>
            `;
        }

        const rendimientoDiv = document.getElementById('superadmin-rendimiento');
        if (rendimientoDiv) {
            rendimientoDiv.innerHTML = `
                <div class="metric-grid">
                    <div class="metric-card"><span>Logs</span><strong>${data.total_logs}</strong></div>
                    <div class="metric-card"><span>Incidentes pendientes</span><strong>${data.incidentes_pendientes}</strong></div>
                    <div class="metric-card"><span>Incidentes resueltos</span><strong>${data.incidentes_resueltos}</strong></div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error cargando estadisticas globales:', error);
    }
}

async function cargarLogs() {
    const token = localStorage.getItem('token');
    const fechaDesde = document.getElementById('logs_fecha_desde')?.value || '';
    const fechaHasta = document.getElementById('logs_fecha_hasta')?.value || '';
    const usuarioId = document.getElementById('logs_usuario_id')?.value || '';
    const accion = document.getElementById('logs_accion')?.value || '';
    
    let url = '/api/superadmin/logs';
    const params = [];
    if (fechaDesde) params.push(`fecha_desde=${fechaDesde}`);
    if (fechaHasta) params.push(`fecha_hasta=${fechaHasta}`);
    if (usuarioId) params.push(`usuario_id=${usuarioId}`);
    if (accion) params.push(`accion=${encodeURIComponent(accion)}`);
    if (params.length) url += '?' + params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('superadmin-logs-lista');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (data.logs.length === 0) {
            lista.innerHTML = '<p>No hay logs registrados</p>';
            return;
        }
        
        data.logs.forEach(function(log) {
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.innerHTML = `
                <div class="incidente-titulo">Acción: ${log.accion}</div>
                <div class="incidente-descripcion">Usuario ID: ${log.usuario_id}</div>
                <div class="incidente-descripcion">Tabla: ${log.tabla_afectada || '-'}</div>
                <div class="incidente-descripcion">Registro ID: ${log.registro_id || '-'}</div>
                <div class="incidente-fecha">IP: ${log.ip_address || '-'}</div>
                <div class="incidente-fecha">Fecha: ${new Date(log.creado_en).toLocaleString()}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando logs:', error);
    }
}

function exportarLogs() {
    const logsLista = document.getElementById('superadmin-logs-lista');
    if (!logsLista) return;
    
    let csvContent = "Accion,Usuario ID,Tabla,Registro ID,IP,Fecha\n";
    const cards = logsLista.querySelectorAll('.incidente-card');
    cards.forEach(function(card) {
        const titulo = card.querySelector('.incidente-titulo')?.innerText.replace('Acción: ', '') || '';
        const descripciones = card.querySelectorAll('.incidente-descripcion');
        const usuarioId = descripciones[0]?.innerText.replace('Usuario ID: ', '') || '';
        const tabla = descripciones[1]?.innerText.replace('Tabla: ', '') || '';
        const registroId = descripciones[2]?.innerText.replace('Registro ID: ', '') || '';
        const ipFecha = card.querySelectorAll('.incidente-fecha');
        const ip = ipFecha[0]?.innerText.replace('IP: ', '') || '';
        const fecha = ipFecha[1]?.innerText.replace('Fecha: ', '') || '';
        csvContent += `"${titulo}","${usuarioId}","${tabla}","${registroId}","${ip}","${fecha}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'logs_auditoria.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage('Logs exportados a CSV', 'success');
}

async function guardarConfiguracion(tipo) {
    const token = localStorage.getItem('token');
    let valor = '';
    let clave = '';
    
    switch(tipo) {
        case 'falsos_limite':
            valor = document.getElementById('config_falsos_limite')?.value;
            clave = 'limite_reportes_falsos';
            break;
        case 'login_intentos':
            valor = document.getElementById('config_login_intentos')?.value;
            clave = 'intentos_login_bloqueo';
            break;
        case 'radio_duplicados':
            valor = document.getElementById('config_radio_duplicados')?.value;
            clave = 'radio_deteccion_duplicados';
            break;
        case 'tiempo_duplicados':
            valor = document.getElementById('config_tiempo_duplicados')?.value;
            clave = 'tiempo_fusion_duplicados';
            break;
        case 'max_peticiones':
            valor = document.getElementById('config_max_peticiones')?.value;
            clave = 'max_peticiones_segundo';
            break;
        case 'max_tiempo_respuesta':
            valor = document.getElementById('config_max_tiempo_respuesta')?.value;
            clave = 'max_tiempo_respuesta';
            break;
        case 'alertas_intervalo':
            valor = document.getElementById('config_alertas_intervalo')?.value;
            clave = 'alertas_intervalo_horas';
            break;
        case 'respaldo_intervalo':
            valor = document.getElementById('respaldo_intervalo')?.value;
            clave = 'respaldo_intervalo_horas';
            break;
    }
    
    try {
        const response = await fetch('/api/superadmin/configuracion', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ clave, valor })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Configuración guardada', 'success');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al guardar configuración', 'error');
    }
}

async function reentrenarModeloIA() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/superadmin/reentrenar-ia', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('ia_ultimo_reentrenamiento').innerText = new Date().toLocaleString();
            document.getElementById('ia_precision_actual').innerText = result.precision + '%';
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al reentrenar modelo IA', 'error');
    }
}

async function realizarRespaldoManual() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/superadmin/respaldo-manual', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(`Respaldo realizado exitosamente: ${result.archivo || ''}`, 'success');
            cargarRespaldos();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al realizar respaldo', 'error');
    }
}

async function cargarRespaldos() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/superadmin/respaldos', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        const lista = document.getElementById('respaldos-lista');
        if (lista) {
            lista.innerHTML = '';
            if (data.respaldos.length === 0) {
                lista.innerHTML = '<p>No hay respaldos registrados</p>';
            } else {
                data.respaldos.forEach(function(backup) {
                    const card = document.createElement('div');
                    card.className = 'incidente-card';
                    card.innerHTML = `
                        <div class="incidente-titulo">Respaldo ${backup.tipo}</div>
                        <div class="incidente-descripcion">Archivo: ${backup.archivo}</div>
                        <div class="incidente-descripcion">Tamaño: ${backup.tamano}</div>
                        <div class="incidente-fecha">Fecha: ${new Date(backup.creado_en).toLocaleString()}</div>
                        <button onclick="descargarRespaldo('${backup.archivo}')" style="background-color:#004d00;width:auto;margin-top:10px;">Descargar</button>
                    `;
                    lista.appendChild(card);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando respaldos:', error);
    }
}

async function descargarRespaldo(archivo) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/superadmin/descargar-respaldo?archivo=${encodeURIComponent(archivo)}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        showMessage('Error al descargar respaldo', 'error');
    }
}

function guardarConfiguracionRespaldo() {
    const intervalo = document.getElementById('respaldo_intervalo')?.value;
    if (intervalo) {
        guardarConfiguracion('respaldo_intervalo');
    }
}

async function cargarConfiguracionSistema() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/superadmin/configuracion', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        const configuracion = data.configuracion || {};

        const mapa = {
            limite_reportes_falsos: 'config_falsos_limite',
            intentos_login_bloqueo: 'config_login_intentos',
            radio_deteccion_duplicados: 'config_radio_duplicados',
            tiempo_fusion_duplicados: 'config_tiempo_duplicados',
            max_peticiones_segundo: 'config_max_peticiones',
            max_tiempo_respuesta: 'config_max_tiempo_respuesta',
            alertas_intervalo_horas: 'config_alertas_intervalo',
            respaldo_intervalo_horas: 'respaldo_intervalo'
        };

        Object.entries(mapa).forEach(([clave, elementoId]) => {
            const input = document.getElementById(elementoId);
            if (input && configuracion[clave] !== undefined) {
                input.value = configuracion[clave];
            }
        });

        const iaPrecision = document.getElementById('ia_precision_actual');
        const iaUltimo = document.getElementById('ia_ultimo_reentrenamiento');
        if (iaPrecision && configuracion.ia_precision_actual !== undefined) {
            iaPrecision.innerText = `${configuracion.ia_precision_actual}%`;
        }
        if (iaUltimo && configuracion.ia_ultimo_reentrenamiento !== undefined) {
            iaUltimo.innerText = configuracion.ia_ultimo_reentrenamiento;
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

async function cargarMonitoreo() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/superadmin/monitoreo', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        
        document.getElementById('servidor-estado').innerHTML = `<span style="color:${data.servidor_estado === 'online' ? '#28a745' : '#dc3545'}">${data.servidor_estado}</span>`;
        document.getElementById('usuarios-conectados').innerHTML = `${data.usuarios_conectados} usuarios`;
        document.getElementById('peticiones-por-segundo').innerHTML = `${data.peticiones_por_segundo} req/s`;
        document.getElementById('tiempo-respuesta').innerHTML = `${data.tiempo_respuesta_promedio} ms`;
        document.getElementById('uso-memoria').innerHTML = `${data.uso_memoria} MB`;
        document.getElementById('db-estado').innerHTML = `<span style="color:${data.db_estado === 'conectada' ? '#28a745' : '#dc3545'}">${data.db_estado}</span>`;
        
    } catch (error) {
        console.error('Error cargando monitoreo:', error);
    }
}

function refrescarMonitoreo() {
    cargarMonitoreo();
}

async function cargarPerfilSuperadmin() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch('/api/perfil', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await response.json();
        const usuario = data.usuario;
        
        const perfilInfo = document.getElementById('perfil-info');
        if (perfilInfo) {
            perfilInfo.innerHTML = `
                <div class="perfil-card" style="background:#f5f5f5;padding:20px;border-radius:10px;margin-bottom:20px;">
                    <p><strong>Nombre:</strong> ${usuario.nombre} ${usuario.apellido}</p>
                    <p><strong>CI:</strong> ${usuario.ci}</p>
                    <p><strong>Email:</strong> ${usuario.email}</p>
                    <p><strong>Teléfono:</strong> ${usuario.telefono || 'No registrado'}</p>
                    <p><strong>Teléfono Emergencia:</strong> ${usuario.telefono_emergencia || 'No registrado'}</p>
                    <p><strong>Número de Placa:</strong> ${usuario.numero_placa || 'No registrado'}</p>
                    <p><strong>Rol:</strong> ${usuario.rol}</p>
                </div>
            `;
        }
        
        const perfilTelefono = document.getElementById('perfil_telefono');
        const perfilTelefonoEmergencia = document.getElementById('perfil_telefono_emergencia');
        if (perfilTelefono) perfilTelefono.value = usuario.telefono || '';
        if (perfilTelefonoEmergencia) perfilTelefonoEmergencia.value = usuario.telefono_emergencia || '';
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

async function actualizarPerfilSuperadmin(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    const data = {};
    const telefono = document.getElementById('perfil_telefono')?.value;
    const telefonoEmergencia = document.getElementById('perfil_telefono_emergencia')?.value;
    const nuevaPassword = document.getElementById('perfil_nueva_password')?.value;
    
    if (telefono) data.telefono = telefono;
    if (telefonoEmergencia) data.telefono_emergencia = telefonoEmergencia;
    if (nuevaPassword) data.nueva_password = nuevaPassword;
    
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
            cargarPerfilSuperadmin();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al actualizar perfil', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('user-name').textContent = userName;
    }
    
    if (document.getElementById('actualizarPerfilForm')) {
        document.getElementById('actualizarPerfilForm').addEventListener('submit', actualizarPerfilSuperadmin);
    }
    
    mostrarPagina('usuarios');
    connectWebSocket();

    cargarConfiguracionSistema();
    cargarRespaldos();
    cargarMonitoreo();
    
    setInterval(function() {
        if (document.getElementById('pagina-monitoreo').classList.contains('active')) {
            cargarMonitoreo();
        }
    }, 30000);
});