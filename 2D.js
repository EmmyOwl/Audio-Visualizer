function init2DVisualizer(mic) {

    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', onResize);

    // position GUI
    const gui2D = new dat.GUI({ autoPlace: false });
    gui2D.domElement.style.position = 'absolute';
    gui2D.domElement.style.right = '0px';
    gui2D.domElement.style.top = '0px';
    gui2D.domElement.style.display = 'none';

    const customContainer = document.getElementById("guiContainer");
    customContainer.appendChild(gui2D.domElement);

    // initial GUI settings
    const settings = {
        fftSize: 512,
        colorRange: 0.1,
        rotationSpeed: 0.01,
        sensitivity: 5,
    };

    // GUI setup
    gui2D.domElement.style.display = 'block';
    const fftSizeController = gui2D.add(settings, "fftSize", [64, 128, 256, 512, 1024]);
    const colorRangeController = gui2D.add(settings, "colorRange", 0.1, 2).step(0.1);
    const rotationSpeedController = gui2D.add(settings, "rotationSpeed", -0.05, 0.05).step(0.01);
    const sensitivityController = gui2D.add(settings, "sensitivity", 1, 30).step(0.5);


    // look for changes in the GUI
    fftSizeController.onChange((value) => {
        const newValue = 128 * Math.pow(2, Math.round(Math.log2(value / 128)));
        updateFFTSize(newValue);
    });
    colorRangeController.onChange((value) => updateColorRange(value));
    rotationSpeedController.onChange((value) => settings.rotationSpeed = value);
    sensitivityController.onChange((value) => settings.sensitivity = value);

    class Bar {
        constructor(x, y, width, height, color, index) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.index = index;
        }
        update(micInput) {
            const sound = micInput * 100;
            if (sound > this.height) {
                this.height = sound;
            } else {
                this.height -= this.height * 0.03;
            }
        }
        draw(context, volume) {
            context.strokeStyle = this.color;
            context.save();
            context.translate(0, 0);
            context.rotate(this.index * 0.03);
            context.scale(1 + volume * 0.2, 1 + volume * 0.2);

            context.beginPath();
            context.stroke();

            context.rotate(this.index * 0.3);
            context.beginPath();
            context.arc(this.x, this.y, this.height * 0.1, 0, Math.PI * 2);
            context.stroke();

            context.restore();
        }
    }

    const microphone = new Microphone(settings.fftSize);
    let bars = [];
    let barWidth = canvas.width / settings.fftSize / 2;

    function createBars(colorRange) {
        for (let i = 0; i < settings.fftSize / 2; i++) {
            let color = 'hsl(' + i * 2 * colorRange + ',100%,50%'; // hue, saturation, lightness
            let x = (canvas.width / 2) - (barWidth * (settings.fftSize / 4)) + (i * barWidth);
            bars.push(new Bar(0, i * 1.5, 10, 50, color, i));
        }
    }

    function updateFFTSize(newValue) {
        if (newValue < 64) {
            newValue = 64;
        } else if (newValue > 32768) {
            newValue = 32768;
        }
        settings.fftSize = newValue;
        microphone.setFFTSize(newValue);
        bars = [];
        barWidth = canvas.width / newValue / 2;
        createBars(settings.colorRange);
    }

    function updateColorRange(value) {
        const colorRange = parseFloat(value);
        bars.forEach((bar, i) => {
            bar.color = 'hsl(' + i * 2 * colorRange + ',100%,50%)';
        });
    }


    let angle = 0;
    let animationID;

    function animate() {
        if (microphone.initialized) {
            // clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // generate audio samples from microphone
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            const colorRange = parseFloat(settings.colorRange);

            // animate bars based on microphone data
            angle -= parseFloat(settings.rotationSpeed);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angle);
            bars.forEach(function (bar, i) {
                bar.update(samples[i] * parseFloat(settings.sensitivity));
                bar.draw(ctx, volume);
            });
            

            const bands = microphone.getFrequencyBands();
            bars.forEach((bar, i) => {
                if (i < bars.length * 0.33) {
                    bar.color = 'hsl(' + i * 2 * colorRange + ',100%,' + (50 + bands.low / 255 * 0.5) + '%)';
                } else if (i >= bars.length * 0.33 && i < bars.length * 0.66) {
                    bar.color = 'hsl(' + i * 2 * colorRange + ',100%,' + (50 + bands.mid / 255 * 0.5) + '%)';
                } else {
                    bar.color = 'hsl(' + i * 2 * colorRange + ',100%,' + (50 + bands.high / 255 * 0.5) + '%)';
                }
            });
            ctx.restore();
        }
        animationID = requestAnimationFrame(animate);
    }

    animate();
    createBars(settings.colorRange);

    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // when stopping visualizer clear all
    return {
        stop: function () {
            console.log("Stopping 2D visualizer");
            window.cancelAnimationFrame(animationID);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
            gui2D.destroy();
            gui2D.domElement.style.display = 'none';
            window.removeEventListener('resize', onResize);
        },
    };

}


