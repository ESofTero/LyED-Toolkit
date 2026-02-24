document.addEventListener("DOMContentLoaded", function () {
    if (window.__LYED_VALIDATOR_INIT__) return;
    window.__LYED_VALIDATOR_INIT__ = true;

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

    function updateLabels() {
        let rows = hypothesesEl.querySelectorAll(".hyp-row");

        for (let i = 0; i < rows.length; i++) {
            rows[i].querySelector(".hyp-label").textContent = "H" + (i + 1);
        }

        countText.textContent = "(" + rows.length + "/" + MAX + ")";

        if (rows.length >= MAX) addBtn.classList.add("hidden");
        else addBtn.classList.remove("hidden");

        if (rows.length <= MIN) {
            for (let i = 0; i < rows.length; i++) {
                rows[i].classList.add("no-remove");
                let removeBtn = rows[i].querySelector(".hyp-remove");
                if (removeBtn) removeBtn.classList.add("hidden");
            }
        } else {
            for (let i = 0; i < rows.length; i++) {
                rows[i].classList.remove("no-remove");
                let removeBtn = rows[i].querySelector(".hyp-remove");
                if (removeBtn) removeBtn.classList.remove("hidden");
            }
        }
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

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(remove);

        return row;
    }

    addBtn.addEventListener("click", function () {
        let rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length >= MAX) return;

        hypothesesEl.appendChild(makeRow(""));
        updateLabels();
        resultBox.textContent = "";
    }, false);

    hypothesesEl.addEventListener("click", function (e) {
        let btn = e.target.closest(".hyp-remove");
        if (!btn) return;

        let rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length <= MIN) return;

        let row = btn.closest(".hyp-row");
        if (row) row.remove();

        updateLabels();
        resultBox.textContent = "";
    }, false);

    clearBtn.addEventListener("click", function () {
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow(""));
        hypothesesEl.appendChild(makeRow(""));
        conclusionInput.value = "";
        resultBox.textContent = "";
        updateLabels();
    });

    criticalBtn.addEventListener("click", function () {
        resultBox.textContent = "Listo: aquí irá la validación por Renglón Crítico (pendiente).";
    });

    tautBtn.addEventListener("click", function () {
        resultBox.textContent = "Listo: aquí irá la validación por Tautología (pendiente).";
    });

    updateLabels();
});