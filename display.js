function Display(canvas) {
  this.canvas = canvas
  this.context = canvas.getContext("2d")
  this.pixels = _.times(64, _.constant(
                  _.times(32, _.constant(0)))) // A 64x32 matrix initialized at 0

  this.width = canvas.width
  this.height = canvas.height
  this.xScale = this.width / 64
  this.yScale = this.height / 32

  this.clear()
}

Display.prototype.clear = function() {
  this.context.fillStyle = '#000'
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
}

Display.prototype.setPixel = function(x, y) {
  // Draw a pixel
  this.context.fillStyle = '#fff'
  this.context.fillRect(x * this.xScale, y * this.yScale, this.xScale, this.yScale)

  if (x > this.width) {
    x -= this.width
  } else if (x < 0) {
    x += this.width
  }

  if (y > this.height) {
    y -= this.height
  } else if (y < 0) {
    y += this.height
  }

  this.pixels[x][y] ^= 1

  // Return true if pixel was erased
  return !this.pixels[x][y]
}