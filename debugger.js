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

    var info = this.disassemble(instruction)

    $("<tr>")
      .attr("id", "mem-" + i)
      .append($("<td>").text("0x" + hex(i, 3)))
      .append($("<td>").text(hex(instruction, 4)))
      .append($("<td>").text(info[0]))
      .append($("<td>").text(info[1]))
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
  var self = this

  this.dumpMemory()
  this.initRegisters()

  this.stop()
  this.timer = setInterval(function() {
    self.update()
  }, 1000 / 60)
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
  switch (instruction & 0xf000) {
    case 0x1000:
      return ["1nnn - JP addr", "Jump to location nnn"]
    case 0x3000:
      return ["3xkk - SE Vx, byte", "Skip next instruction if Vx = kk"]
    case 0x6000:
      return ["6xkk - LD Vx, byte", "Set Vx = kk"]
    case 0x7000:
      return ["7xkk - ADD Vx, byte", "Set Vx = Vx + kk"]
    case 0xa000:
      return ["Annn - LD I, addr", "Set I = nnn"]
    case 0xc000:
      return ["Cxkk - RND Vx, byte", "Set Vx = random byte AND kk"]
    case 0xd000:
      return ["Dxyn - DRW Vx, Vy, nibble", "Display n-byte sprite ..."]
    default:
      return ["???"]
  }
}
