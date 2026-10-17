import {
    initPyodide,
    statusUpdateEvent,
    readyEvent,
    isReady
} from "./pyodide.js";

import {
    solveODE,
    mapNerdamer
} from "./core.js";

const formulaInput = document.getElementById("formulaInput");
const formulaButton = document.getElementById("formulaButton");
const buildButton = document.getElementById("buildButton");



statusUpdateEvent.addEventListener("statusUpdate", (event) => {
    console.log(event.detail.status);
    if (!isReady()) {
        renderer.renderText(event.detail.status);
    }
});


readyEvent.addEventListener("ready", (event) => {
    if (event.detail.ready) {
        formulaInput.value = "dy/dx=y+cos(x)-sin(x)";
        formulaButton.disabled = false;
        formulaInput.disabled = false;
        renderer.clear();
        renderer.renderText("Графопостроитель готов к работе!");
    }
});


initPyodide(["main"]);


buildButton.addEventListener("click", async () => {
    chart.clearGraph();
    chart.renderFunctions();
})

formulaButton.addEventListener("click", async () => { 
    formulaButton.disabled = true;
    renderer.clear();
    renderer.renderText("Уравнение:");
    try {
        renderer.renderTeX(nerdamer(formulaInput.value).toTeX().replace("{d2y}", "{d^{2}y}").replace("{dx2}", "{dx^{2}}").replace("{d3y}", "{d^{3}y}").replace("{dx3}", "{dx^{3}}"));
    } catch (error) {
        renderer.renderText("Уравнение не распознано");
        formulaButton.disabled = false;
        return;
    }
    solveODE(formulaInput.value).then(rawSolutions => {
        if (rawSolutions.ok) {
            let solutions = mapNerdamer(rawSolutions.result);
            renderer.renderText("Решение(-ия) y(x) на множестве:");
            for (let solution of solutions){
                renderer.renderData(solution);
            }
            chart.storeFunctions(solutions);
            console.log(solutions);
        } else {
            console.log(rawSolutions);
            renderer.renderText("Не удалось найти решение(-ия) y(x) на множестве действительных чисел:");
            renderer.renderText(rawSolutions.result);
        }
        formulaButton.disabled = false;
    });
});
    //renderer.renderTeX(solution);});