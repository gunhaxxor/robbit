let valueLength = 0
let InnanConnect = false
let checked = 0
let servoValue = 0
let servoTargetValue = 0
let checkRadioStamp = 0
let receivedValues: number[] = []
let radioStamp = 0
let SERVO_PIN = AnalogPin.P13
let SERVO_START_VALUE = 100
let SERVO_MAX_VALUE = 155
let SERVO_MIN_VALUE = 75
let SERVO_Q = 0.8

input.onButtonPressed(Button.A, () => {
  servoTargetValue = SERVO_START_VALUE
  servoValue = SERVO_START_VALUE
})
input.onButtonPressed(Button.B, () => {
  servoTargetValue = SERVO_MIN_VALUE
  servoValue = SERVO_MIN_VALUE
})
input.onButtonPressed(Button.AB, () => {
  setMotorPwm(0, 0);
  setMotorPwm(1, 0);
})
bluetooth.onBluetoothConnected(() => {
  setMotorPwm(0, 0);
  setMotorPwm(1, 0);
  basic.showIcon(IconNames.Yes)
  basic.pause(500)
})
bluetooth.onBluetoothDisconnected(() => {
  setMotorPwm(0, 0);
  setMotorPwm(1, 0);
  basic.showIcon(IconNames.No)
  basic.pause(1000)
  basic.clearScreen()
})
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), () => {
  radioStamp = input.runningTime()
  receivedValues = []
  receivedString = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
  receivedStrings = split(receivedString, ";");
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
  servoTargetValue = receivedValues[2]
  setMotorPwm(1, motor1Value);
  setMotorPwm(0, motor2Value);
})
bluetooth.startUartService()
basic.showLeds(`
    . . . . .
    # . # . #
    # # # . #
    # . # . #
    . . . . .
    `)
let receivedString = ""
let receivedStrings: string[] = []
let motor1Value = 0
let motor2Value = 0
let motor = false
servoValue = SERVO_START_VALUE
InnanConnect = true
valueLength = 0
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
  let splittedStrings: string[] = [];
  let prevDelimiterIndex = 0;
  for (let index = 0; index <= inputString.length; index++) {
    if (inputString.charAt(index) == delimiter) {
      splittedStrings.push(
        inputString.substr(prevDelimiterIndex, index - prevDelimiterIndex)
      );
      prevDelimiterIndex = index + 1;
    }
  }
  splittedStrings.push(
    inputString.substr(
      prevDelimiterIndex,
      inputString.length - prevDelimiterIndex
    )
  );
  return splittedStrings;
}

control.inBackground(() => {
  while (true) {
    // slowly go towards the target servo value
    servoValue = servoValue * SERVO_Q + servoTargetValue * (1 - SERVO_Q)

    pins.servoWritePin(SERVO_PIN, servoValue)
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
    led.plot(2, pins.map(
      servoValue,
      0,
      180,
      4,
      0
    ))
    checkRadioStamp = input.runningTime()
    checked = checkRadioStamp - radioStamp
    if (checked > 1000) {
      setMotorPwm(1, 0);
      setMotorPwm(0, 0);
    }
    basic.pause(400)
  }
})