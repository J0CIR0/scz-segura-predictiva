async function reportarIncidente(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Debes iniciar sesión', 'error');
        return;
    }
    
    const latitud = parseFloat(document.getElementById('latitud').value);
    const longitud = parseFloat(document.getElementById('longitud').value);
    
    if (isNaN(latitud) || isNaN(longitud)) {
        showMessage('Selecciona una ubicación en el mapa', 'error');
        return;
    }
    
    const imagenesInput = document.getElementById('imagenes');
    const imagenes = [];
    
    for (let i = 0; i < imagenesInput.files.length; i++) {
        const file = imagenesInput.files[i];
        const reader = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
        imagenes.push(reader);
    }
    
    const data = {
        tipo_delito: document.getElementById('tipo_delito').value,
        descripcion: document.getElementById('descripcion').value,
        latitud: latitud,
        longitud: longitud,
        direccion: document.getElementById('direccion').value,
        imagenes: imagenes
    };
    
    try {
        const response = await fetch('/api/reportar-incidente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('Incidente reportado', 'success');
            document.getElementById('reporteForm').reset();
            document.getElementById('preview_imagenes').innerHTML = '';
            document.getElementById('coordenadas_info').innerHTML = '';
            document.getElementById('latitud').value = '';
            document.getElementById('longitud').value = '';
            if (marcadorLeaflet) {
                marcadorLeaflet.remove();
                marcadorLeaflet = null;
            }
            cargarHeatMap();
            cargarIncidentesPreview();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al reportar', 'error');
    }
}

async function cargarIncidentesPreview() {
    try {
        const response = await fetch('/api/incidentes-publicos');
        const data = await response.json();
        const incidentes = data.incidentes || [];
        
        const lista = document.getElementById('incidentes-preview');
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes reportados</p>';
            return;
        }
        
        incidentes.slice(0, 6).forEach(inc => {
            let imagenHtml = '';
            if (inc.imagenes && inc.imagenes.length > 0) {
                try {
                    const imagenes = JSON.parse(inc.imagenes);
                    if (imagenes.length > 0) {
                        imagenHtml = `<img src="${imagenes[0]}" class="incidente-imagen">`;
                    }
                } catch(e) {
                    if (typeof inc.imagenes === 'string' && inc.imagenes.startsWith('data:image')) {
                        imagenHtml = `<img src="${inc.imagenes}" class="incidente-imagen">`;
                    }
                }
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = () => mostrarDetalleIncidente(inc);
            card.innerHTML = `
                ${imagenHtml}
                <div class="incidente-titulo">${inc.tipo_delito}</div>
                <div class="incidente-descripcion">${inc.descripcion.substring(0, 100)}...</div>
                <div class="incidente-fecha">${new Date(inc.creado_en).toLocaleDateString()}</div>
            `;
            lista.appendChild(card);
        });
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
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No hay incidentes</p>';
            return;
        }
        
        incidentes.forEach(inc => {
            let imagenHtml = '';
            if (inc.imagenes && inc.imagenes.length > 0) {
                try {
                    const imagenes = JSON.parse(inc.imagenes);
                    if (imagenes.length > 0) {
                        imagenHtml = `<img src="${imagenes[0]}" class="incidente-imagen">`;
                    }
                } catch(e) {
                    if (typeof inc.imagenes === 'string' && inc.imagenes.startsWith('data:image')) {
                        imagenHtml = `<img src="${inc.imagenes}" class="incidente-imagen">`;
                    }
                }
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = () => mostrarDetalleIncidente(inc);
            card.innerHTML = `
                ${imagenHtml}
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
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const incidentes = await response.json();
        
        const lista = document.getElementById('mis-incidentes-lista');
        lista.innerHTML = '';
        
        if (incidentes.length === 0) {
            lista.innerHTML = '<p>No has reportado incidentes</p>';
            return;
        }
        
        incidentes.forEach(inc => {
            let imagenHtml = '';
            if (inc.imagenes && inc.imagenes.length > 0) {
                try {
                    const imagenes = JSON.parse(inc.imagenes);
                    if (imagenes.length > 0) {
                        imagenHtml = `<img src="${imagenes[0]}" class="incidente-imagen">`;
                    }
                } catch(e) {
                    if (typeof inc.imagenes === 'string' && inc.imagenes.startsWith('data:image')) {
                        imagenHtml = `<img src="${inc.imagenes}" class="incidente-imagen">`;
                    }
                }
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = () => mostrarDetalleIncidente(inc);
            card.innerHTML = `
                ${imagenHtml}
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