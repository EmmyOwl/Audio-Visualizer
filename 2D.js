function init2DVisualizer() {

    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', onResize);

    const fftSizeInput = document.getElementById('fftSizeInput');
    const colorRangeInput = document.getElementById('colorRangeInput');
    const rotationSpeedInput = document.getElementById('rotationSpeedInput');
    const sensitivityInput = document.getElementById('sensitivityInput');

    fftSizeInput.addEventListener('change', (e) => updateFFTSize(e.target));
    colorRangeInput.addEventListener('input', (e) => updateColorRange(e.target.value));


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
            //context.fillStyle = this.color;
            //context.fillRect(this.x, this.y, this.width, this.height)
            context.strokeStyle = this.color;
            context.save();
            context.translate(0, 0);
            context.rotate(this.index * 0.03);
            context.scale(1 + volume * 0.2, 1 + volume * 0.2);

            context.beginPath();
            //context.moveTo(this.x, this.y);
            //context.lineTo(this.y, this.height);
            context.stroke();

            context.rotate(this.index * 0.3);
            //context.strokeRect(this.y + this.index * 1.5, this.height, this.height/2, this.height);
            context.beginPath();
            context.arc(this.x, this.y, this.height * 0.1, 0, Math.PI * 2);
            context.stroke();

            context.restore();
        }
    }

    const microphone = new Microphone(fftSizeInput.value);
    let bars = [];
    let barWidth = canvas.width / fftSizeInput.value / 2;

    function createBars(colorRange) {
        for (let i = 0; i < fftSizeInput.value / 2; i++) {
            let color = 'hsl(' + i * 2 * colorRange + ',100%,50%'; // hue, saturation, lightness
            bars.push(new Bar(0, i * 1.5, 10, 50, color, i));
        }
    }

    function updateFFTSize(input) {
        let newValue = parseInt(input.value);
        if (newValue < 128) {
            newValue = 128;
        } else if (newValue > 32768) {
            newValue = 32768;
        } else {
            newValue = 128 * Math.pow(2, Math.round(Math.log2(newValue / 128)));
        }
        input.value = newValue;
        fftSizeInput.value = newValue;
        microphone.setFFTSize(newValue);
        bars = [];
        barWidth = canvas.width / newValue / 2;
        createBars(colorRangeInput.value);
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // generate audio samples from microphone
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            const colorRange = parseFloat(colorRangeInput.value);

            // animate bars based on microphone data

            angle -= parseFloat(rotationSpeedInput.value);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(angle);
            bars.forEach(function (bar, i) {
                bar.update(samples[i] * parseFloat(sensitivityInput.value));
                bar.draw(ctx, volume);
            });

            const bands = microphone.getFrequencyBands();
            bars.forEach((bar, i) => {
                if (i < bars.length * 0.33) {
                    bar.color = 'hsl(' + i * 2 * colorRange + ',100%,' + (50 + bands.low / 255 * 50) + '%)';
                } else if (i >= bars.length * 0.33 && i < bars.length * 0.66) {
                    bar.color = 'hsl(' + i * 2 * colorRange + ',100%,' + (50 + bands.mid / 255 * 50) + '%)';
                } else {
                    bar.color = 'hsl(' + i * 2 * colorRange + ',100%,' + (50 + bands.high / 255 * 50) + '%)';
                }
            });
            ctx.restore();
        }
        animationID = requestAnimationFrame(animate);
    }

    animate();
    createBars(colorRangeInput.value);

    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    return {
        stop: function () {
            window.cancelAnimationFrame(animationID);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Remove event listeners
            window.removeEventListener('resize', onResize);
            fftSizeInput.removeEventListener('change', (e) => updateFFTSize(e.target));
            colorRangeInput.removeEventListener('input', (e) => updateColorRange(e.target.value));
        },
    };

}


