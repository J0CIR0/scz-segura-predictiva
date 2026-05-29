function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = 'message ' + type;
    msgDiv.style.display = 'block';
    setTimeout(() => {
        msgDiv.style.display = 'none';
    }, 5000);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'incidentes') {
        cargarIncidentes();
    }
    
    if (tabName === 'reportar') {
        setTimeout(function() {
            if (mapaLeaflet) {
                mapaLeaflet.invalidateSize();
            } else {
                inicializarMapa();
            }
        }, 100);
    }
}