class Renderer{
    constructor(id) {
        this.latex = document.getElementById(id);
    }

    clear() {
        this.latex.replaceChildren();
    }
    
    renderData(data) {
        this.renderTeX(data.toTeX());
    }

    renderText(text){
        this.renderTeX("\\text{"+text+"}");
    }

    renderTeX(tex){
        var li = document.createElement('li');
        li.appendChild(document.createElement('div'));

        katex.render(tex, li, {
            throwOnError: false
        });

        this.latex.appendChild(li);
    }
}

class FunctionGraph {
    constructor(id) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');

        this.setScale(1.0);

        this.clear();
    }

    setScale(scale) {
        this.scale = 40 * scale;
    }

    getPixelCoord(x, y) {
        return {
            x: this.canvas.width / 2 + x * this.scale,
            y: this.canvas.height / 2 - y * this.scale
        };
    }

    getMinX() {
        return -this.canvas.width / 2 / this.scale;
    }

    getMaxX() {
        return this.canvas.width / 2 / this.scale;
    }

    getMinY() {
        return -this.canvas.height / 2 / this.scale;
    }

    getMaxY() {
        return this.canvas.height / 2 / this.scale;
    }

    clear() {
        const { ctx, canvas } = this;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Оси
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        // X
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);

        // Y
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);

        ctx.stroke();

        // Подписи осей и координат
        this.drawLabels();
    }

    drawLabels() {
        const { ctx, canvas, scale } = this;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Подписи X и Y
        ctx.fillText('X', canvas.width - 12, centerY - 12);
        ctx.fillText('Y', centerX + 12, 12);

        // Числовые координаты по оси X
        const maxX = Math.floor(centerX / scale);
        const maxY = Math.floor(centerY / scale);

        for (let x = -maxX; x <= maxX; x++) {
            if (x === 0) continue;

            const px = centerX + x * scale;

            // Маленькая отметка на оси
            ctx.beginPath();
            ctx.moveTo(px, centerY - 3);
            ctx.lineTo(px, centerY + 3);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Число под осью X
            ctx.fillText(x, px, centerY + 14);
        }

        // Числовые координаты по оси Y
        for (let y = -maxY; y <= maxY; y++) {
            if (y === 0) continue;

            const py = centerY - y * scale;

            // Маленькая отметка на оси
            ctx.beginPath();
            ctx.moveTo(centerX - 3, py);
            ctx.lineTo(centerX + 3, py);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Число слева от оси Y
            ctx.textAlign = 'right';
            ctx.fillText(y, centerX - 7, py);
            ctx.textAlign = 'center';
        }

        // Ноль в начале координат
        ctx.textAlign = 'right';
        ctx.fillText('0', centerX - 6, centerY + 12);
        ctx.textAlign = 'center';
    }

    
    drawLine(points, color, width) {
        if (!points || points.length < 2) return;

        const { ctx } = this;

        ctx.beginPath();

        const first = this.getPixelCoord(points[0].x, points[0].y);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < points.length; i++) {
            const p = this.getPixelCoord(points[i].x, points[i].y);
            ctx.lineTo(p.x, p.y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }
}

const renderer = new Renderer("latex");
const chart = new FunctionGraph('chart');

