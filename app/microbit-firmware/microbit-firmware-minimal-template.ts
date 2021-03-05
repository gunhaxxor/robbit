basic.showLeds(`
    . . . . .
    # . # . #
    # # # . #
    # . # . #
    . . . . .
    `)

bluetooth.startUartService()
let isConnected = false
bluetooth.onBluetoothConnected(() => {
    isConnected = true
    basic.showIcon(IconNames.Yes)
    basic.clearScreen()
})
bluetooth.onBluetoothDisconnected(() => {
    isConnected = false
    basic.showIcon(IconNames.No)
    basic.clearScreen()
})

// Incoming format: xxxx,xxxxx,xxxxx\n
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    led.toggle(4, 0)
    bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
})

forever(function () {
  if(isConnected){
      led.toggle(0, 4)
  } else {
      led.unplot(0, 4)
  }
})
