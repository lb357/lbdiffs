import { loadPyodide } from "../libs/pyodide/pyodide.mjs";

export const statusUpdateEvent = new EventTarget();
export const readyEvent = new EventTarget();

let status = "Не определен.";
let pyodide = null;
let ready = false;


export async function initPyodide(libs) {
    try {
        setStatus("Загрузка Pyodide...");
        pyodide = await loadPyodide({
            indexURL: "../libs/pyodide/"
        });
        setStatus("Загрузка интерпретатора Python (Pyodide) завершена!");
        setStatus("Загрузка библиотеки SymPy...");
        await pyodide.loadPackage("sympy");
        setStatus("Библиотека SymPy загружена!");
        for (let lib of libs) {
            let scriptName = `${lib}.py`
            setStatus(`Загрузка скрипта ${scriptName}`);
            await loadPythonScript(scriptName);
            setStatus(`Скрипт ${scriptName} загружен!`);
        }
        setStatus("Загрузка завершена.");
        setReady(true);
    } catch (error) {
        setStatus("Ошибка: " + error);
    }
}

function setStatus(newStatus) {
    status = newStatus;
    statusUpdateEvent.dispatchEvent(
        new CustomEvent("statusUpdate", {
            detail: {
                status: newStatus
            }
        })
    );
}

function setReady(newReady){
    ready = newReady;
    readyEvent.dispatchEvent(
        new CustomEvent("ready", {
            detail: {
                ready: ready
            }
        })
    );
}

export function isReady() {
    return ready;
}

export async function python(command) {
    if (ready && pyodide != null) {
        return pyodide.runPythonAsync(command);
    } else {
        setStatus("Ошибка: Интерпретатор Python не готов или не инициализирован для работы");
        return null;
    }
}


async function loadPythonScript(filename) {
    const response = await fetch(`${filename}`);
    if (!response.ok) {
        setStatus(`Не удалось загрузить python файл ${filename}`);
        return;
    }
    const code = await response.text();
    await pyodide.runPythonAsync(code);
}