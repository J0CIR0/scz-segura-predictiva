let token = localStorage.getItem('token');

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
}

document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        ci: document.getElementById('reg_ci').value,
        nombre: document.getElementById('reg_nombre').value,
        apellido: document.getElementById('reg_apellido').value,
        email: document.getElementById('reg_email').value,
        telefono: document.getElementById('reg_telefono').value,
        password: document.getElementById('reg_contrasena').value
    };
    
    try {
        const response = await fetch('/api/registro', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('registroForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el registro', 'error');
    }
});

document.getElementById('verificarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        email: document.getElementById('ver_email').value,
        codigo: document.getElementById('ver_codigo').value
    };
    
    try {
        const response = await fetch('/api/verificar-codigo', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showMessage(result.mensaje, 'success');
            document.getElementById('verificarForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en la verificacion', 'error');
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        email: document.getElementById('login_email').value,
        password: document.getElementById('login_contrasena').value
    };
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            token = result.access_token;
            localStorage.setItem('token', token);
            showMessage('Login exitoso. Bienvenido', 'success');
            document.getElementById('loginForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el login', 'error');
    }
});