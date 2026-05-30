let fotosSeleccionadas = [];

async function reportarIncidente(event) {
    event.preventDefault();
    console.log('reportarIncidente: inicio');
    
    const token = localStorage.getItem('token');
    console.log('reportarIncidente: token=', token);
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
        showMessage('Debes obtener tu ubicacion actual usando el boton "Obtener mi ubicacion actual"', 'error');
        return;
    }
    
    if (!direccion) {
        showMessage('La direccion se obtendra al obtener la ubicacion. Espera un momento.', 'error');
        return;
    }
    
    const imagenes = [];
    
    for (let i = 0; i < fotosSeleccionadas.length; i++) {
        imagenes.push(fotosSeleccionadas[i]);
    }
    
    const data = {
        tipo_delito: tipoDelito,
        descripcion: descripcion,
        latitud: latitud,
        longitud: longitud,
        direccion: direccion,
        imagenes: imagenes
    };
    
    try {
        console.log('reportarIncidente: enviando datos', data);
        const response = await fetch('/api/reportar-incidente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log('reportarIncidente: respuesta', response.status, result);
        if (response.ok) {
            showMessage('Incidente reportado exitosamente', 'success');
            document.getElementById('reporteForm').reset();
            document.getElementById('preview_imagenes').innerHTML = '';
            document.getElementById('direccion').value = '';
            document.getElementById('latitud').value = '';
            document.getElementById('longitud').value = '';
            fotosSeleccionadas = [];
            if (typeof cargarHeatMap === 'function') cargarHeatMap();
            if (typeof cargarIncidentesPreview === 'function') cargarIncidentesPreview();
            mostrarPagina('mapa');
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error al reportar incidente', 'error');
    }
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
            let imagenHtml = '';
            if (inc.imagenes) {
                if (typeof inc.imagenes === 'string') {
                    imagenHtml = '<img src="' + inc.imagenes + '" class="incidente-imagen">';
                } else if (inc.imagenes.length > 0 && inc.imagenes[0]) {
                    imagenHtml = '<img src="' + inc.imagenes[0] + '" class="incidente-imagen">';
                }
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
            card.innerHTML = `
                ${imagenHtml}
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
            let imagenHtml = '';
            if (inc.imagenes) {
                if (typeof inc.imagenes === 'string') {
                    imagenHtml = '<img src="' + inc.imagenes + '" class="incidente-imagen">';
                } else if (inc.imagenes.length > 0 && inc.imagenes[0]) {
                    imagenHtml = '<img src="' + inc.imagenes[0] + '" class="incidente-imagen">';
                }
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
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
            let imagenHtml = '';
            if (inc.imagenes) {
                if (typeof inc.imagenes === 'string') {
                    imagenHtml = '<img src="' + inc.imagenes + '" class="incidente-imagen">';
                } else if (inc.imagenes.length > 0 && inc.imagenes[0]) {
                    imagenHtml = '<img src="' + inc.imagenes[0] + '" class="incidente-imagen">';
                }
            }
            
            const card = document.createElement('div');
            card.className = 'incidente-card';
            card.onclick = function() { mostrarDetalleIncidente(inc); };
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

function previewFotos(input) {
    const preview = document.getElementById('preview_imagenes');
    if (!preview) return;
    preview.innerHTML = '';
    fotosSeleccionadas = [];
    
    const files = input.files;
    
    if (files.length > 3) {
        showMessage('Solo puedes subir maximo 3 fotos', 'error');
        input.value = '';
        return;
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
            showMessage('Solo se permiten imagenes', 'error');
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            fotosSeleccionadas.push(event.target.result);
            
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.width = '80px';
            img.style.height = '80px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '5px';
            img.style.margin = '5px';
            
            const btnBorrar = document.createElement('button');
            btnBorrar.innerHTML = 'X';
            btnBorrar.style.position = 'absolute';
            btnBorrar.style.top = '0';
            btnBorrar.style.right = '0';
            btnBorrar.style.backgroundColor = '#dc3545';
            btnBorrar.style.color = 'white';
            btnBorrar.style.border = 'none';
            btnBorrar.style.borderRadius = '50%';
            btnBorrar.style.width = '20px';
            btnBorrar.style.height = '20px';
            btnBorrar.style.fontSize = '12px';
            btnBorrar.style.cursor = 'pointer';
            btnBorrar.onclick = function() {
                const idx = fotosSeleccionadas.indexOf(event.target.result);
                if (idx > -1) {
                    fotosSeleccionadas.splice(idx, 1);
                }
                container.remove();
                
                const dataTransfer = new DataTransfer();
                const remainingFiles = [];
                for (let j = 0; j < input.files.length; j++) {
                    if (j !== idx) {
                        remainingFiles.push(input.files[j]);
                    }
                }
                for (let j = 0; j < remainingFiles.length; j++) {
                    dataTransfer.items.add(remainingFiles[j]);
                }
                input.files = dataTransfer.files;
            };
            
            container.appendChild(img);
            container.appendChild(btnBorrar);
            preview.appendChild(container);
        };
        reader.readAsDataURL(file);
    }
}

if (document.getElementById('imagenes')) {
    document.getElementById('imagenes').addEventListener('change', function(e) {
        previewFotos(this);
    });
}