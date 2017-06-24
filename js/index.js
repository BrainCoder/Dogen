/**
 * Created by Mitchell on 23-6-2017.
 */
$(function(){
    var events = [];
    var currentTime = 0;
    var clockTime = 50;
    var clockName = "";
    var signalStatus = {};

    var lastRenderDistance = 0;

    $("#add-signal-btn").click(function (e) {
        swal({
                title: "New Signal",
                text: "Please name your signal:",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "InputA"
            },
            function(inputName){
                if (inputName === false) return false;

                if (inputName === "") {
                    swal.showInputError("You need to name your signal!");
                    return false
                }

                $("#main-table").loadTemplate($("#signal-template"),
                    {
                        id:             "signal-"+inputName,
                        idGraph:        "graph-"+inputName,
                        idImg:          "signal-img-"+inputName,
                        idSigOn:        "signal-on-"+inputName,
                        idSigOff:       "signal-off-"+inputName,
                        signalName:     inputName
                    },
                    { append: true }
                );
                var sign = {
                    "name":inputName,
                    "value":"unknown"
                };
                signalStatus[inputName] = sign;

                var event = {
                    "time": 0,
                    "name": inputName,
                    "value":"unknown"
                };
                events.push(event);

                $("#signal-on-"+inputName).click(function (e) {
                    signalStatus[inputName].value = "on";
                    $("#signal-img-"+inputName).attr("src","img/signal-on.png");
                    var event = {
                        "time": currentTime,
                        "name": inputName,
                        "value":"on"
                    };
                    events.push(event);
                });

                $("#signal-off-"+inputName).click(function (e) {
                    signalStatus[inputName].value = "off";
                    $("#signal-img-"+inputName).attr("src","img/signal-off.png");
                    var event = {
                        "time": currentTime,
                        "name": inputName,
                        "value":"off"
                    };
                    events.push(event);
                });

            });
    });

    $("#add-clock-btn").click(function (e) {
        swal({
                title: "New Clock",
                text: "Please name your clock:",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "clk"
            },
            function(inputName){
                if (inputName === false) return false;

                if (inputName === "") {
                    swal.showInputError("You need to name your clock!");
                    return false
                }

                setTimeout(askClockPeriod,800,inputName);
        });
    });

    $("#gen-do-file-btn").click(function (e) {
        var str = "# This dofile is generated using Dogen\n";
        str += "# For more info visit https://github.com/BrainCoder/Dogen\n\n\n";

        str += "restart" + "\n";
        str += "\n";
        if(clockName != ""){
            str += "#Setup" + "\n";
            var halftime = clockTime/2;
            str += "force "+clockName+" 1 0, 0 {"+halftime+" ps} -r "+ clockTime + "\n";
        }
        str += "\n";

        var lastevent = 0;

        str += "#Start" + "\n";
        for (var event in events) {
            var value = events[event].value=="on"?1:0;
            var deltatime = events[event].time - lastevent;
            if(deltatime != 0){
                str += "run "+deltatime+" ps\n";
            }

            str += "force "+events[event].name+" "+value+"\n";
            lastevent = events[event].time;
        }
        str += "run "+(currentTime-lastevent)+" ps\n";
        console.log(str);

        // Save file dialog
        dialog.showSaveDialog({ filters: [

            { name: 'Dogen', extensions: ['do'] }

        ]}, function (fileName) {

            if (fileName === undefined) return;

            fs.writeFile(fileName, str, function (err) {
            });

            swal("File Saved!", "Your do file is saved!", "success")
        });
    });

    function askClockPeriod(inputName) {
        swal({
                title: "New Clock",
                text: "Please set your clock period in ps:",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top",
                inputPlaceholder: "50"
            },
            function(inputValue){
                if (inputValue === false) return false;

                if (inputValue === "") {
                    swal.showInputError("You need to pick a period!");
                    return false
                }
                clockTime = inputValue*1.0;
                clockName = inputName;
                $("#main-table").loadTemplate($("#clock-template"),
                    {
                        id:             "clock-"+inputName,
                        idGraph:        "graph-"+inputName,
                        idImg:          "clock-img-"+inputName,
                        idClockChange:  "clock-change-img" + inputName,
                        clockName:     inputName
                    },
                    { append: true }
                );
            });
    }

    $("#run-1-clock-btn").click(function (e) {
        currentTime += clockTime;
        render();
    });

    var drawLine = function drawLine(ctx, startX, startY, endX, endY, strokeStyle, lineWidth) {
        if (strokeStyle != null) ctx.strokeStyle = strokeStyle;
        if (lineWidth != null) ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
    };
    var getNumValue = function getNumValue(value) {
        if (value == "on") return 4;
        if (value == "off") return 20;
        return 12;
    };

    function render() {
        console.log(events);
        $(".renderWave").each(function(i, renderWave) {
            renderWave.width = currentTime;
            var wave_name = renderWave.id.substring(6);

            var ctx = renderWave.getContext('2d');
            ctx.clearRect(0, 0, renderWave.width, 24);

            var lastevent = {};

            //drawLine(ctx, 0, getNumValue("on"),  100, getNumValue("on"), '#0F0');
            //drawLine(ctx, 0, getNumValue("off"),  100, getNumValue("off"), '#F00');
            //drawLine(ctx, 0, getNumValue("unknown"),  100, getNumValue("unknown"), '#FF0');

            for (var event in events) {
                if(lastevent.name === undefined) {
                    lastevent = events[event];
                }
                if(events[event].name == wave_name) {
                    var value = getNumValue(events[event].value);
                    drawLine(ctx, lastevent.time, getNumValue(lastevent.value),  events[event].time, getNumValue(lastevent.value), lastevent.value=="unknown"?'#FF0':'#0F0');
                    if(lastevent.value != events[event].value) {
                        drawLine(ctx, events[event].time, getNumValue(lastevent.value),  events[event].time, value, '#0F0');
                    }
                    lastevent = events[event];
                }
            }
            drawLine(ctx, lastevent.time, getNumValue(lastevent.value),  renderWave.width, getNumValue(lastevent.value), lastevent.value=="unknown"?'#FF0':'#0F0');
        });

        $(".renderWaveClk").each(function(i, renderWave) {
            renderWave.width = currentTime;
            var halfTime = clockTime/2;

            var ctx = renderWave.getContext('2d');
            ctx.clearRect(0, 0, renderWave.width, 24);

            var clkstatus = {
                "time":0,
                "value":"on"
            };
            for (i = 0; i < renderWave.width; i++) {
                if(i%halfTime == 0) {
                    var newvalue = clkstatus.value=="off"?"on":"off";
                    drawLine(ctx, clkstatus.time, getNumValue(clkstatus.value),  i, getNumValue(clkstatus.value), '#0F0');
                    drawLine(ctx, i, getNumValue(clkstatus.value),  i, getNumValue(newvalue), '#0F0');
                    clkstatus.time = i;
                    clkstatus.value = newvalue;
                }
            }
            drawLine(ctx, clkstatus.time, getNumValue(clkstatus.value),  i, getNumValue(clkstatus.value), '#0F0');
        });
    }
});