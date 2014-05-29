// VM debugger. Outputs the content of memory, track the registers and `pc` values
// as the VM is running.
//
// Depends on two <table> available on the page.
//   <table id="memory"><tbody></tbody></table>  To dump memory and track `pc`.
//   <table id="registers"><tbody></tbody></table>  To inspect Vx and I registers.
//
function Debugger(vm) {
  this.vm = vm
}

Debugger.prototype.dumpMemory = function() {
  $tbody = $("#memory").find("tbody")

  $tbody.find("tr").remove()

  var memory = this.vm.memory

  for (var i = 0x200; i < memory.length; i+=2) {
    var instruction = (memory[i] << 8) + memory[i+1]

    if (instruction === 0) break;

    $("<tr>")
      .attr("id", "mem-" + i)
      .append($("<td>").text("0x" + hex(i, 3)))
      .append($("<td>").text(hex(instruction, 4)))
      .append($("<td>").append($("<pre>").text(this.disassemble(instruction))))
      .appendTo($tbody)
  }
}

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
  this.initRegisters()

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
// Translates machine language into assembly language.
//
// Returns an array: [assembly, description]
Debugger.prototype.disassemble = function(instruction) {
  var x = hex((instruction & 0x0F00) >> 8)
  var y = hex((instruction & 0x00F0) >> 4)
  var nnn = hex(instruction & 0x0FFF, 3)
  var kk = hex(instruction & 0x00FF, 2)
  var n = hex(instruction & 0x000F, 1)

  switch (instruction & 0xf000) {
    case 0x1000:
      return "1nnn - Jump to address 0x" + nnn
    case 0x3000:
      return "3xkk - Skip next instruction if V" + x + " = 0x" + kk
    case 0x6000:
      return "6xkk - Set V" + x + " = 0x" + kk
    case 0x7000:
      return "7xkk - Set V" + x + " = V" + x + " + 0x" + kk
    case 0xa000:
      return "Annn - Set I = 0x" + nnn
    case 0xc000:
      return "Cxkk - Set V" + x + " = random byte AND 0x" + kk
    case 0xd000:
      return "Dxyn - Draw sprite in I..I+" + n + " at (V" + x + ",V" + y + ")"
    default:
      // Anything else is either an unimplemented instruction or sprite data.
      // We display the sprite bits.
      var data = hex(instruction.toString(2), 16)
      return data.substr(0, 8) + "\n" + data.substr(8, 8)
  }
}
