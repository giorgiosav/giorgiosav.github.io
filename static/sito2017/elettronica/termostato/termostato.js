var tempSlide, temppar, temp;
tempPar = document.getElementById("temppar");

function getTemp() {
    tempSlide = document.getElementById("tempslide").value;
    temp = tempSlide * 50/100;
}

function updateTemp() {
    getTemp();
    var r = Math.round(tempSlide*255/100);
    var b = 255-r;

    var tempString = temp.toFixed(1) + " °C"
    var colorString = "#"+("0"+r.toString(16)).slice(-2)+"11"+("0"+b.toString(16)).slice(-2); /* slice(-2) makes sure the number is always 2 digits*/
    tempPar.innerHTML ="<b>"+tempString.fontcolor(colorString)+"</b>";
}


function updateCanvas() {
    getTemp();

    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");
    var img = document.getElementById("circuit");
    var imgRatio = img.height/img.width;

    // var articleWidth = document.getElementsByClassName("article")[0].offsetWidth; //standard form for ClassName width
    var articleWidth = document.getElementById("article").offsetWidth; //offsetWidth or it won't work
    var imgWidth = 0.9*articleWidth;
    var cu; /*canvas unit*/
    var imgX;

    canvas.width = articleWidth; /* Canvas as wide as article */
    canvas.height = imgWidth*imgRatio;

    imgX = (canvas.width - imgWidth)/2;
    cu = imgWidth/100;

    ctx.font = 3.5*cu+"px Arial";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillText(temp.toFixed(1) + " \xB0C",10,50);
    ctx.drawImage(img,imgX,0, imgWidth, imgWidth*imgRatio);

    lightUp(ctx, imgX+76*cu, 15*cu, 4*cu);

    ctx.fillStyle = "rgb(180,0,0)"; //Fill color for what comes next

    thermistorVal(ctx, imgX+41*cu, 61*cu, imgX + 45*cu, 43*cu);
    fixedVoltage(ctx, imgX + 13*cu, 33*cu);
    comparatorOutput(ctx, imgX + 77*cu, 37*cu);
}


function lightUp(ctx, x, y, r) {
    if(temp >= 30) {
        var grd = ctx.createRadialGradient(x,y,r/2,x,y,r);
        grd.addColorStop(0,"rgba(200,0,0,0.8)");
        grd.addColorStop(1,"rgba(200,200,200,0.8)");

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.fillStyle = grd;
        ctx.fill();
    }
}

function thermistorVal(ctx, x1, y1, x2, y2) {
    var m = 19.7;
    var b = 0.388; /*y=m - b x*/
    var rth = m - b * temp; /*Thermistor value*/
    var vvar = 5 * rth / (rth + 10); /* variable voltage*/
    ctx.fillText(rth.toFixed(2) + "k", x1, y1);
    ctx.fillText(vvar.toFixed(2) + "V", x2, y2);
}

function fixedVoltage(ctx, x, y) {
    ctx.fillText("2.23V", x, y);
}

function comparatorOutput(ctx, x, y) {
    if(temp >= 30) {
        ctx.fillText("0V", x, y);
    } else {
        ctx.fillText("5V", x, y);
    }
}


window.addEventListener('resize', updateCanvas); /* Resizes canvas with window */
this.updateTemp();
this.updateCanvas();
