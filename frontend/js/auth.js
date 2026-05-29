async function registrarUsuario(event) {
    event.preventDefault();
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
}

async function verificarCodigo(event) {
    event.preventDefault();
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
}

async function loginUsuario(event) {
    event.preventDefault();
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
            localStorage.setItem('token', result.access_token);
            showMessage('Login exitoso. Bienvenido ' + result.rol, 'success');
            document.getElementById('loginForm').reset();
        } else {
            showMessage(result.detail, 'error');
        }
    } catch (error) {
        showMessage('Error en el login', 'error');
    }
}