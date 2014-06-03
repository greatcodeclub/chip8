// VM debugger. Outputs the content of memory, track the registers and `pc` values
// as the VM is running.
//
// Depends on two <table> available on the page.
//   <table id="memory"><tbody></tbody></table>  To dump memory and track `pc`.
//   <table id="registers"><tbody></tbody></table>  To inspect Vx and I registers.
//
function Debugger(vm) {
  this.vm = vm

  this.dumpMemory()
  this.initRegisters()
}

// Initialize the memory <table> with the content of the VM's memory.
Debugger.prototype.dumpMemory = function() {
  $tbody = $("#memory").find("tbody")

  $tbody.find("tr").remove()

  var memory = this.vm.memory

  // Stop dumping memory after 10 consecutive `0000` instructions.
  var maxZeroInstructions = 10
  var zeroInstructions = 0

  var sprites = false
  var disassembly

  for (var i = 0x200; i < memory.length; i+=2) {
    var instruction = (memory[i] << 8) + memory[i+1]

    if (instruction === 0) {
      zeroInstructions += 1
      if (zeroInstructions == maxZeroInstructions) break

      // Usually, after a `0000` instruction, everything is sprite data
      sprites = true      

      disassembly = ""
    } else { // Non-zero instruction
      zeroInstructions = 0

      disassembly = this.disassemble(instruction)
      if (disassembly === null || sprites) {
        // Unrecognized instruction are displayed as sprite data (two lines of bits).
        disassembly = this.toBits(instruction)
      }
    }

    // Add the table row for that memory address.
    $("<tr>")
      .attr("id", "mem-" + i)
      .append($("<td>").text("0x" + hex(i, 3)))
      .append($("<td>").text(hex(instruction, 4)))
      .append($("<td>").append($("<pre>").text(disassembly)))
      .appendTo($tbody)
  }
}

// Initialize the registers <table>
Debugger.prototype.initRegisters = function() {
  $tbody = $("#registers").find("tbody")

  $tbody.find("tr").remove()

  for (var i = 0; i < 16; i++) {
    $("<tr>")
      .append($("<th>").text("V" + hex(i)))
      .append($("<td>").attr("id", "reg-V" + i))
      .appendTo($tbody)
  }

  $("<tr>")
    .append($("<th>").text("I"))
    .append($("<td>").attr("id", "reg-I"))
    .appendTo($tbody)
}

// Update the registers and program counter.
Debugger.prototype.update = function() {
  // No updates if pc didn't change
  if (this.lastPc === this.vm.pc) return
  this.lastPc = this.vm.pc

  for (var i = 0; i < 16; i++) {
    $("#reg-V" + i).text("0x" + hex(this.vm.V[i], 2))
  }
  $("#reg-I").text("0x" + hex(this.vm.I, 4))

  $(".pc").removeClass("pc")
  $("#mem-" + this.vm.pc).addClass("pc")
}

// Start inspecting the VM for value changes.
Debugger.prototype.debug = function() {
  var interval = 1000 / this.vm.cpuSpeed
  var self = this

  this.dumpMemory()

  this.stop()
  this.timer = setInterval(function() {
    self.update()
  }, interval)
}

// Stop watching the VM for changes.
Debugger.prototype.stop = function() {
  clearTimeout(this.timer)
  this.timer = null
}

// Disassemble an instruction.
// Converts instruction bytes into a human readable description.
// Returns `null` if an instruction is not recagnized.
//
// Warning: if you add support for new types of instructions, they will be
//          displayed as bits unless you modify this method.
Debugger.prototype.disassemble = function(instruction) {
  // Operands
  var x   = (instruction & 0x0F00) >> 8
  var y   = (instruction & 0x00F0) >> 4
  var nnn = instruction & 0x0FFF
  var kk  = instruction & 0x00FF
  var n   = instruction & 0x000F
  // Formated operands
  var xHex   = hex(x >> 8)
  var yHex   = hex(y >> 4)
  var nnnHex = hex(nnn, 3)
  var kkHex  = hex(kk, 2)
  var nHex   = hex(n & 0x000F, 1)

  switch (instruction & 0xf000) {
    case 0x0000:
      switch (instruction) {
        case 0x00E0:
          return "00E0 - Clear the display"
        case 0x00EE:
          return "00E0 - Return from a subroutine"
      }
      return null
    case 0x1000:
      if (nnn < 0x200) return null
      return "1nnn - Jump to address 0x" + nnnHex
    case 0x2000:
      if (nnn < 0x200) return null
      return "2nnn - Call subroutine at 0x" + nnnHex
    case 0x3000:
      return "3xkk - Skip next instruction if V" + xHex + " = 0x" + kkHex
    case 0x4000:
      return "4xkk - Skip next instruction if V" + xHex + " != 0x" + kkHex
    case 0x6000:
      return "6xkk - Set V" + xHex + " = 0x" + kkHex
    case 0x7000:
      return "7xkk - Set V" + xHex + " = V" + xHex + " + 0x" + kkHex
    case 0xa000:
      if (nnn < 0x200) return null
      return "Annn - Set I = 0x" + nnnHex
    case 0xc000:
      return "Cxkk - Set V" + xHex + " = random byte AND 0x" + kkHex
    case 0xd000:
      return "Dxyn - Draw sprite in I..I+" + n + " at (V" + xHex + ",V" + yHex + ")"
    case 0xF000:
      switch (instruction & 0xF0FF) {
        case 0xF01E:
          return "Fx1E - Set I = I + V" + xHex
      }
      return null
    default:
      return null
  }
}

// Returns the bits of an instruction in two lines.
// Useful for displaying sprites stored in memory.
Debugger.prototype.toBits = function(instruction) {
  var data = hex(instruction.toString(2), 16)
  return data.substr(0, 8) + "\n" +
         data.substr(8, 8)
}