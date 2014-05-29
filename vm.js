function VM(display) {
  this.display = display

  this.cpuSpeed = 100 // Hz

  // Allocate 4KB of memory
  this.memory = new Uint8Array(new ArrayBuffer(4096))

  this.pc = 0x200

  this.I = 0 // 16-bit register
  this.V = new Uint8Array(new ArrayBuffer(16)) // 8-bit registers
}

VM.prototype.loadProgram = function(program) {
  for (var i = 0; i < program.length; i++) {
    this.memory[0x200 + i] = program[i]
  }
}

VM.prototype.run = function() {
  // 50 Hz = 50 cycles per seconds
  var interval = 1000 / this.cpuSpeed
  var self = this

  setInterval(function() {
    self.step()
  }, interval)
}

VM.prototype.step = function() {
  var instruction = (this.memory[this.pc] << 8) + this.memory[this.pc+1]

  this.pc += 2

  // Operands
  var x = (instruction & 0x0F00) >> 8
  var y = (instruction & 0x00F0) >> 4
  var kk = instruction & 0x00FF
  var nnn = instruction & 0x0FFF
  var n = instruction & 0x000F

  switch (instruction & 0xF000) {
    case 0x1000:
      // `1nnn` - Jump to location nnn.
      this.pc = nnn
      break
    case 0x3000:
      // `3xkk` - Skip next instruction if Vx = kk.
      if (this.V[x] === kk) {
        this.pc += 2
      }
      break
    case 0x6000:
      // `6xkk` - Set Vx = kk.
      this.V[x] = kk
      break
    case 0x7000:
      // `7xkk` - Set Vx = Vx + kk.
      this.V[x] = this.V[x] + kk
      break
    case 0xA000:
      // `Annn` - Set I = nnn.
      this.I = nnn
      break
    case 0xC000:
      // `Cxkk` - Set Vx = random byte AND kk.
      this.V[x] = (Math.random() * (0xFF + 1)) & kk
      break
    case 0xD000:
      // `Dxyn` - Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
      var collision = this.drawSprite(this.V[x], this.V[y], this.I, n)
      this.V[0xF] = collision ? 1 : 0
      break
  }
}

// Display n-byte sprite starting at memory `address` at (x, y).
// Returns true if there's a collision.
//
// Eg.:
//
// Assuming the following sprite in memory at address 0x21A:
//
//    Addr   Byte     Bits    Pixels
//    0x21A  0xF0   11110000  ****
//    0x21B  0x90   10010000  *  *
//    0x21C  0x90   10010000  *  *
//    0x21D  0x90   10010000  *  *
//    0x21E  0xF0   11110000  ****
//
// Calling:
//
//    vm.drawSprite(2, 3, 0x21A, 5)
//
// Will draw a big 0 on the display at (2, 3).
VM.prototype.drawSprite = function(x, y, address, nbytes) {
  var collision = false

  for (var line = 0; line < nbytes; line++) { // Walk the horizonta
    var bits = this.memory[address + line]    // Get the sprite lin

    for (var bit = 7; bit >= 0; bit--) {      // Walk the bits on t
                                              // starting from last

      if (bits & 1) {                         // Check current bit
        if (!this.display.xorPixel(x + bit, y + line)) {
          collision = true
        }
      }

      bits >>= 1                              // Move forward one b

    }
  }

  return collision
}