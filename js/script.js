document.addEventListener('DOMContentLoaded', () => {
    const ADMIN_ACCOUNT = {
        name: 'Administrador Hakuna Matata',
        email: 'admin@hakunamatata.bo',
        password: 'admin123',
        role: 'admin'
    };

    const GUEST_USER = {
        name: 'Invitado Hakuna Matata',
        email: 'invitado@hakunamatata.bo',
        password: '',
        role: 'user'
    };

    let users = JSON.parse(localStorage.getItem('hm_users')) || [ADMIN_ACCOUNT];
    if (!users.some(u => u.email === ADMIN_ACCOUNT.email)) {
        users.push(ADMIN_ACCOUNT);
        localStorage.setItem('hm_users', JSON.stringify(users));
    }

    let appointments = JSON.parse(localStorage.getItem('hm_appointments')) || [
        {
            id: 1,
            userEmail: 'lucia@ejemplo.com',
            userName: 'Lucía Fernández',
            petName: 'Luna (Perro)',
            service: 'Consulta General',
            price: 50,
            doctor: 'Dra. Elena Martínez',
            date: '2026-11-24T10:00',
            payment: 'QR Simple (Bs.)',
            status: 'Pendiente'
        }
    ];

    let currentUser = JSON.parse(localStorage.getItem('hm_currentUser')) || null;

    const sessionContainer = document.getElementById('hmSessionArea');
    const dashboardSection = document.getElementById('hmDashboard');
    const authModal = document.getElementById('hmAuthModal');
    const bookingModal = document.getElementById('hmBookingModal');
    const tableBody = document.getElementById('hmTableBody');

    function openModal(modalEl) {
        if (modalEl) {
            modalEl.classList.remove('modal--hidden');
        }
    }

    function closeModal(modalEl) {
        if (modalEl) {
            modalEl.classList.add('modal--hidden');
        }
    }

    function formatDateTime(rawDate) {
        if (!rawDate) return '';
        const parsed = new Date(rawDate);
        if (Number.isNaN(parsed.getTime())) {
            return rawDate.replace('T', ' ');
        }
        const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const diaNombre = dias[parsed.getDay()];
        const dd = String(parsed.getDate()).padStart(2, '0');
        const mm = String(parsed.getMonth() + 1).padStart(2, '0');
        const yyyy = parsed.getFullYear();
        const hh = String(parsed.getHours()).padStart(2, '0');
        const min = String(parsed.getMinutes()).padStart(2, '0');
        return `${diaNombre} ${dd}/${mm}/${yyyy} · ${hh}:${min}`;
    }

    function renderSessionAndDashboard() {
        if (!sessionContainer) return;

        if (currentUser) {
            sessionContainer.innerHTML = `
                <span class="header__user-badge">${currentUser.role === 'admin' ? '👑 Admin' : '🐾 ' + currentUser.name.split(' ')[0]}</span>
                <button type="button" id="hmBtnLogout" class="btn btn--outline">Salir</button>
            `;

            const btnLogout = document.getElementById('hmBtnLogout');
            if (btnLogout) {
                btnLogout.addEventListener('click', () => {
                    currentUser = null;
                    localStorage.removeItem('hm_currentUser');
                    renderSessionAndDashboard();
                });
            }

            if (dashboardSection) {
                dashboardSection.classList.remove('dashboard--hidden');
            }

            const metricsEl = document.getElementById('hmAdminMetrics');
            const roleTagEl = document.getElementById('hmRoleTag');
            const dashTitleEl = document.getElementById('hmDashTitle');
            const dashSubEl = document.getElementById('hmDashSub');

            if (currentUser.role === 'admin') {
                if (roleTagEl) roleTagEl.textContent = '👑 ADMINISTRADOR DE LA PÁGINA';
                if (dashTitleEl) dashTitleEl.textContent = 'Panel de Control — Hakuna Matata';
                if (dashSubEl) dashSubEl.textContent = 'Controla todas las citas, estados e ingresos en Bolivianos (Bs.).';
                if (metricsEl) metricsEl.classList.remove('dashboard__metrics--hidden');
            } else {
                if (roleTagEl) roleTagEl.textContent = '🐾 CUENTA DE USUARIO';
                if (dashTitleEl) dashTitleEl.textContent = `Hola, ${currentUser.name}`;
                if (dashSubEl) dashSubEl.textContent = 'Revisa tus citas agendadas y reserva nuevas atenciones.';
                if (metricsEl) metricsEl.classList.add('dashboard__metrics--hidden');
            }

            renderTable();
        } else {
            sessionContainer.innerHTML = `<button type="button" id="hmBtnOpenAuth" class="btn btn--outline">Ingresar / Registrarse</button>`;
            const btnOpenAuth = document.getElementById('hmBtnOpenAuth');
            if (btnOpenAuth) {
                btnOpenAuth.addEventListener('click', () => openModal(authModal));
            }
            if (dashboardSection) {
                dashboardSection.classList.add('dashboard--hidden');
            }
        }
    }

    function renderTable() {
        if (!tableBody || !currentUser) return;

        tableBody.innerHTML = '';
        const list = currentUser.role === 'admin'
            ? appointments
            : appointments.filter(a => a.userEmail === currentUser.email);

        if (currentUser.role === 'admin') {
            const pend = appointments.filter(a => a.status === 'Pendiente').length;
            const totalBs = appointments.reduce((sum, item) => sum + Number(item.price), 0);
            const metricTotal = document.getElementById('hmMetricTotal');
            const metricPend = document.getElementById('hmMetricPend');
            const metricBs = document.getElementById('hmMetricBs');

            if (metricTotal) metricTotal.textContent = appointments.length;
            if (metricPend) metricPend.textContent = pend;
            if (metricBs) metricBs.textContent = `Bs. ${totalBs}`;
        }

        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="data-table__td data-table__empty">No hay citas registradas todavía.</td></tr>`;
            return;
        }

        list.forEach(cita => {
            const tr = document.createElement('tr');
            const stModifier = cita.status === 'Atendida' ? 'data-table__status--atendida' : 'data-table__status--pendiente';
            const btns = currentUser.role === 'admin'
                ? `<button type="button" class="data-table__btn data-table__btn--ok" onclick="hmAtender(${cita.id})">Atender</button>
                   <button type="button" class="data-table__btn data-table__btn--del" onclick="hmEliminar(${cita.id})">Eliminar</button>`
                : `<button type="button" class="data-table__btn data-table__btn--del" onclick="hmEliminar(${cita.id})">Cancelar</button>`;

            tr.innerHTML = `
                <td class="data-table__td">${cita.userName}</td>
                <td class="data-table__td">${cita.petName}</td>
                <td class="data-table__td">${cita.service}</td>
                <td class="data-table__td">${cita.doctor}</td>
                <td class="data-table__td">${formatDateTime(cita.date)}</td>
                <td class="data-table__td"><strong>Bs. ${cita.price}</strong></td>
                <td class="data-table__td"><span class="data-table__status ${stModifier}">${cita.status}</span></td>
                <td class="data-table__td">${btns}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    window.hmAtender = (id) => {
        appointments = appointments.map(a => a.id === id ? { ...a, status: 'Atendida' } : a);
        localStorage.setItem('hm_appointments', JSON.stringify(appointments));
        renderTable();
    };

    window.hmEliminar = (id) => {
        appointments = appointments.filter(a => a.id !== id);
        localStorage.setItem('hm_appointments', JSON.stringify(appointments));
        renderTable();
    };

    const tabLogin = document.getElementById('hmTabLogin');
    const tabReg = document.getElementById('hmTabReg');
    const loginForm = document.getElementById('hmLoginForm');
    const regForm = document.getElementById('hmRegForm');

    if (tabLogin && tabReg && loginForm && regForm) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('modal__tab--active');
            tabReg.classList.remove('modal__tab--active');
            loginForm.classList.remove('form--hidden');
            regForm.classList.add('form--hidden');
        });

        tabReg.addEventListener('click', () => {
            tabReg.classList.add('modal__tab--active');
            tabLogin.classList.remove('modal__tab--active');
            regForm.classList.remove('form--hidden');
            loginForm.classList.add('form--hidden');
        });
    }

    const closeAuthBtn = document.getElementById('hmCloseAuth');
    const closeBookingBtn = document.getElementById('hmCloseBooking');

    if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => closeModal(authModal));
    if (closeBookingBtn) closeBookingBtn.addEventListener('click', () => closeModal(bookingModal));

    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeModal(authModal);
        });
    }

    if (bookingModal) {
        bookingModal.addEventListener('click', (e) => {
            if (e.target === bookingModal) closeModal(bookingModal);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('hmLoginEmail').value.trim();
            const pass = document.getElementById('hmLoginPass').value.trim();
            const user = users.find(u => u.email === email && u.password === pass);
            if (user) {
                currentUser = user;
                localStorage.setItem('hm_currentUser', JSON.stringify(currentUser));
                closeModal(authModal);
                loginForm.reset();
                renderSessionAndDashboard();
            } else {
                alert('Correo o contraseña incorrectos.');
            }
        });
    }

    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('hmRegName').value.trim();
            const email = document.getElementById('hmRegEmail').value.trim();
            const pass = document.getElementById('hmRegPass').value.trim();
            if (users.some(u => u.email === email)) {
                alert('Ese correo ya está registrado.');
                return;
            }
            const nuevo = { name, email, password: pass, role: 'user' };
            users.push(nuevo);
            localStorage.setItem('hm_users', JSON.stringify(users));
            currentUser = nuevo;
            localStorage.setItem('hm_currentUser', JSON.stringify(currentUser));
            closeModal(authModal);
            regForm.reset();
            renderSessionAndDashboard();
        });
    }

    // Asignar fecha y hora por defecto al abrir el modal de cita
    const dateInputEl = document.getElementById('hmDate');
    function setDefaultDateTime() {
        if (!dateInputEl) return;
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        dateInputEl.value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }

    // Botones Agendar Cita: abren el modal directo y si no hay sesión usan Invitado automáticamente
    const btnAgendars = document.querySelectorAll('#btnAgendarHeader, #btnAgendarHero, #btnAgendarFooter, #hmBtnNewBooking');
    btnAgendars.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentUser) {
                currentUser = { ...GUEST_USER };
                localStorage.setItem('hm_currentUser', JSON.stringify(currentUser));
                renderSessionAndDashboard();
            }
            setDefaultDateTime();
            openModal(bookingModal);
        });
    });

    const serviceEl = document.getElementById('hmService');
    const paymentEl = document.getElementById('hmPayment');
    const qrPreview = document.getElementById('hmQrPreview');
    const qrText = document.getElementById('hmQrText');

    function syncQr() {
        if (!serviceEl || !paymentEl || !qrPreview || !qrText) return;
        const price = serviceEl.options[serviceEl.selectedIndex].dataset.price;
        qrText.textContent = `Monto: Bs. ${price}`;
        qrPreview.classList.toggle('qr-box--hidden', !paymentEl.value.includes('QR'));
    }

    if (serviceEl) serviceEl.addEventListener('change', syncQr);
    if (paymentEl) paymentEl.addEventListener('change', syncQr);

    const bookingForm = document.getElementById('hmBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentUser) {
                currentUser = { ...GUEST_USER };
                localStorage.setItem('hm_currentUser', JSON.stringify(currentUser));
            }
            const opt = serviceEl.options[serviceEl.selectedIndex];
            const dateVal = dateInputEl ? dateInputEl.value : '';
            const nuevaCita = {
                id: Date.now(),
                userEmail: currentUser.email,
                userName: currentUser.name,
                petName: `${document.getElementById('hmPetName').value} (${document.getElementById('hmPetType').value})`,
                service: serviceEl.value,
                price: Number(opt.dataset.price),
                doctor: document.getElementById('hmDoctor').value,
                date: dateVal,
                payment: paymentEl.value,
                status: 'Pendiente'
            };
            appointments.push(nuevaCita);
            localStorage.setItem('hm_appointments', JSON.stringify(appointments));
            closeModal(bookingModal);
            bookingForm.reset();
            syncQr();
            renderSessionAndDashboard();
            if (dashboardSection) {
                dashboardSection.scrollIntoView({ behavior: 'smooth' });
            }
            alert(`Cita agendada para ${formatDateTime(dateVal)} por Bs. ${nuevaCita.price}.`);
        });
    }

    // Menú interactivo: cambia el verde al enlace presionado y al hacer scroll
    const navLinks = document.querySelectorAll('.header__link');
    let manualSelection = false;

    function setActiveLink(targetLink) {
        navLinks.forEach(item => item.classList.remove('header__link--active'));
        if (targetLink) {
            targetLink.classList.add('header__link--active');
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            manualSelection = true;
            setActiveLink(this);
            setTimeout(() => {
                manualSelection = false;
            }, 700);
        });
    });

    window.addEventListener('scroll', () => {
        if (manualSelection) return;
        const scrollPos = window.scrollY + 140;
        let currentActive = navLinks[0];

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = document.querySelector(href);
                if (section && section.offsetTop <= scrollPos) {
                    currentActive = link;
                }
            }
        });

        setActiveLink(currentActive);
    });

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('¡Mensaje enviado con éxito! Te responderemos en menos de 24 horas. 🦁');
            contactForm.reset();
        });
    }

    renderSessionAndDashboard();
    syncQr();
});