let mapaLeaflet;
let marcadorLeaflet;

function inicializarMapa() {
    const centroSantaCruz = [-17.783333, -63.183333];

    if (mapaLeaflet) {
        mapaLeaflet.off();
        mapaLeaflet.remove();
    }

    mapaLeaflet = L.map('mapa').setView(centroSantaCruz, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        minZoom: 3
    }).addTo(mapaLeaflet);

    L.control.scale().addTo(mapaLeaflet);

    mapaLeaflet.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        actualizarCoordenadas(lat, lng);
    });
}

function actualizarCoordenadas(lat, lng) {
    const latRedondeada = lat.toFixed(6);
    const lngRedondeada = lng.toFixed(6);

    document.getElementById('latitud').value = latRedondeada;
    document.getElementById('longitud').value = lngRedondeada;
    document.getElementById('coordenadas_info').innerHTML = `Ubicacion seleccionada: ${latRedondeada}, ${lngRedondeada}`;

    if (marcadorLeaflet) {
        marcadorLeaflet.setLatLng([lat, lng]);
    } else {
        marcadorLeaflet = L.marker([lat, lng]).addTo(mapaLeaflet);
    }

    mapaLeaflet.setView([lat, lng], 15);
}

function obtenerUbicacionActual() {
    if (!navigator.geolocation) {
        showMessage("Tu navegador no soporta geolocalizacion.", "error");
        return;
    }

    showMessage("Obteniendo tu ubicacion...", "success");

    navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        actualizarCoordenadas(lat, lng);
        showMessage("Ubicacion obtenida correctamente.", "success");
    }, function(error) {
        let mensaje = "Error al obtener ubicacion. ";
        switch(error.code) {
            case 1:
                mensaje += "Permiso denegado.";
                break;
            case 2:
                mensaje += "Ubicacion no disponible.";
                break;
            case 3:
                mensaje += "Tiempo de espera agotado.";
                break;
            default:
                mensaje += "Error desconocido.";
        }
        showMessage(mensaje, "error");
    });
}