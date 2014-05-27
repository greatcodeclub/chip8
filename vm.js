function VM(display) {
  this.display = display
}

VM.prototype.reset = function() {
  // See doc for typed arrays in JavaScript
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
  this.memory = new Uint8Array(new ArrayBuffer(4095))  // 4KB of memory

  this.V = new Uint8Array(new ArrayBuffer(16)) // Vx: 16 general purpose 8-bit registers
  this.I = 0 // I: 16-bit register, for storing addresses
  this.stack = [] // The call stack

  this.pc = 0x200 // Instruction pointer. Programs start at address 0x200 in memory
}

VM.prototype.loadProgram = function(program) {
  this.reset()

  // Load program in memory
  var index = 0
  while (index < program.length) {
    this.memory[0x200 + index] = program[index]
    index += 1
  }
}

VM.prototype.step = function() {
  var instruction = (this.memory[this.pc] << 8) + this.memory[this.pc+1] // 2 bytes long
  
  // Move to next instruction
  this.pc += 2

  // Compute x & y for operations on Vx and Vy registers
  var x = (instruction & 0x0F00) >> 8
  var y = (instruction & 0x00F0) >> 4

  switch (instruction & 0xf000) {
    case 0x1000:
      // 1nnn - JP addr
      // Jump to location nnn.
      this.pc = instruction & 0x0fff
      break
    case 0x2000:
      // 2nnn - CALL addr
      // Call subroutine at nnn.
      this.stack.push(this.pc)
      this.pc = instruction & 0x0fff
      break
    case 0x3000:
      // 3xkk - SE Vx, byte
      // Skip next instruction if Vx = kk.
      if (this.V[x] === (instruction & 0xff)) {
        this.pc += 2
      }
      break
    case 0x6000:
      // 6xkk - LD Vx, byte
      // Set Vx = kk.
      this.V[x] = instruction & 0xff
      break
    case 0x7000:
      // 7xkk - ADD Vx, byte
      // Set Vx = Vx + kk.
      var val = (instruction & 0xFF) + this.V[x]

      if (val > 255) {
        val -= 256
      }

      this.V[x] = val
      break
    case 0x8000:
      switch (instruction & 0x000f) {
        // LD Vx, Vy
        // 8xy0
        // Stores register Vy in Vx
        case 0x0000:
          this.V[x] = this.V[y]
          break
        // OR Vx, Vy
        // 8xu1
        // Set vX equal to vX OR Vy
        case 0x0001:
          this.V[x] |= this.V[y]
          break
        // AND Vx, Vy
        // 8xy2
        // Set Vx equal to Vx AMD Vy
        case 0x0002:
          this.V[x] &= this.V[y]
          break
        // XOR Vx, Vy
        // 8xy3
        // Set Vx equal to Vx XOR Vy.
        case 0x0003:
          this.V[x] ^= this.V[y]
          break
        // ADD Vx, Vy
        // 8xy4
        // Set Vx equal to Vx + Vy, set Vf equal to carry.
        case 0x0004:
          this.V[x] += this.V[y]
          this.V[0xF] = +(this.V[x] > 255)
          if (this.V[x] > 255) {
            this.V[x] -= 256
          }
          break
        // SUB Vx, Vy
        // 8xy5
        // Set Vx equal to Vx - Vy, set Vf equal to NOT borrow.
        case 0x0005:
          this.V[0xF] = +(this.V[x] > this.V[y])
          this.V[x] -= this.V[y]
          if (this.V[x] < 0) {
            this.V[x] += 256
          }
          break
        // SHR Vx, Vy
        // 8xy6
        // Set Vx SHR 1.
        case 0x0006:
          this.V[0xF] = this.V[x] & 0x1
          this.V[x] >>= 1
          break
        // SUBN Vx, Vy
        // 8xy7
        // Set Vx equal to Vy - Vx, set Vf equal to NOT borrow.
        case 0x0007:
          this.V[0xF] = +(this.V[y] > this.V[x])
          this.V[x] = this.V[y] - this.V[x]
          if (this.V[x] < 0) {
            this.V[x] += 256
          }
          break
        // SHL Vx, Vy
        // 8xyE
        // Set Vx equal to Vx SHL 1.
        case 0x000E:
          this.V[0xF] = +(this.V[x] & 0x80)
          this.V[x] <<= 1
          if (this.V[x] > 255) {
            this.V[x] -= 256
          }
          break
      }
      break
    case 0xa000:
      // Annn - LD I, addr
      // Set I = nnn.
      this.I = instruction & 0xfff
      break
    case 0xc000:
      // Cxkk - RND Vx, byte
      // Set Vx = random byte AND kk.
      this.V[x] = (Math.random() * (0xff + 1)) & (instruction & 0xff)
      break
    case 0xd000:
      // Dxyn - DRW Vx, Vy, nibble
      // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.

      this.V[0xf] = 0

      var n = instruction & 0x000F
      console.log('draw', this.I)

      for (var sy = 0; sy < n; sy++) {          // walk the horizontal lines (Y)
        var line = this.memory[this.I + sy]     // get the sprite line to draw
        for (var sx = 0; sx < 8; sx++) {        // walk the bits on the line (X)
          if ((line & 0x80) > 0) { // ????
            if (this.display.setPixel(this.V[x] + sx, this.V[y] + sy)) {
              this.V[0xf] = 1                   // the pixel was erased
            }
          }
          line <<= 1                            // advance one bit in line
        }
      }

      break
    default:
      throw new Error("Unsupported instruction", hex(instruction, 4))
  }
}

VM.prototype.run = function() {
  var interval = 1000 / 60 // 60 cycles per sec
  var self = this

  this.timer = setInterval(function() {
    self.step()
  }, interval)
}

VM.prototype.stop = function() {
  clearTimeout(this.timer)
  this.timer = null
}
