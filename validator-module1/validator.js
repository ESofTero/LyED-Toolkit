(function () {
    let MAX = 10;
    let MIN = 1;

    let hypothesesEl = document.getElementById("hypotheses");
    let addBtn = document.getElementById("addHypBtn");
    let countText = document.getElementById("countText");
    let conclusionInput = document.getElementById("conclusionInput");
    let resultBox = document.getElementById("resultBox");
    let clearBtn = document.getElementById("clearBtn");

    function updateLabels() {
        let rows = hypothesesEl.querySelectorAll(".hyp-row");

        for (let i = 0; i < rows.length; i++) {
            rows[i].querySelector(".hyp-label").textContent = "H" + (i + 1);
        }

        countText.textContent = "(" + rows.length + "/" + MAX + ")";

        if (rows.length >= MAX) addBtn.classList.add("hidden");
        else addBtn.classList.remove("hidden");
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

    // ✅ Un solo listener para quitar (evita duplicados)
    hypothesesEl.addEventListener("click", function (e) {
        let btn = e.target.closest(".hyp-remove");
        if (!btn) return;

        let rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length <= MIN) return;

        let row = btn.closest(".hyp-row");
        if (row) row.remove();

        updateLabels();
        resultBox.textContent = "";
    });

    addBtn.addEventListener("click", function () {
        if (addBtn.dataset.busy === "1") return;
        addBtn.dataset.busy = "1";
        setTimeout(() => addBtn.dataset.busy = "0", 0);

        let rows = hypothesesEl.querySelectorAll(".hyp-row");
        if (rows.length >= MAX) return;

        hypothesesEl.appendChild(makeRow(""));
        updateLabels();
    });

    clearBtn.addEventListener("click", function () {
        hypothesesEl.innerHTML = "";
        hypothesesEl.appendChild(makeRow(""));
        hypothesesEl.appendChild(makeRow(""));
        conclusionInput.value = "";
        resultBox.textContent = "";
        updateLabels();
    });

    document.getElementById("criticalBtn").addEventListener("click", function () {
        resultBox.textContent = "Listo: aquí irá la validación por Renglón Crítico (pendiente).";
    });

    document.getElementById("tautBtn").addEventListener("click", function () {
        resultBox.textContent = "Listo: aquí irá la validación por Tautología (pendiente).";
    });

    updateLabels();
})();