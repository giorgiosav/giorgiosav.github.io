
/* Plot code taken partly from http://www.javascripter.net/faq/plotafunctiongraph.htm
The rest was written by Giorgio Savini */

var wp, ws, h, wAarray = [];
var color1 = "rgb(11,153,11)", color2 = "rgb(66,44,255)"

function drawLegend() {
    legend = document.getElementById("legend-canvas");
    if (null==legend || !legend.getContext) return;

    var lctx = legend.getContext('2d');
    var entries = {};

    entries.xpos = 5;
    entries.y1pos = 0.2*legend.height;
    entries.y2pos = 0.6*legend.height;
    entries.lineLength = 30;

    drawLine(color1, entries.xpos, entries.y1pos, lctx, entries.lineLength);
    drawLine(color2, entries.xpos, entries.y2pos, lctx, entries.lineLength);

    lctx.font = "16px Arial";
    lctx.fillText("Portante", entries.xpos + entries.lineLength + 10, entries.y1pos + 5);
    lctx.fillText("Modulante", entries.xpos + entries.lineLength + 10, entries.y2pos + 5);
}

function drawLine(color, posx, posy, ctx, len) {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.moveTo(posx,posy);
    ctx.lineTo(posx + len, posy);
    ctx.stroke();
}

function updateFrequencies() {
    wp = document.getElementById('carrier-frequency').value; // carrier frequency
    ws = document.getElementById('modulator-frequency').value; // modulator frequency
    h = document.getElementById('modulation').value;
}

function updateModArray() {
    wsString = document.getElementById('modulator-frequency').value;
    wsArray = wsString.split(",");
}

function modSignal(x) {
    var sig = 1;
    for(var i = 0; i < wsArray.length; i++) {
        sig *= Math.cos(Number(wsArray[i]) * x);
    }
    return sig;
}

function fun1(x) {

    return (1+h*modSignal(x))* Math.sin(wp*x);
    //return (Math.cos(ws*x)*Math.cos(wp*x));
}
function fun2(x) {


    return 1+h*modSignal(x)
    //return Math.cos(ws*x);
}

function draw() {
    var canvas = document.getElementById("simulation-canvas");
    if (null==canvas || !canvas.getContext) return;

    var axes={}, ctx=canvas.getContext("2d");
    axes.x0 = .5 + .5*canvas.width;  // x0 pixels from left to x=0
    axes.y0 = .5 + .5*canvas.height; // y0 pixels from top to y=0
    axes.scale = 50;                 // 40 pixels from x=0 to x=1
    axes.doNegativeX = true;

    //showAxes(ctx,axes);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    funGraph(ctx,axes,fun1,color1);
    funGraph(ctx,axes,fun2,color2);

}

function funGraph (ctx,axes,func,color) {
    updateFrequencies();
    updateModArray();

    var xx, yy, dx=1, x0=axes.x0, y0=axes.y0, scale=axes.scale;
    var iMax = Math.round((ctx.canvas.width-x0)/dx);
    var iMin = axes.doNegativeX ? Math.round(-x0/dx) : 0;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;

    for (var i=iMin;i<=iMax;i++) {
        xx = dx*i; yy = scale*func(xx/scale);
        if (i==iMin) ctx.moveTo(x0+xx,y0-yy);
        else         ctx.lineTo(x0+xx,y0-yy);
    }
    ctx.stroke();
}

document.getElementById('draw').onclick = draw;
drawLegend();
draw();
