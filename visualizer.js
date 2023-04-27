function main() {
    //console.log('loaded');
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

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
            const sound = micInput * 1000;
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
            context.scale(1+ volume * 0.2,1 + volume * 2);

            context.beginPath();
            //context.moveTo(this.x, this.y);
            //context.lineTo(this.y, this.height);
            context.stroke();

            context.rotate(this.index * 0.3);
            //context.strokeRect(this.y + this.index * 1.5, this.height, this.height/2, this.height);
            context.beginPath();
            context.arc(this.x, this.y,this.height * 2, 0, Math.PI * 2);
            context.stroke();

            context.restore();
        }
    }
    const fftSize = 512;
    const microphone = new Microphone(fftSize);
    let bars = [];
    let barWidth = canvas.width /fftSize/2;
    function createBars() {
        for (let i = 0; i < fftSize/2; i++) {
            let color = 'hsl(' + i * 2 + ',100%,50%'; // hue, saturation, lightness
            bars.push(new Bar(0, i * 1.5, 10, 50, color, i));
        }
    }
    createBars();
    let angle = 0;
    //console.log(bars);

    //console.log(microphone);
    function animate() {
        if (microphone.initialized) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // generate audio samples from microphone
            const samples = microphone.getSamples();
            const volume = microphone.getVolume();
            // animate bars based on microphone data
            angle -= 0.03 + volume/2;
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(angle);
            bars.forEach(function (bar, i) {
                bar.update(samples[i]);
                bar.draw(ctx, volume);
            });
            ctx.restore();
        }
        requestAnimationFrame(animate);
    }

    animate();

}
