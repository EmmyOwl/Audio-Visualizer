class Microphone {
    
    constructor(fftSize) {
        this.initialized = false;
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            this.audioContext = new AudioContext();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = fftSize;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.microphone.connect(this.analyser);
            this.initialized = true;
            this.ready = new Promise((resolve) => {
                this.resolveReady = resolve;
            })
        }.bind(this)).catch(function (err) {
            console.log(err);
        });
    }
    async initialize() {
        this.initialized = true;
        this.resolveReady();
    }
    getSamples() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        //normalize samples
        let normSamples = [...this.dataArray].map(e => e / 128 - 1);
        return normSamples;
    }
    getVolume() {
        this.analyser.getByteTimeDomainData(this.dataArray);
        let normSamples = [...this.dataArray].map(e => e / 128 - 1);
        let sum = 0;
        for (let i = 0; i < normSamples.length; i++) {
            sum += normSamples[i] * normSamples[i];
        }
        let volume = Math.sqrt(sum / normSamples.length);
        return volume;
    }
    setFFTSize(size) {
        this.analyser.fftSize = size;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }

    getFFTSize() {
        return this.analyser.fftSize;
    }

    getFrequencyBands() {
        this.analyser.getByteFrequencyData(this.dataArray);
    
        const bands = {
            low: 0,
            mid: 0,
            high: 0
        };
    
        const lowFrequencyEnd = 150;
        const midFrequencyStart = 150;
        const midFrequencyEnd = 5000;
        const highFrequencyStart = 5000;
        const highFrequencyStartIndex = Math.floor(highFrequencyStart * this.analyser.fftSize / this.audioContext.sampleRate);
    
        let lowCount = 0;
        let midCount = 0;
        let highCount = 0;
    
        for (let i = 0; i < this.bufferLength; i++) {
            let frequency = (i * this.audioContext.sampleRate) / (this.analyser.fftSize * 2);
            if (frequency <= lowFrequencyEnd) {
                bands.low += this.dataArray[i];
                lowCount++;
            } else if (frequency > midFrequencyStart && frequency <= midFrequencyEnd) {
                bands.mid += this.dataArray[i];
                midCount++;
            }
        }
    
        for (let i = highFrequencyStartIndex; i < this.bufferLength; i++) {
            bands.high += this.dataArray[i];
            highCount++;
        }
    
        bands.low = lowCount > 0 ? bands.low / lowCount : 0;
        bands.mid = midCount > 0 ? bands.mid / midCount : 0;
        bands.high = highCount > 0 ? bands.high / highCount : 0;
    
        return bands;
    }
} 