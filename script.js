// 1. CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyD_WiArRCE8_x7il5xaKCVkrHJo9mW6DT0",
    authDomain: "calendario-sofii.firebaseapp.com",
    projectId: "calendario-sofii",
    storageBucket: "calendario-sofii.firebasestorage.app",
    messagingSenderId: "510593512305",
    appId: "1:510593512305:web:4bd38144068d757beafcd0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ⚠️ REEMPLAZA ESTO CON LA URL LARGA QUE TE DARÁ MACRODROID EN TU CELULAR
const URL_MI_BOT_PROPIO = "https://trigger.macrodroid.com/TU_CODIGO_AQUÍ/alerta_sofi";

let fechaActualAlmanaque = new Date();
let listaFechasGuardadas = []; 

// 2. ELEMENTOS DE LA PÁGINA
const modalCalendario = document.getElementById("modal-calendario");
const btnCalendario = document.getElementById("btn-calendario");
const cerrarCalendario = document.getElementById("cerrar-calendario");

const btnGuardarFecha = document.getElementById("btn-guardar-fecha");
const fechaInput = document.getElementById("fecha-input");
const descInput = document.getElementById("desc-input");
const listaFechas = document.getElementById("lista-fechas");
const contenedorAlmanaque = document.getElementById("almanaque-visual");

// Control de ventanas flotantes
const modalCuriosidades = document.getElementById("modal-curiosidades");
document.getElementById("btn-curiosidades").onclick = () => modalCuriosidades.style.display = "flex";
document.getElementById("cerrar-curiosidades").onclick = () => modalCuriosidades.style.display = "none";

btnCalendario.onclick = () => { modalCalendario.style.display = "flex"; cargarFechas(); };
cerrarCalendario.onclick = () => modalCalendario.style.display = "none";

window.onclick = (event) => {
    if (event.target == modalCuriosidades) modalCuriosidades.style.display = "none";
    if (event.target == modalCalendario) modalCalendario.style.display = "none";
};

// Acordeón para secretos
const secretos = document.querySelectorAll('.secreto-item');
secretos.forEach(secreto => {
    const pregunta = secreto.querySelector('.secreto-pregunta');
    if(pregunta) {
        pregunta.addEventListener('click', () => {
            const respuesta = secreto.querySelector('.secreto-respuesta');
            if(respuesta) {
                respuesta.style.display = (respuesta.style.display === "block") ? "none" : "block";
            }
        });
    }
});

// 3. DIBUJAR ALMANAQUE NATIVO Y CONFIGURAR INTERACCIÓN
function dibujarAlmanaque() {
    const año = fechaActualAlmanaque.getFullYear();
    const mes = fechaActualAlmanaque.getMonth();
    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const primerDiaIndex = new Date(año, mes, 1).getDay(); 
    const totalDiasMes = new Date(año, mes + 1, 0).getDate();

    let html = `
        <div class="almanaque-header">
            <button id="ant-mes"><i class="fas fa-chevron-left"></i></button>
            <span>${nombresMeses[mes]} ${año}</span>
            <button id="sig-mes"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="almanaque-semana">
            <div>Do</div><div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sá</div>
        </div>
        <div class="almanaque-dias">
    `;

    for (let i = 0; i < primerDiaIndex; i++) html += `<div class="dia-celda dia-vacio"></div>`;

    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const mesFormateado = String(mes + 1).padStart(2, '0');
        const diaFormateado = String(dia).padStart(2, '0');
        const stringFechaCelda = `${año}-${mesFormateado}-${diaFormateado}`;
        const tieneEvento = listaFechasGuardadas.includes(stringFechaCelda);
        const claseEvento = tieneEvento ? "dia-con-evento" : "";

        html += `<div class="dia-celda ${claseEvento}" data-fecha="${stringFechaCelda}">${dia}</div>`;
    }

    html += `</div>`;
    contenedorAlmanaque.innerHTML = html;

    document.getElementById("ant-mes").onclick = () => { fechaActualAlmanaque.setMonth(fechaActualAlmanaque.getMonth() - 1); dibujarAlmanaque(); };
    document.getElementById("sig-mes").onclick = () => { fechaActualAlmanaque.setMonth(fechaActualAlmanaque.getMonth() + 1); dibujarAlmanaque(); };

    // AL DAR CLICK EN UN DÍA DEL CALENDARIO:
    const celdas = contenedorAlmanaque.querySelectorAll('.dia-celda:not(.dia-vacio)');
    celdas.forEach(celda => {
        celda.onclick = () => {
            celdas.forEach(c => c.classList.remove('dia-seleccionado'));
            celda.classList.add('dia-seleccionado');
            const fechaSeleccionada = celda.getAttribute('data-fecha');
            fechaInput.value = fechaSeleccionada;

            // Si el día tiene un evento, baja de inmediato y lo enfoca con destello rosa
            if (celda.classList.contains('dia-con-evento')) {
                const tarjetaObjetivo = document.getElementById(`tarjeta-${fechaSeleccionada}`);
                if (tarjetaObjetivo) {
                    tarjetaObjetivo.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    tarjetaObjetivo.classList.add('tarjeta-enfocada');
                    setTimeout(() => tarjetaObjetivo.classList.remove('tarjeta-enfocada'), 1500);
                }
            }
        };
    });
}

// --- LEER Y DESPLEGAR EVENTOS (FIREBASE) ---
function cargarFechas() {
    listaFechas.innerHTML = "<p style='text-align:center; color:#999; margin-top: 10px;'>Buscando recuerdos...</p>";
    
    db.collection("fechas").get().then((querySnapshot) => {
        listaFechas.innerHTML = ""; 
        let notas = [];
        listaFechasGuardadas = []; 
        
        if (querySnapshot.empty) {
            listaFechas.innerHTML = "<p style='text-align:center; color:#999; margin-top: 10px;'>Aún no hay fechas guardadas. ¡Añade la primera!</p>";
            dibujarAlmanaque(); 
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            notas.push({ id: doc.id, fecha: data.fecha, descripcion: data.descripcion });
            listaFechasGuardadas.push(data.fecha); 
        });

        notas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        notas.forEach((nota) => {
            const fechaObj = new Date(nota.fecha + 'T00:00:00'); 
            const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
            const fechaBonita = fechaObj.toLocaleDateString('es-ES', opciones);

            const div = document.createElement("div");
            div.className = "secreto-item glass-mini fecha-item";
            div.id = `tarjeta-${nota.fecha}`; 
            div.innerHTML = `
                <div class="fecha-header">
                    <strong>${fechaBonita}</strong>
                    <button class="btn-eliminar" onclick="eliminarFecha('${nota.id}')"><i class="fas fa-trash-alt"></i></button>
                </div>
                <p id="desc-${nota.id}" ondblclick="editarFecha('${nota.id}', '${nota.descripcion}')">${nota.descripcion}</p>
                <small style="color: #666; font-size: 0.75rem; margin-top: 5px; display: block;">💡 Doble clic en el texto para editar</small>
            `;
            listaFechas.appendChild(div);
        });

        dibujarAlmanaque();
        motorVerificacionPropio(notas); // Revisa si tu celular debe disparar el WhatsApp Business
    });
}

// --- MOTOR DE ALERTAS DIRECTO A TU WHATSAPP BUSINESS ---
function motorVerificacionPropio(listaFechas) {
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);

    const stringHoy = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    const stringMañana = `${mañana.getFullYear()}-${String(mañana.getMonth()+1).padStart(2,'0')}-${String(mañana.getDate()).padStart(2,'0')}`;

    listaFechas.forEach((item) => {
        let mensajeAlerta = "";
        
        if (item.fecha === stringHoy) {
            mensajeAlerta = `¡Es hoy! 🎉 Hoy celebramos vuestra fecha especial: ${item.descripcion}. ¡Feliz día! 💕`;
        } else if (item.fecha === stringMañana) {
            mensajeAlerta = `¡Recuerdo tierno! 🌹 Mañana se cumple un momento muy especial: ${item.descripcion}. ¡Que no se te pase! 🥰`;
        }

        if (mensajeAlerta !== "") {
            // Envía la orden directa a tu MacroDroid usando tu URL personal
            fetch(`${URL_MI_BOT_PROPIO}?alerta_msg=${encodeURIComponent(mensajeAlerta)}`, { mode: 'no-cors' })
                .then(() => console.log("Señal enviada al WhatsApp Business con éxito."))
                .catch(err => console.error("Error al conectar con MacroDroid:", err));
        }
    });
}

// --- MÉTODOS CRUD (GUARDAR, BORRAR, EDITAR) ---
btnGuardarFecha.onclick = () => {
    const fecha = fechaInput.value; const desc = descInput.value;
    if (fecha === "" || desc === "") { alert("Por favor llena ambos campos 😊"); return; }
    btnGuardarFecha.innerText = "Guardando...";
    db.collection("fechas").add({ fecha: fecha, descripcion: desc }).then(() => {
        fechaInput.value = ""; descInput.value = ""; btnGuardarFecha.innerText = "Guardar Fecha"; cargarFechas();
    });
};

function eliminarFecha(id) {
    if (confirm("¿Borrar este recuerdo? 🥺")) { db.collection("fechas").doc(id).delete().then(() => cargarFechas()); }
}

function editarFecha(id, descripcionActual) {
    const nuevoTexto = prompt("Edita tu recuerdo o plan:", descripcionActual);
    if (nuevoTexto === null || nuevoTexto.trim() === "") return;
    db.collection("fechas").doc(id).update({ descripcion: nuevoTexto }).then(() => cargarFechas());
}
