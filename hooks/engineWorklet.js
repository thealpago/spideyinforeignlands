
export const workletCode = `
class AeroSonicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
  }

  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 1000, minValue: 0, maxValue: 12000 },
      { name: 'load', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'throttle', defaultValue: 0.1, minValue: 0, maxValue: 1 }
    ];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channelL = output[0];
    const channelR = output[1];
    
    // Basit test tonu (RPM'e bağlı frekans)
    // Eğer bu çalışırsa worklet yükleniyor demektir.
    const rpm = parameters.rpm[0] || 1000;
    const freq = rpm / 4; // 1000 RPM -> 250 Hz
    const dt = 1 / sampleRate;
    
    for (let i = 0; i < channelL.length; i++) {
       this.phase += freq * dt;
       if (this.phase > 1) this.phase -= 1;
       
       // Basit testere dişi dalga (Motor sesine benzer cızırtılı ton)
       const sample = (this.phase * 2 - 1) * 0.2; // %20 ses seviyesi
       
       channelL[i] = sample;
       if (channelR) channelR[i] = sample;
    }

    return true;
  }
}

registerProcessor('aerosonic-processor', AeroSonicProcessor);
`
