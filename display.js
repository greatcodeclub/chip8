// A display of 64x32 scalled to the canvas dimensions.
function Display(canvas) {
  this.canvas = canvas
  this.context = canvas.getContext("2d")

  // Display dimensions
  this.width = 64
  this.height = 32

  // The scale of one pseudo-pixel
  //
  //   640 width = pseudo-pixels are 10px width
  //
  this.xScale = this.canvas.width / this.width
  this.yScale = this.canvas.height / this.height

  this.clear()
}

// Clear the display. Draw all black.
Display.prototype.clear = function() {
  // A 64x32 matrix representing state of pseudo-pixels on the canvas.
  this.pixels = _.times(64, function() {
    return _.times(32, _.constant(0))
  })

  this.context.fillStyle = '#000'
  this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
}

// XOR a pixel at (x,y).
Display.prototype.xorPixel = function(x, y) {
  // Wrap vertically
  if (x > this.width) {
    x -= this.width
  } else if (x < 0) {
    x += this.width
  }

  // Wrap horizontally
  if (y > this.height) {
    y -= this.height
  } else if (y < 0) {
    y += this.height
  }

  // Set the pixel state
  var state = this.pixels[x][y] ^= 1

  // Draw the pixel
  if (state) {
    // Turn pixel on
    this.context.fillStyle = '#fff'
  } else {
    // Turn pixel off
    this.context.fillStyle = '#000'
  }
  this.context.fillRect(x * this.xScale, y * this.yScale, this.xScale, this.yScale)

  // Return state of pixel
  return state
}