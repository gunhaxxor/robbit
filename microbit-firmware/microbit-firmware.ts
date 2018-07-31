let valueLength = 0;
let InnanConnect = false;
let Servo = 0;
let checked = 0;
let checkRadioStamp = 0;
let receivedValues: number[] = [];
let radioStamp = 0;
input.onButtonPressed(Button.A, () => {
  pins.servoWritePin(AnalogPin.P1, 165);
});
input.onButtonPressed(Button.AB, () => {
  setMotorPwm(0, 0);
  setMotorPwm(1, 0);
});
bluetooth.onBluetoothDisconnected(() => {
  setMotorPwm(0, 0);
  setMotorPwm(1, 0);
  basic.showIcon(IconNames.No);
  basic.pause(1000);
  basic.clearScreen();
});
bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), () => {
  radioStamp = input.runningTime();
  receivedValues = [];
  receivedString = bluetooth.uartReadUntil(
    serial.delimiters(Delimiters.NewLine)
  );
  receivedStrings = split(receivedString, ";");
  for (let i = 0; i <= receivedStrings.length - 1; i++) {
    receivedValues.push(parseInt(receivedStrings[i]));
  }
  // valueLength = 4 for (let i = 0, k = 0; k <
  // receivedString.length; i++ , k += valueLength) {
  // receivedValues[i] =
  // parseInt(receivedString.substr(k, valueLength))
  // -1023; }
  motor1Value = receivedValues[0];
  motor2Value = receivedValues[1];
  Servo = receivedValues[2];
  pins.servoWritePin(AnalogPin.P1, Servo);
  setMotorPwm(1, motor1Value);
  setMotorPwm(0, motor2Value);
});
bluetooth.onBluetoothConnected(() => {
  setMotorPwm(0, 0);
  setMotorPwm(1, 0);
  basic.showIcon(IconNames.Yes);
});
input.onButtonPressed(Button.B, () => {
  pins.servoWritePin(AnalogPin.P1, 85);
});
let motor = false;
let motor2Value = 0;
let motor1Value = 0;
let receivedStrings: string[] = [];
let receivedString = "";
Servo = 165;
InnanConnect = true;
valueLength = 0;
basic.showLeds(`
    . . . . .
    # . # . #
    # # # . #
    # . # . #
    . . . . .
    `);
bluetooth.startUartService();
motor2Value = 0;
motor1Value = 0;
receivedValues = [];
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
    basic.clearScreen();
    led.plot(0, pins.map(motor1Value, -1023, 1023, 4, 0));
    led.plot(4, pins.map(motor2Value, -1023, 1023, 4, 0));
    checkRadioStamp = input.runningTime();
    checked = checkRadioStamp - radioStamp;
    if (checked > 1000) {
      setMotorPwm(1, 0);
      setMotorPwm(0, 0);
    }
    basic.pause(200);
  }
});
