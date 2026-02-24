document.addEventListener("DOMContentLoaded", function () {
    let MAX = 10;
    let MIN = 1;

    let hypothesesEl = document.getElementById("hypotheses");
    let addBtn = document.getElementById("addHypBtn");
    let countText = document.getElementById("countText");
    let conclusionInput = document.getElementById("conclusionInput");
    let resultBox = document.getElementById("resultBox");
    let clearBtn = document.getElementById("clearBtn");
    let criticalBtn = document.getElementById("criticalBtn");
    let tautBtn = document.getElementById("tautBtn");

    // ✅ Si falta algo, no revientes toda la app
    if (!hypothesesEl || !addBtn || !countText || !conclusionInput || !resultBox || !clearBtn || !criticalBtn || !tautBtn) {
        console.error("Falta un elemento en el DOM. Revisa IDs:", {
            hypothesesEl, addBtn, countText, conclusionInput, resultBox, clearBtn, criticalBtn, tautBtn
        });
        return;
    }

    // Protección global ligera: mostrar mensaje amigable y evitar que errores no capturados crasheen la interacción.
    window.addEventListener('error', function (ev) {
        console.error('Error no capturado:', ev.error || ev.message, ev);
        try {
            if (resultBox) resultBox.textContent = 'Se produjo un error inesperado. Revisa la consola para más detalles.';
        } catch (e) { /* no-op */ }
        // No prevengas el default para que la consola siga recibiendo la información.
    });

    // Evitar re-entrancy accidental en updateLabels
    let updatingLabels = false;

    function updateLabels() {
        if (updatingLabels) return;
        updatingLabels = true;
        // Tomamos una snapshot estática
        let rows = hypothesesEl.querySelectorAll(".hyp-row");

        for (let i = 0; i < rows.length; i++) {
            try {
                let lbl = rows[i].querySelector(".hyp-label");
                if (lbl) lbl.textContent = "H" + (i + 1);
            } catch (err) {
                // Si hay un nodo inesperado, no abortamos todo el proceso
                console.warn('updateLabels: fila sin label o con problema', err);
            }
        }

        countText.textContent = "(" + rows.length + "/" + MAX + ")";

        if (rows.length >= MAX) addBtn.classList.add("hidden");
        else addBtn.classList.remove("hidden");

        let removeBtns = hypothesesEl.querySelectorAll(".hyp-remove");

        if (rows.length <= MIN) {
            for (let i = 0; i < rows.length; i++) rows[i].classList.add("no-remove");
            for (let i = 0; i < removeBtns.length; i++) removeBtns[i].classList.add("hidden");
        } else {
            for (let i = 0; i < rows.length; i++) rows[i].classList.remove("no-remove");
            for (let i = 0; i < removeBtns.length; i++) removeBtns[i].classList.remove("hidden");
        }

        updatingLabels = false;
    }

    function clampString(s, max) {
        if (typeof s !== 'string') return '';
        return s.length > max ? s.slice(0, max) : s;
    }

    function makeRow(value) {
        let row = document.createElement("div");
        row.className = "hyp-row";

        let label = document.createElement("div");
        label.className = "hyp-label";
        label.textContent = "H?";

        let input = document.createElement("input");
        input.className = "hyp-input";
        input.type = "text";
        input.placeholder = "Escribe una hipótesis...";
        // Limitar tamaño para evitar entradas excesivamente largas que puedan causar problemas
        input.maxLength = 200;
        input.value = value || "";

        // Defender contra pegados masivos: truncar
        input.addEventListener('paste', function (ev) {
            try {
                let paste = (ev.clipboardData || window.clipboardData).getData('text') || '';
                if (paste.length > input.maxLength) {
                    ev.preventDefault();
                    // Insert trimmed text manualmente
                    let trimmed = clampString(paste, input.maxLength);
                    let start = input.selectionStart || 0;
                    let end = input.selectionEnd || 0;
                    let newVal = input.value.slice(0, start) + trimmed + input.value.slice(end);
                    input.value = clampString(newVal, input.maxLength);
                }
            } catch (e) { /* no-op */ }
        });

        // También defensiva en 'input' (por si el navegador ignora maxlength en alguna circunstancia)
        input.addEventListener('input', function () {
            if (input.value && input.value.length > input.maxLength) {
                input.value = input.value.slice(0, input.maxLength);
            }
        });

        let remove = document.createElement("button");
        remove.className = "hyp-remove";
        remove.type = "button";
        remove.title = "Quitar hipótesis";
        remove.textContent = "–";

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(remove);

        return row;
    }

    // Evita clicks rápidos que podrían crear condiciones inusuales
    function temporaryDisable(el, ms) {
        if (!el) return;
        el.disabled = true;
        setTimeout(() => { try { el.disabled = false; } catch(e){} }, ms || 150);
    }

    addBtn.addEventListener("click", function () {
        try {
            let rows = hypothesesEl.querySelectorAll(".hyp-row");
            if (rows.length >= MAX) return;

            hypothesesEl.appendChild(makeRow(""));
            updateLabels();
            resultBox.textContent = "";

            temporaryDisable(addBtn, 150);
        } catch (err) {
            console.error('Error en addBtn click:', err);
            resultBox.textContent = 'Error al agregar hipótesis. Revisa la consola.';
        }
    });

    hypothesesEl.addEventListener("click", function (e) {
        try {
            let btn = e.target.closest(".hyp-remove");
            if (!btn) return;

            let rows = hypothesesEl.querySelectorAll(".hyp-row");
            if (rows.length <= MIN) return;

            let row = btn.closest(".hyp-row");
            if (row) row.remove();

            updateLabels();
            resultBox.textContent = "";
        } catch (err) {
            console.error('Error al quitar hipótesis:', err);
            resultBox.textContent = 'Error al quitar hipótesis. Revisa la consola.';
        }
    });

    clearBtn.addEventListener("click", function () {
        try {
            hypothesesEl.innerHTML = "";
            hypothesesEl.appendChild(makeRow(""));
            hypothesesEl.appendChild(makeRow(""));
            conclusionInput.value = "";
            resultBox.textContent = "";
            updateLabels();
        } catch (err) {
            console.error('Error en clearBtn click:', err);
            resultBox.textContent = 'Error al limpiar. Revisa la consola.';
        }
    });

    criticalBtn.addEventListener("click", function () {
        try {
            resultBox.textContent = "Listo: aquí irá la validación por Renglón Crítico (pendiente).";
        } catch (err) {
            console.error('Error en criticalBtn click:', err);
            resultBox.textContent = 'Error en validación. Revisa la consola.';
        }
    });

    tautBtn.addEventListener("click", function () {
        try {
            resultBox.textContent = "Listo: aquí irá la validación por Tautología (pendiente).";
        } catch (err) {
            console.error('Error en tautBtn click:', err);
            resultBox.textContent = 'Error en validación. Revisa la consola.';
        }
    });

    // Limita la longitud de la conclusión también (defensa sobre entradas grandes)
    try { conclusionInput.maxLength = 200; } catch(e) {}

    // Defender contra pegados masivos en la conclusión
    conclusionInput.addEventListener('paste', function (ev) {
        try {
            let paste = (ev.clipboardData || window.clipboardData).getData('text') || '';
            if (paste.length > (conclusionInput.maxLength || 200)) {
                ev.preventDefault();
                conclusionInput.value = clampString(paste, conclusionInput.maxLength || 200);
            }
        } catch (e) { /* no-op */ }
    });

    // Validación defensiva en 'input' para la conclusión
    conclusionInput.addEventListener('input', function () {
        try {
            if (conclusionInput.value && conclusionInput.value.length > (conclusionInput.maxLength || 200)) {
                conclusionInput.value = conclusionInput.value.slice(0, conclusionInput.maxLength || 200);
            }
        } catch (e) { /* no-op */ }
    });

    updateLabels();
});