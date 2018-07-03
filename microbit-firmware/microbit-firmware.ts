let valueLength = 0
let receivedValues: number[] = []
let InnanConnect = false
input.onButtonPressed(Button.A, () => {
    setMotorPwm(0, 0);
setMotorPwm(1, 0);
})
bluetooth.onBluetoothDisconnected(() => {
    setMotorPwm(0, 0);
setMotorPwm(1, 0);
basic.showIcon(IconNames.No)
    basic.pause(1000)
    basic.clearScreen()
})
bluetooth.onBluetoothConnected(() => {
    setMotorPwm(0, 0);
setMotorPwm(1, 0);
basic.showIcon(IconNames.Yes)
})
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), () => {
    while (InnanConnect == true) {
        InnanConnect = false
    }
    receivedValues = []
    receivedString = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
    receivedStrings = split(receivedString, ";")
for (let i = 0; i <= receivedStrings.length - 1; i++) {
        receivedValues.push(parseInt(receivedStrings[i]))
    }
    // valueLength = 4 for (let i = 0, k = 0; k <
    // receivedString.length; i++ , k += valueLength) {
    // receivedValues[i] =
    // parseInt(receivedString.substr(k, valueLength))
    // -1023; }
    motor1Value = receivedValues[0]
    motor2Value = receivedValues[1]
    setMotorPwm(1, motor1Value);
setMotorPwm(0, motor2Value);
})
let motor = false
let motor2Value = 0
let motor1Value = 0
let receivedStrings: string[] = []
let receivedString = ""
InnanConnect = true
valueLength = 0
basic.showLeds(`
    . . . . .
    # . # . #
    # # # . #
    # . # . #
    . . . . .
    `)
bluetooth.startUartService()
motor2Value = 0
motor1Value = 0
receivedValues = []
function setMotorPwm(motor: number, value: number) {
    if (motor == 0) {
        if (value > 0) {
            pins.analogWritePin(AnalogPin.P16, value);
            pins.analogWritePin(AnalogPin.P0, 0);
        } else {
            pins.analogWritePin(AnalogPin.P16, 0);
            pins.analogWritePin(AnalogPin.P0, Math.abs(value));
        }
    } else {
        if (value > 0) {
            pins.analogWritePin(AnalogPin.P12, value);
            pins.analogWritePin(AnalogPin.P8, 0);
        } else {
            pins.analogWritePin(AnalogPin.P12, 0);
            pins.analogWritePin(AnalogPin.P8, Math.abs(value));
        }
    }

}
function split(inputString: string, delimiter: string): Array<string> {
    let splittedStrings: string[] = []
    let prevDelimiterIndex = 0
    for (let index = 0; index <= inputString.length; index++) {
        if (inputString.charAt(index) == delimiter) {
            splittedStrings.push(inputString.substr(prevDelimiterIndex, index - prevDelimiterIndex))
            prevDelimiterIndex = index + 1
        }
    }
    splittedStrings.push(inputString.substr(prevDelimiterIndex, inputString.length - prevDelimiterIndex))
    return splittedStrings
}
control.inBackground(() => {
    if (InnanConnect == false) {
        while (true) {
            basic.clearScreen()
            led.plot(0, pins.map(
            motor1Value,
            -1023,
            1023,
            4,
            0
            ))
            led.plot(4, pins.map(
            motor2Value,
            -1023,
            1023,
            4,
            0
            ))
            basic.pause(200)
        }
    }
})
