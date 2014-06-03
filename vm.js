function VM(display) {
  this.display = display

  // CPU speed (in Hertz). Number of cycles per second.
  this.cpuSpeed = 100 // Hz

  // Initialize 4KB of memory.
  // See doc for typed arrays in JavaScript:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays
  this.memory = new Uint8Array(new ArrayBuffer(4096))

  // Registers
  this.V = new Uint8Array(new ArrayBuffer(16)) // Vx: 16 general purpose 8-bit registers
  this.I = 0 // I: 16-bit register, for storing addresses

  // Program counter. Address of the next instruction the VM will execute.
  // Programs start at address 0x200 in memory.
  this.pc = 0x200

  this.stack = []
}

// Load a program in memory
VM.prototype.loadProgram = function(program) {
  // Load program in memory. Starting at address 0x200.
  for (var i = 0; i < program.length; i++) {
    this.memory[0x200 + i] = program[i]
  }
}

// One cycle in the VM. Executes one instruction.
VM.prototype.step = function() {
  // Read the instructions at `pc`. Instructions are 2 bytes long.
  var instruction = (this.memory[this.pc] << 8) + this.memory[this.pc+1]

  // Move to next instruction
  this.pc += 2

  // Extract common operands.
  var x   = (instruction & 0x0F00) >> 8
  var y   = (instruction & 0x00F0) >> 4
  var kk  =  instruction & 0x00FF
  var nnn =  instruction & 0x0FFF
  var n   =  instruction & 0x000F

  // Inspect the first nibble, the opcode.
  // A case for each type of instruction.
  switch (instruction & 0xF000) {
    case 0x0000:
      switch (instruction) {
        case 0x00E0:
          // 00E0 - Clear the display.
          this.display.clear()
          break
        case 0x00EE:
          // 00EE - Return from a subroutine.
          this.pc = this.stack.pop()
          break
      }
      break
    case 0x1000:
      // 1nnn - Jump to location nnn.
      this.pc = nnn
      break
    case 0x2000:
      // 2nnn -- Call subroutine at nnn.
      this.stack.push(this.pc)
      this.pc = nnn
      break
    case 0x3000:
      // 3xkk - Skip next instruction if Vx = kk.
      if (this.V[x] === kk) {
        this.pc += 2 // an instruction is 2 bytes
      }
      break
    case 0x4000:
      // 4xkk - Skip next instruction if Vx != kk.
      if (this.V[x] !== kk) {
        this.pc += 2 // an instruction is 2 bytes
      }
      break
    case 0x6000:
      // 6xkk - Set Vx = kk.
      this.V[x] = kk
      break
    case 0x7000:
      // 7xkk - Set Vx = Vx + kk.
      this.V[x] = this.V[x] + kk
      break
    case 0xA000:
      // Annn - Set I = nnn.
      this.I = nnn
      break
    case 0xC000:
      // Cxkk - Set Vx = random byte AND kk.
      this.V[x] = (Math.random() * (0xFF + 1)) & kk
      break
    case 0xD000:
      // Dxyn - Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
      var collision = this.drawSprite(this.V[x], this.V[y], this.I, n)
      // VF is set to 1 if there is a collision.
      this.V[0xF] = collision ? 1 : 0
      break
    case 0xF000:
      switch (instruction & 0xF0FF) {
        case 0xF01E:
          // Fx1E - Set I = I + Vx.
          this.I += this.V[x]
          break
      }
      break
    default:
      throw new Error("Unsupported instruction at 0x" + hex(this.pc, 3) + ": " + hex(instruction, 4))
  }
}

VM.prototype.run = function() {
  var interval = 1000 / this.cpuSpeed
  var self = this

  this.stop()
  this.timer = setInterval(function() {
    self.step()
  }, interval)
}

VM.prototype.stop = function() {
  clearTimeout(this.timer)
  this.timer = null
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

  for (var line = 0; line < nbytes; line++) { // Walk the horizontal lines (Y)
    var bits = this.memory[address + line]    // Get the sprite line bits to draw

    for (var bit = 7; bit >= 0; bit--) {      // Walk the bits on the line (X),
                                              // starting from last bit (left).

      if (bits & 1) {                         // Check current bit
        if (!this.display.xorPixel(x + bit, y + line)) {
          collision = true
        }
      }

      bits >>= 1                              // Move forward one bit

    }
  }

  return collision
}
