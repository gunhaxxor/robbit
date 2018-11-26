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
let MOTOR_RECEIVED_MAX = 1000;


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
let currentMotorValues: number[] = [];
let previousMotorValues: number[] = [];
let motor = false
let isConnected = false
servoValue = SERVO_START_VALUE
servoTargetValue = SERVO_START_VALUE
InnanConnect = true
valueLength = 0
receivedValues = []
//gigglebot.setSpeed(gigglebotWhichMotor.Both, gigglebotWhichSpeed.Slowest)


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
    isConnected = true
    basic.pause(500)
})
bluetooth.onBluetoothDisconnected(() => {
    setMotorPwm(0, 0);
    setMotorPwm(1, 0);
    isConnected = false
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
    servoTargetValue = receivedValues[2]

    //We expect received motorValues to be between -1000 and 1000
    setMotorPwm(0, receivedValues[0]);
    setMotorPwm(1, receivedValues[1]);
})

let minMotorPowerAtLowBatteryVoltage = 36;
let minMotorPowerAtHighBatteryVoltage = 25;

function setMotorPwm(motor: number, value: number) {
    previousMotorValues[motor] = currentMotorValues[motor];
    currentMotorValues[motor] = value;
    let minMotorPower = Math.map(gigglebot.voltageBattery(), 3400, 4700, minMotorPowerAtLowBatteryVoltage, minMotorPowerAtHighBatteryVoltage);
    minMotorPower = Math.constrain(minMotorPower, 22, 36);
    let currentDirection = Math.sign(currentMotorValues[motor]);
    let previousDirection = Math.sign(previousMotorValues[motor]);
    //Check if we need to force kick the motor to move with a slightly higher initial voltage
    //Should be true if the motor was still or if it was previously moving the other direction 
    let needsInitialPush = currentDirection != previousDirection;
    let activeMotor: number;
    if(motor == 0){
        activeMotor = gigglebotWhichMotor.Left;
    }else{
        activeMotor = gigglebotWhichMotor.Right;
    }

    if(needsInitialPush){
        gigglebot.motorPowerAssign(activeMotor, currentDirection * 50);
        basic.pause(15);
    }
    gigglebot.motorPowerAssign(activeMotor, Math.map(value, 0, currentDirection*MOTOR_RECEIVED_MAX, currentDirection*minMotorPower, currentDirection*100));
    // gigglebot.motorPowerAssign(activeMotor, Math.constrain(value / -10, -100, 100))
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

        if (isConnected) {
            basic.clearScreen()
            led.plot(0, pins.map(
                currentMotorValues[0],
                -1023,
                1023,
                4,
                0
            ))
            led.plot(4, pins.map(
                currentMotorValues[1],
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
        }
        else {
            basic.showIcon(IconNames.Asleep)
        }
        checkRadioStamp = input.runningTime()
        checked = checkRadioStamp - radioStamp
        if (checked > 1000) {
            setMotorPwm(1, 0);
            setMotorPwm(0, 0);
        }
        basic.pause(100)
    }
})