# Chip-8: a Chip-8 emulator / VM for the browser

A [Chip-8](http://en.wikipedia.org/wiki/CHIP-8) virtual machine and debugger
built in JavaScript, using HTML Canvas for display.

A project of [The Great Code Club](http://www.greatcodeclub.com/).

## Running

Start a web server in the current directory. If you have python 2.x installed:

    $ python -m SimpleHTTPServer

(See [this list](https://gist.github.com/willurd/5720255) for other ways to
start a static web server.)

Then browse to http://localhost:8000/.

Reload the page each time you change something, or check out `Guardfile` to
setup automatic reloading.

## Opcodes

Only 7 out of the 35 opcodes are supported. Mainly for loading values in
registers and drawing sprites:

- `1nnn` - Jump to location nnn.
- `3xkk` - Skip next instruction if Vx = kk.
- `6xkk` - Set Vx = kk.
- `7xkk` - Set Vx = Vx + kk.
- `Annn` - Set I = nnn.
- `Cxkk` - Set Vx = random byte AND kk.
- `Dxyn` - Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.

The call stack, timers, input and sound are not implemented.

## License

Copyright 2014 Coded Inc. <marc@codedinc.com>

You are free to modify and distribute this however you want. Except for teaching
purposes.
