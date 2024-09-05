/* eslint-disable default-case */
const loadboot = (p) => {
    const boot = [
        0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C, 0x20, 0xFB, 0x21, 0x26, 0xFF, 0x0E,
        0x11, 0x3E, 0x80, 0x32, 0xE2, 0x0C, 0x3E, 0xF3, 0xE2, 0x32, 0x3E, 0x77, 0x77, 0x3E, 0xFC, 0xE0,
        0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1A, 0xCD, 0x95, 0x00, 0xCD, 0x96, 0x00, 0x13, 0x7B,
        0xFE, 0x34, 0x20, 0xF3, 0x11, 0xD8, 0x00, 0x06, 0x08, 0x1A, 0x13, 0x22, 0x23, 0x05, 0x20, 0xF9,
        0x3E, 0x19, 0xEA, 0x10, 0x99, 0x21, 0x2F, 0x99, 0x0E, 0x0C, 0x3D, 0x28, 0x08, 0x32, 0x0D, 0x20,
        0xF9, 0x2E, 0x0F, 0x18, 0xF3, 0x67, 0x3E, 0x64, 0x57, 0xE0, 0x42, 0x3E, 0x91, 0xE0, 0x40, 0x04,
        0x1E, 0x02, 0x0E, 0x0C, 0xF0, 0x44, 0xFE, 0x90, 0x20, 0xFA, 0x0D, 0x20, 0xF7, 0x1D, 0x20, 0xF2,
        0x0E, 0x13, 0x24, 0x7C, 0x1E, 0x83, 0xFE, 0x62, 0x28, 0x06, 0x1E, 0xC1, 0xFE, 0x64, 0x20, 0x06,
        0x7B, 0xE2, 0x0C, 0x3E, 0x87, 0xE2, 0xF0, 0x42, 0x90, 0xE0, 0x42, 0x15, 0x20, 0xD2, 0x05, 0x20,
        0x4F, 0x16, 0x20, 0x18, 0xCB, 0x4F, 0x06, 0x04, 0xC5, 0xCB, 0x11, 0x17, 0xC1, 0xCB, 0x11, 0x17,
        0x05, 0x20, 0xF5, 0x22, 0x23, 0x22, 0x23, 0xC9, 0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
        0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
        0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99, 0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC,
        0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E, 0x3C, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x3C,
        0x21, 0x04, 0x01, 0x11, 0xA8, 0x00, 0x1A, 0x13, 0xBE, 0x00, 0x00, 0x23, 0x7D, 0xFE, 0x34, 0x20,
        0xF5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xFB, 0x86, 0x00, 0x00, 0x3E, 0x01, 0xE0, 0x50
    ];

    for (let i in boot) {
        p.memory[i] = boot[i];
    }
    p.r.pc = 0;
    p.usingBootRom = true;
}

let GameboyJS;
(function (GameboyJS) {
    // CPU class
    class CPU {
        constructor(gameboy) {
            this.gameboy = gameboy;

            this.r = { A: 0, F: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0, pc: 0, sp: 0 };
            this.IME = true;
            this.clock = { c: 0, serial: 0 };
            this.isHalted = false;
            this.isPaused = false;
            this.usingBootRom = false;

            this.createDevices();
        }
        createDevices() {
            this.memory = new GameboyJS.Memory(this);
            this.timer = new GameboyJS.Timer(this, this.memory);
            this.apu = new GameboyJS.APU(this.memory);

            this.SERIAL_INTERNAL_INSTR = 512; // instr to wait per bit if internal clock
            this.enableSerial = 0;
            this.serialHandler = GameboyJS.ConsoleSerial;
        }
        reset() {
            this.memory.reset();

            this.r.sp = 0xFFFE;
        }
        loadRom(data) {
            this.memory.setRomData(data);
        }
        getRamSize() {
            let size = 0;
            switch (this.memory.rb(0x149)) {
                case 1:
                    size = 2048;
                    break;
                case 2:
                    size = 2048 * 4;
                    break;
                case 3:
                    size = 2048 * 16;
                    break;
            }

            return size;
        }
        getGameName() {
            let name = '';
            for (let i = 0x134; i < 0x143; i++) {
                let char = this.memory.rb(i) || 32;
                name += String.fromCharCode(char);
            }

            return name;
        }
        // Start the execution of the emulator
        run() {
            if (this.usingBootRom) {
                this.r.pc = 0x0000;
            } else {
                this.r.pc = 0x0100;
            }
            this.frame();
        }
        stop() {
            clearTimeout(this.nextFrameTimer);
        }
        // Fetch-and-execute loop
        // Will execute instructions for the duration of a frame
        //
        // The screen unit will notify the vblank period which
        // is considered the end of a frame
        //
        // The function is called on a regular basis with a timeout
        frame() {
            if (!this.isPaused) {
                this.nextFrameTimer = setTimeout(this.frame.bind(this), 1000 / GameboyJS.Screen.physics.FREQUENCY);
            }

            try {
                let vblank = false;
                while (!vblank) {
                    let oldInstrCount = this.clock.c;
                    if (!this.isHalted) {
                        let opcode = this.fetchOpcode();
                        GameboyJS.opcodeMap[opcode](this);
                        this.r.F &= 0xF0; // tmp fix

                        if (this.enableSerial) {
                            let instr = this.clock.c - oldInstrCount;
                            this.clock.serial += instr;
                            if (this.clock.serial >= 8 * this.SERIAL_INTERNAL_INSTR) {
                                this.endSerialTransfer();
                            }
                        }
                    } else {
                        this.clock.c += 4;
                    }

                    let elapsed = this.clock.c - oldInstrCount;
                    vblank = this.gpu.update(elapsed);
                    this.timer.update(elapsed);
                    this.input.update();
                    this.apu.update(elapsed);
                    this.checkInterrupt();
                }
                this.clock.c = 0;
            } catch (e) {
                this.gameboy.handleException(e);
            }
        }
        fetchOpcode() {
            let opcode = this.memory.rb(this.r.pc++);
            if (opcode === undefined) { console.log(opcode + ' at ' + (this.r.pc - 1).toString(16)); this.stop(); return; }
            if (!GameboyJS.opcodeMap[opcode]) {
                console.error('Unknown opcode ' + opcode.toString(16) + ' at address ' + (this.r.pc - 1).toString(16) + ', stopping execution...');
                this.stop();
                return null;
            }

            return opcode;
        }
        // read register
        rr(register) {
            return this.r[register];
        }
        // write register
        wr(register, value) {
            this.r[register] = value;
        }
        halt() {
            this.isHalted = true;
        }
        unhalt() {
            this.isHalted = false;
        }
        pause() {
            this.isPaused = true;
        }
        unpause() {
            if (this.isPaused) {
                this.isPaused = false;
                this.frame();
            }
        }
        // Look for interrupt flags
        checkInterrupt() {
            if (!this.IME) {
                return;
            }
            for (let i = 0; i < 5; i++) {
                let IFval = this.memory.rb(0xFF0F);
                if (GameboyJS.Util.readBit(IFval, i) && this.isInterruptEnable(i)) {
                    IFval &= (0xFF - (1 << i));
                    this.memory.wb(0xFF0F, IFval);
                    this.disableInterrupts();
                    this.clock.c += 4; // 20 clocks to serve interrupt, with 16 for RSTn
                    CPU.interruptRoutines[i](this);
                    break;
                }
            }
        }
        // Set an interrupt flag
        requestInterrupt(type) {
            let IFval = this.memory.rb(0xFF0F);
            IFval |= (1 << type);
            this.memory.wb(0xFF0F, IFval);
            this.unhalt();
        }
        isInterruptEnable(type) {
            return GameboyJS.Util.readBit(this.memory.rb(0xFFFF), type) !== 0;
        }
        enableInterrupts() {
            this.IME = true;
        }
        disableInterrupts() {
            this.IME = false;
        }
        enableSerialTransfer() {
            this.enableSerial = 1;
            this.clock.serial = 0;
        }
        endSerialTransfer() {
            this.enableSerial = 0;
            let data = this.memory.rb(0xFF01);
            this.memory.wb(0xFF02, 0);
            this.serialHandler.out(data);
            this.memory.wb(0xFF01, this.serialHandler.in());
        }
        resetDivTimer() {
            this.timer.resetDiv();
        }
    }

    CPU.INTERRUPTS = {
        VBLANK: 0,
        LCDC: 1,
        TIMER: 2,
        SERIAL: 3,
        HILO: 4
    };
    CPU.interruptRoutines = {
        0: (p) => { GameboyJS.cpuOps.RSTn(p, 0x40); },
        1: (p) => { GameboyJS.cpuOps.RSTn(p, 0x48); },
        2: (p) => { GameboyJS.cpuOps.RSTn(p, 0x50); },
        3: (p) => { GameboyJS.cpuOps.RSTn(p, 0x58); },
        4: (p) => { GameboyJS.cpuOps.RSTn(p, 0x60); }
    };
    GameboyJS.CPU = CPU;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    let Debug = {};
    // Output a range of 16 memory addresses
    Debug.view_memory = function (addr, gameboy) {
        let memory = gameboy.cpu.memory;
        addr = addr & 0xFFF0;
        let pad = '00';
        let str = addr.toString(16) + ':';
        for (let i = addr; i < addr + 0x10; i++) {
            if ((i & 0x1) === 0) {
                str += ' ';
            }
            let val = memory[i] || 0;

            val = val.toString(16);
            str += pad.substring(val.length) + val;
        }

        return str;
    };

    Debug.view_tile = function (gameboy, index, dataStart) {
        //let memory = gameboy.cpu.memory;
        let screen = gameboy.screen;
        let LCDC = screen.deviceram(screen.LCDC);
        if (typeof dataStart === 'undefined') {
            dataStart = 0x8000;
            if (!GameboyJS.Util.readBit(LCDC, 4)) {
                dataStart = 0x8800;
                index = GameboyJS.cpuOps._getSignedValue(index) + 128;
            }
        }

        let tileData = screen.readTileData(index, dataStart);

        let pixelData = new Array(8 * 8)
        for (let line = 0; line < 8; line++) {
            let b1 = tileData.shift();
            let b2 = tileData.shift();

            for (let pixel = 0; pixel < 8; pixel++) {
                let mask = (1 << (7 - pixel));
                let colorValue = ((b1 & mask) >> (7 - pixel)) + ((b2 & mask) >> (7 - pixel)) * 2;
                pixelData[line * 8 + pixel] = colorValue;
            }
        }

        let i = 0;
        while (pixelData.length) {
            console.log(i++ + ' ' + pixelData.splice(0, 8).join(''));
        }
    };

    Debug.list_visible_sprites = function (gameboy) {
        let memory = gameboy.cpu.memory;
        let indexes = [];
        for (let i = 0xFE00; i < 0xFE9F; i += 4) {
            let x = memory.oamram(i + 1);
            let y = memory.oamram(i);
            let tileIndex = memory.oamram(i + 2);
            if (x === 0 || x >= 168) {
                continue;
            }
            indexes.push({ oamIndex: i, x: x, y: y, tileIndex: tileIndex });
        }

        return indexes;
    };
    GameboyJS.Debug = Debug;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    let Screen;
    class GPU {
        constructor(screen, cpu) {
            this.cpu = cpu;
            this.screen = screen;

            this.LCDC = 0xFF40;
            this.STAT = 0xFF41;
            this.SCY = 0xFF42;
            this.SCX = 0xFF43;
            this.LY = 0xFF44;
            this.LYC = 0xFF45;
            this.BGP = 0xFF47;
            this.OBP0 = 0xFF48;
            this.OBP1 = 0xFF49;
            this.WY = 0xFF4A;
            this.WX = 0xFF4B;

            this.vram = cpu.memory.vram.bind(cpu.memory);

            this.OAM_START = 0xFE00;
            this.OAM_END = 0xFE9F;
            this.deviceram = cpu.memory.deviceram.bind(cpu.memory);
            this.oamram = cpu.memory.oamram.bind(cpu.memory);
            this.VBLANK_TIME = 70224;
            this.clock = 0;
            this.mode = 2;
            this.line = 0;

            Screen = GameboyJS.Screen;
            this.buffer = new Array(Screen.physics.WIDTH * Screen.physics.HEIGHT);
            this.tileBuffer = new Array(8);
            this.bgTileCache = {};
        }
        // Get the palette mapping from a given palette byte as stored in memory
        // A palette will map a tile color to a final palette color index
        // used with Screen.colors to get a shade of grey
        static getPalette(paletteByte) {
            let palette = [];
            for (let i = 0; i < 8; i += 2) {
                let shade = (paletteByte & (3 << i)) >> i;
                palette.push(shade);
            }
            return palette;
        }
        update(clockElapsed) {
            this.clock += clockElapsed;
            let vblank = false;

            switch (this.mode) {
                case 0: // HBLANK
                    if (this.clock >= 204) {
                        this.clock -= 204;
                        this.line++;
                        this.updateLY();
                        if (this.line === 144) {
                            this.setMode(1);
                            vblank = true;
                            this.cpu.requestInterrupt(GameboyJS.CPU.INTERRUPTS.VBLANK);
                            this.drawFrame();
                        } else {
                            this.setMode(2);
                        }
                    }
                    break;
                case 1: // VBLANK
                    if (this.clock >= 456) {
                        this.clock -= 456;
                        this.line++;
                        if (this.line > 153) {
                            this.line = 0;
                            this.setMode(2);
                        }
                        this.updateLY();
                    }

                    break;
                case 2: // SCANLINE OAM
                    if (this.clock >= 80) {
                        this.clock -= 80;
                        this.setMode(3);
                    }
                    break;
                case 3: // SCANLINE VRAM
                    if (this.clock >= 172) {
                        this.clock -= 172;
                        this.drawScanLine(this.line);
                        this.setMode(0);
                    }
                    break;
            }

            return vblank;
        }
        updateLY() {
            this.deviceram(this.LY, this.line);
            let STAT = this.deviceram(this.STAT);
            if (this.deviceram(this.LY) === this.deviceram(this.LYC)) {
                this.deviceram(this.STAT, STAT | (1 << 2));
                if (STAT & (1 << 6)) {
                    this.cpu.requestInterrupt(GameboyJS.CPU.INTERRUPTS.LCDC);
                }
            } else {
                this.deviceram(this.STAT, STAT & (0xFF - (1 << 2)));
            }
        }
        setMode(mode) {
            this.mode = mode;
            let newSTAT = this.deviceram(this.STAT);
            newSTAT &= 0xFC;
            newSTAT |= mode;
            this.deviceram(this.STAT, newSTAT);

            if (mode < 3) {
                if (newSTAT & (1 << (3 + mode))) {
                    this.cpu.requestInterrupt(GameboyJS.CPU.INTERRUPTS.LCDC);
                }
            }
        }
        // Push one scanline into the main buffer
        drawScanLine(line) {
            let LCDC = this.deviceram(this.LCDC);
            let enable = GameboyJS.Util.readBit(LCDC, 7);
            if (enable) {
                let lineBuffer = new Array(Screen.physics.WIDTH);
                this.drawBackground(LCDC, line, lineBuffer);
                this.drawSprites(LCDC, line, lineBuffer);
                // TODO draw a line for the window here too
            }
        }
        drawFrame() {
            let LCDC = this.deviceram(this.LCDC);
            let enable = GameboyJS.Util.readBit(LCDC, 7);
            if (enable) {
                //this.drawSprites(LCDC);
                this.drawWindow(LCDC);
            }
            this.bgTileCache = {};
            this.screen.render(this.buffer);
        }
        drawBackground(LCDC, line, lineBuffer) {
            if (!GameboyJS.Util.readBit(LCDC, 0)) {
                return;
            }

            let mapStart = GameboyJS.Util.readBit(LCDC, 3) ? GPU.tilemap.START_1 : GPU.tilemap.START_0;

            let dataStart, signedIndex = false;
            if (GameboyJS.Util.readBit(LCDC, 4)) {
                dataStart = 0x8000;
            } else {
                dataStart = 0x8800;
                signedIndex = true;
            }

            let bgx = this.deviceram(this.SCX);
            let bgy = this.deviceram(this.SCY);
            let tileLine = ((line + bgy) & 7);

            // browse BG tilemap for the line to render
            let tileRow = ((((bgy + line) / 8) | 0) & 0x1F);
            let firstTile = ((bgx / 8) | 0) + 32 * tileRow;
            let lastTile = firstTile + Screen.physics.WIDTH / 8 + 1;
            if ((lastTile & 0x1F) < (firstTile & 0x1F)) {
                lastTile -= 32;
            }
            let x = (firstTile & 0x1F) * 8 - bgx; // x position of the first tile's leftmost pixel
            for (let i = firstTile; i !== lastTile; i++, (i & 0x1F) === 0 ? i -= 32 : null) {
                let tileIndex = this.vram(i + mapStart);

                if (signedIndex) {
                    tileIndex = GameboyJS.Util.getSignedValue(tileIndex) + 128;
                }

                // try to retrieve the tile data from the cache, or use readTileData() to read from ram
                // TODO find a better cache system now that the BG is rendered line by line
                let tileData = this.bgTileCache[tileIndex] || (this.bgTileCache[tileIndex] = this.readTileData(tileIndex, dataStart));

                this.drawTileLine(tileData, tileLine);
                this.copyBGTileLine(lineBuffer, this.tileBuffer, x);
                x += 8;
            }

            this.copyLineToBuffer(lineBuffer, line);
        }
        // Copy a tile line from a tileBuffer to a line buffer, at a given x position
        copyBGTileLine(lineBuffer, tileBuffer, x) {
            // copy tile line to buffer
            for (let k = 0; k < 8; k++, x++) {
                if (x < 0 || x >= Screen.physics.WIDTH) continue;
                lineBuffer[x] = tileBuffer[k];
            }
        }
        // Copy a scanline into the main buffer
        copyLineToBuffer(lineBuffer, line) {
            let bgPalette = GPU.getPalette(this.deviceram(this.BGP));

            for (let x = 0; x < Screen.physics.WIDTH; x++) {
                let color = lineBuffer[x];
                this.drawPixel(x, line, bgPalette[color]);
            }
        }
        // Write a line of a tile (8 pixels) into a buffer array
        drawTileLine(tileData, line, xflip, yflip) {
            xflip = xflip | 0;
            yflip = yflip | 0;
            let l = yflip ? 7 - line : line;
            let byteIndex = l * 2;
            let b1 = tileData[byteIndex++];
            let b2 = tileData[byteIndex++];

            let offset = 8;
            for (let pixel = 0; pixel < 8; pixel++) {
                offset--;
                let mask = (1 << offset);
                let colorValue = ((b1 & mask) >> offset) + ((b2 & mask) >> offset) * 2;
                let p = xflip ? offset : pixel;
                this.tileBuffer[p] = colorValue;
            }
        }
        drawSprites(LCDC, line, lineBuffer) {
            if (!GameboyJS.Util.readBit(LCDC, 1)) {
                return;
            }
            let spriteHeight = GameboyJS.Util.readBit(LCDC, 2) ? 16 : 8;

            let sprites = [];
            let flags;
            for (let i = this.OAM_START; i < this.OAM_END && sprites.length < 10; i += 4) {
                let y = this.oamram(i);
                let x = this.oamram(i + 1);
                let index = this.oamram(i + 2);
                flags = this.oamram(i + 3);

                if (y - 16 > line || y - 16 < line - spriteHeight) {
                    continue;
                }
                sprites.push({ x: x, y: y, index: index, flags: flags });
            }

            if (sprites.length === 0) return;

            // cache object to store read tiles from this frame
            let cacheTile = {};
            let spriteLineBuffer = new Array(Screen.physics.WIDTH);

            for (let i = 0; i < sprites.length; i++) {
                let sprite = sprites[i];
                let tileLine = line - sprite.y + 16;
                let paletteNumber = GameboyJS.Util.readBit(flags, 4);
                let xflip = GameboyJS.Util.readBit(sprite.flags, 5);
                let yflip = GameboyJS.Util.readBit(sprite.flags, 6);
                let tileData = cacheTile[sprite.index] || (cacheTile[sprite.index] = this.readTileData(sprite.index, 0x8000, spriteHeight * 2));
                this.drawTileLine(tileData, tileLine, xflip, yflip);
                this.copySpriteTileLine(spriteLineBuffer, this.tileBuffer, sprite.x - 8, paletteNumber);
            }

            this.copySpriteLineToBuffer(spriteLineBuffer, line);
        }
        // Copy a tile line from a tileBuffer to a line buffer, at a given x position
        copySpriteTileLine(lineBuffer, tileBuffer, x, palette) {
            // copy tile line to buffer
            for (let k = 0; k < 8; k++, x++) {
                if (x < 0 || x >= Screen.physics.WIDTH || tileBuffer[k] === 0) continue;
                lineBuffer[x] = { color: tileBuffer[k], palette: palette };
            }
        }
        // Copy a sprite scanline into the main buffer
        copySpriteLineToBuffer(spriteLineBuffer, line) {
            let spritePalettes = {};
            spritePalettes[0] = GPU.getPalette(this.deviceram(this.OBP0));
            spritePalettes[1] = GPU.getPalette(this.deviceram(this.OBP1));

            for (let x = 0; x < Screen.physics.WIDTH; x++) {
                if (!spriteLineBuffer[x]) continue;
                let color = spriteLineBuffer[x].color;
                if (color === 0) continue;
                let paletteNumber = spriteLineBuffer[x].palette;
                this.drawPixel(x, line, spritePalettes[paletteNumber][color]);
            }
        }
        drawTile(tileData, x, y, buffer, bufferWidth, xflip, yflip, spriteMode) {
            xflip = xflip | 0;
            yflip = yflip | 0;
            spriteMode = spriteMode | 0;
            let byteIndex = 0;
            for (let line = 0; line < 8; line++) {
                let l = yflip ? 7 - line : line;
                let b1 = tileData[byteIndex++];
                let b2 = tileData[byteIndex++];

                for (let pixel = 0; pixel < 8; pixel++) {
                    let mask = (1 << (7 - pixel));
                    let colorValue = ((b1 & mask) >> (7 - pixel)) + ((b2 & mask) >> (7 - pixel)) * 2;
                    if (spriteMode && colorValue === 0) continue;
                    let p = xflip ? 7 - pixel : pixel;
                    let bufferIndex = (x + p) + (y + l) * bufferWidth;
                    buffer[bufferIndex] = colorValue;
                }
            }
        }
        // get an array of tile bytes data (16 entries for 8*8px)
        readTileData(tileIndex, dataStart, tileSize) {
            tileSize = tileSize || 0x10; // 16 bytes / tile by default (8*8 px)
            let tileData = [];

            let tileAddressStart = dataStart + (tileIndex * 0x10);
            for (let i = tileAddressStart; i < tileAddressStart + tileSize; i++) {
                tileData.push(this.vram(i));
            }

            return tileData;
        }
        drawWindow(LCDC) {
            if (!GameboyJS.Util.readBit(LCDC, 5)) {
                return;
            }

            let buffer = new Array(256 * 256);
            let mapStart = GameboyJS.Util.readBit(LCDC, 6) ? GPU.tilemap.START_1 : GPU.tilemap.START_0;

            let dataStart, signedIndex = false;
            if (GameboyJS.Util.readBit(LCDC, 4)) {
                dataStart = 0x8000;
            } else {
                dataStart = 0x8800;
                signedIndex = true;
            }

            // browse Window tilemap
            for (let i = 0; i < GPU.tilemap.LENGTH; i++) {
                let tileIndex = this.vram(i + mapStart);

                if (signedIndex) {
                    tileIndex = GameboyJS.Util.getSignedValue(tileIndex) + 128;
                }

                let tileData = this.readTileData(tileIndex, dataStart);
                let x = i % GPU.tilemap.WIDTH;
                let y = (i / GPU.tilemap.WIDTH) | 0;
                this.drawTile(tileData, x * 8, y * 8, buffer, 256);
            }

            let wx = this.deviceram(this.WX) - 7;
            let wy = this.deviceram(this.WY);
            for (let x = Math.max(0, -wx); x < Math.min(Screen.physics.WIDTH, Screen.physics.WIDTH - wx); x++) {
                for (let y = Math.max(0, -wy); y < Math.min(Screen.physics.HEIGHT, Screen.physics.HEIGHT - wy); y++) {
                    let color = buffer[(x & 255) + (y & 255) * 256];
                    this.drawPixel(x + wx, y + wy, color);
                }
            }
        }
        drawPixel(x, y, color) {
            this.buffer[y * 160 + x] = color;
        }
        getPixel(x, y) {
            return this.buffer[y * 160 + x];
        }
    }

    GPU.tilemap = {
        HEIGHT: 32,
        WIDTH: 32,
        START_0: 0x9800,
        START_1: 0x9C00,
        LENGTH: 0x0400 // 1024 bytes = 32*32
    };
    GameboyJS.GPU = GPU;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // Screen device
    class Screen {
        constructor(canvas, pixelSize) {
            this.context = canvas.getContext('2d');
            this.canvas = canvas;
            this.pixelSize = pixelSize || 1;
            this.initImageData();
        }
        setPixelSize(pixelSize) {
            this.pixelSize = pixelSize;
            this.initImageData();
        }
        initImageData() {
            this.canvas.width = Screen.physics.WIDTH * this.pixelSize;
            this.canvas.height = Screen.physics.HEIGHT * this.pixelSize;
            this.imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
        }
        clearScreen() {
            this.context.fillStyle = '#FFF';
            this.context.fillRect(0, 0, Screen.physics.WIDTH * this.pixelSize, Screen.physics.HEIGHT * this.pixelSize);
        }
        fillImageData(buffer) {
            for (let y = 0; y < Screen.physics.HEIGHT; y++) {
                for (let py = 0; py < this.pixelSize; py++) {
                    let _y = y * this.pixelSize + py;
                    for (let x = 0; x < Screen.physics.WIDTH; x++) {
                        for (let px = 0; px < this.pixelSize; px++) {
                            let offset = _y * this.canvas.width + (x * this.pixelSize + px);
                            let v = Screen.colors[buffer[y * Screen.physics.WIDTH + x]];
                            this.imageData.data[offset * 4] = v;
                            this.imageData.data[offset * 4 + 1] = v;
                            this.imageData.data[offset * 4 + 2] = v;
                            this.imageData.data[offset * 4 + 3] = 255;
                        }
                    }
                }
            }
        }
        render(buffer) {
            this.fillImageData(buffer);
            this.context.putImageData(this.imageData, 0, 0);
        }
    }

    Screen.colors = [
        0xFF,
        0xAA,
        0x55,
        0x00
    ];

    Screen.physics = {
        WIDTH: 160,
        HEIGHT: 144,
        FREQUENCY: 60
    };
    GameboyJS.Screen = Screen;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {

    // has not been implemented is requested
    class UnimplementedException {
        constructor(message, fatal) {
            this.message = message;
            this.name = UnimplementedException;
            if (fatal === undefined) {
                fatal = true;
            }
            this.fatal = fatal;
        }
    }
    GameboyJS.UnimplementedException = UnimplementedException;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // Object for mapping the cartridge RAM
    class ExtRam {
        constructor() {
            this.extRam = null;
            this.ramSize = 0;
            this.ramBank = 0;
        }
        loadRam(game, size) {
            this.gameName = game;

            this.ramSize = size;
            this.ramBanksize = this.ramSize >= 0x2000 ? 8192 : 2048;

            let key = this.getStorageKey();
            let data = localStorage.getItem(key);
            if (data === null) {
                this.extRam = Array.apply(null, new Array(this.ramSize)).map(function () { return 0; });
            } else {
                this.extRam = JSON.parse(data);
                if (this.extRam.length !== size) {
                    console.error('Found RAM data but not matching expected size.');
                }
            }
        }
        setRamBank(bank) {
            this.ramBank = bank;
        }
        manageWrite(offset, value) {
            this.extRam[this.ramBank * 8192 + offset] = value;
        }
        manageRead(offset) {
            return this.extRam[this.ramBank * 8192 + offset];
        }
        getStorageKey() {
            return this.gameName + '_EXTRAM';;
        }
        // Actually save the RAM in the physical storage (localStorage)
        saveRamData() {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.extRam));
        }
    }
    GameboyJS.ExtRam = ExtRam;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    // This is the default buttons mapping for the Gamepad
    // It's optimized for the XBOX pad
    //
    // Any other mapping can be provided as a constructor argument of the Gamepad object
    // An alternative mapping should be an object with keys being the indexes
    // of the gamepad buttons and values the normalized gameboy button names
    const xboxMapping = {
        0: 'UP',
        1: 'DOWN',
        2: 'LEFT',
        3: 'RIGHT',
        4: 'START',
        5: 'SELECT',
        11: 'A',
        12: 'B'
    };

    // Gamepad listener
    // Communication layer between the Gamepad API and the Input class
    // Any physical controller can be used but the mapping should be provided
    // in order to get an optimal layout of the buttons (see above)
    class Gamepad {
        constructor(mapping) {
            this.gamepad = null;
            this.state = { A: 0, B: 0, START: 0, SELECT: 0, LEFT: 0, RIGHT: 0, UP: 0, DOWN: 0 };
            this.pullInterval = null;
            this.buttonMapping = mapping || xboxMapping;
        }
        // Initialize the keyboard listeners and set up the callbacks
        // for button press / release
        init(onPress, onRelease) {
            this.onPress = onPress;
            this.onRelease = onRelease;

            let self = this;
            window.addEventListener('gamepadconnected', (e) => {
                self.gamepad = e.gamepad;
                self.activatePull();
            });
            window.addEventListener('gamepaddisconnected', (e) => {
                self.gamepad = null;
                self.deactivatePull();
            });
        }
        activatePull() {
            this.deactivatePull();
            this.pullInterval = setInterval(this.pullState.bind(this), 100);
        }
        deactivatePull() {
            clearInterval(this.pullInterval);
        }
        // Check the state of the current gamepad in order to detect any press/release action
        pullState() {
            for (let index in this.buttonMapping) {
                let button = this.buttonMapping[index];
                let oldState = this.state[button];
                this.state[button] = this.gamepad.buttons[index].pressed;

                if (this.state[button] === 1 && oldState === 0) {
                    this.managePress(button);
                } else if (this.state[button] === 0 && oldState === 1) {
                    this.manageRelease(button);
                }
            }
        }
        managePress(key) {
            this.onPress(key);
        }
        manageRelease(key) {
            this.onRelease(key);
        }
    }
    GameboyJS.Gamepad = Gamepad;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // The Input management system
    //
    // The pressKey() and releaseKey() functions should be called by a device class
    // like GameboyJS.Keyboard after a physical button trigger event
    //
    // They rely on the name of the original buttons as parameters (see Input.keys)
    class Input {
        constructor(cpu, pad) {
            this.cpu = cpu;
            this.memory = cpu.memory;
            this.P1 = 0xFF00;
            this.state = 0;

            pad.init(this.pressKey.bind(this), this.releaseKey.bind(this));
        }
        pressKey(key) {
            this.state |= Input.keys[key];

            this.cpu.requestInterrupt(GameboyJS.CPU.INTERRUPTS.HILO);
        }
        releaseKey(key) {
            let mask = 0xFF - Input.keys[key];
            this.state &= mask;
        }
        update() {
            let value = this.memory.rb(this.P1);
            value = ((~value) & 0x30); // invert the value so 1 means 'active'
            if (value & 0x10) { // direction keys listened
                value |= (this.state & 0x0F);
            } else if (value & 0x20) { // action keys listened
                value |= ((this.state & 0xF0) >> 4);
            } else if ((value & 0x30) === 0) { // no keys listened
                value &= 0xF0;
            }

            value = ((~value) & 0x3F); // invert back
            this.memory[this.P1] = value;
        }
    }

    Input.keys = {
        START: 0x80,
        SELECT: 0x40,
        B: 0x20,
        A: 0x10,
        DOWN: 0x08,
        UP: 0x04,
        LEFT: 0x02,
        RIGHT: 0x01
    };

    GameboyJS.Input = Input;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // Keyboard listener
    // Does the mapping between the keyboard and the Input class
    class Keyboard {
        // Initialize the keyboard listeners and set up the callbacks
        // for button press / release
        init(onPress, onRelease) {
            this.onPress = onPress;
            this.onRelease = onRelease;

            let self = this;
            document.addEventListener('keydown', (e) => {
                self.managePress(e.keyCode);
            });
            document.addEventListener('keyup', (e) => {
                self.manageRelease(e.keyCode);
            });
        }
        managePress(keycode) {
            let key = this.translateKey(keycode);
            if (key) {
                this.onPress(key);
            }
        }
        manageRelease(keycode) {
            let key = this.translateKey(keycode);
            if (key) {
                this.onRelease(key);
            }
        }
        // Transform a keyboard keycode into a key of the Input.keys object
        translateKey(keycode) {
            let key = null;
            switch (keycode) {
                case 71: // G
                    key = 'A';
                    break;
                case 66: // B
                    key = 'B';
                    break;
                case 72: case 13:// H or ENTER
                    key = 'START';
                    break;
                case 78: // N
                    key = 'SELECT';
                    break;
                case 37: // left
                    key = 'LEFT';
                    break;
                case 38: // up
                    key = 'UP';
                    break;
                case 39: // right
                    key = 'RIGHT';
                    break;
                case 40: // down
                    key = 'DOWN';
                    break;
            }

            return key;
        }
    }
    GameboyJS.Keyboard = Keyboard;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // List of CPU operations
    // Most operations have been factorized here to limit code redundancy
    //
    // How to read operations:
    // Uppercase letters qualify the kind of operation (LD = LOAD, INC = INCREMENT, etc.)
    // Lowercase letters are used to hint parameters :
    // r = register, n = 1 memory byte, sp = sp register,
    // a = suffix for memory address, i = bit index
    // Example : LDrrar = LOAD operation with two-registers memory address
    // as first parameter and one register value as second
    //
    // Underscore-prefixed functions are here to delegate the logic between similar operations,
    // they should not be called from outside
    //
    // It's up to each operation to update the CPU clock
    let ops = {
        LDrrnn: function (p, r1, r2) { p.wr(r2, p.memory.rb(p.r.pc)); p.wr(r1, p.memory.rb(p.r.pc + 1)); p.r.pc += 2; p.clock.c += 12; },
        LDrrar: function (p, r1, r2, r3) { ops._LDav(p, GameboyJS.Util.getRegAddr(p, r1, r2), p.r[r3]); p.clock.c += 8; },
        LDrrra: function (p, r1, r2, r3) { p.wr(r1, p.memory.rb(GameboyJS.Util.getRegAddr(p, r2, r3))); p.clock.c += 8; },
        LDrn: function (p, r1) { p.wr(r1, p.memory.rb(p.r.pc++)); p.clock.c += 8; },
        LDrr: function (p, r1, r2) { p.wr(r1, p.r[r2]); p.clock.c += 4; },
        LDrar: function (p, r1, r2) { p.memory.wb(p.r[r1] + 0xFF00, p.r[r2]); p.clock.c += 8; },
        LDrra: function (p, r1, r2) { p.wr(r1, p.memory.rb(p.r[r2] + 0xFF00)); p.clock.c += 8; },
        LDspnn: (p) => { p.wr('sp', (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc)); p.r.pc += 2; p.clock.c += 12; },
        LDsprr: function (p, r1, r2) { p.wr('sp', GameboyJS.Util.getRegAddr(p, r1, r2)); p.clock.c += 8; },
        LDnnar: function (p, r1) { let addr = (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc); p.memory.wb(addr, p.r[r1]); p.r.pc += 2; p.clock.c += 16; },
        LDrnna: function (p, r1) { let addr = (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc); p.wr(r1, p.memory.rb(addr)); p.r.pc += 2; p.clock.c += 16; },
        LDrrspn: function (p, r1, r2) {
            let rel = p.memory.rb(p.r.pc++); rel = GameboyJS.Util.getSignedValue(rel); let val = p.r.sp + rel;
            let c = (p.r.sp & 0xFF) + (rel & 0xFF) > 0xFF; let h = (p.r.sp & 0xF) + (rel & 0xF) > 0xF; val &= 0xFFFF;
            let f = 0; if (h) f |= 0x20; if (c) f |= 0x10; p.wr('F', f);
            p.wr(r1, val >> 8); p.wr(r2, val & 0xFF);
            p.clock.c += 12;
        },
        LDnnsp: (p) => { let addr = p.memory.rb(p.r.pc++) + (p.memory.rb(p.r.pc++) << 8); ops._LDav(p, addr, p.r.sp & 0xFF); ops._LDav(p, addr + 1, p.r.sp >> 8); p.clock.c += 20; },
        LDrran: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); ops._LDav(p, addr, p.memory.rb(p.r.pc++)); p.clock.c += 12; },
        _LDav: function (p, addr, val) { p.memory.wb(addr, val); },
        LDHnar: function (p, r1) { p.memory.wb(0xFF00 + p.memory.rb(p.r.pc++), p.r[r1]); p.clock.c += 12; },
        LDHrna: function (p, r1) { p.wr(r1, p.memory.rb(0xFF00 + p.memory.rb(p.r.pc++))); p.clock.c += 12; },
        INCrr: function (p, r1, r2) { p.wr(r2, (p.r[r2] + 1) & 0xFF); if (p.r[r2] === 0) p.wr(r1, (p.r[r1] + 1) & 0xFF); p.clock.c += 8; },
        INCrra: function (p, r1, r2) {
            let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let val = (p.memory.rb(addr) + 1) & 0xFF; let z = val === 0; let h = (p.memory.rb(addr) & 0xF) + 1 > 0xF;
            p.memory.wb(addr, val);
            p.r.F &= 0x10; if (h) p.r.F |= 0x20; if (z) p.r.F |= 0x80;
            p.clock.c += 12;
        },
        INCsp: (p) => { p.wr('sp', p.r.sp + 1); p.r.sp &= 0xFFFF; p.clock.c += 8; },
        INCr: function (p, r1) {
            let h = ((p.r[r1] & 0xF) + 1) & 0x10; p.wr(r1, (p.r[r1] + 1) & 0xFF); let z = p.r[r1] === 0;
            p.r.F &= 0x10; if (h) p.r.F |= 0x20; if (z) p.r.F |= 0x80;
            p.clock.c += 4;
        },
        DECrr: function (p, r1, r2) { p.wr(r2, (p.r[r2] - 1) & 0xFF); if (p.r[r2] === 0xFF) p.wr(r1, (p.r[r1] - 1) & 0xFF); p.clock.c += 8; },
        DECsp: (p) => { p.wr('sp', p.r.sp - 1); p.r.sp &= 0xFFFF; p.clock.c += 8; },
        DECr: function (p, r1) {
            let h = (p.r[r1] & 0xF) < 1; p.wr(r1, (p.r[r1] - 1) & 0xFF); let z = p.r[r1] === 0;
            p.r.F &= 0x10; p.r.F |= 0x40; if (h) p.r.F |= 0x20; if (z) p.r.F |= 0x80;
            p.clock.c += 4;
        },
        DECrra: function (p, r1, r2) {
            let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let val = (p.memory.rb(addr) - 1) & 0xFF; let z = val === 0; let h = (p.memory.rb(addr) & 0xF) < 1;
            p.memory.wb(addr, val);
            p.r.F &= 0x10; p.r.F |= 0x40; if (h) p.r.F |= 0x20; if (z) p.r.F |= 0x80;
            p.clock.c += 12;
        },
        ADDrr: function (p, r1, r2) { let n = p.r[r2]; ops._ADDrn(p, r1, n); p.clock.c += 4; },
        ADDrn: function (p, r1) { let n = p.memory.rb(p.r.pc++); ops._ADDrn(p, r1, n); p.clock.c += 8; },
        _ADDrn: function (p, r1, n) {
            let h = ((p.r[r1] & 0xF) + (n & 0xF)) & 0x10; p.wr(r1, p.r[r1] + n); let c = p.r[r1] & 0x100; p.r[r1] &= 0xFF;
            let f = 0; if (p.r[r1] === 0) f |= 0x80; if (h) f |= 0x20; if (c) f |= 0x10; p.wr('F', f);
        },
        ADDrrrr: function (p, r1, r2, r3, r4) { ops._ADDrrn(p, r1, r2, (p.r[r3] << 8) + p.r[r4]); p.clock.c += 8; },
        ADDrrsp: function (p, r1, r2) { ops._ADDrrn(p, r1, r2, p.r.sp); p.clock.c += 8; },
        ADDspn: (p) => {
            let v = p.memory.rb(p.r.pc++); v = GameboyJS.Util.getSignedValue(v);
            let c = ((p.r.sp & 0xFF) + (v & 0xFF)) > 0xFF; let h = (p.r.sp & 0xF) + (v & 0xF) > 0xF;
            let f = 0; if (h) f |= 0x20; if (c) f |= 0x10; p.wr('F', f);
            p.wr('sp', (p.r.sp + v) & 0xFFFF);
            p.clock.c += 16;
        },
        _ADDrrn: function (p, r1, r2, n) {
            let v1 = (p.r[r1] << 8) + p.r[r2]; let v2 = n;
            let res = v1 + v2; let c = res & 0x10000; let h = ((v1 & 0xFFF) + (v2 & 0xFFF)) & 0x1000; let z = p.r.F & 0x80;
            res &= 0xFFFF; p.r[r2] = res & 0xFF; res = res >> 8; p.r[r1] = res & 0xFF;
            let f = 0; if (z) f |= 0x80; if (h) f |= 0x20; if (c) f |= 0x10; p.r.F = f;
        },
        ADCrr: function (p, r1, r2) { let n = p.r[r2]; ops._ADCrn(p, r1, n); p.clock.c += 4; },
        ADCrn: function (p, r1) { let n = p.memory.rb(p.r.pc++); ops._ADCrn(p, r1, n); p.clock.c += 8; },
        _ADCrn: function (p, r1, n) {
            let c = p.r.F & 0x10 ? 1 : 0; let h = ((p.r[r1] & 0xF) + (n & 0xF) + c) & 0x10;
            p.wr(r1, p.r[r1] + n + c); c = p.r[r1] & 0x100; p.r[r1] &= 0xFF;
            let f = 0; if (p.r[r1] === 0) f |= 0x80; if (h) f |= 0x20; if (c) f |= 0x10; p.r.F = f;
        },
        ADCrrra: function (p, r1, r2, r3) { let n = p.memory.rb(GameboyJS.Util.getRegAddr(p, r2, r3)); ops._ADCrn(p, r1, n); p.clock.c += 8; },
        ADDrrra: function (p, r1, r2, r3) {
            let v = p.memory.rb(GameboyJS.Util.getRegAddr(p, r2, r3)); let h = ((p.r[r1] & 0xF) + (v & 0xF)) & 0x10; p.wr(r1, p.r[r1] + v); let c = p.r[r1] & 0x100; p.r[r1] &= 0xFF;
            let f = 0; if (p.r[r1] === 0) f |= 0x80; if (h) f |= 0x20; if (c) f |= 0x10; p.wr('F', f);
            p.clock.c += 8;
        },
        SUBr: function (p, r1) { let n = p.r[r1]; ops._SUBn(p, n); p.clock.c += 4; },
        SUBn: (p) => { let n = p.memory.rb(p.r.pc++); ops._SUBn(p, n); p.clock.c += 8; },
        SUBrra: function (p, r1, r2) { let n = p.memory.rb(GameboyJS.Util.getRegAddr(p, r1, r2)); ops._SUBn(p, n); p.clock.c += 8; },
        _SUBn: function (p, n) {
            let c = p.r.A < n; let h = (p.r.A & 0xF) < (n & 0xF);
            p.wr('A', p.r.A - n); p.r.A &= 0xFF; let z = p.r.A === 0;
            let f = 0x40; if (z) f |= 0x80; if (h) f |= 0x20; if (c) f |= 0x10; p.wr('F', f);
        },
        SBCn: (p) => { let n = p.memory.rb(p.r.pc++); ops._SBCn(p, n); p.clock.c += 8; },
        SBCr: function (p, r1) { let n = p.r[r1]; ops._SBCn(p, n); p.clock.c += 4; },
        SBCrra: function (p, r1, r2) { let v = p.memory.rb((p.r[r1] << 8) + p.r[r2]); ops._SBCn(p, v); p.clock.c += 8; },
        _SBCn: function (p, n) {
            let carry = p.r.F & 0x10 ? 1 : 0;
            let c = p.r.A < n + carry; let h = (p.r.A & 0xF) < (n & 0xF) + carry;
            p.wr('A', p.r.A - n - carry); p.r.A &= 0xFF; let z = p.r.A === 0;
            let f = 0x40; if (z) f |= 0x80; if (h) f |= 0x20; if (c) f |= 0x10; p.r.F = f;
        },
        ORr: function (p, r1) { p.r.A |= p.r[r1]; p.r.F = (p.r.A === 0) ? 0x80 : 0x00; p.clock.c += 4; },
        ORn: (p) => { p.r.A |= p.memory.rb(p.r.pc++); p.r.F = (p.r.A === 0) ? 0x80 : 0x00; p.clock.c += 8; },
        ORrra: function (p, r1, r2) { p.r.A |= p.memory.rb((p.r[r1] << 8) + p.r[r2]); p.r.F = (p.r.A === 0) ? 0x80 : 0x00; p.clock.c += 8; },
        ANDr: function (p, r1) { p.r.A &= p.r[r1]; p.r.F = (p.r.A === 0) ? 0xA0 : 0x20; p.clock.c += 4; },
        ANDn: (p) => { p.r.A &= p.memory.rb(p.r.pc++); p.r.F = (p.r.A === 0) ? 0xA0 : 0x20; p.clock.c += 8; },
        ANDrra: function (p, r1, r2) { p.r.A &= p.memory.rb(GameboyJS.Util.getRegAddr(p, r1, r2)); p.r.F = (p.r.A === 0) ? 0xA0 : 0x20; p.clock.c += 8; },
        XORr: function (p, r1) { p.r.A ^= p.r[r1]; p.r.F = (p.r.A === 0) ? 0x80 : 0x00; p.clock.c += 4; },
        XORn: (p) => { p.r.A ^= p.memory.rb(p.r.pc++); p.r.F = (p.r.A === 0) ? 0x80 : 0x00; p.clock.c += 8; },
        XORrra: function (p, r1, r2) { p.r.A ^= p.memory.rb((p.r[r1] << 8) + p.r[r2]); p.r.F = (p.r.A === 0) ? 0x80 : 0x00; p.clock.c += 8; },
        CPr: function (p, r1) { let n = p.r[r1]; ops._CPn(p, n); p.clock.c += 4; },
        CPn: (p) => { let n = p.memory.rb(p.r.pc++); ops._CPn(p, n); p.clock.c += 8; },
        CPrra: function (p, r1, r2) { let n = p.memory.rb(GameboyJS.Util.getRegAddr(p, r1, r2)); ops._CPn(p, n); p.clock.c += 8; },
        _CPn: function (p, n) {
            let c = p.r.A < n; let z = p.r.A === n; let h = (p.r.A & 0xF) < (n & 0xF);
            let f = 0x40; if (z) f += 0x80; if (h) f += 0x20; if (c) f += 0x10; p.r.F = f;
        },
        RRCr: function (p, r1) { p.r.F = 0; let out = p.r[r1] & 0x01; if (out) p.r.F |= 0x10; p.r[r1] = (p.r[r1] >> 1) | (out * 0x80); if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        RRCrra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); p.r.F = 0; let out = p.memory.rb(addr) & 0x01; if (out) p.r.F |= 0x10; p.memory.wb(addr, (p.memory.rb(addr) >> 1) | (out * 0x80)); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        RLCr: function (p, r1) { p.r.F = 0; let out = p.r[r1] & 0x80 ? 1 : 0; if (out) p.r.F |= 0x10; p.r[r1] = ((p.r[r1] << 1) + out) & 0xFF; if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        RLCrra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); p.r.F = 0; let out = p.memory.rb(addr) & 0x80 ? 1 : 0; if (out) p.r.F |= 0x10; p.memory.wb(addr, ((p.memory.rb(addr) << 1) + out) & 0xFF); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        RLr: function (p, r1) { let c = (p.r.F & 0x10) ? 1 : 0; p.r.F = 0; let out = p.r[r1] & 0x80; out ? p.r.F |= 0x10 : p.r.F &= 0xEF; p.r[r1] = ((p.r[r1] << 1) + c) & 0xFF; if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        RLrra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let c = (p.r.F & 0x10) ? 1 : 0; p.r.F = 0; let out = p.memory.rb(addr) & 0x80; out ? p.r.F |= 0x10 : p.r.F &= 0xEF; p.memory.wb(addr, ((p.memory.rb(addr) << 1) + c) & 0xFF); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        RRr: function (p, r1) { let c = (p.r.F & 0x10) ? 1 : 0; p.r.F = 0; let out = p.r[r1] & 0x01; out ? p.r.F |= 0x10 : p.r.F &= 0xEF; p.r[r1] = (p.r[r1] >> 1) | (c * 0x80); if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        RRrra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let c = (p.r.F & 0x10) ? 1 : 0; p.r.F = 0; let out = p.memory.rb(addr) & 0x01; out ? p.r.F |= 0x10 : p.r.F &= 0xEF; p.memory.wb(addr, (p.memory.rb(addr) >> 1) | (c * 0x80)); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        SRAr: function (p, r1) { p.r.F = 0; if (p.r[r1] & 0x01) p.r.F |= 0x10; let msb = p.r[r1] & 0x80; p.r[r1] = (p.r[r1] >> 1) | msb; if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        SRArra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); p.r.F = 0; if (p.memory.rb(addr) & 0x01) p.r.F |= 0x10; let msb = p.memory.rb(addr) & 0x80; p.memory.wb(addr, (p.memory.rb(addr) >> 1) | msb); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        SLAr: function (p, r1) { p.r.F = 0; if (p.r[r1] & 0x80) p.r.F |= 0x10; p.r[r1] = (p.r[r1] << 1) & 0xFF; if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        SLArra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); p.r.F = 0; if (p.memory.rb(addr) & 0x80) p.r.F |= 0x10; p.memory.wb(addr, (p.memory.rb(addr) << 1) & 0xFF); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        SRLr: function (p, r1) { p.r.F = 0; if (p.r[r1] & 0x01) p.r.F |= 0x10; p.r[r1] = p.r[r1] >> 1; if (p.r[r1] === 0) p.r.F |= 0x80; p.clock.c += 4; },
        SRLrra: function (p, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); p.r.F = 0; if (p.memory.rb(addr) & 0x01) p.r.F |= 0x10; p.memory.wb(addr, p.memory.rb(addr) >> 1); if (p.memory.rb(addr) === 0) p.r.F |= 0x80; p.clock.c += 12; },
        BITir: function (p, i, r1) { let mask = 1 << i; let z = (p.r[r1] & mask) ? 0 : 1; let f = p.r.F & 0x10; f |= 0x20; if (z) f |= 0x80; p.r.F = f; p.clock.c += 4; },
        BITirra: function (p, i, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let mask = 1 << i; let z = (p.memory.rb(addr) & mask) ? 0 : 1; let f = p.r.F & 0x10; f |= 0x20; if (z) f |= 0x80; p.r.F = f; p.clock.c += 8; },
        SETir: function (p, i, r1) { let mask = 1 << i; p.r[r1] |= mask; p.clock.c += 4; },
        SETirra: function (p, i, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let mask = 1 << i; p.memory.wb(addr, p.memory.rb(addr) | mask); p.clock.c += 12; },
        RESir: function (p, i, r1) { let mask = 0xFF - (1 << i); p.r[r1] &= mask; p.clock.c += 4; },
        RESirra: function (p, i, r1, r2) { let addr = GameboyJS.Util.getRegAddr(p, r1, r2); let mask = 0xFF - (1 << i); p.memory.wb(addr, p.memory.rb(addr) & mask); p.clock.c += 12; },
        SWAPr: function (p, r1) { p.r[r1] = ops._SWAPn(p, p.r[r1]); p.clock.c += 4; },
        SWAPrra: function (p, r1, r2) { let addr = (p.r[r1] << 8) + p.r[r2]; p.memory.wb(addr, ops._SWAPn(p, p.memory.rb(addr))); p.clock.c += 12; },
        _SWAPn: function (p, n) { p.r.F = n === 0 ? 0x80 : 0; return ((n & 0xF0) >> 4) | ((n & 0x0F) << 4); },
        JPnn: (p) => { p.wr('pc', (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc)); p.clock.c += 16; },
        JRccn: function (p, cc) { if (GameboyJS.Util.testFlag(p, cc)) { let v = p.memory.rb(p.r.pc++); v = GameboyJS.Util.getSignedValue(v); p.r.pc += v; p.clock.c += 4; } else { p.r.pc++; } p.clock.c += 8; },
        JPccnn: function (p, cc) { if (GameboyJS.Util.testFlag(p, cc)) { p.wr('pc', (p.memory.rb(p.r.pc + 1) << 8) + p.memory.rb(p.r.pc)); p.clock.c += 4; } else { p.r.pc += 2; } p.clock.c += 12; },
        JPrr: function (p, r1, r2) { p.r.pc = (p.r[r1] << 8) + p.r[r2]; p.clock.c += 4; },
        JRn: (p) => { let v = p.memory.rb(p.r.pc++); v = GameboyJS.Util.getSignedValue(v); p.r.pc += v; p.clock.c += 12; },
        PUSHrr: function (p, r1, r2) { p.wr('sp', p.r.sp - 1); p.memory.wb(p.r.sp, p.r[r1]); p.wr('sp', p.r.sp - 1); p.memory.wb(p.r.sp, p.r[r2]); p.clock.c += 16; },
        POPrr: function (p, r1, r2) { p.wr(r2, p.memory.rb(p.r.sp)); p.wr('sp', p.r.sp + 1); p.wr(r1, p.memory.rb(p.r.sp)); p.wr('sp', p.r.sp + 1); p.clock.c += 12; },
        RSTn: function (p, n) { p.wr('sp', p.r.sp - 1); p.memory.wb(p.r.sp, p.r.pc >> 8); p.wr('sp', p.r.sp - 1); p.memory.wb(p.r.sp, p.r.pc & 0xFF); p.r.pc = n; p.clock.c += 16; },
        RET: (p) => { p.r.pc = p.memory.rb(p.r.sp); p.wr('sp', p.r.sp + 1); p.r.pc += p.memory.rb(p.r.sp) << 8; p.wr('sp', p.r.sp + 1); p.clock.c += 16; },
        RETcc: function (p, cc) { if (GameboyJS.Util.testFlag(p, cc)) { p.r.pc = p.memory.rb(p.r.sp); p.wr('sp', p.r.sp + 1); p.r.pc += p.memory.rb(p.r.sp) << 8; p.wr('sp', p.r.sp + 1); p.clock.c += 12; } p.clock.c += 8; },
        CALLnn: (p) => { ops._CALLnn(p); p.clock.c += 24; },
        CALLccnn: function (p, cc) { if (GameboyJS.Util.testFlag(p, cc)) { ops._CALLnn(p); p.clock.c += 12; } else { p.r.pc += 2; } p.clock.c += 12; },
        _CALLnn: (p) => {
            p.wr('sp', p.r.sp - 1); p.memory.wb(p.r.sp, ((p.r.pc + 2) & 0xFF00) >> 8);
            p.wr('sp', p.r.sp - 1); p.memory.wb(p.r.sp, (p.r.pc + 2) & 0x00FF);
            let j = p.memory.rb(p.r.pc) + (p.memory.rb(p.r.pc + 1) << 8); p.r.pc = j;
        },
        // eslint-disable-next-line no-unused-expressions
        CPL: (p) => { p.wr('A', (~p.r.A) & 0xFF); p.r.F |= 0x60; p.clock.c += 4; },
        CCF: (p) => { p.r.F &= 0x9F; p.r.F & 0x10 ? p.r.F &= 0xE0 : p.r.F |= 0x10; p.clock.c += 4; },
        SCF: (p) => { p.r.F &= 0x9F; p.r.F |= 0x10; p.clock.c += 4; },
        DAA: (p) => {
            let sub = (p.r.F & 0x40) ? 1 : 0; let h = (p.r.F & 0x20) ? 1 : 0; let c = (p.r.F & 0x10) ? 1 : 0;
            if (sub) {
                if (h) {
                    p.r.A = (p.r.A - 0x6) & 0xFF;
                }
                if (c) {
                    p.r.A -= 0x60;
                }
            } else {
                if ((p.r.A & 0xF) > 9 || h) {
                    p.r.A += 0x6;
                }
                if (p.r.A > 0x9F || c) {
                    p.r.A += 0x60;
                }
            }
            if (p.r.A & 0x100) c = 1;

            p.r.A &= 0xFF;
            p.r.F &= 0x40; if (p.r.A === 0) p.r.F |= 0x80; if (c) p.r.F |= 0x10;
            p.clock.c += 4;
        },
        HALT: (p) => { p.halt(); p.clock.c += 4; },
        DI: (p) => { p.disableInterrupts(); p.clock.c += 4; },
        EI: (p) => { p.enableInterrupts(); p.clock.c += 4; },
        RETI: (p) => { p.enableInterrupts(); ops.RET(p); },
        CB: (p) => {
            let opcode = p.memory.rb(p.r.pc++);
            GameboyJS.opcodeCbmap[opcode](p);
            p.clock.c += 4;
        }
    };
    GameboyJS.cpuOps = ops;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    let defaultOptions = {
        pad: { class: GameboyJS.Keyboard, mapping: null },
        zoom: 1,
        romReaders: [],
        statusContainerId: 'status',
        gameNameContainerId: 'game-name',
        errorContainerId: 'error'
    };

    // Gameboy class
    //
    // This object is the entry point of the application
    // Will delegate user actions to the emulated devices
    // and provide information where needed
    class Gameboy {
        constructor(canvas, options) {
            this.options = GameboyJS.Util.extend(defaultOptions, options);

            let cpu = new GameboyJS.CPU(this);
            let screen = new GameboyJS.Screen(canvas, this.options.zoom);
            let gpu = new GameboyJS.GPU(screen, cpu);
            cpu.gpu = gpu;

            let pad = new this.options.pad.class(this.options.pad.mapping);
            let input = new GameboyJS.Input(cpu, pad);
            cpu.input = input;

            this.cpu = cpu;
            this.screen = screen;
            this.input = input;
            this.pad = pad;

            this.createRom(this.options.romReaders);

            this.statusContainer = document.getElementById(this.options.statusContainerId) || document.createElement('div');
            this.gameNameContainer = document.getElementById(this.options.gameNameContainerId) || document.createElement('div');
            this.errorContainer = document.getElementById(this.options.errorContainerId) || document.createElement('div');
        }
        // Create the ROM object and bind one or more readers
        createRom(readers) {
            let rom = new GameboyJS.Rom(this);
            if (readers.length === 0) {
                // add the default rom reader
                let romReader = new GameboyJS.RomFileReader();
                rom.addReader(romReader);
            } else {
                for (let i in readers) {
                    if (readers.hasOwnProperty(i)) {
                        rom.addReader(readers[i]);
                    }
                }
            }
        }
        startRom(rom) {
            this.errorContainer.classList.add('hide');
            this.cpu.reset();
            try {
                this.cpu.loadRom(rom.data);
                this.setStatus('Game Running :');
                this.setGameName(this.cpu.getGameName());
                this.cpu.run();
            } catch (e) {
                this.handleException(e);
            }
        }
        pause(value) {
            if (value) {
                this.setStatus('Game Paused :');
                this.cpu.pause();
            } else {
                this.setStatus('Game Running :');
                this.cpu.unpause();
            }
        }
        error(message) {
            this.setStatus('Error during execution');
            this.setError('An error occurred during execution:' + message);
            this.cpu.stop();
        }
        setStatus(status) {
            this.statusContainer.innerHTML = status;
        }
        // Display an error message
        setError(message) {
            this.errorContainer.classList.remove('hide');
            this.errorContainer.innerHTML = message;
        }
        // Display the name of the game running
        setGameName(name) {
            this.gameNameContainer.innerHTML = name;
        }
        setSoundEnabled(value) {
            if (value) {
                this.cpu.apu.connect();
            } else {
                this.cpu.apu.disconnect();
            }
        }
        setScreenZoom(value) {
            this.screen.setPixelSize(value);
        }
        handleException(e) {
            if (e instanceof GameboyJS.UnimplementedException) {
                if (e.fatal) {
                    this.error('This cartridge is not supported (' + e.message + ')');
                } else {
                    console.error(e.message);
                }
            } else {
                throw e;
            }
        }
    }

    GameboyJS.Gameboy = Gameboy;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // Memory bank controllers
    let MBC = {};
    // Create an MBC instance depending on the type specified in the cartridge
    MBC.getMbcInstance = function (memory, type) {
        let instance;
        switch (type) {
            case 0x00:
                instance = new MBC0(memory);
                break;
            case 0x01: case 0x02: case 0x03:
                instance = new MBC1(memory);
                break;
            case 0x0F: case 0x10: case 0x11: case 0x12: case 0x13:
                instance = new MBC3(memory);
                break;
            case 0x19: case 0x1A: case 0x1B: case 0x1C: case 0x1D: case 0x1E:
                instance = new MBC5(memory);
                break;
            default:
                throw new GameboyJS.UnimplementedException('MBC type not supported');
        }

        return instance;
    };

    class MBC1 {
        constructor(memory) {
            this.memory = memory;
            this.romBankNumber = 1;
            this.mode = 0; // mode 0 = ROM, mode 1 = RAM
            this.ramEnabled = true;
            this.extRam = new GameboyJS.ExtRam();
        }
        loadRam(game, size) {
            this.extRam.loadRam(game, size);
        }
        manageWrite(addr, value) {
            switch (addr & 0xF000) {
                case 0x0000: case 0x1000: // enable RAM
                    this.ramEnabled = (value & 0x0A) ? true : false;
                    if (this.ramEnabled) {
                        this.extRam.saveRamData();
                    }
                    break;
                case 0x2000: case 0x3000: // ROM bank number lower 5 bits
                    value &= 0x1F;
                    if (value === 0) value = 1;
                    let mask = this.mode ? 0 : 0xE0;
                    this.romBankNumber = (this.romBankNumber & mask) + value;
                    this.memory.loadRomBank(this.romBankNumber);
                    break;
                case 0x4000: case 0x5000: // RAM bank or high bits ROM
                    value &= 0x03;
                    if (this.mode === 0) { // ROM upper bits
                        this.romBankNumber = (this.romBankNumber & 0x1F) | (value << 5);
                        this.memory.loadRomBank(this.romBankNumber);
                    } else { // RAM bank
                        this.extRam.setRamBank(value);
                    }
                    break;
                case 0x6000: case 0x7000: // ROM / RAM mode
                    this.mode = value & 1;
                    break;
                case 0xA000: case 0xB000:
                    this.extRam.manageWrite(addr - 0xA000, value);
                    break;
            }
        }
        readRam(addr) {
            return this.extRam.manageRead(addr - 0xA000);
        }
    }

    class MBC3 {
        constructor(memory) {
            this.memory = memory;
            this.romBankNumber = 1;
            this.ramEnabled = true;
            this.extRam = new GameboyJS.ExtRam();
        }
        loadRam(game, size) {
            this.extRam.loadRam(game, size);
        }
        manageWrite(addr, value) {
            switch (addr & 0xF000) {
                case 0x0000: case 0x1000: // enable RAM
                    this.ramEnabled = (value & 0x0A) ? true : false;
                    if (this.ramEnabled) {
                        this.extRam.saveRamData();
                    }
                    break;
                case 0x2000: case 0x3000: // ROM bank number
                    value &= 0x7F;
                    if (value === 0) value = 1;
                    this.romBankNumber = value;
                    this.memory.loadRomBank(this.romBankNumber);
                    break;
                case 0x4000: case 0x5000: // RAM bank
                    this.extRam.setRamBank(value);
                    break;
                case 0x6000: case 0x7000: // Latch clock data
                    throw new GameboyJS.UnimplementedException('cartridge clock not supported', false);
                case 0xA000: case 0xB000:
                    this.extRam.manageWrite(addr - 0xA000, value);
                    break;
            }
        }
        readRam(addr) {
            return this.extRam.manageRead(addr - 0xA000);
        }
    }

    // declare MBC5 for compatibility with most cartriges
    // does not support rumble feature
    let MBC5 = MBC3;

    // MBC0 exists for consistency and manages the no-MBC cartriges
    class MBC0 {
        constructor(memory) { this.memory = memory; }
        manageWrite(addr, value) {
            this.memory.loadRomBank(value);
        }
        readRam(addr) { return 0; }
        loadRam() { }
    }

    GameboyJS.MBC = MBC;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    // Memory unit
    class Memory {
        constructor(cpu) {
            this.MEM_SIZE = 65536; // 64KB

            this.MBCtype = 0;
            this.banksize = 0x4000;
            this.rom = null;
            this.mbc = null;
            this.cpu = cpu;
        }
        reset() {
            this.length = this.MEM_SIZE;
            for (let i = Memory.addresses.VRAM_START; i <= Memory.addresses.VRAM_END; i++) {
                this[i] = 0;
            }
            for (let i = Memory.addresses.DEVICE_START; i <= Memory.addresses.DEVICE_END; i++) {
                this[i] = 0;
            }
            this[0xFFFF] = 0;
        }
        setRomData(data) {
            this.rom = data;
            this.loadRomBank(0);
            this.mbc = GameboyJS.MBC.getMbcInstance(this, this[0x147]);
            this.loadRomBank(1);
            this.mbc.loadRam(this.cpu.getGameName(), this.cpu.getRamSize());
        }
        loadRomBank(index) {
            let start = index ? 0x4000 : 0x0;
            let romStart = index * 0x4000;
            for (let i = 0; i < this.banksize; i++) {
                this[i + start] = this.rom[romStart + i];
            }
        }
        // Video ram accessor
        vram(address) {
            if (address < Memory.addresses.VRAM_START || address > Memory.addresses.VRAM_END) {
                throw 'VRAM access in out of bounds address ' + address;
            }

            return this[address];
        }
        // OAM ram accessor
        oamram(address) {
            if (address < Memory.addresses.OAM_START || address > Memory.addresses.OAM_END) {
                throw 'OAMRAM access in out of bounds address ' + address;
            }

            return this[address];
        }
        // Device ram accessor
        deviceram(address, value) {
            if (address < Memory.addresses.DEVICERAM_START || address > Memory.addresses.DEVICERAM_END) {
                throw 'Device RAM access in out of bounds address ' + address;
            }
            if (typeof value === "undefined") {
                return this[address];
            } else {
                this[address] = value;
            }

        }
        // Memory read proxy function
        // Used to centralize memory read access
        rb(addr) {
            if (addr >= 0xFF10 && addr < 0xFF40) {
                let mask = apuMask[addr - 0xFF10];
                return this[addr] | mask;
            }
            if ((addr >= 0xA000 && addr < 0xC000)) {
                return this.mbc.readRam(addr);
            }
            return this[addr];
        }
        // Memory write proxy function
        // Used to centralize memory writes and delegate specific behaviour
        // to the correct units
        wb(addr, value) {
            if (addr < 0x8000 || (addr >= 0xA000 && addr < 0xC000)) { // MBC
                this.mbc.manageWrite(addr, value);
            } else if (addr >= 0xFF10 && addr <= 0xFF3F) { // sound registers
                this.cpu.apu.manageWrite(addr, value);
            } else if (addr === 0xFF00) { // input register
                this[addr] = ((this[addr] & 0x0F) | (value & 0x30));
            } else {
                this[addr] = value;
                if ((addr & 0xFF00) === 0xFF00) {
                    if (addr === 0xFF02) {
                        if (value & 0x80) {
                            this.cpu.enableSerialTransfer();
                        }
                    }
                    if (addr === 0xFF04) {
                        this.cpu.resetDivTimer();
                    }
                    if (addr === 0xFF46) { // OAM DMA transfer
                        this.dmaTransfer(value);
                    }
                }
            }
        }
        // Start a DMA transfer (OAM data from cartrige to RAM)
        dmaTransfer(startAddressPrefix) {
            let startAddress = (startAddressPrefix << 8);
            for (let i = 0; i < 0xA0; i++) {
                this[Memory.addresses.OAM_START + i] = this[startAddress + i];
            }
        }
    }

    Memory.addresses = {
        VRAM_START: 0x8000,
        VRAM_END: 0x9FFF,

        EXTRAM_START: 0xA000,
        EXTRAM_END: 0xBFFF,

        OAM_START: 0xFE00,
        OAM_END: 0xFE9F,

        DEVICE_START: 0xFF00,
        DEVICE_END: 0xFF7F
    };

    // Memory can be accessed as an Array
    //Memory.prototype = [];

    // Bitmasks for audio addresses reads
    let apuMask = [
        0x80, 0x3F, 0x00, 0xFF, 0xBF, // NR10-NR15
        0xFF, 0x3F, 0x00, 0xFF, 0xBF, // NR20-NR25
        0x7F, 0xFF, 0x9F, 0xFF, 0xBF, // NR30-NR35
        0xFF, 0xFF, 0x00, 0x00, 0xBF, // NR40-NR45
        0x00, 0x00, 0x70,           // NR50-NR52
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Wave RAM
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    GameboyJS.Memory = Memory;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    let ops = GameboyJS.cpuOps;
    // Each opcode (0 to 0xFF) is associated to a CPU operation
    // CPU operations are implemented separately
    // The cbmap object holds operations for CB prefixed opcodes (0xCB00 to 0xCBFF)
    // Non existent opcodes are commented out and marked empty
    const map = {
        0x00: (p) => { p.clock.c += 4; },
        0x01: (p) => { ops.LDrrnn(p, 'B', 'C'); },
        0x02: (p) => { ops.LDrrar(p, 'B', 'C', 'A'); },
        0x03: (p) => { ops.INCrr(p, 'B', 'C'); },
        0x04: (p) => { ops.INCr(p, 'B'); },
        0x05: (p) => { ops.DECr(p, 'B'); },
        0x06: (p) => { ops.LDrn(p, 'B'); },
        0x07: (p) => { let out = p.r.A & 0x80 ? 1 : 0; out ? p.r.F = 0x10 : p.r.F = 0; p.wr('A', ((p.r.A << 1) + out) & 0xFF); p.clock.c += 4; },
        0x08: (p) => { ops.LDnnsp(p); },
        0x09: (p) => { ops.ADDrrrr(p, 'H', 'L', 'B', 'C'); },
        0x0A: (p) => { ops.LDrrra(p, 'A', 'B', 'C'); },
        0x0B: (p) => { ops.DECrr(p, 'B', 'C'); },
        0x0C: (p) => { ops.INCr(p, 'C'); },
        0x0D: (p) => { ops.DECr(p, 'C'); },
        0x0E: (p) => { ops.LDrn(p, 'C'); },
        0x0F: (p) => { let out = p.r.A & 0x01; out ? p.r.F = 0x10 : p.r.F = 0; p.wr('A', (p.r.A >> 1) | (out * 0x80)); p.clock.c += 4; },

        0x10: (p) => { p.r.pc++; p.clock.c += 4; },
        0x11: (p) => { ops.LDrrnn(p, 'D', 'E'); },
        0x12: (p) => { ops.LDrrar(p, 'D', 'E', 'A'); },
        0x13: (p) => { ops.INCrr(p, 'D', 'E'); },
        0x14: (p) => { ops.INCr(p, 'D'); },
        0x15: (p) => { ops.DECr(p, 'D'); },
        0x16: (p) => { ops.LDrn(p, 'D'); },
        0x17: (p) => { let c = (p.r.F & 0x10) ? 1 : 0; let out = p.r.A & 0x80 ? 1 : 0; out ? p.r.F = 0x10 : p.r.F = 0; p.wr('A', ((p.r.A << 1) + c) & 0xFF); p.clock.c += 4; },
        0x18: (p) => { ops.JRn(p); },
        0x19: (p) => { ops.ADDrrrr(p, 'H', 'L', 'D', 'E'); },
        0x1A: (p) => { ops.LDrrra(p, 'A', 'D', 'E'); },
        0x1B: (p) => { ops.DECrr(p, 'D', 'E'); },
        0x1C: (p) => { ops.INCr(p, 'E'); },
        0x1D: (p) => { ops.DECr(p, 'E'); },
        0x1E: (p) => { ops.LDrn(p, 'E'); },
        0x1F: (p) => { let c = (p.r.F & 0x10) ? 1 : 0; let out = p.r.A & 0x01; out ? p.r.F = 0x10 : p.r.F = 0; p.wr('A', (p.r.A >> 1) | (c * 0x80)); p.clock.c += 4; },

        0x20: (p) => { ops.JRccn(p, 'NZ'); },
        0x21: (p) => { ops.LDrrnn(p, 'H', 'L'); },
        0x22: (p) => { ops.LDrrar(p, 'H', 'L', 'A'); ops.INCrr(p, 'H', 'L'); p.clock.c -= 8; },
        0x23: (p) => { ops.INCrr(p, 'H', 'L'); },
        0x24: (p) => { ops.INCr(p, 'H'); },
        0x25: (p) => { ops.DECr(p, 'H'); },
        0x26: (p) => { ops.LDrn(p, 'H'); },
        0x27: (p) => { ops.DAA(p); },
        0x28: (p) => { ops.JRccn(p, 'Z'); },
        0x29: (p) => { ops.ADDrrrr(p, 'H', 'L', 'H', 'L'); },
        0x2A: (p) => { ops.LDrrra(p, 'A', 'H', 'L'); ops.INCrr(p, 'H', 'L'); p.clock.c -= 8; },
        0x2B: (p) => { ops.DECrr(p, 'H', 'L'); },
        0x2C: (p) => { ops.INCr(p, 'L'); },
        0x2D: (p) => { ops.DECr(p, 'L'); },
        0x2E: (p) => { ops.LDrn(p, 'L'); },
        0x2F: (p) => { ops.CPL(p); },

        0x30: (p) => { ops.JRccn(p, 'NC'); },
        0x31: (p) => { ops.LDspnn(p); },
        0x32: (p) => { ops.LDrrar(p, 'H', 'L', 'A'); ops.DECrr(p, 'H', 'L'); p.clock.c -= 8; },
        0x33: (p) => { ops.INCsp(p); },
        0x34: (p) => { ops.INCrra(p, 'H', 'L'); },
        0x35: (p) => { ops.DECrra(p, 'H', 'L'); },
        0x36: (p) => { ops.LDrran(p, 'H', 'L'); },
        0x37: (p) => { ops.SCF(p); },
        0x38: (p) => { ops.JRccn(p, 'C'); },
        0x39: (p) => { ops.ADDrrsp(p, 'H', 'L'); },
        0x3A: (p) => { ops.LDrrra(p, 'A', 'H', 'L'); ops.DECrr(p, 'H', 'L'); p.clock.c -= 8; },
        0x3B: (p) => { ops.DECsp(p); },
        0x3C: (p) => { ops.INCr(p, 'A'); },
        0x3D: (p) => { ops.DECr(p, 'A'); },
        0x3E: (p) => { ops.LDrn(p, 'A'); },
        0x3F: (p) => { ops.CCF(p); },

        0x40: (p) => { ops.LDrr(p, 'B', 'B'); },
        0x41: (p) => { ops.LDrr(p, 'B', 'C'); },
        0x42: (p) => { ops.LDrr(p, 'B', 'D'); },
        0x43: (p) => { ops.LDrr(p, 'B', 'E'); },
        0x44: (p) => { ops.LDrr(p, 'B', 'H'); },
        0x45: (p) => { ops.LDrr(p, 'B', 'L'); },
        0x46: (p) => { ops.LDrrra(p, 'B', 'H', 'L'); },
        0x47: (p) => { ops.LDrr(p, 'B', 'A'); },
        0x48: (p) => { ops.LDrr(p, 'C', 'B'); },
        0x49: (p) => { ops.LDrr(p, 'C', 'C'); },
        0x4A: (p) => { ops.LDrr(p, 'C', 'D'); },
        0x4B: (p) => { ops.LDrr(p, 'C', 'E'); },
        0x4C: (p) => { ops.LDrr(p, 'C', 'H'); },
        0x4D: (p) => { ops.LDrr(p, 'C', 'L'); },
        0x4E: (p) => { ops.LDrrra(p, 'C', 'H', 'L'); },
        0x4F: (p) => { ops.LDrr(p, 'C', 'A'); },

        0x50: (p) => { ops.LDrr(p, 'D', 'B'); },
        0x51: (p) => { ops.LDrr(p, 'D', 'C'); },
        0x52: (p) => { ops.LDrr(p, 'D', 'D'); },
        0x53: (p) => { ops.LDrr(p, 'D', 'E'); },
        0x54: (p) => { ops.LDrr(p, 'D', 'H'); },
        0x55: (p) => { ops.LDrr(p, 'D', 'L'); },
        0x56: (p) => { ops.LDrrra(p, 'D', 'H', 'L'); },
        0x57: (p) => { ops.LDrr(p, 'D', 'A'); },
        0x58: (p) => { ops.LDrr(p, 'E', 'B'); },
        0x59: (p) => { ops.LDrr(p, 'E', 'C'); },
        0x5A: (p) => { ops.LDrr(p, 'E', 'D'); },
        0x5B: (p) => { ops.LDrr(p, 'E', 'E'); },
        0x5C: (p) => { ops.LDrr(p, 'E', 'H'); },
        0x5D: (p) => { ops.LDrr(p, 'E', 'L'); },
        0x5E: (p) => { ops.LDrrra(p, 'E', 'H', 'L'); },
        0x5F: (p) => { ops.LDrr(p, 'E', 'A'); },

        0x60: (p) => { ops.LDrr(p, 'H', 'B'); },
        0x61: (p) => { ops.LDrr(p, 'H', 'C'); },
        0x62: (p) => { ops.LDrr(p, 'H', 'D'); },
        0x63: (p) => { ops.LDrr(p, 'H', 'E'); },
        0x64: (p) => { ops.LDrr(p, 'H', 'H'); },
        0x65: (p) => { ops.LDrr(p, 'H', 'L'); },
        0x66: (p) => { ops.LDrrra(p, 'H', 'H', 'L'); },
        0x67: (p) => { ops.LDrr(p, 'H', 'A'); },
        0x68: (p) => { ops.LDrr(p, 'L', 'B'); },
        0x69: (p) => { ops.LDrr(p, 'L', 'C'); },
        0x6A: (p) => { ops.LDrr(p, 'L', 'D'); },
        0x6B: (p) => { ops.LDrr(p, 'L', 'E'); },
        0x6C: (p) => { ops.LDrr(p, 'L', 'H'); },
        0x6D: (p) => { ops.LDrr(p, 'L', 'L'); },
        0x6E: (p) => { ops.LDrrra(p, 'L', 'H', 'L'); },
        0x6F: (p) => { ops.LDrr(p, 'L', 'A'); },

        0x70: (p) => { ops.LDrrar(p, 'H', 'L', 'B'); },
        0x71: (p) => { ops.LDrrar(p, 'H', 'L', 'C'); },
        0x72: (p) => { ops.LDrrar(p, 'H', 'L', 'D'); },
        0x73: (p) => { ops.LDrrar(p, 'H', 'L', 'E'); },
        0x74: (p) => { ops.LDrrar(p, 'H', 'L', 'H'); },
        0x75: (p) => { ops.LDrrar(p, 'H', 'L', 'L'); },
        0x76: (p) => { ops.HALT(p); },
        0x77: (p) => { ops.LDrrar(p, 'H', 'L', 'A'); },
        0x78: (p) => { ops.LDrr(p, 'A', 'B'); },
        0x79: (p) => { ops.LDrr(p, 'A', 'C'); },
        0x7A: (p) => { ops.LDrr(p, 'A', 'D'); },
        0x7B: (p) => { ops.LDrr(p, 'A', 'E'); },
        0x7C: (p) => { ops.LDrr(p, 'A', 'H'); },
        0x7D: (p) => { ops.LDrr(p, 'A', 'L'); },
        0x7E: (p) => { ops.LDrrra(p, 'A', 'H', 'L'); },
        0x7F: (p) => { ops.LDrr(p, 'A', 'A'); },

        0x80: (p) => { ops.ADDrr(p, 'A', 'B'); },
        0x81: (p) => { ops.ADDrr(p, 'A', 'C'); },
        0x82: (p) => { ops.ADDrr(p, 'A', 'D'); },
        0x83: (p) => { ops.ADDrr(p, 'A', 'E'); },
        0x84: (p) => { ops.ADDrr(p, 'A', 'H'); },
        0x85: (p) => { ops.ADDrr(p, 'A', 'L'); },
        0x86: (p) => { ops.ADDrrra(p, 'A', 'H', 'L'); },
        0x87: (p) => { ops.ADDrr(p, 'A', 'A'); },
        0x88: (p) => { ops.ADCrr(p, 'A', 'B'); },
        0x89: (p) => { ops.ADCrr(p, 'A', 'C'); },
        0x8A: (p) => { ops.ADCrr(p, 'A', 'D'); },
        0x8B: (p) => { ops.ADCrr(p, 'A', 'E'); },
        0x8C: (p) => { ops.ADCrr(p, 'A', 'H'); },
        0x8D: (p) => { ops.ADCrr(p, 'A', 'L'); },
        0x8E: (p) => { ops.ADCrrra(p, 'A', 'H', 'L'); },
        0x8F: (p) => { ops.ADCrr(p, 'A', 'A'); },

        0x90: (p) => { ops.SUBr(p, 'B'); },
        0x91: (p) => { ops.SUBr(p, 'C'); },
        0x92: (p) => { ops.SUBr(p, 'D'); },
        0x93: (p) => { ops.SUBr(p, 'E'); },
        0x94: (p) => { ops.SUBr(p, 'H'); },
        0x95: (p) => { ops.SUBr(p, 'L'); },
        0x96: (p) => { ops.SUBrra(p, 'H', 'L'); },
        0x97: (p) => { ops.SUBr(p, 'A'); },
        0x98: (p) => { ops.SBCr(p, 'B'); },
        0x99: (p) => { ops.SBCr(p, 'C'); },
        0x9A: (p) => { ops.SBCr(p, 'D'); },
        0x9B: (p) => { ops.SBCr(p, 'E'); },
        0x9C: (p) => { ops.SBCr(p, 'H'); },
        0x9D: (p) => { ops.SBCr(p, 'L'); },
        0x9E: (p) => { ops.SBCrra(p, 'H', 'L'); },
        0x9F: (p) => { ops.SBCr(p, 'A'); },

        0xA0: (p) => { ops.ANDr(p, 'B'); },
        0xA1: (p) => { ops.ANDr(p, 'C'); },
        0xA2: (p) => { ops.ANDr(p, 'D'); },
        0xA3: (p) => { ops.ANDr(p, 'E'); },
        0xA4: (p) => { ops.ANDr(p, 'H'); },
        0xA5: (p) => { ops.ANDr(p, 'L'); },
        0xA6: (p) => { ops.ANDrra(p, 'H', 'L'); },
        0xA7: (p) => { ops.ANDr(p, 'A'); },
        0xA8: (p) => { ops.XORr(p, 'B'); },
        0xA9: (p) => { ops.XORr(p, 'C'); },
        0xAA: (p) => { ops.XORr(p, 'D'); },
        0xAB: (p) => { ops.XORr(p, 'E'); },
        0xAC: (p) => { ops.XORr(p, 'H'); },
        0xAD: (p) => { ops.XORr(p, 'L'); },
        0xAE: (p) => { ops.XORrra(p, 'H', 'L'); },
        0xAF: (p) => { ops.XORr(p, 'A'); },

        0xB0: (p) => { ops.ORr(p, 'B'); },
        0xB1: (p) => { ops.ORr(p, 'C'); },
        0xB2: (p) => { ops.ORr(p, 'D'); },
        0xB3: (p) => { ops.ORr(p, 'E'); },
        0xB4: (p) => { ops.ORr(p, 'H'); },
        0xB5: (p) => { ops.ORr(p, 'L'); },
        0xB6: (p) => { ops.ORrra(p, 'H', 'L'); },
        0xB7: (p) => { ops.ORr(p, 'A'); },
        0xB8: (p) => { ops.CPr(p, 'B'); },
        0xB9: (p) => { ops.CPr(p, 'C'); },
        0xBA: (p) => { ops.CPr(p, 'D'); },
        0xBB: (p) => { ops.CPr(p, 'E'); },
        0xBC: (p) => { ops.CPr(p, 'H'); },
        0xBD: (p) => { ops.CPr(p, 'L'); },
        0xBE: (p) => { ops.CPrra(p, 'H', 'L'); },
        0xBF: (p) => { ops.CPr(p, 'A'); },

        0xC0: (p) => { ops.RETcc(p, 'NZ'); },
        0xC1: (p) => { ops.POPrr(p, 'B', 'C'); },
        0xC2: (p) => { ops.JPccnn(p, 'NZ'); },
        0xC3: (p) => { ops.JPnn(p); },
        0xC4: (p) => { ops.CALLccnn(p, 'NZ'); },
        0xC5: (p) => { ops.PUSHrr(p, 'B', 'C'); },
        0xC6: (p) => { ops.ADDrn(p, 'A'); },
        0xC7: (p) => { ops.RSTn(p, 0x00); },
        0xC8: (p) => { ops.RETcc(p, 'Z'); },
        0xC9: (p) => { ops.RET(p); },
        0xCA: (p) => { ops.JPccnn(p, 'Z'); },
        0xCB: (p) => { ops.CB(p); },
        0xCC: (p) => { ops.CALLccnn(p, 'Z'); },
        0xCD: (p) => { ops.CALLnn(p); },
        0xCE: (p) => { ops.ADCrn(p, 'A'); },
        0xCF: (p) => { ops.RSTn(p, 0x08); },

        0xD0: (p) => { ops.RETcc(p, 'NC'); },
        0xD1: (p) => { ops.POPrr(p, 'D', 'E'); },
        0xD2: (p) => { ops.JPccnn(p, 'NC'); },
        //0xD3 empty
        0xD4: (p) => { ops.CALLccnn(p, 'NC'); },
        0xD5: (p) => { ops.PUSHrr(p, 'D', 'E'); },
        0xD6: (p) => { ops.SUBn(p); },
        0xD7: (p) => { ops.RSTn(p, 0x10); },
        0xD8: (p) => { ops.RETcc(p, 'C'); },
        0xD9: (p) => { ops.RETI(p); },
        0xDA: (p) => { ops.JPccnn(p, 'C'); },
        //0xDB empty
        0xDC: (p) => { ops.CALLccnn(p, 'C'); },
        //0xDD empty
        0xDE: (p) => { ops.SBCn(p); },
        0xDF: (p) => { ops.RSTn(p, 0x18); },

        0xE0: (p) => { ops.LDHnar(p, 'A'); },
        0xE1: (p) => { ops.POPrr(p, 'H', 'L'); },
        0xE2: (p) => { ops.LDrar(p, 'C', 'A'); },
        //0xE3 empty
        //0xE4 empty
        0xE5: (p) => { ops.PUSHrr(p, 'H', 'L'); },
        0xE6: (p) => { ops.ANDn(p); },
        0xE7: (p) => { ops.RSTn(p, 0x20); },
        0xE8: (p) => { ops.ADDspn(p); },
        0xE9: (p) => { ops.JPrr(p, 'H', 'L'); },
        0xEA: (p) => { ops.LDnnar(p, 'A'); },
        //0xEB empty
        //0xEC empty
        //0xED empty
        0xEE: (p) => { ops.XORn(p); },
        0xEF: (p) => { ops.RSTn(p, 0x28); },

        0xF0: (p) => { ops.LDHrna(p, 'A'); },
        0xF1: (p) => { ops.POPrr(p, 'A', 'F'); },
        0xF2: (p) => { ops.LDrra(p, 'A', 'C'); },
        0xF3: (p) => { ops.DI(p); },
        //0xF4 empty
        0xF5: (p) => { ops.PUSHrr(p, 'A', 'F'); },
        0xF6: (p) => { ops.ORn(p); },
        0xF7: (p) => { ops.RSTn(p, 0x30); },
        0xF8: (p) => { ops.LDrrspn(p, 'H', 'L'); },
        0xF9: (p) => { ops.LDsprr(p, 'H', 'L'); },
        0xFA: (p) => { ops.LDrnna(p, 'A'); },
        0xFB: (p) => { ops.EI(p); },
        //0xFC empty
        //0xFD empty
        0xFE: (p) => { ops.CPn(p); },
        0xFF: (p) => { ops.RSTn(p, 0x38); }
    };

    const cbmap = {
        0x00: (p) => { ops.RLCr(p, 'B'); },
        0x01: (p) => { ops.RLCr(p, 'C'); },
        0x02: (p) => { ops.RLCr(p, 'D'); },
        0x03: (p) => { ops.RLCr(p, 'E'); },
        0x04: (p) => { ops.RLCr(p, 'H'); },
        0x05: (p) => { ops.RLCr(p, 'L'); },
        0x06: (p) => { ops.RLCrra(p, 'H', 'L'); },
        0x07: (p) => { ops.RLCr(p, 'A'); },
        0x08: (p) => { ops.RRCr(p, 'B'); },
        0x09: (p) => { ops.RRCr(p, 'C'); },
        0x0A: (p) => { ops.RRCr(p, 'D'); },
        0x0B: (p) => { ops.RRCr(p, 'E'); },
        0x0C: (p) => { ops.RRCr(p, 'H'); },
        0x0D: (p) => { ops.RRCr(p, 'L'); },
        0x0E: (p) => { ops.RRCrra(p, 'H', 'L'); },
        0x0F: (p) => { ops.RRCr(p, 'A'); },

        0x10: (p) => { ops.RLr(p, 'B'); },
        0x11: (p) => { ops.RLr(p, 'C'); },
        0x12: (p) => { ops.RLr(p, 'D'); },
        0x13: (p) => { ops.RLr(p, 'E'); },
        0x14: (p) => { ops.RLr(p, 'H'); },
        0x15: (p) => { ops.RLr(p, 'L'); },
        0x16: (p) => { ops.RLrra(p, 'H', 'L'); },
        0x17: (p) => { ops.RLr(p, 'A'); },
        0x18: (p) => { ops.RRr(p, 'B'); },
        0x19: (p) => { ops.RRr(p, 'C'); },
        0x1A: (p) => { ops.RRr(p, 'D'); },
        0x1B: (p) => { ops.RRr(p, 'E'); },
        0x1C: (p) => { ops.RRr(p, 'H'); },
        0x1D: (p) => { ops.RRr(p, 'L'); },
        0x1E: (p) => { ops.RRrra(p, 'H', 'L'); },
        0x1F: (p) => { ops.RRr(p, 'A'); },

        0x20: (p) => { ops.SLAr(p, 'B'); },
        0x21: (p) => { ops.SLAr(p, 'C'); },
        0x22: (p) => { ops.SLAr(p, 'D'); },
        0x23: (p) => { ops.SLAr(p, 'E'); },
        0x24: (p) => { ops.SLAr(p, 'H'); },
        0x25: (p) => { ops.SLAr(p, 'L'); },
        0x26: (p) => { ops.SLArra(p, 'H', 'L'); },
        0x27: (p) => { ops.SLAr(p, 'A'); },
        0x28: (p) => { ops.SRAr(p, 'B'); },
        0x29: (p) => { ops.SRAr(p, 'C'); },
        0x2A: (p) => { ops.SRAr(p, 'D'); },
        0x2B: (p) => { ops.SRAr(p, 'E'); },
        0x2C: (p) => { ops.SRAr(p, 'H'); },
        0x2D: (p) => { ops.SRAr(p, 'L'); },
        0x2E: (p) => { ops.SRArra(p, 'H', 'L'); },
        0x2F: (p) => { ops.SRAr(p, 'A'); },

        0x30: (p) => { ops.SWAPr(p, 'B'); },
        0x31: (p) => { ops.SWAPr(p, 'C'); },
        0x32: (p) => { ops.SWAPr(p, 'D'); },
        0x33: (p) => { ops.SWAPr(p, 'E'); },
        0x34: (p) => { ops.SWAPr(p, 'H'); },
        0x35: (p) => { ops.SWAPr(p, 'L'); },
        0x36: (p) => { ops.SWAPrra(p, 'H', 'L'); },
        0x37: (p) => { ops.SWAPr(p, 'A'); },
        0x38: (p) => { ops.SRLr(p, 'B'); },
        0x39: (p) => { ops.SRLr(p, 'C'); },
        0x3A: (p) => { ops.SRLr(p, 'D'); },
        0x3B: (p) => { ops.SRLr(p, 'E'); },
        0x3C: (p) => { ops.SRLr(p, 'H'); },
        0x3D: (p) => { ops.SRLr(p, 'L'); },
        0x3E: (p) => { ops.SRLrra(p, 'H', 'L'); },
        0x3F: (p) => { ops.SRLr(p, 'A'); },

        0x40: (p) => { ops.BITir(p, 0, 'B'); },
        0x41: (p) => { ops.BITir(p, 0, 'C'); },
        0x42: (p) => { ops.BITir(p, 0, 'D'); },
        0x43: (p) => { ops.BITir(p, 0, 'E'); },
        0x44: (p) => { ops.BITir(p, 0, 'H'); },
        0x45: (p) => { ops.BITir(p, 0, 'L'); },
        0x46: (p) => { ops.BITirra(p, 0, 'H', 'L'); },
        0x47: (p) => { ops.BITir(p, 0, 'A'); },
        0x48: (p) => { ops.BITir(p, 1, 'B'); },
        0x49: (p) => { ops.BITir(p, 1, 'C'); },
        0x4A: (p) => { ops.BITir(p, 1, 'D'); },
        0x4B: (p) => { ops.BITir(p, 1, 'E'); },
        0x4C: (p) => { ops.BITir(p, 1, 'H'); },
        0x4D: (p) => { ops.BITir(p, 1, 'L'); },
        0x4E: (p) => { ops.BITirra(p, 1, 'H', 'L'); },
        0x4F: (p) => { ops.BITir(p, 1, 'A'); },

        0x50: (p) => { ops.BITir(p, 2, 'B'); },
        0x51: (p) => { ops.BITir(p, 2, 'C'); },
        0x52: (p) => { ops.BITir(p, 2, 'D'); },
        0x53: (p) => { ops.BITir(p, 2, 'E'); },
        0x54: (p) => { ops.BITir(p, 2, 'H'); },
        0x55: (p) => { ops.BITir(p, 2, 'L'); },
        0x56: (p) => { ops.BITirra(p, 2, 'H', 'L'); },
        0x57: (p) => { ops.BITir(p, 2, 'A'); },
        0x58: (p) => { ops.BITir(p, 3, 'B'); },
        0x59: (p) => { ops.BITir(p, 3, 'C'); },
        0x5A: (p) => { ops.BITir(p, 3, 'D'); },
        0x5B: (p) => { ops.BITir(p, 3, 'E'); },
        0x5C: (p) => { ops.BITir(p, 3, 'H'); },
        0x5D: (p) => { ops.BITir(p, 3, 'L'); },
        0x5E: (p) => { ops.BITirra(p, 3, 'H', 'L'); },
        0x5F: (p) => { ops.BITir(p, 3, 'A'); },

        0x60: (p) => { ops.BITir(p, 4, 'B'); },
        0x61: (p) => { ops.BITir(p, 4, 'C'); },
        0x62: (p) => { ops.BITir(p, 4, 'D'); },
        0x63: (p) => { ops.BITir(p, 4, 'E'); },
        0x64: (p) => { ops.BITir(p, 4, 'H'); },
        0x65: (p) => { ops.BITir(p, 4, 'L'); },
        0x66: (p) => { ops.BITirra(p, 4, 'H', 'L'); },
        0x67: (p) => { ops.BITir(p, 4, 'A'); },
        0x68: (p) => { ops.BITir(p, 5, 'B'); },
        0x69: (p) => { ops.BITir(p, 5, 'C'); },
        0x6A: (p) => { ops.BITir(p, 5, 'D'); },
        0x6B: (p) => { ops.BITir(p, 5, 'E'); },
        0x6C: (p) => { ops.BITir(p, 5, 'H'); },
        0x6D: (p) => { ops.BITir(p, 5, 'L'); },
        0x6E: (p) => { ops.BITirra(p, 5, 'H', 'L'); },
        0x6F: (p) => { ops.BITir(p, 5, 'A'); },

        0x70: (p) => { ops.BITir(p, 6, 'B'); },
        0x71: (p) => { ops.BITir(p, 6, 'C'); },
        0x72: (p) => { ops.BITir(p, 6, 'D'); },
        0x73: (p) => { ops.BITir(p, 6, 'E'); },
        0x74: (p) => { ops.BITir(p, 6, 'H'); },
        0x75: (p) => { ops.BITir(p, 6, 'L'); },
        0x76: (p) => { ops.BITirra(p, 6, 'H', 'L'); },
        0x77: (p) => { ops.BITir(p, 6, 'A'); },
        0x78: (p) => { ops.BITir(p, 7, 'B'); },
        0x79: (p) => { ops.BITir(p, 7, 'C'); },
        0x7A: (p) => { ops.BITir(p, 7, 'D'); },
        0x7B: (p) => { ops.BITir(p, 7, 'E'); },
        0x7C: (p) => { ops.BITir(p, 7, 'H'); },
        0x7D: (p) => { ops.BITir(p, 7, 'L'); },
        0x7E: (p) => { ops.BITirra(p, 7, 'H', 'L'); },
        0x7F: (p) => { ops.BITir(p, 7, 'A'); },

        0x80: (p) => { ops.RESir(p, 0, 'B'); },
        0x81: (p) => { ops.RESir(p, 0, 'C'); },
        0x82: (p) => { ops.RESir(p, 0, 'D'); },
        0x83: (p) => { ops.RESir(p, 0, 'E'); },
        0x84: (p) => { ops.RESir(p, 0, 'H'); },
        0x85: (p) => { ops.RESir(p, 0, 'L'); },
        0x86: (p) => { ops.RESirra(p, 0, 'H', 'L'); },
        0x87: (p) => { ops.RESir(p, 0, 'A'); },
        0x88: (p) => { ops.RESir(p, 1, 'B'); },
        0x89: (p) => { ops.RESir(p, 1, 'C'); },
        0x8A: (p) => { ops.RESir(p, 1, 'D'); },
        0x8B: (p) => { ops.RESir(p, 1, 'E'); },
        0x8C: (p) => { ops.RESir(p, 1, 'H'); },
        0x8D: (p) => { ops.RESir(p, 1, 'L'); },
        0x8E: (p) => { ops.RESirra(p, 1, 'H', 'L'); },
        0x8F: (p) => { ops.RESir(p, 1, 'A'); },

        0x90: (p) => { ops.RESir(p, 2, 'B'); },
        0x91: (p) => { ops.RESir(p, 2, 'C'); },
        0x92: (p) => { ops.RESir(p, 2, 'D'); },
        0x93: (p) => { ops.RESir(p, 2, 'E'); },
        0x94: (p) => { ops.RESir(p, 2, 'H'); },
        0x95: (p) => { ops.RESir(p, 2, 'L'); },
        0x96: (p) => { ops.RESirra(p, 2, 'H', 'L'); },
        0x97: (p) => { ops.RESir(p, 2, 'A'); },
        0x98: (p) => { ops.RESir(p, 3, 'B'); },
        0x99: (p) => { ops.RESir(p, 3, 'C'); },
        0x9A: (p) => { ops.RESir(p, 3, 'D'); },
        0x9B: (p) => { ops.RESir(p, 3, 'E'); },
        0x9C: (p) => { ops.RESir(p, 3, 'H'); },
        0x9D: (p) => { ops.RESir(p, 3, 'L'); },
        0x9E: (p) => { ops.RESirra(p, 3, 'H', 'L'); },
        0x9F: (p) => { ops.RESir(p, 3, 'A'); },

        0xA0: (p) => { ops.RESir(p, 4, 'B'); },
        0xA1: (p) => { ops.RESir(p, 4, 'C'); },
        0xA2: (p) => { ops.RESir(p, 4, 'D'); },
        0xA3: (p) => { ops.RESir(p, 4, 'E'); },
        0xA4: (p) => { ops.RESir(p, 4, 'H'); },
        0xA5: (p) => { ops.RESir(p, 4, 'L'); },
        0xA6: (p) => { ops.RESirra(p, 4, 'H', 'L'); },
        0xA7: (p) => { ops.RESir(p, 4, 'A'); },
        0xA8: (p) => { ops.RESir(p, 5, 'B'); },
        0xA9: (p) => { ops.RESir(p, 5, 'C'); },
        0xAA: (p) => { ops.RESir(p, 5, 'D'); },
        0xAB: (p) => { ops.RESir(p, 5, 'E'); },
        0xAC: (p) => { ops.RESir(p, 5, 'H'); },
        0xAD: (p) => { ops.RESir(p, 5, 'L'); },
        0xAE: (p) => { ops.RESirra(p, 5, 'H', 'L'); },
        0xAF: (p) => { ops.RESir(p, 5, 'A'); },

        0xB0: (p) => { ops.RESir(p, 6, 'B'); },
        0xB1: (p) => { ops.RESir(p, 6, 'C'); },
        0xB2: (p) => { ops.RESir(p, 6, 'D'); },
        0xB3: (p) => { ops.RESir(p, 6, 'E'); },
        0xB4: (p) => { ops.RESir(p, 6, 'H'); },
        0xB5: (p) => { ops.RESir(p, 6, 'L'); },
        0xB6: (p) => { ops.RESirra(p, 6, 'H', 'L'); },
        0xB7: (p) => { ops.RESir(p, 6, 'A'); },
        0xB8: (p) => { ops.RESir(p, 7, 'B'); },
        0xB9: (p) => { ops.RESir(p, 7, 'C'); },
        0xBA: (p) => { ops.RESir(p, 7, 'D'); },
        0xBB: (p) => { ops.RESir(p, 7, 'E'); },
        0xBC: (p) => { ops.RESir(p, 7, 'H'); },
        0xBD: (p) => { ops.RESir(p, 7, 'L'); },
        0xBE: (p) => { ops.RESirra(p, 7, 'H', 'L'); },
        0xBF: (p) => { ops.RESir(p, 7, 'A'); },

        0xC0: (p) => { ops.SETir(p, 0, 'B'); },
        0xC1: (p) => { ops.SETir(p, 0, 'C'); },
        0xC2: (p) => { ops.SETir(p, 0, 'D'); },
        0xC3: (p) => { ops.SETir(p, 0, 'E'); },
        0xC4: (p) => { ops.SETir(p, 0, 'H'); },
        0xC5: (p) => { ops.SETir(p, 0, 'L'); },
        0xC6: (p) => { ops.SETirra(p, 0, 'H', 'L'); },
        0xC7: (p) => { ops.SETir(p, 0, 'A'); },
        0xC8: (p) => { ops.SETir(p, 1, 'B'); },
        0xC9: (p) => { ops.SETir(p, 1, 'C'); },
        0xCA: (p) => { ops.SETir(p, 1, 'D'); },
        0xCB: (p) => { ops.SETir(p, 1, 'E'); },
        0xCC: (p) => { ops.SETir(p, 1, 'H'); },
        0xCD: (p) => { ops.SETir(p, 1, 'L'); },
        0xCE: (p) => { ops.SETirra(p, 1, 'H', 'L'); },
        0xCF: (p) => { ops.SETir(p, 1, 'A'); },

        0xD0: (p) => { ops.SETir(p, 2, 'B'); },
        0xD1: (p) => { ops.SETir(p, 2, 'C'); },
        0xD2: (p) => { ops.SETir(p, 2, 'D'); },
        0xD3: (p) => { ops.SETir(p, 2, 'E'); },
        0xD4: (p) => { ops.SETir(p, 2, 'H'); },
        0xD5: (p) => { ops.SETir(p, 2, 'L'); },
        0xD6: (p) => { ops.SETirra(p, 2, 'H', 'L'); },
        0xD7: (p) => { ops.SETir(p, 2, 'A'); },
        0xD8: (p) => { ops.SETir(p, 3, 'B'); },
        0xD9: (p) => { ops.SETir(p, 3, 'C'); },
        0xDA: (p) => { ops.SETir(p, 3, 'D'); },
        0xDB: (p) => { ops.SETir(p, 3, 'E'); },
        0xDC: (p) => { ops.SETir(p, 3, 'H'); },
        0xDD: (p) => { ops.SETir(p, 3, 'L'); },
        0xDE: (p) => { ops.SETirra(p, 3, 'H', 'L'); },
        0xDF: (p) => { ops.SETir(p, 3, 'A'); },

        0xE0: (p) => { ops.SETir(p, 4, 'B'); },
        0xE1: (p) => { ops.SETir(p, 4, 'C'); },
        0xE2: (p) => { ops.SETir(p, 4, 'D'); },
        0xE3: (p) => { ops.SETir(p, 4, 'E'); },
        0xE4: (p) => { ops.SETir(p, 4, 'H'); },
        0xE5: (p) => { ops.SETir(p, 4, 'L'); },
        0xE6: (p) => { ops.SETirra(p, 4, 'H', 'L'); },
        0xE7: (p) => { ops.SETir(p, 4, 'A'); },
        0xE8: (p) => { ops.SETir(p, 5, 'B'); },
        0xE9: (p) => { ops.SETir(p, 5, 'C'); },
        0xEA: (p) => { ops.SETir(p, 5, 'D'); },
        0xEB: (p) => { ops.SETir(p, 5, 'E'); },
        0xEC: (p) => { ops.SETir(p, 5, 'H'); },
        0xED: (p) => { ops.SETir(p, 5, 'L'); },
        0xEE: (p) => { ops.SETirra(p, 5, 'H', 'L'); },
        0xEF: (p) => { ops.SETir(p, 5, 'A'); },

        0xF0: (p) => { ops.SETir(p, 6, 'B'); },
        0xF1: (p) => { ops.SETir(p, 6, 'C'); },
        0xF2: (p) => { ops.SETir(p, 6, 'D'); },
        0xF3: (p) => { ops.SETir(p, 6, 'E'); },
        0xF4: (p) => { ops.SETir(p, 6, 'H'); },
        0xF5: (p) => { ops.SETir(p, 6, 'L'); },
        0xF6: (p) => { ops.SETirra(p, 6, 'H', 'L'); },
        0xF7: (p) => { ops.SETir(p, 6, 'A'); },
        0xF8: (p) => { ops.SETir(p, 7, 'B'); },
        0xF9: (p) => { ops.SETir(p, 7, 'C'); },
        0xFA: (p) => { ops.SETir(p, 7, 'D'); },
        0xFB: (p) => { ops.SETir(p, 7, 'E'); },
        0xFC: (p) => { ops.SETir(p, 7, 'H'); },
        0xFD: (p) => { ops.SETir(p, 7, 'L'); },
        0xFE: (p) => { ops.SETirra(p, 7, 'H', 'L'); },
        0xFF: (p) => { ops.SETir(p, 7, 'A'); }
    };
    GameboyJS.opcodeMap = map;
    GameboyJS.opcodeCbmap = cbmap;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    // A RomAjaxReader is able to load a file through an AJAX request
    class RomAjaxReader {
        // The callback argument will be called when a file is successfully
        // read, with the data as argument (Uint8Array)
        setCallback(onLoadCallback) {
            this.callback = onLoadCallback;
        }
        // This function should be called by application code
        // and will trigger the AJAX call itself and push data to the ROM object
        loadFromUrl(url) {
            if (!url) {
                throw 'No url has been set in order to load a ROM file.';
            }
            let cb = this.callback;

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function () {
                let rom = new Uint8Array(xhr.response);
                cb && cb(rom);
            };

            xhr.send();
        }
    }
    GameboyJS.RomAjaxReader = RomAjaxReader;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    // A RomDropFileReader is able to load a drag and dropped file
    class RomDropFileReader {
        constructor(el) {
            this.dropElement = el;
            if (this.dropElement) {
                let self = this;
                this.dropElement.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    e.target.classList.add('drag-active');
                });
                this.dropElement.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    e.target.classList.remove('drag-active');
                });
                this.dropElement.addEventListener('dragover', (e) => {
                    e.preventDefault();
                });
                this.dropElement.addEventListener('drop', (e) => {
                    e.target.classList.remove('drag-active');
                    if (e.dataTransfer.files.length === 0) {
                        return;
                    }
                    e.preventDefault();
                    self.loadFromFile(e.dataTransfer.files[0]);
                });

            } else {
                //throw 'The RomDropFileReader needs a drop zone.';
                console.log("No file");
            }
        }
        // The callback argument will be called when a file is successfully
        // read, with the data as argument (Uint8Array)
        setCallback(onLoadCallback) {
            this.callback = onLoadCallback;
        }
        // The file loading logic is the same as the regular file reader
        loadFromFile(file) {
            if (file === undefined) {
                return;
            }
            let fr = new FileReader();
            let cb = this.callback;

            fr.onload = function () {
                cb && cb(new Uint8Array(fr.result));
            };
            fr.onerror = (e) => {
                console.log('Error reading the file', e.target.error.code);
            };
            fr.readAsArrayBuffer(file);
        }
    }



    GameboyJS.RomDropFileReader = RomDropFileReader;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    // A RomFileReader is able to load a local file from an input element
    //
    // Expects to be provided a file input element,
    // or will try to find one with the "file" DOM ID
    class RomFileReader {
        constructor(el) {
            this.domElement = el || document.getElementById('file');
            if (!this.domElement) {
                //throw 'The RomFileReader needs a valid input element.';
                console.log("No file");
            } else {
                let self = this;
                this.domElement.addEventListener('change', (e) => {
                    self.loadFromFile(e.target.files[0]);
                });
            }
        }
        // The callback argument will be called when a file is successfully
        // read, with the data as argument (Uint8Array)
        setCallback(onLoadCallback) {
            this.callback = onLoadCallback;
        }
        // Automatically called when the DOM input is provided with a file
        loadFromFile(file) {
            if (file === undefined) {
                return;
            }
            let fr = new FileReader();
            let cb = this.callback;

            fr.onload = function () {
                cb && cb(new Uint8Array(fr.result));
            };
            fr.onerror = (e) => {
                console.log('Error reading the file', e.target.error.code);
            };
            fr.readAsArrayBuffer(file);
        }
    }



    GameboyJS.RomFileReader = RomFileReader;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    class Rom {
        constructor(gameboy, romReader) {
            this.gameboy = gameboy;
            if (romReader) {
                this.addReader(romReader);
            }
        }
        addReader(romReader) {
            let self = this;
            romReader.setCallback(function (data) {
                if (!validate(data)) {
                    self.gameboy.error('The file is not a valid GameBoy ROM.');
                    return;
                }
                self.data = data;
                self.gameboy.startRom(self);
            });
        }
    }


    // Validate the checksum of the cartridge header
    const validate = function (data) {
        let hash = 0;
        for (let i = 0x134; i <= 0x14C; i++) {
            hash = hash - data[i] - 1;
        }
        return (hash & 0xFF) === data[0x14D];
    };

    GameboyJS.Rom = Rom;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    // Handlers for the Serial port of the Gameboy

    // The ConsoleSerial is an output-only serial port
    // designed for debug purposes as some test roms output data on the serial port
    //
    // Will regularly output the received byte (converted to string) in the console logs
    // This handler always push the value 0xFF as an input
    const ConsoleSerial = {
        current: '',
        timeout: null,
        out: function (data) {
            ConsoleSerial.current += String.fromCharCode(data);
            if (data === 10) {
                ConsoleSerial.print();
            } else {
                clearTimeout(ConsoleSerial.timeout);
                ConsoleSerial.timeout = setTimeout(ConsoleSerial.print, 500);
            }
        },
        in: function () {
            return 0xFF;
        },
        print: function () {
            clearTimeout(ConsoleSerial.timeout);
            console.log('serial: ' + ConsoleSerial.current);
            ConsoleSerial.current = '';
        }
    };
    GameboyJS.ConsoleSerial = ConsoleSerial;

    // A DummySerial outputs nothing and always inputs 0xFF
    let DummySerial = {
        out: function () { },
        in: function () {
            return 0xFF;
        }
    };
    GameboyJS.DummySerial = DummySerial;
}(GameboyJS || (GameboyJS = {})));

(function (GameboyJS) {
    // Audio Processing unit
    // Listens the write accesses to the audio-reserved memory addresses
    // and dispatches the data to the sound channels
    class APU {
        constructor(memory) {
            this.memory = memory;
            this.enabled = false;

            AudioContext = window.AudioContext || window.webkitAudioContext;
            let audioContext = new AudioContext();

            this.channel1 = new GameboyJS.Channel1(this, 1, audioContext);
            this.channel2 = new GameboyJS.Channel1(this, 2, audioContext);
            this.channel3 = new GameboyJS.Channel3(this, 3, audioContext);
            this.channel4 = new GameboyJS.Channel4(this, 4, audioContext);

        }
        connect() {
            this.channel1.enable();
            this.channel2.enable();
            this.channel3.enable();
        }
        disconnect() {
            this.channel1.disable();
            this.channel2.disable();
            this.channel3.disable();
        }
        // Updates the states of each channel given the elapsed time
        // (in instructions) since last update
        update(clockElapsed) {
            if (this.enabled === false) return;

            this.channel1.update(clockElapsed);
            this.channel2.update(clockElapsed);
            this.channel3.update(clockElapsed);
            this.channel4.update(clockElapsed);
        }
        setSoundFlag(channel, value) {
            let mask = 0xFF - (1 << (channel - 1));
            value = value << (channel - 1);
            let byteValue = this.memory.rb(APU.registers.NR52);
            byteValue &= mask;
            byteValue |= value;
            this.memory[APU.registers.NR52] = byteValue;
        }
        // Manage writes to audio registers
        // Will update the channels depending on the address
        manageWrite(addr, value) {
            if (this.enabled === false && addr < APU.registers.NR52) {
                return;
            }
            this.memory[addr] = value;
            let frequency;
            let envelopeVolume;
            switch (addr) {
                // Channel 1 addresses
                case 0xFF10:
                    this.channel1.clockSweep = 0;
                    this.channel1.sweepTime = ((value & 0x70) >> 4);
                    this.channel1.sweepSign = (value & 0x08) ? -1 : 1;
                    this.channel1.sweepShifts = (value & 0x07);
                    this.channel1.sweepCount = this.channel1.sweepShifts;
                    break;
                case 0xFF11:
                    // todo : bits 6-7
                    this.channel1.setLength(value & 0x3F);
                    break;
                case 0xFF12:
                    this.channel1.envelopeSign = (value & 0x08) ? 1 : -1;
                    envelopeVolume = (value & 0xF0) >> 4;
                    this.channel1.setEnvelopeVolume(envelopeVolume);
                    this.channel1.envelopeStep = (value & 0x07);
                    break;
                case 0xFF13:
                    frequency = this.channel1.getFrequency();
                    frequency &= 0xF00;
                    frequency |= value;
                    this.channel1.setFrequency(frequency);
                    break;
                case 0xFF14:
                    frequency = this.channel1.getFrequency();
                    frequency &= 0xFF;
                    frequency |= (value & 7) << 8;
                    this.channel1.setFrequency(frequency);
                    this.channel1.lengthCheck = (value & 0x40) ? true : false;
                    if (value & 0x80) this.channel1.play();
                    break;

                // Channel 2 addresses
                case 0xFF16:
                    // todo : bits 6-7
                    this.channel2.setLength(value & 0x3F);
                    break;
                case 0xFF17:
                    this.channel2.envelopeSign = (value & 0x08) ? 1 : -1;
                    envelopeVolume = (value & 0xF0) >> 4;
                    this.channel2.setEnvelopeVolume(envelopeVolume);
                    this.channel2.envelopeStep = (value & 0x07);
                    break;
                case 0xFF18:
                    frequency = this.channel2.getFrequency();
                    frequency &= 0xF00;
                    frequency |= value;
                    this.channel2.setFrequency(frequency);
                    break;
                case 0xFF19:
                    frequency = this.channel2.getFrequency();
                    frequency &= 0xFF;
                    frequency |= (value & 7) << 8;
                    this.channel2.setFrequency(frequency);
                    this.channel2.lengthCheck = (value & 0x40) ? true : false;
                    if (value & 0x80) {
                        this.channel2.play();
                    }
                    break;

                // Channel 3 addresses
                case 0xFF1A:
                    // todo
                    break;
                case 0xFF1B:
                    this.channel3.setLength(value);
                    break;
                case 0xFF1C:
                    // todo
                    break;
                case 0xFF1D:
                    frequency = this.channel3.getFrequency();
                    frequency &= 0xF00;
                    frequency |= value;
                    this.channel3.setFrequency(frequency);
                    break;
                case 0xFF1E:
                    frequency = this.channel3.getFrequency();
                    frequency &= 0xFF;
                    frequency |= (value & 7) << 8;
                    this.channel3.setFrequency(frequency);
                    this.channel3.lengthCheck = (value & 0x40) ? true : false;
                    if (value & 0x80) {
                        this.channel3.play();
                    }
                    break;

                // Channel 4 addresses
                case 0xFF20:
                    this.channel4.setLength(value & 0x3F);
                    break;
                case 0xFF21:
                    // todo
                    break;
                case 0xFF22:
                    // todo
                    break;
                case 0xFF23:
                    this.channel4.lengthCheck = (value & 0x40) ? true : false;
                    if (value & 0x80) {
                        this.channel4.play();
                    }
                    break;

                // channel 3 wave bytes
                case 0xFF30: case 0xFF31: case 0xFF32: case 0xFF33: case 0xFF34: case 0xFF35: case 0xFF36: case 0xFF37:
                case 0xFF38: case 0xFF39: case 0xFF3A: case 0xFF3B: case 0xFF3C: case 0xFF3D: case 0xFF3E: case 0xFF3F:
                    let index = addr - 0xFF30;
                    this.channel3.setWaveBufferByte(index, value);
                    break;

                // general audio switch
                case 0xFF26:
                    value &= 0xF0;
                    this.memory[addr] = value;
                    this.enabled = (value & 0x80) === 0 ? false : true;
                    if (!this.enabled) {
                        for (let i = 0xFF10; i < 0xFF27; i++)
                            this.memory[i] = 0;
                        // todo stop sound
                    }
                    break;
            }
        }
    }

    APU.registers = {
        NR10: 0xFF10,
        NR11: 0xFF11,
        NR12: 0xFF12,
        NR13: 0xFF13,
        NR14: 0xFF14,

        NR21: 0xFF16,
        NR22: 0xFF17,
        NR23: 0xFF18,
        NR24: 0xFF19,

        NR30: 0xFF1A,
        NR31: 0xFF1B,
        NR32: 0xFF1C,
        NR33: 0xFF1D,
        NR34: 0xFF1E,

        NR41: 0xFF20,
        NR42: 0xFF21,
        NR43: 0xFF22,
        NR44: 0xFF23,

        NR50: 0xFF24,
        NR51: 0xFF25,
        NR52: 0xFF26
    };
    GameboyJS.APU = APU;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    class Channel1 {
        constructor(apu, channelNumber, audioContext) {
            this.apu = apu;
            this.channelNumber = channelNumber;
            this.playing = false;

            this.soundLengthUnit = 0x4000; // 1 / 256 second of instructions
            this.soundLength = 64; // defaults to 64 periods
            this.lengthCheck = false;

            this.sweepTime = 0; // from 0 to 7
            this.sweepStepLength = 0x8000; // 1 / 128 seconds of instructions
            this.sweepCount = 0;
            this.sweepShifts = 0;
            this.sweepSign = 1; // +1 / -1 for increase / decrease freq

            this.frequency = 0;

            this.envelopeStep = 0;
            this.envelopeStepLength = 0x10000; // 1 / 64 seconds of instructions
            this.envelopeCheck = false;
            this.envelopeSign = 1;

            this.clockLength = 0;
            this.clockEnvelop = 0;
            this.clockSweep = 0;

            let gainNode = audioContext.createGain();
            gainNode.gain.value = 0;
            let oscillator = audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.value = 1000;
            oscillator.connect(gainNode);
            oscillator.start(0);

            this.audioContext = audioContext;
            this.gainNode = gainNode;
            this.oscillator = oscillator;
        }
        play() {
            if (this.playing) return;
            this.playing = true;
            this.apu.setSoundFlag(this.channelNumber, 1);
            this.gainNode.connect(this.audioContext.destination);
            this.clockLength = 0;
            this.clockEnvelop = 0;
            this.clockSweep = 0;
            if (this.sweepShifts > 0) this.checkFreqSweep();
        }
        stop() {
            this.playing = false;
            this.apu.setSoundFlag(this.channelNumber, 0);
            this.gainNode.disconnect();
        }
        checkFreqSweep() {
            let oldFreq = this.getFrequency();
            let newFreq = oldFreq + this.sweepSign * (oldFreq >> this.sweepShifts);
            if (newFreq > 0x7FF) {
                newFreq = 0;
                this.stop();
            }

            return newFreq;
        }
        update(clockElapsed) {
            this.clockEnvelop += clockElapsed;
            this.clockSweep += clockElapsed;

            if ((this.sweepCount || this.sweepTime) && this.clockSweep > (this.sweepStepLength * this.sweepTime)) {
                this.clockSweep -= (this.sweepStepLength * this.sweepTime);
                this.sweepCount--;

                let newFreq = this.checkFreqSweep(); // process and check new freq

                this.apu.memory[0xFF13] = newFreq & 0xFF;
                this.apu.memory[0xFF14] &= 0xF8;
                this.apu.memory[0xFF14] |= (newFreq & 0x700) >> 8;
                this.setFrequency(newFreq);

                this.checkFreqSweep(); // check again with new value
            }

            if (this.envelopeCheck && this.clockEnvelop > this.envelopeStepLength) {
                this.clockEnvelop -= this.envelopeStepLength;
                this.envelopeStep--;
                this.setEnvelopeVolume(this.envelopeVolume + this.envelopeSign);
                if (this.envelopeStep <= 0) {
                    this.envelopeCheck = false;
                }
            }

            if (this.lengthCheck) {
                this.clockLength += clockElapsed;
                if (this.clockLength > this.soundLengthUnit) {
                    this.soundLength--;
                    this.clockLength -= this.soundLengthUnit;
                    if (this.soundLength === 0) {
                        this.setLength(0);
                        this.stop();
                    }
                }
            }
        }
        setFrequency(value) {
            this.frequency = value;
            this.oscillator.frequency.value = 131072 / (2048 - this.frequency);
        }
        getFrequency() {
            return this.frequency;
        }
        setLength(value) {
            this.soundLength = 64 - (value & 0x3F);
        }
        setEnvelopeVolume(volume) {
            this.envelopeCheck = volume > 0 && volume < 16 ? true : false;
            this.envelopeVolume = volume;
            this.gainNode.gain.value = this.envelopeVolume * 1 / 100;
        }
        disable() {
            this.oscillator.disconnect();
        }
        enable() {
            this.oscillator.connect(this.gainNode);
        }
    }

    GameboyJS.Channel1 = Channel1;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    class Channel3 {
        constructor(apu, channelNumber, audioContext) {
            this.apu = apu;
            this.channelNumber = channelNumber;
            this.playing = false;

            this.soundLength = 0;
            this.soundLengthUnit = 0x4000; // 1 / 256 second of instructions
            this.lengthCheck = false;

            this.clockLength = 0;

            this.buffer = new Float32Array(32);

            let gainNode = audioContext.createGain();
            gainNode.gain.value = 1;
            this.gainNode = gainNode;

            this.baseSpeed = 65536;
            let waveBuffer = audioContext.createBuffer(1, 32, this.baseSpeed);

            let bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = waveBuffer;
            bufferSource.loop = true;
            bufferSource.connect(gainNode);
            bufferSource.start(0);

            this.audioContext = audioContext;
            this.waveBuffer = waveBuffer;
            this.bufferSource = bufferSource;

        }
        play() {
            if (this.playing) return;
            this.playing = true;
            this.apu.setSoundFlag(this.channelNumber, 1);
            this.waveBuffer.copyToChannel(this.buffer, 0, 0);

            this.gainNode.connect(this.audioContext.destination);
            this.clockLength = 0;
        }
        stop() {
            this.playing = false;
            this.apu.setSoundFlag(this.channelNumber, 0);
            this.gainNode.disconnect();
        }
        update(clockElapsed) {
            if (this.lengthCheck) {
                this.clockLength += clockElapsed;
                if (this.clockLength > this.soundLengthUnit) {
                    this.soundLength--;
                    this.clockLength -= this.soundLengthUnit;
                    if (this.soundLength === 0) {
                        this.setLength(0);
                        this.stop();
                    }
                }
            }
        }
        setFrequency(value) {
            value = 65536 / (2048 - value);
            this.bufferSource.playbackRate.value = value / this.baseSpeed;
        }
        getFrequency() {
            let freq = 2048 - 65536 / (this.bufferSource.playbackRate.value * this.baseSpeed);
            return freq | 1;
        }
        setLength(value) {
            this.soundLength = 256 - value;
        }
        setWaveBufferByte(index, value) {
            let bufferIndex = index * 2;

            this.buffer[bufferIndex] = (value >> 4) / 8 - 1; // value in buffer is in -1 -> 1
            this.buffer[bufferIndex + 1] = (value & 0x0F) / 8 - 1;
        }
        disable() {
            this.bufferSource.disconnect();
        }
        enable() {
            this.bufferSource.connect(this.gainNode);
        }
    }
    GameboyJS.Channel3 = Channel3;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    class Channel4 {
        constructor(apu, channelNumber, audioContext) {
            this.apu = apu;
            this.channelNumber = channelNumber;
            this.playing = false;

            this.soundLengthUnit = 0x4000; // 1 / 256 second of instructions
            this.soundLength = 64; // defaults to 64 periods
            this.lengthCheck = false;

            this.clockLength = 0;

            this.audioContext = audioContext;
        }
        play() {
            if (this.playing) return;
            this.playing = true;
            this.apu.setSoundFlag(this.channelNumber, 1);
            this.clockLength = 0;
        }
        stop() {
            this.playing = false;
            this.apu.setSoundFlag(this.channelNumber, 0);
        }
        update(clockElapsed) {
            if (this.lengthCheck) {
                this.clockLength += clockElapsed;
                if (this.clockLength > this.soundLengthUnit) {
                    this.soundLength--;
                    this.clockLength -= this.soundLengthUnit;
                    if (this.soundLength === 0) {
                        this.setLength(0);
                        this.stop();
                    }
                }
            }
        }
        setLength(value) {
            this.soundLength = 64 - (value & 0x3F);
        }
    }

    GameboyJS.Channel4 = Channel4;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {
    class Timer {
        constructor(cpu, memory) {
            this.cpu = cpu;
            this.memory = memory;

            this.DIV = 0xFF04;
            this.TIMA = 0xFF05;
            this.TMA = 0xFF06;
            this.TAC = 0xFF07;

            this.mainTime = 0;
            this.divTime = 0;
        }
        update(clockElapsed) {
            this.updateDiv(clockElapsed);
            this.updateTimer(clockElapsed);
        }
        updateTimer(clockElapsed) {
            if (!(this.memory.rb(this.TAC) & 0x4)) {
                return;
            }
            this.mainTime += clockElapsed;

            let threshold = 64;
            switch (this.memory.rb(this.TAC) & 3) {
                case 0: threshold = 64; break; // 4KHz
                case 1: threshold = 1; break; // 256KHz
                case 2: threshold = 4; break; // 64KHz
                case 3: threshold = 16; break; // 16KHz
            }
            threshold *= 16;

            while (this.mainTime >= threshold) {
                this.mainTime -= threshold;

                this.memory.wb(this.TIMA, this.memory.rb(this.TIMA) + 1);
                if (this.memory.rb(this.TIMA) > 0xFF) {
                    this.memory.wb(this.TIMA, this.memory.rb(this.TMA));
                    this.cpu.requestInterrupt(GameboyJS.CPU.INTERRUPTS.TIMER);
                }
            }
        }
        // Update the DIV register internal clock
        // Increment it if the clock threshold is elapsed and
        // reset it if its value overflows
        updateDiv(clockElapsed) {
            let divThreshold = 256; // DIV is 16KHz
            this.divTime += clockElapsed;
            if (this.divTime > divThreshold) {
                this.divTime -= divThreshold;
                let div = this.memory.rb(this.DIV) + 1;
                this.memory.wb(this.DIV, div & 0xFF);
            }
        }
        resetDiv() {
            this.divTime = 0;
            this.memory[this.DIV] = 0; // direct write to avoid looping
        }
    }



    GameboyJS.Timer = Timer;
}(GameboyJS || (GameboyJS = {})));


(function (GameboyJS) {

    // Utility functions
    const Util = {
        // Add to the first argument the properties of all other arguments
        extend: (target /*, source1, source2, etc. */) => {
            let sources = Array.prototype.slice.call(arguments);
            for (let i in sources) {
                let source = sources[i];
                for (let name in source) {
                    target[name] = source[name];
                }
            }

            return target;
        },
        testFlag: (p, cc) => {
            let test = 1;
            let mask = 0x10;
            if (cc === 'NZ' || cc === 'NC') test = 0;
            if (cc === 'NZ' || cc === 'Z') mask = 0x80;
            return (test && p.r.F & mask) || (!test && !(p.r.F & mask));
        },
        getRegAddr: (p, r1, r2) => { return Util.makeword(p.r[r1], p.r[r2]); },

        // make a 16 bits word from 2 bytes
        makeword: (b1, b2) => { return (b1 << 8) + b2; },

        // return the integer signed value of a given byte
        getSignedValue: (v) => { return v & 0x80 ? v - 256 : v; },

        // extract a bit from a byte
        readBit: (byte, index) => {
            return (byte >> index) & 1;
        }
    };

    GameboyJS.Util = Util;
}(GameboyJS || (GameboyJS = {})));

export default GameboyJS
