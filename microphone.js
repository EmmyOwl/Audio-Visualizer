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
            this.prevBands = {
                bass: 0,
                low: 0,
                mid: 0,
                high: 0
            };
            this.lowPassFilter = this.audioContext.createBiquadFilter();
            this.lowPassFilter.type = 'lowpass';
            this.lowPassFilter.frequency.value = 40;
            this.microphone.connect(this.lowPassFilter);
            this.lowPassFilter.connect(this.analyser);

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

    applySmoothing(value, previousValue, alpha) {
        return alpha * value + (1 - alpha) * previousValue;
    }

    applyThreshold(value, threshold) {
        return value > threshold ? value : 0;
    }
    

    getFrequencyBands() {
        this.analyser.getByteFrequencyData(this.dataArray);

        const bands = {
            bass: 0,
            low: 0,
            mid: 0,
            high: 0
        };

        
        let lowPassFilter = this.audioContext.createBiquadFilter();
        lowPassFilter.type = 'lowpass';
        lowPassFilter.frequency.value = 50;

        const bassFrequencyStart = 60;
        const bassFrequencyEnd = 120;
        const lowFrequencyEnd = 200;
        const midFrequencyStart = 500;
        const midFrequencyEnd = 1000;
        const highFrequencyStart = 6000;
        const highFrequencyStartIndex = Math.floor(highFrequencyStart * this.analyser.fftSize / this.audioContext.sampleRate);

        let bassCount = 1;
        let lowCount = 1;
        let midCount = 1;
        let highCount = 1;

        for (let i = 0; i < this.bufferLength; i++) {
            let frequency = (i * this.audioContext.sampleRate) / (this.analyser.fftSize * 2);
            if (frequency >= bassFrequencyStart && frequency <= bassFrequencyEnd) {
                bands.bass += this.dataArray[i];
                bassCount++;
            } else if (frequency <= lowFrequencyEnd) {
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

        bands.bass = bassCount > 0 ? bands.bass / bassCount : 0;
        bands.low = lowCount > 0 ? bands.low / lowCount : 0;
        bands.mid = midCount > 0 ? bands.mid / midCount : 0;
        bands.high = highCount > 0 ? bands.high / highCount : 0;
        
        const alphaHigh = 0.1;
        const alphaMid = 0.1;
        const alphaLow = 0.1;
        const alphaBass = 0.1;
        
        if (this.previousBands) {
            bands.bass = this.applySmoothing(bands.bass, this.previousBands.bass, alphaBass);
            bands.low = this.applySmoothing(bands.low, this.previousBands.low, alphaLow);
            bands.mid = this.applySmoothing(bands.mid, this.previousBands.mid, alphaMid);
            bands.high = this.applySmoothing(bands.high, this.previousBands.high, alphaHigh);
        }
        this.prevBands = bands;
        
        return bands;
    }
} 