(function () {
    let MAX = 10;

    let hypothesesEl = document.getElementById("hypotheses");
    let addBtn = document.getElementById("addHypBtn");
    let countText = document.getElementById("countText");

    let conclusionInput = document.getElementById("conclusionInput");
    let resultBox = document.getElementById("resultBox");

    let exampleBtn = document.getElementById("exampleBtn");
    let clearBtn = document.getElementById("clearBtn");

    function updateLabels() {
        let rows = hypothesesEl.querySelectorAll(".hyp-row");
        for (let i = 0; i < rows.length; i++) {
            rows[i].querySelector(".hyp-label").textContent = "H" + (i + 1);
        }
        countText.textContent = "(" + rows.length + "/" + MAX + ")";
        addBtn.disabled = rows.length >= MAX;
        addBtn.style.opacity = addBtn.disabled ? "0.6" : "1";
        addBtn.style.cursor = addBtn.disabled ? "not-allowed" : "pointer";
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
        input.value = value || "";

        let remove = document.createElement("button");
        remove.className = "hyp-remove";
        remove.type = "button";
        remove.title = "Quitar hipótesis";
        remove.textContent = "–";

        remove.addEventListener("click", function () {
            row.remove();
            updateLabels();
            resultBox.textContent = "";
        });

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(remove);

        return row;
    }

    function attachRemoveHandlersToExisting() {
        let removes = hypothesesEl.querySelectorAll(".hyp-remove");
        for (let i = 0; i < removes.length; i++) {
            (function (btn) {
                btn.addEventListener("click", function () {
                    let row = btn.closest(".hyp-row");
                    if (row) row.remove();
                    updateLabels();
                    resultBox.textContent = "";
                });
            })(removes[i]);
        }
    }

    addBtn.addEventListener("click", function () {
        let rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length >= MAX) return;

        hypothesesEl.appendChild(makeRow(""));
        updateLabels();
    });

    exampleBtn.addEventListener("click", function () {
        // Ejemplo clásico: p -> q, p ⟹ q
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow("p -> q"));
        hypothesesEl.appendChild(makeRow("p"));
        conclusionInput.value = "q";
        attachRemoveHandlersToExisting();
        updateLabels();
        resultBox.textContent = "";
    });

    clearBtn.addEventListener("click", function () {
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow(""));
        hypothesesEl.appendChild(makeRow(""));
        conclusionInput.value = "";
        attachRemoveHandlersToExisting();
        updateLabels();
        resultBox.textContent = "";
    });

    // Botones grandes (por ahora solo placeholder visual)
    document.getElementById("criticalBtn").addEventListener("click", function () {
        resultBox.textContent = "Listo: aquí irá la validación por Renglón Crítico (pendiente).";
    });

    document.getElementById("tautBtn").addEventListener("click", function () {
        resultBox.textContent = "Listo: aquí irá la validación por Tautología (pendiente).";
    });

    // Init
    attachRemoveHandlersToExisting();
    updateLabels();
})();