document.addEventListener('DOMContentLoaded', () => {
    const CUENTA_ADMIN = {
        nombre: 'Administrador Hakuna Matata',
        correo: 'admin@hakunamatata.bo',
        contrasena: 'admin123',
        rol: 'admin'
    };

    const USUARIO_INVITADO = {
        nombre: 'Invitado Hakuna Matata',
        correo: 'invitado@hakunamatata.bo',
        contrasena: '',
        rol: 'user'
    };

    let usuarios = JSON.parse(localStorage.getItem('hm_users')) || [CUENTA_ADMIN];
    if (!usuarios.some(u => u.correo === CUENTA_ADMIN.correo)) {
        usuarios.push(CUENTA_ADMIN);
        localStorage.setItem('hm_users', JSON.stringify(usuarios));
    }

    let citas = JSON.parse(localStorage.getItem('hm_appointments')) || [
        {
            id: 1,
            correoUsuario: 'lucia@ejemplo.com',
            nombreUsuario: 'Lucía Fernández',
            nombreMascota: 'Luna (Perro)',
            servicio: 'Consulta General',
            precio: 50,
            doctor: 'Dra. Elena Martínez',
            fecha: '2026-11-24T10:00',
            pago: 'QR Simple (Bs.)',
            estado: 'Pendiente'
        }
    ];

    let usuarioActual = JSON.parse(localStorage.getItem('hm_currentUser')) || null;

    const contenedorSesion = document.getElementById('hmSessionArea');
    const seccionPanel = document.getElementById('hmDashboard');
    const ventanaAcceso = document.getElementById('hmAuthModal');
    const ventanaCita = document.getElementById('hmBookingModal');
    const cuerpoTabla = document.getElementById('hmTableBody');

    function abrirVentana(elementoVentana) {
        if (elementoVentana) {
            elementoVentana.classList.remove('ventana--oculta');
        }
    }

    function cerrarVentana(elementoVentana) {
        if (elementoVentana) {
            elementoVentana.classList.add('ventana--oculta');
        }
    }

    function formatearFechaHora(fechaSinFormato) {
        if (!fechaSinFormato) return '';
        const fechaAnalizada = new Date(fechaSinFormato);
        if (Number.isNaN(fechaAnalizada.getTime())) {
            return fechaSinFormato.replace('T', ' ');
        }
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const nombreDia = dias[fechaAnalizada.getDay()];
        const dia = String(fechaAnalizada.getDate()).padStart(2, '0');
        const mes = String(fechaAnalizada.getMonth() + 1).padStart(2, '0');
        const anio = fechaAnalizada.getFullYear();
        const hora = String(fechaAnalizada.getHours()).padStart(2, '0');
        const minutos = String(fechaAnalizada.getMinutes()).padStart(2, '0');
        return `${nombreDia} ${dia}/${mes}/${anio} · ${hora}:${minutos}`;
    }

    function renderizarSesionYPanel() {
        if (!contenedorSesion) return;

        if (usuarioActual) {
            contenedorSesion.innerHTML = `
                <span class="encabezado__insignia-usuario">${usuarioActual.rol === 'admin' ? '👑 Admin' : '🐾 ' + usuarioActual.nombre.split(' ')[0]}</span>
                <button type="button" id="hmBtnLogout" class="boton boton--contorno">Salir</button>
            `;

            const botonSalir = document.getElementById('hmBtnLogout');
            if (botonSalir) {
                botonSalir.addEventListener('click', () => {
                    usuarioActual = null;
                    localStorage.removeItem('hm_currentUser');
                    renderizarSesionYPanel();
                });
            }

            if (seccionPanel) {
                seccionPanel.classList.remove('panel--oculto');
            }

            const elementoMetricas = document.getElementById('hmAdminMetrics');
            const etiquetaRol = document.getElementById('hmRoleTag');
            const tituloPanel = document.getElementById('hmDashTitle');
            const subtituloPanel = document.getElementById('hmDashSub');

            if (usuarioActual.rol === 'admin') {
                if (etiquetaRol) etiquetaRol.textContent = '👑 ADMINISTRADOR DE LA PÁGINA';
                if (tituloPanel) tituloPanel.textContent = 'Panel de Control — Hakuna Matata';
                if (subtituloPanel) subtituloPanel.textContent = 'Controla todas las citas, estados e ingresos en Bolivianos (Bs.).';
                if (elementoMetricas) elementoMetricas.classList.remove('panel__metricas--oculto');
            } else {
                if (etiquetaRol) etiquetaRol.textContent = '🐾 CUENTA DE USUARIO';
                if (tituloPanel) tituloPanel.textContent = `Hola, ${usuarioActual.nombre}`;
                if (subtituloPanel) subtituloPanel.textContent = 'Revisa tus citas agendadas y reserva nuevas atenciones.';
                if (elementoMetricas) elementoMetricas.classList.add('panel__metricas--oculto');
            }

            renderizarTabla();
        } else {
            contenedorSesion.innerHTML = `<button type="button" id="hmBtnOpenAuth" class="boton boton--contorno">Ingresar / Registrarse</button>`;
            const botonAbrirAcceso = document.getElementById('hmBtnOpenAuth');
            if (botonAbrirAcceso) {
                botonAbrirAcceso.addEventListener('click', () => abrirVentana(ventanaAcceso));
            }
            if (seccionPanel) {
                seccionPanel.classList.add('panel--oculto');
            }
        }
    }

    function renderizarTabla() {
        if (!cuerpoTabla || !usuarioActual) return;

        cuerpoTabla.innerHTML = '';
        const lista = usuarioActual.rol === 'admin'
            ? citas
            : citas.filter(cita => cita.correoUsuario === usuarioActual.correo);

        if (usuarioActual.rol === 'admin') {
            const pendientes = citas.filter(cita => cita.estado === 'Pendiente').length;
            const totalBs = citas.reduce((suma, item) => suma + Number(item.precio), 0);
            const metricaTotal = document.getElementById('hmMetricTotal');
            const metricaPendientes = document.getElementById('hmMetricPend');
            const metricaBs = document.getElementById('hmMetricBs');

            if (metricaTotal) metricaTotal.textContent = citas.length;
            if (metricaPendientes) metricaPendientes.textContent = pendientes;
            if (metricaBs) metricaBs.textContent = `Bs. ${totalBs}`;
        }

        if (lista.length === 0) {
            cuerpoTabla.innerHTML = `<tr><td colspan="8" class="tabla-datos__celda tabla-datos__vacia">No hay citas registradas todavía.</td></tr>`;
            return;
        }

        lista.forEach(cita => {
            const fila = document.createElement('tr');
            const modificadorEstado = cita.estado === 'Atendida' ? 'tabla-datos__estado--atendida' : 'tabla-datos__estado--pendiente';
            const botones = usuarioActual.rol === 'admin'
                ? `<button type="button" class="tabla-datos__boton tabla-datos__boton--ok" onclick="hmAtender(${cita.id})">Atender</button>
                   <button type="button" class="tabla-datos__boton tabla-datos__boton--eliminar" onclick="hmEliminar(${cita.id})">Eliminar</button>`
                : `<button type="button" class="tabla-datos__boton tabla-datos__boton--eliminar" onclick="hmEliminar(${cita.id})">Cancelar</button>`;

            fila.innerHTML = `
                <td class="tabla-datos__celda">${cita.nombreUsuario}</td>
                <td class="tabla-datos__celda">${cita.nombreMascota}</td>
                <td class="tabla-datos__celda">${cita.servicio}</td>
                <td class="tabla-datos__celda">${cita.doctor}</td>
                <td class="tabla-datos__celda">${formatearFechaHora(cita.fecha)}</td>
                <td class="tabla-datos__celda"><strong>Bs. ${cita.precio}</strong></td>
                <td class="tabla-datos__celda"><span class="tabla-datos__estado ${modificadorEstado}">${cita.estado}</span></td>
                <td class="tabla-datos__celda">${botones}</td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    window.hmAtender = (id) => {
        citas = citas.map(cita => cita.id === id ? { ...cita, estado: 'Atendida' } : cita);
        localStorage.setItem('hm_appointments', JSON.stringify(citas));
        renderizarTabla();
    };

    window.hmEliminar = (id) => {
        citas = citas.filter(cita => cita.id !== id);
        localStorage.setItem('hm_appointments', JSON.stringify(citas));
        renderizarTabla();
    };

    const pestanaLogin = document.getElementById('hmTabLogin');
    const pestanaRegistro = document.getElementById('hmTabReg');
    const formularioLogin = document.getElementById('hmLoginForm');
    const formularioRegistro = document.getElementById('hmRegForm');

    if (pestanaLogin && pestanaRegistro && formularioLogin && formularioRegistro) {
        pestanaLogin.addEventListener('click', () => {
            pestanaLogin.classList.add('ventana__pestana--activa');
            pestanaRegistro.classList.remove('ventana__pestana--activa');
            formularioLogin.classList.remove('formulario--oculto');
            formularioRegistro.classList.add('formulario--oculto');
        });

        pestanaRegistro.addEventListener('click', () => {
            pestanaRegistro.classList.add('ventana__pestana--activa');
            pestanaLogin.classList.remove('ventana__pestana--activa');
            formularioRegistro.classList.remove('formulario--oculto');
            formularioLogin.classList.add('formulario--oculto');
        });
    }

    const botonCerrarAcceso = document.getElementById('hmCloseAuth');
    const botonCerrarCita = document.getElementById('hmCloseBooking');

    if (botonCerrarAcceso) botonCerrarAcceso.addEventListener('click', () => cerrarVentana(ventanaAcceso));
    if (botonCerrarCita) botonCerrarCita.addEventListener('click', () => cerrarVentana(ventanaCita));

    if (ventanaAcceso) {
        ventanaAcceso.addEventListener('click', (evento) => {
            if (evento.target === ventanaAcceso) cerrarVentana(ventanaAcceso);
        });
    }

    if (ventanaCita) {
        ventanaCita.addEventListener('click', (evento) => {
            if (evento.target === ventanaCita) cerrarVentana(ventanaCita);
        });
    }

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', (evento) => {
            evento.preventDefault();
            const correo = document.getElementById('hmLoginEmail').value.trim();
            const contrasena = document.getElementById('hmLoginPass').value.trim();
            const usuarioEncontrado = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
            if (usuarioEncontrado) {
                usuarioActual = usuarioEncontrado;
                localStorage.setItem('hm_currentUser', JSON.stringify(usuarioActual));
                cerrarVentana(ventanaAcceso);
                formularioLogin.reset();
                renderizarSesionYPanel();
            } else {
                alert('Correo o contraseña incorrectos.');
            }
        });
    }

    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', (evento) => {
            evento.preventDefault();
            const nombre = document.getElementById('hmRegName').value.trim();
            const correo = document.getElementById('hmRegEmail').value.trim();
            const contrasena = document.getElementById('hmRegPass').value.trim();
            if (usuarios.some(u => u.correo === correo)) {
                alert('Ese correo ya está registrado.');
                return;
            }
            const nuevoUsuario = { nombre, correo, contrasena, rol: 'user' };
            usuarios.push(nuevoUsuario);
            localStorage.setItem('hm_users', JSON.stringify(usuarios));
            usuarioActual = nuevoUsuario;
            localStorage.setItem('hm_currentUser', JSON.stringify(usuarioActual));
            cerrarVentana(ventanaAcceso);
            formularioRegistro.reset();
            renderizarSesionYPanel();
        });
    }

    const entradaFecha = document.getElementById('hmDate');
    function asignarFechaHoraPorDefecto() {
        if (!entradaFecha) return;
        const ahora = new Date();
        ahora.setHours(ahora.getHours() + 1, 0, 0, 0);
        const anio = ahora.getFullYear();
        const mes = String(ahora.getMonth() + 1).padStart(2, '0');
        const dia = String(ahora.getDate()).padStart(2, '0');
        const hora = String(ahora.getHours()).padStart(2, '0');
        const minutos = String(ahora.getMinutes()).padStart(2, '0');
        entradaFecha.value = `${anio}-${mes}-${dia}T${hora}:${minutos}`;
    }

    const botonesAgendar = document.querySelectorAll('#btnAgendarHeader, #btnAgendarHero, #btnAgendarFooter, #hmBtnNewBooking');
    botonesAgendar.forEach(boton => {
        boton.addEventListener('click', (evento) => {
            evento.preventDefault();
            if (!usuarioActual) {
                usuarioActual = { ...USUARIO_INVITADO };
                localStorage.setItem('hm_currentUser', JSON.stringify(usuarioActual));
                renderizarSesionYPanel();
            }
            asignarFechaHoraPorDefecto();
            abrirVentana(ventanaCita);
        });
    });

    const selectorServicio = document.getElementById('hmService');
    const selectorPago = document.getElementById('hmPayment');
    const vistaPreviaQr = document.getElementById('hmQrPreview');
    const textoQr = document.getElementById('hmQrText');

    function sincronizarQr() {
        if (!selectorServicio || !selectorPago || !vistaPreviaQr || !textoQr) return;
        const precio = selectorServicio.options[selectorServicio.selectedIndex].dataset.price;
        textoQr.textContent = `Monto: Bs. ${precio}`;
        vistaPreviaQr.classList.toggle('caja-qr--oculta', !selectorPago.value.includes('QR'));
    }

    if (selectorServicio) selectorServicio.addEventListener('change', sincronizarQr);
    if (selectorPago) selectorPago.addEventListener('change', sincronizarQr);

    const formularioCita = document.getElementById('hmBookingForm');
    if (formularioCita) {
        formularioCita.addEventListener('submit', (evento) => {
            evento.preventDefault();
            if (!usuarioActual) {
                usuarioActual = { ...USUARIO_INVITADO };
                localStorage.setItem('hm_currentUser', JSON.stringify(usuarioActual));
            }
            const opcionSeleccionada = selectorServicio.options[selectorServicio.selectedIndex];
            const valorFecha = entradaFecha ? entradaFecha.value : '';
            const nuevaCita = {
                id: Date.now(),
                correoUsuario: usuarioActual.correo,
                nombreUsuario: usuarioActual.nombre,
                nombreMascota: `${document.getElementById('hmPetName').value} (${document.getElementById('hmPetType').value})`,
                servicio: selectorServicio.value,
                precio: Number(opcionSeleccionada.dataset.price),
                doctor: document.getElementById('hmDoctor').value,
                fecha: valorFecha,
                pago: selectorPago.value,
                estado: 'Pendiente'
            };
            citas.push(nuevaCita);
            localStorage.setItem('hm_appointments', JSON.stringify(citas));
            cerrarVentana(ventanaCita);
            formularioCita.reset();
            sincronizarQr();
            renderizarSesionYPanel();
            if (seccionPanel) {
                seccionPanel.scrollIntoView({ behavior: 'smooth' });
            }
            alert(`Cita agendada para ${formatearFechaHora(valorFecha)} por Bs. ${nuevaCita.precio}.`);
        });
    }

    const enlacesNavegacion = document.querySelectorAll('.encabezado__enlace');
    let seleccionManual = false;

    function establecerEnlaceActivo(enlaceDestino) {
        enlacesNavegacion.forEach(item => item.classList.remove('encabezado__enlace--activo'));
        if (enlaceDestino) {
            enlaceDestino.classList.add('encabezado__enlace--activo');
        }
    }

    enlacesNavegacion.forEach(enlace => {
        enlace.addEventListener('click', function () {
            seleccionManual = true;
            establecerEnlaceActivo(this);
            setTimeout(() => {
                seleccionManual = false;
            }, 700);
        });
    });

    window.addEventListener('scroll', () => {
        if (seleccionManual) return;
        const posicionDesplazamiento = window.scrollY + 140;
        let enlaceActivoActual = enlacesNavegacion[0];

        enlacesNavegacion.forEach(enlace => {
            const destino = enlace.getAttribute('href');
            if (destino && destino.startsWith('#')) {
                const seccion = document.querySelector(destino);
                if (seccion && seccion.offsetTop <= posicionDesplazamiento) {
                    enlaceActivoActual = enlace;
                }
            }
        });

        establecerEnlaceActivo(enlaceActivoActual);
    });

    const formularioContacto = document.getElementById('contactForm');
    if (formularioContacto) {
        formularioContacto.addEventListener('submit', (evento) => {
            evento.preventDefault();
            alert('¡Mensaje enviado con éxito! Te responderemos en menos de 24 horas. 🦁');
            formularioContacto.reset();
        });
    }

    renderizarSesionYPanel();
    sincronizarQr();
});