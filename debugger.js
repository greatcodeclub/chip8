function Debugger(vm) {
  this.vm = vm
}

Debugger.prototype.dumpMemory = function() {
  $tbody = $("#memory").find("tbody")

  var memory = this.vm.memory

  for (var i = 0x200; i < memory.length; i+=2) {
    var instruction = (memory[i] << 8) + memory[i+1]

    if (instruction === 0) break;

    var info = this.disassemble(instruction)

    $("<tr>")
      .attr("id", "mem-" + i)
      .append($("<td>").text("0x" + hex(i, 3)))
      .append($("<td>").text(hex(instruction, 4)))
      .append($("<td class='disasm' style='padding-left:10px'>").text(info[0]))
      .append($("<td class='desc' style='padding-left:10px'>").text(info[1]))
      .appendTo($tbody)
  }
}

Debugger.prototype.dumpRegisters = function() {
  $tbody = $("#registers").find("tbody")

  for (var i = 0; i < 16; i++) {
    $("<tr>")
      .append($("<th>").text("V" + hex(i)))
      .append($("<td>").attr("id", "reg-V" + i).text(hex(this.vm.V[i], 2)))
      .appendTo($tbody)
  }

  $("<tr>")
    .append($("<th>").text("I"))
    .append($("<td>").attr("id", "reg-I").text(hex(this.vm.I, 4)))
    .appendTo($tbody)
}

Debugger.prototype.update = function() {
  for (var i = 0; i < 16; i++) {
    $("#reg-V" + i).text(hex(this.vm.V[i], 2))
  }
  $("#reg-I").text(hex(this.vm.I, 4))

  $(".pc").removeClass("pc")
  $("#mem-" + this.vm.pc).addClass("pc")
}

Debugger.prototype.debug = function() {
  var self = this

  this.dumpMemory()
  this.dumpRegisters()

  this.timer = setInterval(function() {
    self.update()
  }, 300)
}

Debugger.prototype.stop = function() {
  clearTimeout(this.timer)
  this.timer = null
}

Debugger.prototype.disassemble = function(instruction) {
  switch (instruction & 0xf000) {
    case 0x1000:
      return ["1nnn - JP addr", "Jump to location nnn"]
    case 0x2000:
      return ["2nnn - CALL addr", "Call subroutine at nnn"]
    case 0x3000:
      return ["3xkk - SE Vx, byte", "Skip next instruction if Vx = kk"]
    case 0x6000:
      return ["6xkk - LD Vx, byte", "Set Vx = kk"]
    case 0x7000:
      return ["7xkk - ADD Vx, byte", "Set Vx = Vx + kk"]
    case 0x8000:
      switch (instruction & 0x000f) {
        case 0x0000:
          return ["8xy0 - LD Vx, Vy", "Loads register Vy in Vx"]
        default:
          return ["???"]
      }
      break
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
