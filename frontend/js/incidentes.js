let fotosSeleccionadas = [];

function normalizarImagenesIncidente(imagenes) {
    if (!imagenes) {
        return [];
    }

    if (Array.isArray(imagenes)) {
        return imagenes.filter(function(img) {
            return typeof img === 'string' && img.length > 0;
        });
    }

    if (typeof imagenes === 'string') {
        try {
            const parsed = JSON.parse(imagenes);
            if (Array.isArray(parsed)) {
                return parsed.filter(function(img) {
                    return typeof img === 'string' && img.length > 0;
                });
            }
        } catch (error) {
            if (imagenes.startsWith('data:image')) {
                return [imagenes];
            }

            const coincidencias = imagenes.match(/data:image\/[^\"'\s]+/g);
            if (coincidencias && coincidencias.length > 0) {
                return coincidencias;
            }
        }
    }

    return [];
}

function renderizarMiniaturasImagenes(imagenes, maximas) {
    const urls = normalizarImagenesIncidente(imagenes);
    if (urls.length === 0) {
        return '';
    }

    const limite = Math.min(urls.length, maximas || urls.length);
    let html = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">';

    for (let i = 0; i < limite; i++) {
        html += '<img src="' + urls[i] + '" style="width:72px;height:72px;object-fit:cover;border-radius:6px;border:1px solid #004d00;">';
    }

    html += '</div>';
    return html;
}

function renderizarFotosSeleccionadas() {
    const preview = document.getElementById('preview_imagenes');
    if (!preview) {
        return;
    }

    preview.innerHTML = '';

    fotosSeleccionadas.forEach(function(foto, index) {
        const container = document.createElement('div');
        container.className = 'foto-container';

        const img = document.createElement('img');
        img.src = foto.vistaPrevia;
        img.alt = 'Foto seleccionada ' + (index + 1);

        const btnBorrar = document.createElement('button');
        btnBorrar.innerHTML = 'X';
        btnBorrar.type = 'button';
        btnBorrar.className = 'foto-borrar';
        btnBorrar.onclick = function() {
            eliminarFoto(index);
        };

        container.appendChild(img);
        container.appendChild(btnBorrar);
        preview.appendChild(container);
    });
}

async function manejarSeleccionFotos(event) {
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Debes iniciar sesion para reportar un incidente', 'error');
        event.target.value = '';
        return;
    }

    const archivos = Array.from(event.target.files || []);
    if (archivos.length === 0) {
        return;
    }

    const seleccionKey = archivos.map(function(archivo) {
        return [archivo.name, archivo.size, archivo.lastModified].join(':');
    }).join('|');

    if (event.target.dataset.lastSelectionKey === seleccionKey) {
        return;
    }

    event.target.dataset.lastSelectionKey = seleccionKey;

    const espacioDisponible = 3 - fotosSeleccionadas.length;
    if (espacioDisponible <= 0) {
        showMessage('Solo puedes subir maximo 3 fotos', 'error');
        event.target.value = '';
        return;
    }

    const archivosPermitidos = archivos.slice(0, espacioDisponible);
    for (const archivo of archivosPermitidos) {
        await agregarFoto(archivo, true);
    }

    renderizarFotosSeleccionadas();

    if (archivos.length > espacioDisponible) {
        showMessage('Solo puedes subir maximo 3 fotos', 'error');
    }

    event.target.value = '';
}

function agregarFoto(file, omitirRender) {
    return new Promise(function(resolve) {
        if (!file.type.startsWith('image/')) {
            showMessage('Solo se permiten imagenes', 'error');
            resolve(false);
            return;
        }
        
        if (fotosSeleccionadas.length >= 3) {
            showMessage('Solo puedes tomar maximo 3 fotos', 'error');
            resolve(false);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function() {
            fotosSeleccionadas.push({
                archivo: file,
                vistaPrevia: reader.result
            });

            if (!omitirRender) {
                renderizarFotosSeleccionadas();
            }

            resolve(true);
        };

        reader.onerror = function() {
            showMessage('No se pudo cargar la vista previa de la imagen', 'error');
            resolve(false);
        };

        reader.readAsDataURL(file);
    });
}

function eliminarFoto(index) {
    fotosSeleccionadas.splice(index, 1);

    renderizarFotosSeleccionadas();
}

async function reportarIncidente(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Debes iniciar sesion', 'error');
        return;
    }
    
    const latitud = parseFloat(document.getElementById('latitud').value);
    const longitud = parseFloat(document.getElementById('longitud').value);
    const tipoDelito = document.getElementById('tipo_delito').value;
    const descripcion = document.getElementById('descripcion').value;
    const direccion = document.getElementById('direccion').value;
    
    if (!tipoDelito) {
        showMessage('Selecciona un tipo de delito', 'error');
        return;
    }
    
    if (!descripcion.trim()) {
        showMessage('Ingresa una descripcion del incidente', 'error');
        return;
    }
    
    if (isNaN(latitud) || isNaN(longitud) || latitud === 0 || longitud === 0) {
        showMessage('Debes obtener tu ubicacion actual', 'error');
        return;
    }
    
    if (!direccion) {
        showMessage('La direccion se obtendra al obtener la ubicacion', 'error');
        return;
    }
    
    const imagenesBase64 = [];
    
    for (let i = 0; i < fotosSeleccionadas.length; i++) {
        const base64 = await convertirArchivoABase64(fotosSeleccionadas[i].archivo);
        imagenesBase64.push(base64);
    }
    
    const data = {
        tipo_delito: tipoDelito,
        descripcion: descripcion,
        latitud: latitud,
        longitud: longitud,
        direccion: direccion,
        imagenes: imagenesBase64
    };
    
    try {
        const response = await fetch('/api/reportar-incidente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Incidente reportado exitosamente', 'success');
            document.getElementById('reporteForm').reset();
            const previewDiv = document.getElementById('preview_imagenes');
            if (previewDiv) previewDiv.innerHTML = '';
            document.getElementById('direccion').value = '';
            document.getElementById('latitud').value = '';
            document.getElementById('longitud').value = '';
            fotosSeleccionadas = [];
            if (typeof cargarHeatMap === 'function') cargarHeatMap();
            if (typeof cargarIncidentesPreview === 'function') cargarIncidentesPreview();
            mostrarPagina('mapa');
        } else {
            showMessage(result.detail || 'Error al reportar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error al reportar incidente', 'error');
    }
}

function convertirArchivoABase64(file) {
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onloadend = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function cargarIncidentesPreview() {
    try {
        const response = await fetch('/api/incidentes-publicos');
        const data = await response.json();
        const incidentes = data.incidentes || [];
        
        const lista = document.getElementById('incidentes-preview');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes reportados</p>';
            return;
        }
        
        for (let i = 0; i < Math.min(incidentes.length, 6); i++) {
            const inc = incidentes[i];
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion ? inc.descripcion.substring(0, 100) : ''}...</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleDateString()}</div>
            `;
            lista.appendChild(card);
        }
    } catch (error) {
        console.error('Error cargando preview:', error);
    }
}

async function cargarTodosIncidentes() {
    try {
        const response = await fetch('/api/incidentes-publicos');
        const data = await response.json();
        const incidentes = data.incidentes || [];
        
        const lista = document.getElementById('incidentes-lista-completa');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes</p>';
            return;
        }
        
        incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion}</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando incidentes:', error);
    }
}

async function cargarMisIncidentes() {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarPagina('login');
        return;
    }
    
    try {
        const response = await fetch('/api/mis-incidentes', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const incidentes = await response.json();
        
        const lista = document.getElementById('mis-incidentes-lista');
        if (!lista) return;
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No has reportado incidentes</p>';
            return;
        }
        
        incidentes.forEach(function(inc) {
            const imagenesHtml = renderizarMiniaturasImagenes(inc.imagenes, 3);
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
            card.innerHTML = imagenesHtml + `
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion}</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleString()}</div>
                <div class="incidente-fecha">Estado: ${inc.estado}</div>
            `;
            lista.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando mis incidentes:', error);
    }
}

function mostrarDetalleIncidente(incidente) {
    const modal = document.getElementById('modal-detalle');
    const contenido = document.getElementById('modal-contenido');
    
    let imagenesHtml = '';
    const imagenes = normalizarImagenesIncidente(incidente.imagenes);
    if (imagenes.length > 0) {
        imagenesHtml = '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:15px;">';
        imagenes.forEach(function(img) {
            imagenesHtml += '<img src="' + img + '" style="width:100%;border-radius:5px;border:1px solid #004d00;">';
        });
        imagenesHtml += '</div>';
    }
    
    const fecha = new Date(incidente.creado_en).toLocaleString();
    
    contenido.innerHTML = `
        <h3>${incidente.tipo_delito.toUpperCase()}</h3>
        <p><strong>Descripcion:</strong> ${incidente.descripcion}</p>
        <p><strong>Direccion:</strong> ${incidente.direccion}</p>
        <p><strong>Coordenadas:</strong> ${incidente.latitud}, ${incidente.longitud}</p>
        <p><strong>Reportado por:</strong> ${incidente.vecino_nombre || 'Vecino'} ${incidente.vecino_apellido || ''}</p>
        <p><strong>Estado:</strong> ${incidente.estado}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        ${imagenesHtml}
    `;
    
    modal.style.display = 'flex';
}
